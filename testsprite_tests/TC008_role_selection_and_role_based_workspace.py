import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def login_get_token(email: str, password: str) -> str:
    """Login via REST API and return the access token."""
    # First ensure user exists by trying to sign up
    signup_url = f"{BASE_URL}/api/auth/signup"
    signup_payload = {"email": email, "password": password}
    requests.post(signup_url, json=signup_payload, headers={"Content-Type": "application/json"}, timeout=TIMEOUT)

    # Now login
    url = f"{BASE_URL}/api/auth"
    payload = {"email": email, "password": password}
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    data = response.json()
    assert "access_token" in data, "Login response missing access_token"
    return data["access_token"]

def test_role_selection_and_role_based_workspace():
    # Test user credentials (assumed existing test user)
    email = "testuser@example.com"
    password = "StrongPass123!"

    # Login to get auth token
    token = login_get_token(email, password)
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    # Available roles
    roles = ["Client", "Lawyer", "Office"]

    # 1. Test selecting and confirming each role and verify role-based dashboards/sidebars
    for role in roles:
        # Select role
        select_role_url = f"{BASE_URL}/api/select-role"
        select_payload = {"role": role, "confirmed": True}
        resp = requests.post(select_role_url, json=select_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200 or resp.status_code == 204, f"Selecting role {role} failed"
        
        # Get dashboard data for the selected role
        dashboard_url = f"{BASE_URL}/api/dashboard"
        dash_resp = requests.get(dashboard_url, headers=headers, timeout=TIMEOUT)
        assert dash_resp.status_code == 200, f"Failed to load dashboard for role {role}"
        dash_data = dash_resp.json()

        # Validate role-specific sidebar and workspace presence
        assert "sidebar" in dash_data, "Dashboard response missing sidebar"
        assert "workspace" in dash_data, "Dashboard response missing workspace"
        # Check sidebar and workspace content reflect role (basic expected keys or names)
        sidebar = dash_data["sidebar"]
        workspace = dash_data["workspace"]

        if role == "Client":
            assert "Client Dashboard" in sidebar.get("title", "") or "client" in sidebar.get("roles", []), "Sidebar not client role specific"
            assert "consultations" in workspace.get("features", []), "Client workspace missing consultations feature"
        elif role == "Lawyer":
            assert "Lawyer Dashboard" in sidebar.get("title", "") or "lawyer" in sidebar.get("roles", []), "Sidebar not lawyer role specific"
            assert "case_management" in workspace.get("features", []), "Lawyer workspace missing case management feature"
        elif role == "Office":
            assert "Office Dashboard" in sidebar.get("title", "") or "office" in sidebar.get("roles", []), "Sidebar not office role specific"
            assert "client_management" in workspace.get("features", []), "Office workspace missing client management feature"

    # 2. Test selecting a role but not confirming triggers validation prompt when accessing role features
    unconfirmed_role = "Client"
    select_payload = {"role": unconfirmed_role, "confirmed": False}
    resp = requests.post(f"{BASE_URL}/api/select-role", json=select_payload, headers=headers, timeout=TIMEOUT)
    # Even if accepted, the role is unconfirmed
    assert resp.status_code == 200 or resp.status_code == 204

    # Attempt to access dashboard - expect validation prompt or error
    dashboard_resp = requests.get(f"{BASE_URL}/api/dashboard", headers=headers, timeout=TIMEOUT)
    assert dashboard_resp.status_code in (400, 403, 409), "Expected validation error when role unconfirmed"
    error_data = {}
    try:
        error_data = dashboard_resp.json()
    except Exception:
        pass
    assert (
        "confirm role" in str(error_data).lower() or
        "role selection unconfirmed" in str(error_data).lower() or
        "validation" in str(error_data).lower()
    ), "Expected validation prompt about unconfirmed role"

test_role_selection_and_role_based_workspace()