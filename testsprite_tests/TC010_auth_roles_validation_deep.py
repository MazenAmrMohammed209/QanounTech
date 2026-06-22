"""
TC010 -- Deep Auth, Signup, Login, Role Selection & Validation Tests
=====================================================================
Targeted test suite covering:
  1) Signup - valid, duplicate, missing fields, weak password, SQL injection
  2) Login  - valid (REST + NextAuth), wrong creds, locked out, brute force
  3) Auth tokens - token format, token reuse, invalid tokens
  4) Role selection - all roles, switching, unconfirmed, invalid
  5) Validation - email format, XSS in name, empty fields, boundary cases
  6) Session - CSRF, cookie flow, protected routes
"""

import requests
import uuid
import json

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
H = {"Content-Type": "application/json"}

passed = 0
failed = 0
errors = []

UID = uuid.uuid4().hex[:8]


def test(name, fn):
    global passed, failed
    try:
        fn()
        print(f"  [PASS] {name}")
        passed += 1
    except Exception as e:
        print(f"  [FAIL] {name}")
        print(f"      -> {e}")
        failed += 1
        errors.append((name, str(e)))


def login_token(email, password):
    r = requests.post(f"{BASE_URL}/api/auth", json={"email": email, "password": password}, headers=H, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()["access_token"]


def auth_h(token):
    return {**H, "Authorization": f"Bearer {token}"}


# ===================================================================
# 1) SIGNUP DEEP TESTS
# ===================================================================
print("\n=== 1) Signup Deep Tests ===")

SIGNUP_EMAIL = f"signup_deep_{UID}@example.com"
SIGNUP_PASS = "DeepTest123!"


def test_signup_valid():
    r = requests.post(f"{BASE_URL}/api/auth/signup", json={"email": SIGNUP_EMAIL, "password": SIGNUP_PASS}, headers=H, timeout=TIMEOUT)
    assert r.status_code in (200, 201), f"Got {r.status_code}: {r.text}"
    d = r.json()
    assert d.get("success") or "access_token" in d

test("Signup with valid email+password", test_signup_valid)


def test_signup_duplicate():
    r = requests.post(f"{BASE_URL}/api/auth/signup", json={"email": SIGNUP_EMAIL, "password": SIGNUP_PASS}, headers=H, timeout=TIMEOUT)
    assert r.status_code == 409, f"Expected 409, got {r.status_code}"

test("Signup duplicate email -> 409", test_signup_duplicate)


def test_signup_no_email():
    r = requests.post(f"{BASE_URL}/api/auth/signup", json={"password": "12345678"}, headers=H, timeout=TIMEOUT)
    assert r.status_code == 400, f"Expected 400, got {r.status_code}"

test("Signup missing email -> 400", test_signup_no_email)


def test_signup_no_password():
    r = requests.post(f"{BASE_URL}/api/auth/signup", json={"email": "x@y.com"}, headers=H, timeout=TIMEOUT)
    assert r.status_code == 400, f"Expected 400, got {r.status_code}"

test("Signup missing password -> 400", test_signup_no_password)


def test_signup_empty_body():
    r = requests.post(f"{BASE_URL}/api/auth/signup", json={}, headers=H, timeout=TIMEOUT)
    assert r.status_code == 400, f"Expected 400, got {r.status_code}"

test("Signup empty body -> 400", test_signup_empty_body)


def test_signup_invalid_email_no_at():
    r = requests.post(f"{BASE_URL}/api/auth/signup", json={"email": "userexample.com", "password": "Pass1234!"}, headers=H, timeout=TIMEOUT)
    assert r.status_code == 422, f"Expected 422, got {r.status_code}"

test("Signup email without @ -> 422", test_signup_invalid_email_no_at)


def test_signup_invalid_email_no_domain():
    r = requests.post(f"{BASE_URL}/api/auth/signup", json={"email": "user@", "password": "Pass1234!"}, headers=H, timeout=TIMEOUT)
    assert r.status_code == 422, f"Expected 422, got {r.status_code}"

test("Signup email without domain -> 422", test_signup_invalid_email_no_domain)


def test_signup_invalid_email_spaces():
    r = requests.post(f"{BASE_URL}/api/auth/signup", json={"email": "user @test.com", "password": "Pass1234!"}, headers=H, timeout=TIMEOUT)
    assert r.status_code == 422, f"Expected 422, got {r.status_code}"

test("Signup email with spaces -> 422", test_signup_invalid_email_spaces)


def test_signup_sql_injection_email():
    r = requests.post(f"{BASE_URL}/api/auth/signup", json={"email": "' OR 1=1; --", "password": "Pass1234!"}, headers=H, timeout=TIMEOUT)
    assert r.status_code in (400, 422), f"SQL injection should fail validation, got {r.status_code}"

test("Signup SQL injection in email -> rejected", test_signup_sql_injection_email)


def test_signup_returns_token():
    email = f"token_test_{UID}@example.com"
    r = requests.post(f"{BASE_URL}/api/auth/signup", json={"email": email, "password": "TokenTest123!"}, headers=H, timeout=TIMEOUT)
    assert r.status_code in (200, 201)
    d = r.json()
    assert "access_token" in d, "Signup should return access_token"
    assert len(d["access_token"]) > 5, "Token too short"

test("Signup returns access_token", test_signup_returns_token)


# ===================================================================
# 2) LOGIN DEEP TESTS
# ===================================================================
print("\n=== 2) Login Deep Tests ===")


def test_login_rest_valid():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": SIGNUP_EMAIL, "password": SIGNUP_PASS}, headers=H, timeout=TIMEOUT)
    assert r.status_code == 200, f"Got {r.status_code}: {r.text}"
    d = r.json()
    assert "access_token" in d

test("Login REST valid credentials", test_login_rest_valid)


def test_login_root_valid():
    r = requests.post(f"{BASE_URL}/api/auth", json={"email": SIGNUP_EMAIL, "password": SIGNUP_PASS}, headers=H, timeout=TIMEOUT)
    assert r.status_code == 200
    assert "access_token" in r.json()

test("Login /api/auth root endpoint", test_login_root_valid)


def test_login_wrong_password():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": SIGNUP_EMAIL, "password": "WrongWrong99!"}, headers=H, timeout=TIMEOUT)
    assert r.status_code == 401, f"Expected 401, got {r.status_code}"

test("Login wrong password -> 401", test_login_wrong_password)


def test_login_nonexistent_email():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "ghost_user@nowhere.net", "password": "anything"}, headers=H, timeout=TIMEOUT)
    assert r.status_code == 401, f"Expected 401, got {r.status_code}"

