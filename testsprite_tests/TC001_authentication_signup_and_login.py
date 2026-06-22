import requests
import re
import time

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_TC001_authentication_signup_and_login():
    session = requests.Session()
    headers = {'Content-Type': 'application/json'}

    # Helper to signup user
    def signup(email, password):
        resp = session.post(
            f"{BASE_URL}/api/auth/signup",
            json={"email": email, "password": password},
            headers=headers,
            timeout=TIMEOUT,
        )
        return resp

    # Helper to login user
    def login(email, password):
        resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": email, "password": password},
            headers=headers,
            timeout=TIMEOUT,
        )
        return resp

    # Helper to access dashboard (protected)
    def get_dashboard():
        # Use session to access dashboard endpoint
        resp = session.get(
            f"{BASE_URL}/api/dashboard",
            headers=headers,
            timeout=TIMEOUT,
        )
        return resp

    # Generate a unique valid email for signup to avoid conflicts
    timestamp = int(time.time() * 1000)
    valid_email = f"testuser_{timestamp}@example.com"
    valid_password = "TestPassword123!"

    # 1) SIGNUP with valid email and password
    signup_resp = signup(valid_email, valid_password)
    assert signup_resp.status_code == 201 or signup_resp.status_code == 200, \
        f"Signup failed with status {signup_resp.status_code}: {signup_resp.text}"
    try:
        # Expect JSON with user info or session info
        signup_json = signup_resp.json()
        assert "user" in signup_json or "session" in signup_json, \
            f"Signup response missing user/session info: {signup_resp.text}"
    except Exception as e:
        assert False, f"Signup response is not valid JSON or unexpected format: {str(e)}"

    # 2) LOGIN with valid email and password
    login_resp = login(valid_email, valid_password)
    assert login_resp.status_code == 200, \
        f"Login failed with status {login_resp.status_code}: {login_resp.text}"
    try:
        login_json = login_resp.json()
        assert "user" in login_json or "session" in login_json, \
            f"Login response missing user/session info: {login_resp.text}"
    except Exception as e:
        assert False, f"Login response is not valid JSON or unexpected format: {str(e)}"

    # 3) LOGIN with invalid email formats -> validation errors
    invalid_emails = [
        "plainaddress",
        "@missingusername.com",
        "missingatsign.com",
        "missingdomain@.com",
        "missingdot@domaincom",
        "missingboth@@domain.com",
        "space in@email.com",
        "name@domain@domain.com",
        "name@domain,com",
    ]
    for invalid_email in invalid_emails:
        resp = login(invalid_email, "anyPassword1!")
        # Expect 400 or 422 for client validation error or explicit error message
        assert resp.status_code in (400, 422), \
            f"Invalid email '{invalid_email}' did not yield validation error, status {resp.status_code}"
        try:
            error_json = resp.json()
            errors = ""
            if "error" in error_json:
                errors = error_json["error"]
            elif "message" in error_json:
                errors = error_json["message"]
            # Check for indication of invalid email format
            assert re.search(r"email.*valid", errors, re.I) or re.search(r"invalid.*email", errors, re.I), \
                f"Error message for invalid email '{invalid_email}' missing or not about email format: {errors}"
        except Exception:
            # If no JSON or no proper message, fail
            assert False, f"Login with invalid email '{invalid_email}' failed but no proper error message"

    # 4) Access dashboard after login should succeed (authenticated protected route)
    dashboard_resp = get_dashboard()
    assert dashboard_resp.status_code == 200, f"Access to dashboard failed with status {dashboard_resp.status_code}: {dashboard_resp.text}"
    try:
        # Expect some expected JSON structure or identifiers indicating dashboard data
        dashboard_json = dashboard_resp.json()
        assert "consultations" in dashboard_json or "user" in dashboard_json or "stats" in dashboard_json or isinstance(dashboard_json, dict), \
            "Dashboard response JSON unexpected or missing expected keys"
    except Exception as e:
        assert False, f"Dashboard response is not valid JSON: {str(e)}"

    # 5) Edge case: Access dashboard with expired/tampered token => Unauthorized (simulate by altering session cookies)
    tampered_session = requests.Session()
    # simulate by setting invalid cookie
    tampered_session.cookies.set('auth_token', 'tampered_value')
    resp = tampered_session.get(f"{BASE_URL}/api/dashboard", headers=headers, timeout=TIMEOUT)
    assert resp.status_code in (401, 403), \
        f"Access dashboard with tampered token should be unauthorized but got {resp.status_code}"

    # 6) Edge case: Access dashboard with no auth token => Unauthorized
    no_auth_resp = requests.get(f"{BASE_URL}/api/dashboard", timeout=TIMEOUT)
    assert no_auth_resp.status_code in (401, 403), f"Access dashboard without auth should fail but got {no_auth_resp.status_code}"

    # 7) Simulated network failure & backend downtime behavior can't be fully tested here without external mocks.
    # Best effort: simulate by calling invalid endpoint and timeouts
    try:
        session.get(f"{BASE_URL}/api/dashboard", timeout=0.001)
        assert False, "Request with extremely short timeout should raise timeout exception"
    except requests.exceptions.Timeout:
        pass

    try:
        bad_resp = session.get(f"{BASE_URL}/api/invalidendpoint", timeout=TIMEOUT)
        assert bad_resp.status_code == 404, f"Invalid endpoint should respond 404 but got {bad_resp.status_code}"
    except Exception as e:
        assert False, f"Unexpected error when accessing invalid endpoint: {str(e)}"

test_TC001_authentication_signup_and_login()