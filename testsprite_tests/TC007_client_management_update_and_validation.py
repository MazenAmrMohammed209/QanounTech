import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

# Assuming authentication is required, we perform login first to get a token.
# For this test code, I'll define login credentials and a login function.
# Adjust login details as needed.

LOGIN_EMAIL = "testclient@example.com"
LOGIN_PASSWORD = "TestPass123!"

def login():
    session = requests.Session()
    csrf_res = session.get(f"{BASE_URL}/api/auth/csrf", timeout=TIMEOUT)
    csrf_token = csrf_res.json().get("csrfToken")
    payload = {
        "email": LOGIN_EMAIL,
        "password": LOGIN_PASSWORD,
        "csrfToken": csrf_token,
        "json": "true"
    }
    try:
        response = session.post(f"{BASE_URL}/api/auth/callback/credentials", data=payload, timeout=TIMEOUT)
        response.raise_for_status()
        return "mock_token"
    except requests.RequestException as e:
        raise AssertionError(f"Login request failed: {e}")

def test_client_management_update_and_validation():
    token = login()
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}

    # Step 1: View client records - GET /client
    try:
        get_clients_resp = requests.get(f"{BASE_URL}/api/client", headers=auth_headers, timeout=TIMEOUT)
        get_clients_resp.raise_for_status()
        clients = get_clients_resp.json()
        assert isinstance(clients, list), "Expected client list response"
    except requests.RequestException as e:
        raise AssertionError(f"Failed to get client records: {e}")

    # If no clients exist, create one for update and validation
    client_id = None
    created_client = None
    try:
        if not clients:
            # Create new client - POST /client
            create_payload = {
                "name": "Test Client",
                "email": "testclient_record@example.com",
                "caseNotes": "Initial notes"
            }
            create_resp = requests.post(f"{BASE_URL}/api/client", json=create_payload, headers=auth_headers, timeout=TIMEOUT)
            create_resp.raise_for_status()
            created_client = create_resp.json()
            client_id = created_client.get("id")
            assert client_id, "Created client ID not returned"
        else:
            client_id = clients[0].get("id")
            assert client_id, "Client ID missing"

        # Step 2: Update client case notes - PUT /client/{id}
        update_payload = {
            "caseNotes": "Updated case notes for testing."
        }
        update_resp = requests.put(f"{BASE_URL}/api/client/{client_id}", json=update_payload, headers=auth_headers, timeout=TIMEOUT)
        update_resp.raise_for_status()
        updated_client = update_resp.json()
        assert updated_client.get("caseNotes") == update_payload["caseNotes"], "Case notes update failed"

        # Step 3: Validation error on empty required fields - PUT /client/{id}
        invalid_payload = {
            "caseNotes": ""  # Assuming caseNotes is required
        }
        invalid_resp = requests.put(f"{BASE_URL}/api/client/{client_id}", json=invalid_payload, headers=auth_headers, timeout=TIMEOUT)
        # Expecting validation error, HTTP 400 or 422 likely
        assert invalid_resp.status_code in (400, 422), "Expected validation error status code"
        error_response = invalid_resp.json()
        # Expect error detail about required fields
        assert any("required" in str(v).lower() for v in error_response.values()), "Expected validation error about required fields"

    finally:
        # Cleanup created client if needed
        if created_client and client_id:
            try:
                delete_resp = requests.delete(f"{BASE_URL}/api/client/{client_id}", headers=auth_headers, timeout=TIMEOUT)
                delete_resp.raise_for_status()
            except requests.RequestException as e:
                # Log or ignore; test cannot do much here
                pass

test_client_management_update_and_validation()