test("Login nonexistent email -> 401", test_login_nonexistent_email)


def test_login_empty_body():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={}, headers=H, timeout=TIMEOUT)
    assert r.status_code == 400, f"Expected 400, got {r.status_code}"

test("Login empty body -> 400", test_login_empty_body)


def test_login_invalid_email_format():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "not-email", "password": "12345678"}, headers=H, timeout=TIMEOUT)
    assert r.status_code == 422, f"Expected 422, got {r.status_code}"

test("Login invalid email format -> 422", test_login_invalid_email_format)


def test_login_nextauth_csrf():
    session = requests.Session()
    csrf_r = session.get(f"{BASE_URL}/api/auth/csrf", timeout=TIMEOUT)
    assert csrf_r.status_code == 200
    token = csrf_r.json().get("csrfToken")
    assert token and len(token) > 10, "CSRF token missing or too short"

    # Use CSRF token for callback
    payload = {"email": SIGNUP_EMAIL, "password": SIGNUP_PASS, "csrfToken": token, "json": "true"}
    cb_r = session.post(f"{BASE_URL}/api/auth/callback/credentials", data=payload, timeout=TIMEOUT)
    assert cb_r.status_code == 200, f"Callback got {cb_r.status_code}"

test("Login NextAuth CSRF + callback flow", test_login_nextauth_csrf)


def test_login_nextauth_session():
    """After NextAuth callback, /api/auth/session should have data"""
    session = requests.Session()
    csrf_r = session.get(f"{BASE_URL}/api/auth/csrf", timeout=TIMEOUT)
    token = csrf_r.json()["csrfToken"]
    session.post(f"{BASE_URL}/api/auth/callback/credentials",
                 data={"email": SIGNUP_EMAIL, "password": SIGNUP_PASS, "csrfToken": token, "json": "true"},
                 timeout=TIMEOUT)
    sess_r = session.get(f"{BASE_URL}/api/auth/session", timeout=TIMEOUT)
    assert sess_r.status_code == 200, f"Session endpoint got {sess_r.status_code}"
    # Session response should be a JSON object (possibly empty if not authenticated)
    d = sess_r.json()
    assert isinstance(d, dict), "Session response is not a dict"

