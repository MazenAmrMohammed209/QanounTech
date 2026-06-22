import requests
from requests.auth import HTTPBasicAuth
import uuid

BASE_URL = "http://localhost:3000"
AUTH_ENDPOINT = "/api/auth/login"
CLIENTS_ENDPOINT = "/api/client"
CLIENT_ID_ENDPOINT = "/api/client/{client_id}"
TIMEOUT = 30


def authenticate(username: str, password: str) -> str:
    """Authenticate user and return Bearer token."""
    url = f"{BASE_URL}{AUTH_ENDPOINT}"
    try:
        resp = requests.post(
            url,
            json={"email": username, "password": password},
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        assert "token" in data, "Authentication response missing token"
        return data["token"]
    except Exception as e:
        raise RuntimeError(f"Authentication failed: {e}")


def create_client(auth_token: str, name: str, case_status: str, case_notes: str) -> dict:
    """Create a new client with provided initial data."""
    url = f"{BASE_URL}{CLIENTS_ENDPOINT}"
    headers = {"Authorization": f"Bearer {auth_token}"}
    payload = {
        "name": name,
        "caseStatus": case_status,
        "caseNotes": case_notes
    }
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        assert "id" in data, "Created client object missing 'id'"
        return data
    except Exception as e:
        raise RuntimeError(f"Failed to create client: {e}")


def delete_client(auth_token: str, client_id: str):
    """Delete client by ID."""
    url = f"{BASE_URL}{CLIENT_ID_ENDPOINT.format(client_id=client_id)}"
    headers = {"Authorization": f"Bearer {auth_token}"}
    try:
        resp = requests.delete(url, headers=headers, timeout=TIMEOUT)
        # 204 No Content is acceptable, 404 means already deleted or not found
        if resp.status_code not in (204, 404):
            resp.raise_for_status()
    except Exception as e:
        raise RuntimeError(f"Failed to delete client {client_id}: {e}")


def get_clients(auth_token: str) -> list:
    """Fetch list of clients."""
    url = f"{BASE_URL}{CLIENTS_ENDPOINT}"
    headers = {"Authorization": f"Bearer {auth_token}"}
    try:
        resp = requests.get(url, headers=headers, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        assert isinstance(data, list), "Clients list response is not a list"
        return data
    except Exception as e:
        raise RuntimeError(f"Failed to fetch clients list: {e}")


def update_client(auth_token: str, client_id: str, updates: dict) -> dict:
    """Update client fields."""
    url = f"{BASE_URL}{CLIENT_ID_ENDPOINT.format(client_id=client_id)}"
    headers = {"Authorization": f"Bearer {auth_token}"}
    try:
        resp = requests.put(url, json=updates, headers=headers, timeout=TIMEOUT)
        return resp
    except Exception as e:
        raise RuntimeError(f"Failed to update client {client_id}: {e}")


def test_TC007_client_management_view_update_and_validation():
    username = "lamplampkok39@gmail.com"
    password = "lamplampkok39"
    auth_token = authenticate(username, password)

    # Step 1: View client list (should succeed and return list)
    clients = get_clients(auth_token)
    assert isinstance(clients, list), "Client list should be a list"

    # Step 2: Create a client to work with (to avoid assumptions)
    unique_name = f"Test Client {uuid.uuid4()}"
    initial_status = "Open"
    initial_notes = "Initial case notes"
    client = create_client(auth_token, unique_name, initial_status, initial_notes)
    client_id = client["id"]

    try:
        # Step 3: Validate client can be retrieved again in list
        updated_clients = get_clients(auth_token)
        found_client = next((c for c in updated_clients if c.get("id") == client_id), None)
        assert found_client is not None, "Created client not found in client list"

        # Step 4: Update client case notes and status successfully
        updated_status = "In Progress"
        updated_notes = "Updated case notes with important info."
        update_payload = {
            "caseStatus": updated_status,
            "caseNotes": updated_notes,
        }
        resp_update = update_client(auth_token, client_id, update_payload)
        assert resp_update.status_code == 200, f"Expected 200 OK, got {resp_update.status_code}"
        updated_client = resp_update.json()
        assert updated_client.get("caseStatus") == updated_status, "Case status update not applied"
        assert updated_client.get("caseNotes") == updated_notes, "Case notes update not applied"

        # Step 5: Update client with empty required field (caseNotes) to trigger validation error
        invalid_payload = {
            "caseNotes": "",  # assuming caseNotes is required non-empty
        }
        resp_invalid = update_client(auth_token, client_id, invalid_payload)
        # Expecting 400 or 422 validation error from backend
        assert resp_invalid.status_code in (400, 422), \
            f"Expected validation error status (400/422), got {resp_invalid.status_code}"
        error_response = resp_invalid.json()
        # Verify error details mention required fields
        assert (
            "error" in error_response or "message" in error_response
        ), "Error response should contain 'error' or 'message' describing validation failure"
        err_msg = error_response.get("error") or error_response.get("message")
        assert "required" in err_msg.lower() or "empty" in err_msg.lower(), \
            f"Validation error message unexpected: {err_msg}"

    finally:
        # Cleanup: Delete the created client to avoid side effects
        delete_client(auth_token, client_id)


test_TC007_client_management_view_update_and_validation()