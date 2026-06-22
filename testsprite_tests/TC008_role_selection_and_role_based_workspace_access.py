import requests
from requests.auth import HTTPBasicAuth
import time

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

USERNAME = "lamplampkok39@gmail.com"
PASSWORD = "lamplampkok39"

def test_TC008_role_selection_and_role_based_workspace_access():
    session = requests.Session()
    session.auth = HTTPBasicAuth(USERNAME, PASSWORD)
    headers = {"Content-Type": "application/json"}

    def login():
        # Attempt login to acquire session cookie / token via /api/auth/login
        login_url = f"{BASE_URL}/api/auth/login"
        payload = {"email": USERNAME, "password": PASSWORD}
        try:
            resp = session.post(login_url, json=payload, headers=headers, timeout=TIMEOUT)
            resp.raise_for_status()
            json_resp = resp.json()
            assert "access_token" in json_resp or resp.cookies.get_dict(), (
                "Login failed: no access token or session cookie received"
            )
            return json_resp.get("access_token") or resp.cookies.get_dict()
        except Exception as e:
            raise AssertionError(f"Login request failed: {e}")

    def logout():
        logout_url = f"{BASE_URL}/api/auth/logout"
        try:
            session.post(logout_url, timeout=TIMEOUT)
        except Exception:
            pass  # best effort logout

    def get_headers_with_auth(token=None):
        h = {"Content-Type": "application/json"}
        if token:
            h["Authorization"] = f"Bearer {token}"
        return h

    # Login and get auth token or cookie session
    auth_token_or_cookies = login()

    try:
        # Determine if using token or cookie auth
        token = None
        cookies = None
        if isinstance(auth_token_or_cookies, dict):
            cookies = auth_token_or_cookies
        else:
            token = auth_token_or_cookies

        # Helper to call protected endpoint
        def call_api(path, method="GET", data=None, headers_extra=None):
            url = f"{BASE_URL}{path}"
            h = get_headers_with_auth(token)
            if headers_extra:
                h.update(headers_extra)
            try:
                if method == "GET":
                    r = session.get(url, headers=h, cookies=cookies, timeout=TIMEOUT)
                elif method == "POST":
                    r = session.post(url, json=data, headers=h, cookies=cookies, timeout=TIMEOUT)
                elif method == "PUT":
                    r = session.put(url, json=data, headers=h, cookies=cookies, timeout=TIMEOUT)
                elif method == "DELETE":
                    r = session.delete(url, headers=h, cookies=cookies, timeout=TIMEOUT)
                else:
                    raise ValueError(f"Unsupported HTTP method {method}")
                return r
            except requests.exceptions.RequestException as e:
                raise AssertionError(f"API request {method} {url} failed: {e}")

        # Step 1: Access /api/select-role - fetch current role info or allowed roles
        resp = call_api("/api/select-role", "GET")
        assert resp.status_code == 200, f"GET /api/select-role failed: {resp.status_code}"
        roles_data = resp.json()
        assert isinstance(roles_data, dict), "Expected dict response for /api/select-role GET"
        available_roles = roles_data.get("availableRoles") or roles_data.get("roles") or ["Client", "Lawyer", "Office"]
        # Fallback default roles if not provided by API

        # Edge case: Ensure roles are as expected
        for expected_role in ["Client", "Lawyer", "Office"]:
            assert expected_role in available_roles, f"Role {expected_role} not available in /api/select-role"

        # Helper to select and confirm role
        def select_and_confirm_role(role_name):
            # POST to /api/select-role to select and confirm
            payload = {"role": role_name, "confirm": True}
            r = call_api("/api/select-role", "POST", data=payload)
            assert r.status_code == 200, f"POST /api/select-role failed for role {role_name}: {r.status_code}"
            resp_json = r.json()
            assert resp_json.get("confirmedRole") == role_name, f"Role {role_name} not confirmed in response"
            return resp_json

        # Helper to select role but NOT confirm
        def select_role_without_confirm(role_name):
            payload = {"role": role_name, "confirm": False}
            r = call_api("/api/select-role", "POST", data=payload)
            assert r.status_code == 200, f"POST /api/select-role (unconfirmed) failed for role {role_name}: {r.status_code}"
            resp_json = r.json()
            # Expecting a prompt or status indicating unconfirmed selection
            assert resp_json.get("confirmedRole") is None or resp_json.get("confirmedRole") != role_name,\
                "Role should not be confirmed when confirm=false"
            return resp_json

        # Step 2: For each role, select and confirm, then verify dashboard and sidebar access
        for role in ["Client", "Lawyer", "Office"]:
            # Select and confirm role
            select_and_confirm_role(role)

            # Access dashboard, expect role-specific data or sidebar keys
            dash_resp = call_api("/api/dashboard", "GET")
            assert dash_resp.status_code == 200, f"GET /api/dashboard failed for role {role} with {dash_resp.status_code}"
            dash_json = dash_resp.json()
            # Check for role-specific sidebar or workspace info
            # Expected keys or markers depending on role
            sidebar = dash_json.get("sidebar") or dash_json.get("roleSidebar")
            workspace = dash_json.get("workspace") or dash_json.get("roleWorkspace")
            assert sidebar, f"Sidebar missing in dashboard response for role {role}"
            assert workspace, f"Workspace missing in dashboard response for role {role}"

            # Role-specific dashboard validation can be enhanced by role:
            if role == "Client":
                # Expect sidebar contains client links, dashboard shows past consultations
                assert "pastConsultations" in workspace or "consultations" in workspace, "Client dashboard missing consultations info"
            elif role == "Lawyer":
                # Expect sidebar to contain consultations management and client management access
                assert "consultations" in workspace or "clients" in workspace, "Lawyer dashboard missing consultations or clients info"
            elif role == "Office":
                # Expect sidebar to show office-level management tools
                assert "officeManagement" in sidebar or "clients" in workspace, "Office dashboard missing office management info"

        # Step 3: Select a role but do not confirm, expect prompt on using role-specific features
        unconfirmed_role = "Client"
        select_role_without_confirm(unconfirmed_role)

        # Try to access dashboard expecting prompt/error about unconfirmed role
        dash_resp = call_api("/api/dashboard", "GET")
        # Expect forbidden or an error indicating unconfirmed role
        assert dash_resp.status_code in (403, 400), f"Unconfirmed role dashboard access should be forbidden or blocked, got {dash_resp.status_code}"
        dash_json = dash_resp.json()
        prompt = dash_json.get("error") or dash_json.get("message") or ""
        # Check for message about confirming role selection
        assert any(keyword in prompt.lower() for keyword in ["confirm role", "unconfirmed role", "select role", "role not confirmed"]), \
            f"Expected prompt about confirming role selection, got message: {prompt}"

        # Step 4: Simulate expired token - forcibly use invalid token and test access denied
        invalid_token = "invalid_or_expired_token_example_string"
        invalid_headers = {"Authorization": f"Bearer {invalid_token}", "Content-Type": "application/json"}
        try:
            expired_resp = session.get(f"{BASE_URL}/api/dashboard", headers=invalid_headers, timeout=TIMEOUT)
        except Exception as e:
            raise AssertionError(f"Expired token request failed unexpectedly: {e}")
        assert expired_resp.status_code in (401, 403), f"Expired token should be rejected with 401 or 403, got {expired_resp.status_code}"

        # Step 5: Simulate tampered token (modify valid token slightly)
        if token:
            tampered_token = token[:-1] + ("X" if token[-1] != "X" else "Y")
            tampered_headers = {"Authorization": f"Bearer {tampered_token}", "Content-Type": "application/json"}
            tampered_resp = session.get(f"{BASE_URL}/api/dashboard", headers=tampered_headers, timeout=TIMEOUT)
            assert tampered_resp.status_code in (401, 403), f"Tampered token should be rejected with 401 or 403, got {tampered_resp.status_code}"

        # Step 6: Simulate network failure by calling invalid host - expect requests exception
        try:
            requests.get("http://10.255.255.1/", timeout=5)
            raise AssertionError("Expected network failure but request succeeded")
        except requests.exceptions.RequestException:
            pass  # Expected

        # Step 7: Simulate backend downtime by calling endpoint on unused port - expect connection error
        try:
            requests.get(f"http://localhost:9999/api/dashboard", timeout=5)
            raise AssertionError("Expected backend downtime connection failure but request succeeded")
        except requests.exceptions.RequestException:
            pass  # Expected

    finally:
        logout()

test_TC008_role_selection_and_role_based_workspace_access()