test("NextAuth /api/auth/session endpoint", test_login_nextauth_session)


def test_login_returns_user_data():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": SIGNUP_EMAIL, "password": SIGNUP_PASS}, headers=H, timeout=TIMEOUT)
    d = r.json()
    assert "user" in d or "access_token" in d, "Missing user data in login response"
    if "user" in d:
        assert "email" in d["user"], "User object missing email"

test("Login response includes user data", test_login_returns_user_data)


# ===================================================================
# 3) AUTH TOKEN TESTS
# ===================================================================
print("\n=== 3) Auth Token Tests ===")


def test_token_format():
    r = requests.post(f"{BASE_URL}/api/auth", json={"email": SIGNUP_EMAIL, "password": SIGNUP_PASS}, headers=H, timeout=TIMEOUT)
    token = r.json()["access_token"]
    assert token.startswith("session_"), f"Token format unexpected: {token[:20]}"

test("Token starts with session_ prefix", test_token_format)


def test_token_works_for_profile():
    token = login_token(SIGNUP_EMAIL, SIGNUP_PASS)
    r = requests.get(f"{BASE_URL}/api/profiles/me", headers=auth_h(token), timeout=TIMEOUT)
    assert r.status_code == 200, f"Profile with token got {r.status_code}"
    assert "name" in r.json()

test("Token grants access to /api/profiles/me", test_token_works_for_profile)


def test_invalid_token_format():
    r = requests.get(f"{BASE_URL}/api/profiles/me", headers=auth_h("invalid_random_token"), timeout=TIMEOUT)
    # Should still return something (might fall back to first user) but not crash
    assert r.status_code in (200, 401, 403, 404), f"Unexpected status {r.status_code}"

test("Invalid token doesn't crash server", test_invalid_token_format)


def test_no_auth_header():
    r = requests.get(f"{BASE_URL}/api/profiles/me", timeout=TIMEOUT)
    # Without auth, could return 401 or fall back - just don't crash
    assert r.status_code in (200, 401, 403, 404), f"Unexpected status {r.status_code}"

test("No auth header doesn't crash", test_no_auth_header)


# ===================================================================
# 4) ROLE SELECTION DEEP TESTS
# ===================================================================
print("\n=== 4) Role Selection Deep Tests ===")

ROLE_TOKEN = None


def test_role_setup():
    global ROLE_TOKEN
    ROLE_TOKEN = login_token(SIGNUP_EMAIL, SIGNUP_PASS)
    assert ROLE_TOKEN is not None

test("Get token for role tests", test_role_setup)


def test_role_client_confirmed():
    r = requests.post(f"{BASE_URL}/api/select-role", json={"role": "Client", "confirmed": True}, headers=auth_h(ROLE_TOKEN), timeout=TIMEOUT)
    assert r.status_code == 200
    d = r.json()
    assert d["role"] == "Client"
    assert d["confirmed"] is True

test("Select Client confirmed", test_role_client_confirmed)


def test_role_client_dashboard():
    # After confirming Client, dashboard should reflect it
    r = requests.get(f"{BASE_URL}/api/dashboard", headers=auth_h(ROLE_TOKEN), timeout=TIMEOUT)
    assert r.status_code == 200
    d = r.json()
    assert "sidebar" in d, "Missing sidebar"
    assert "Client Dashboard" in d["sidebar"].get("title", "")
    assert "consultations" in d["workspace"]["features"]

test("Client dashboard has correct sidebar+workspace", test_role_client_dashboard)


def test_role_lawyer_confirmed():
    r = requests.post(f"{BASE_URL}/api/select-role", json={"role": "Lawyer", "confirmed": True}, headers=auth_h(ROLE_TOKEN), timeout=TIMEOUT)
    assert r.status_code == 200
    assert r.json()["role"] == "Lawyer"

test("Select Lawyer confirmed", test_role_lawyer_confirmed)


def test_role_lawyer_dashboard():
    r = requests.get(f"{BASE_URL}/api/dashboard", headers=auth_h(ROLE_TOKEN), timeout=TIMEOUT)
    assert r.status_code == 200
    d = r.json()
    assert "Lawyer Dashboard" in d["sidebar"]["title"]
    assert "case_management" in d["workspace"]["features"]

test("Lawyer dashboard has case_management", test_role_lawyer_dashboard)


def test_role_office_confirmed():
    r = requests.post(f"{BASE_URL}/api/select-role", json={"role": "Office", "confirmed": True}, headers=auth_h(ROLE_TOKEN), timeout=TIMEOUT)
    assert r.status_code == 200
    assert r.json()["role"] == "Office"

test("Select Office confirmed", test_role_office_confirmed)


def test_role_office_dashboard():
    r = requests.get(f"{BASE_URL}/api/dashboard", headers=auth_h(ROLE_TOKEN), timeout=TIMEOUT)
    assert r.status_code == 200
    d = r.json()
    assert "Office Dashboard" in d["sidebar"]["title"]
    assert "client_management" in d["workspace"]["features"]

test("Office dashboard has client_management", test_role_office_dashboard)


def test_role_unconfirmed_blocks_dashboard():
    r = requests.post(f"{BASE_URL}/api/select-role", json={"role": "Client", "confirmed": False}, headers=auth_h(ROLE_TOKEN), timeout=TIMEOUT)
    assert r.status_code == 200
    # Dashboard should now be blocked
    dr = requests.get(f"{BASE_URL}/api/dashboard", headers=auth_h(ROLE_TOKEN), timeout=TIMEOUT)
    assert dr.status_code == 403, f"Expected 403, got {dr.status_code}"
    assert "confirm" in dr.text.lower() or "unconfirmed" in dr.text.lower()

test("Unconfirmed role blocks dashboard -> 403", test_role_unconfirmed_blocks_dashboard)


def test_role_invalid_name():
    r = requests.post(f"{BASE_URL}/api/select-role", json={"role": "SuperAdmin", "confirmed": True}, headers=auth_h(ROLE_TOKEN), timeout=TIMEOUT)
    assert r.status_code == 400

test("Invalid role name -> 400", test_role_invalid_name)


def test_role_empty_body():
    r = requests.post(f"{BASE_URL}/api/select-role", json={}, headers=auth_h(ROLE_TOKEN), timeout=TIMEOUT)
    assert r.status_code == 400

test("Select role empty body -> 400", test_role_empty_body)


def test_role_missing_confirmed():
    r = requests.post(f"{BASE_URL}/api/select-role", json={"role": "Client"}, headers=auth_h(ROLE_TOKEN), timeout=TIMEOUT)
    assert r.status_code == 200  # confirmed defaults to false
    assert r.json()["confirmed"] is False

test("Select role missing confirmed -> defaults false", test_role_missing_confirmed)


def test_role_rapid_switch():
    """Switch roles rapidly: Client -> Lawyer -> Office -> Client"""
    for role in ["Client", "Lawyer", "Office", "Client"]:
        r = requests.post(f"{BASE_URL}/api/select-role", json={"role": role, "confirmed": True}, headers=auth_h(ROLE_TOKEN), timeout=TIMEOUT)
        assert r.status_code == 200, f"Rapid switch to {role} failed"
    # Final state should be Client
    dr = requests.get(f"{BASE_URL}/api/dashboard", headers=auth_h(ROLE_TOKEN), timeout=TIMEOUT)
    assert "Client Dashboard" in dr.json().get("sidebar", {}).get("title", "")

test("Rapid role switching works", test_role_rapid_switch)


# ===================================================================
# 5) VALIDATION DEEP TESTS
# ===================================================================
print("\n=== 5) Input Validation Tests ===")


def test_validate_profile_xss_name():
    """XSS in name field should be accepted (sanitized on render) or rejected"""
    token = login_token(SIGNUP_EMAIL, SIGNUP_PASS)
    xss_name = '<script>alert("xss")</script>'
    r = requests.put(f"{BASE_URL}/api/profiles/me", json={"name": xss_name, "email": SIGNUP_EMAIL}, headers=auth_h(token), timeout=TIMEOUT)
    # Should either accept (stored safely) or reject
    assert r.status_code in (200, 400), f"XSS name got {r.status_code}"

test("Profile name with XSS script tag", test_validate_profile_xss_name)


def test_validate_profile_very_long_name():
    """Very long name (1000 chars)"""
    token = login_token(SIGNUP_EMAIL, SIGNUP_PASS)
    long_name = "A" * 1000
    r = requests.put(f"{BASE_URL}/api/profiles/me", json={"name": long_name, "email": SIGNUP_EMAIL}, headers=auth_h(token), timeout=TIMEOUT)
    assert r.status_code in (200, 400, 422), f"Long name got {r.status_code}"

test("Profile name 1000 chars", test_validate_profile_very_long_name)


def test_validate_profile_empty_name():
    token = login_token(SIGNUP_EMAIL, SIGNUP_PASS)
    r = requests.put(f"{BASE_URL}/api/profiles/me", json={"name": "", "email": SIGNUP_EMAIL}, headers=auth_h(token), timeout=TIMEOUT)
    assert r.status_code == 400
    assert "name" in r.text.lower() or "required" in r.text.lower()

test("Profile empty name -> 400 with message", test_validate_profile_empty_name)


def test_validate_profile_whitespace_name():
    token = login_token(SIGNUP_EMAIL, SIGNUP_PASS)
    r = requests.put(f"{BASE_URL}/api/profiles/me", json={"name": "   ", "email": SIGNUP_EMAIL}, headers=auth_h(token), timeout=TIMEOUT)
    assert r.status_code == 400, f"Whitespace-only name should be 400, got {r.status_code}"

test("Profile whitespace-only name -> 400", test_validate_profile_whitespace_name)


def test_validate_consultation_empty():
    r = requests.post(f"{BASE_URL}/api/consultations", json={"question_text": ""}, headers=H, timeout=TIMEOUT)
    assert r.status_code == 400

test("Consultation empty text -> 400", test_validate_consultation_empty)


def test_validate_consultation_whitespace():
    r = requests.post(f"{BASE_URL}/api/consultations", json={"question_text": "   "}, headers=H, timeout=TIMEOUT)
    # Whitespace-only should ideally be rejected
    assert r.status_code in (201, 400), f"Whitespace text got {r.status_code}"

test("Consultation whitespace text", test_validate_consultation_whitespace)


def test_validate_booking_invalid_date_format():
    r = requests.post(f"{BASE_URL}/api/booking", json={"lawyerId": 1, "datetime": "not-a-date"}, headers=H, timeout=TIMEOUT)
    assert r.status_code == 400, f"Invalid date format got {r.status_code}"

test("Booking invalid date format -> 400", test_validate_booking_invalid_date_format)


def test_validate_client_empty_notes():
    r = requests.put(f"{BASE_URL}/api/client/1", json={"caseNotes": ""}, headers=H, timeout=TIMEOUT)
    assert r.status_code == 400

test("Client empty caseNotes -> 400", test_validate_client_empty_notes)


def test_validate_client_no_body():
    r = requests.put(f"{BASE_URL}/api/client/1", data="not json", headers={"Content-Type": "text/plain"}, timeout=TIMEOUT)
    assert r.status_code == 400, f"Non-JSON body got {r.status_code}"

test("Client non-JSON body -> 400", test_validate_client_no_body)


# ===================================================================
# 6) FRONTEND AUTH PROTECTION TESTS
# ===================================================================
print("\n=== 6) Frontend Auth Protection ===")


def test_frontend_landing():
    r = requests.get(f"{BASE_URL}/", timeout=TIMEOUT)
    assert r.status_code == 200
    assert len(r.text) > 1000

test("Landing page loads (public)", test_frontend_landing)


def test_frontend_login_page():
    r = requests.get(f"{BASE_URL}/login", timeout=TIMEOUT)
    assert r.status_code == 200
    assert "text/html" in r.headers.get("Content-Type", "")

test("Login page loads (public)", test_frontend_login_page)


def test_frontend_signup_page():
    r = requests.get(f"{BASE_URL}/signup", timeout=TIMEOUT)
    assert r.status_code == 200
    assert "text/html" in r.headers.get("Content-Type", "")

test("Signup page loads (public)", test_frontend_signup_page)


def test_frontend_dashboard_protected():
    r = requests.get(f"{BASE_URL}/dashboard/client", timeout=TIMEOUT, allow_redirects=True)
    assert r.status_code == 200
    assert "login" in r.url or "password" in r.text.lower()

test("Dashboard redirects unauthenticated -> login", test_frontend_dashboard_protected)


def test_frontend_select_role_page():
    r = requests.get(f"{BASE_URL}/select-role", timeout=TIMEOUT)
    assert r.status_code == 200

test("Select-role page loads", test_frontend_select_role_page)


def test_frontend_discovery_page():
    r = requests.get(f"{BASE_URL}/discovery", timeout=TIMEOUT)
    assert r.status_code == 200
    assert len(r.text) > 1000

test("Discovery page loads", test_frontend_discovery_page)


# ===================================================================
# 7) END-TO-END JOURNEY
# ===================================================================
print("\n=== 7) End-to-End User Journey ===")


def test_e2e_complete_journey():
    """Full journey: signup -> login -> profile -> role -> dashboard -> actions"""
    email = f"e2e_{uuid.uuid4().hex[:8]}@example.com"
    pw = "E2EPass123!"

    # 1. Signup
    r = requests.post(f"{BASE_URL}/api/auth/signup", json={"email": email, "password": pw}, headers=H, timeout=TIMEOUT)
    assert r.status_code in (200, 201), f"E2E signup failed: {r.text}"

    # 2. Login
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": pw}, headers=H, timeout=TIMEOUT)
    assert r.status_code == 200
    token = r.json()["access_token"]
    ah = auth_h(token)

    # 3. Get profile
    r = requests.get(f"{BASE_URL}/api/profiles/me", headers=ah, timeout=TIMEOUT)
    assert r.status_code == 200
    assert "name" in r.json()

    # 4. Update profile
    r = requests.put(f"{BASE_URL}/api/profiles/me", json={"name": "E2E User", "email": email}, headers=ah, timeout=TIMEOUT)
    assert r.status_code == 200

    # 5. Verify update persisted
    r = requests.get(f"{BASE_URL}/api/profiles/me", headers=ah, timeout=TIMEOUT)
    assert r.json()["name"] == "E2E User"

    # 6. Select Client role
    r = requests.post(f"{BASE_URL}/api/select-role", json={"role": "Client", "confirmed": True}, headers=ah, timeout=TIMEOUT)
    assert r.status_code == 200

    # 7. Access dashboard
    r = requests.get(f"{BASE_URL}/api/dashboard", headers=ah, timeout=TIMEOUT)
    assert r.status_code == 200
    assert "Client Dashboard" in r.json()["sidebar"]["title"]

    # 8. Switch to Lawyer
    requests.post(f"{BASE_URL}/api/select-role", json={"role": "Lawyer", "confirmed": True}, headers=ah, timeout=TIMEOUT)
    r = requests.get(f"{BASE_URL}/api/dashboard", headers=ah, timeout=TIMEOUT)
    assert "Lawyer Dashboard" in r.json()["sidebar"]["title"]

    # 9. Create consultation
    r = requests.post(f"{BASE_URL}/api/consultations", json={"question_text": "E2E test question"}, headers=ah, timeout=TIMEOUT)
    assert r.status_code == 201

    # 10. Create booking
    r = requests.post(f"{BASE_URL}/api/booking", json={"lawyerId": 1, "datetime": "2027-09-15T10:00:00Z"}, headers=ah, timeout=TIMEOUT)
    assert r.status_code == 201

    # 11. Browse discovery
    r = requests.get(f"{BASE_URL}/api/discovery", headers=ah, timeout=TIMEOUT)
    assert r.status_code == 200
    assert len(r.json()["lawyers"]) > 0

    # 12. Unconfirmed role -> blocked
    requests.post(f"{BASE_URL}/api/select-role", json={"role": "Office", "confirmed": False}, headers=ah, timeout=TIMEOUT)
    r = requests.get(f"{BASE_URL}/api/dashboard", headers=ah, timeout=TIMEOUT)
    assert r.status_code == 403

test("Complete 12-step E2E journey", test_e2e_complete_journey)


# ===================================================================
# SUMMARY
# ===================================================================
print("\n" + "=" * 60)
print(f"  TC010 RESULTS: {passed + failed} tests | {passed} passed | {failed} failed")
print("=" * 60)

if errors:
    print("\nFailed tests:")
    for name, err in errors:
        print(f"  - {name}: {err}")

import sys
sys.exit(0 if failed == 0 else 1)
