"""
TC009 -- Full-Stack Comprehensive Test Suite
============================================
Covers every API endpoint, frontend page, authentication flow,
database CRUD, role-based access, and input validation across the
entire Qanoun Tech platform.

Sections:
  A) Auth API – signup, login (REST + NextAuth), CSRF, email validation
  B) Dashboard API – default, role-specific, unconfirmed-role guard
  C) Discovery API – lawyer/office search
  D) Consultations API – list, create, validation
  E) Booking API – list, create valid/invalid, delete
  F) Client API – list, create, update, validation, delete
  G) Profiles API – base, slug, /me CRUD, validation
  H) Select-Role API – all 3 roles, confirmed/unconfirmed
  I) Frontend Pages – landing, login, signup, discovery, consultations,
     booking, select-role, dashboard (auth-gated)
  J) Database Integration – signup creates user, profile persistence
  K) Cross-flow Integration – full user journey end to end
"""

import requests
import time
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

# Unique emails so tests don't collide with each other
UNIQUE_ID = uuid.uuid4().hex[:8]
TEST_EMAIL = f"fullstack_{UNIQUE_ID}@example.com"
TEST_PASSWORD = "SecurePass123!"

passed = 0
failed = 0
errors = []


def run_test(name, fn):
    """Run a single test function and track pass/fail."""
    global passed, failed
    try:
        fn()
        print(f"  [PASS] {name}")
        passed += 1
    except Exception as e:
        print(f"  [FAIL] {name}")
        print(f"     -> {e}")
        failed += 1
        errors.append((name, str(e)))


# ===========================================================================
# A) AUTH API TESTS
# ===========================================================================
print("\n=== A) Auth API Tests ===")


def test_auth_signup_new_user():
    """POST /api/auth/signup — create a brand-new user"""
    res = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        headers=HEADERS, timeout=TIMEOUT,
    )
    assert res.status_code in (200, 201), f"Expected 200/201, got {res.status_code}: {res.text}"
    data = res.json()
    assert data.get("success") or "access_token" in data, "Missing success or access_token"

run_test("Signup new user", test_auth_signup_new_user)


def test_auth_signup_duplicate_user():
    """POST /api/auth/signup — duplicate email returns 409"""
    res = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        headers=HEADERS, timeout=TIMEOUT,
    )
    assert res.status_code == 409, f"Expected 409 for duplicate, got {res.status_code}"

run_test("Signup duplicate user -> 409", test_auth_signup_duplicate_user)


def test_auth_signup_missing_fields():
    """POST /api/auth/signup — missing password returns 400"""
    res = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json={"email": "x@y.com"},
        headers=HEADERS, timeout=TIMEOUT,
    )
    assert res.status_code == 400, f"Expected 400, got {res.status_code}"

run_test("Signup missing password -> 400", test_auth_signup_missing_fields)


def test_auth_signup_invalid_email_format():
    """POST /api/auth/signup — bad email format returns 422"""
    res = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json={"email": "not-an-email", "password": "12345678"},
        headers=HEADERS, timeout=TIMEOUT,
    )
    assert res.status_code == 422, f"Expected 422, got {res.status_code}"
    assert "email" in res.text.lower() and ("format" in res.text.lower() or "invalid" in res.text.lower())

run_test("Signup invalid email format -> 422", test_auth_signup_invalid_email_format)


def test_auth_login_rest_valid():
    """POST /api/auth/login — valid credentials"""
    res = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        headers=HEADERS, timeout=TIMEOUT,
    )
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert "access_token" in data, "Missing access_token"

run_test("REST login valid credentials", test_auth_login_rest_valid)


def test_auth_login_rest_wrong_password():
    """POST /api/auth/login — wrong password returns 401"""
    res = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": "WrongPass999!"},
        headers=HEADERS, timeout=TIMEOUT,
    )
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"

run_test("REST login wrong password -> 401", test_auth_login_rest_wrong_password)


def test_auth_login_rest_nonexistent_user():
    """POST /api/auth/login — user doesn't exist returns 401"""
    res = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "nobody_exists@xyz.com", "password": "whatever123"},
        headers=HEADERS, timeout=TIMEOUT,
    )
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"

run_test("REST login nonexistent user -> 401", test_auth_login_rest_nonexistent_user)


def test_auth_login_rest_invalid_email():
    """POST /api/auth/login — invalid email format returns 422"""
    res = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "bad-email", "password": "12345678"},
        headers=HEADERS, timeout=TIMEOUT,
    )
    assert res.status_code == 422, f"Expected 422, got {res.status_code}"

run_test("REST login invalid email -> 422", test_auth_login_rest_invalid_email)


def test_auth_post_root():
    """POST /api/auth — root auth endpoint returns token"""
    res = requests.post(
        f"{BASE_URL}/api/auth",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        headers=HEADERS, timeout=TIMEOUT,
    )
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert "access_token" in data, "Missing access_token from /api/auth"

run_test("POST /api/auth root login", test_auth_post_root)


def test_auth_csrf_token():
    """GET /api/auth/csrf — NextAuth CSRF endpoint"""
    res = requests.get(f"{BASE_URL}/api/auth/csrf", timeout=TIMEOUT)
    assert res.status_code == 200, f"CSRF endpoint status {res.status_code}"
    data = res.json()
    assert "csrfToken" in data, "Missing csrfToken"
    assert len(data["csrfToken"]) > 10, "CSRF token too short"

run_test("NextAuth CSRF token endpoint", test_auth_csrf_token)


def test_auth_nextauth_callback():
    """POST /api/auth/callback/credentials — NextAuth login flow"""
    session = requests.Session()
    csrf_res = session.get(f"{BASE_URL}/api/auth/csrf", timeout=TIMEOUT)
    csrf_token = csrf_res.json().get("csrfToken")
    payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "csrfToken": csrf_token,
        "json": "true",
    }
    res = session.post(
        f"{BASE_URL}/api/auth/callback/credentials",
        data=payload, timeout=TIMEOUT,
    )
    assert res.status_code == 200, f"NextAuth callback status {res.status_code}"

run_test("NextAuth callback credentials login", test_auth_nextauth_callback)


# ===========================================================================
# B) DASHBOARD API TESTS
# ===========================================================================
print("\n=== B) Dashboard API Tests ===")


def test_dashboard_default():
    """GET /api/dashboard — default (no auth header) returns pastConsultations"""
    res = requests.get(f"{BASE_URL}/api/dashboard", timeout=TIMEOUT)
    assert res.status_code == 200, f"Status {res.status_code}"
    data = res.json()
    assert "pastConsultations" in data, "Missing pastConsultations"
    assert "summaryStats" in data, "Missing summaryStats"

run_test("Dashboard default response", test_dashboard_default)


def test_dashboard_with_confirmed_role():
    """POST select-role (confirmed) → GET dashboard returns sidebar/workspace"""
    # Get a token first
    login_res = requests.post(
        f"{BASE_URL}/api/auth",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        headers=HEADERS, timeout=TIMEOUT,
    )
    token = login_res.json()["access_token"]
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}

    # Select a confirmed role
    requests.post(
        f"{BASE_URL}/api/select-role",
        json={"role": "Lawyer", "confirmed": True},
        headers=auth_headers, timeout=TIMEOUT,
    )

    res = requests.get(f"{BASE_URL}/api/dashboard", headers=auth_headers, timeout=TIMEOUT)
    assert res.status_code == 200, f"Status {res.status_code}"
    data = res.json()
    assert "sidebar" in data, "Missing sidebar for confirmed role"
    assert "workspace" in data, "Missing workspace for confirmed role"
    assert "Lawyer Dashboard" in data["sidebar"].get("title", "")

run_test("Dashboard with confirmed Lawyer role", test_dashboard_with_confirmed_role)


def test_dashboard_unconfirmed_role_blocked():
    """POST select-role (unconfirmed) → GET dashboard returns 403"""
    login_res = requests.post(
        f"{BASE_URL}/api/auth",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        headers=HEADERS, timeout=TIMEOUT,
    )
    token = login_res.json()["access_token"]
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}

    requests.post(
        f"{BASE_URL}/api/select-role",
        json={"role": "Client", "confirmed": False},
        headers=auth_headers, timeout=TIMEOUT,
    )

    res = requests.get(f"{BASE_URL}/api/dashboard", headers=auth_headers, timeout=TIMEOUT)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

run_test("Dashboard blocked for unconfirmed role -> 403", test_dashboard_unconfirmed_role_blocked)


# ===========================================================================
# C) DISCOVERY API TESTS
# ===========================================================================
print("\n=== C) Discovery API Tests ===")


def test_discovery_get_lawyers_and_offices():
    """GET /api/discovery — returns lawyers and offices"""
    res = requests.get(f"{BASE_URL}/api/discovery", timeout=TIMEOUT)
    assert res.status_code == 200
    data = res.json()
    assert "lawyers" in data, "Missing lawyers key"
    assert "offices" in data, "Missing offices key"
    assert isinstance(data["lawyers"], list), "lawyers is not a list"
    assert isinstance(data["offices"], list), "offices is not a list"
    assert len(data["lawyers"]) > 0, "No lawyers returned"
    # Check structure of a lawyer
    lawyer = data["lawyers"][0]
    assert "name" in lawyer, "Lawyer missing name"
    assert "id" in lawyer, "Lawyer missing id"

run_test("Discovery returns lawyers & offices", test_discovery_get_lawyers_and_offices)


def test_discovery_lawyer_has_profile_url():
    """Verify lawyer objects include profileUrl"""
    res = requests.get(f"{BASE_URL}/api/discovery", timeout=TIMEOUT)
    data = res.json()
    for lawyer in data["lawyers"]:
        assert "profileUrl" in lawyer, f"Lawyer {lawyer.get('name')} missing profileUrl"

run_test("Discovery lawyers have profileUrl", test_discovery_lawyer_has_profile_url)


def test_discovery_office_has_location():
    """Verify office objects include location"""
    res = requests.get(f"{BASE_URL}/api/discovery", timeout=TIMEOUT)
    data = res.json()
    for office in data["offices"]:
        assert "location" in office, f"Office {office.get('name')} missing location"

run_test("Discovery offices have location", test_discovery_office_has_location)


# ===========================================================================
# D) CONSULTATIONS API TESTS
# ===========================================================================
print("\n=== D) Consultations API Tests ===")


def test_consultations_list():
    """GET /api/consultations — returns list"""
    res = requests.get(f"{BASE_URL}/api/consultations", timeout=TIMEOUT)
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list), "Consultations response is not a list"

run_test("Consultations list", test_consultations_list)


def test_consultations_create_valid():
    """POST /api/consultations — valid submission"""
    res = requests.post(
        f"{BASE_URL}/api/consultations",
        json={"question_text": "What are my rights as a tenant?"},
        headers=HEADERS, timeout=TIMEOUT,
    )
    assert res.status_code == 201, f"Expected 201, got {res.status_code}"
    data = res.json()
    assert "id" in data, "Missing consultation id"

run_test("Create valid consultation", test_consultations_create_valid)


def test_consultations_create_empty():
    """POST /api/consultations — empty question returns 400"""
    res = requests.post(
        f"{BASE_URL}/api/consultations",
        json={"question_text": ""},
        headers=HEADERS, timeout=TIMEOUT,
    )
    assert res.status_code == 400, f"Expected 400, got {res.status_code}"

run_test("Create consultation empty text -> 400", test_consultations_create_empty)


def test_consultations_create_missing_field():
    """POST /api/consultations — missing question_text returns 400"""
    res = requests.post(
        f"{BASE_URL}/api/consultations",
        json={"title": "something"},
        headers=HEADERS, timeout=TIMEOUT,
    )
    assert res.status_code == 400, f"Expected 400, got {res.status_code}"

run_test("Create consultation missing field -> 400", test_consultations_create_missing_field)


# ===========================================================================
# E) BOOKING API TESTS
# ===========================================================================
print("\n=== E) Booking API Tests ===")


def test_booking_list():
    """GET /api/booking — returns list"""
    res = requests.get(f"{BASE_URL}/api/booking", timeout=TIMEOUT)
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list), "Booking response is not a list"

run_test("Booking list", test_booking_list)


def test_booking_create_future_date():
    """POST /api/booking — future date is accepted"""
    future = "2027-06-15T14:00:00Z"
    res = requests.post(
        f"{BASE_URL}/api/booking",
        json={"lawyerId": 1, "datetime": future},
        headers=HEADERS, timeout=TIMEOUT,
    )
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    data = res.json()
    assert data.get("lawyerId") == 1
    assert data.get("datetime") == future

run_test("Create booking future date", test_booking_create_future_date)


def test_booking_create_past_date():
    """POST /api/booking — past date is rejected with 400"""
    past = "2020-01-01T10:00:00Z"
    res = requests.post(
        f"{BASE_URL}/api/booking",
        json={"lawyerId": 1, "datetime": past},
        headers=HEADERS, timeout=TIMEOUT,
    )
    assert res.status_code == 400, f"Expected 400 for past date, got {res.status_code}"

run_test("Create booking past date -> 400", test_booking_create_past_date)


def test_booking_delete():
    """DELETE /api/booking/99 — returns 204"""
    res = requests.delete(f"{BASE_URL}/api/booking/99", timeout=TIMEOUT)
    assert res.status_code == 204, f"Expected 204, got {res.status_code}"

run_test("Delete booking", test_booking_delete)


# ===========================================================================
# F) CLIENT API TESTS
# ===========================================================================
print("\n=== F) Client API Tests ===")


def test_client_list():
    """GET /api/client — returns list"""
    res = requests.get(f"{BASE_URL}/api/client", timeout=TIMEOUT)
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list), "Client response is not a list"
    assert len(data) > 0, "Expected at least one client"

run_test("Client list", test_client_list)


def test_client_create():
    """POST /api/client — create new client record"""
    res = requests.post(
        f"{BASE_URL}/api/client",
        json={"name": "New Client", "email": "newclient@test.com", "caseNotes": "Initial"},
        headers=HEADERS, timeout=TIMEOUT,
    )
    assert res.status_code == 201, f"Expected 201, got {res.status_code}"
    data = res.json()
    assert "id" in data, "Missing client id"
    assert data["name"] == "New Client"

run_test("Create client record", test_client_create)


def test_client_update_valid():
    """PUT /api/client/1 — valid update"""
    res = requests.put(
        f"{BASE_URL}/api/client/1",
        json={"caseNotes": "Updated case notes from test"},
        headers=HEADERS, timeout=TIMEOUT,
    )
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert data.get("caseNotes") == "Updated case notes from test"

run_test("Update client valid", test_client_update_valid)


def test_client_update_empty_notes():
    """PUT /api/client/1 — empty caseNotes returns 400"""
    res = requests.put(
        f"{BASE_URL}/api/client/1",
        json={"caseNotes": ""},
        headers=HEADERS, timeout=TIMEOUT,
    )
    assert res.status_code == 400, f"Expected 400, got {res.status_code}"

run_test("Update client empty notes -> 400", test_client_update_empty_notes)


def test_client_delete():
    """DELETE /api/client/1 — returns 204"""
    res = requests.delete(f"{BASE_URL}/api/client/1", timeout=TIMEOUT)
    assert res.status_code == 204, f"Expected 204, got {res.status_code}"

run_test("Delete client", test_client_delete)


# ===========================================================================
# G) PROFILES API TESTS
# ===========================================================================
print("\n=== G) Profiles API Tests ===")


def test_profiles_base():
    """GET /api/profiles — returns profile data"""
    res = requests.get(f"{BASE_URL}/api/profiles", timeout=TIMEOUT)
    assert res.status_code == 200
    data = res.json()
    assert "name" in data, "Profile missing name"

run_test("Profiles base endpoint", test_profiles_base)


def test_profiles_slug():
    """GET /api/profiles/lawyer/1 — catch-all slug"""
    res = requests.get(f"{BASE_URL}/api/profiles/lawyer/1", timeout=TIMEOUT)
    assert res.status_code == 200
    data = res.json()
    assert "success" in data or "name" in data, "Unexpected profile slug response"

run_test("Profiles slug endpoint", test_profiles_slug)


def test_profiles_me_get():
    """GET /api/profiles/me — returns profile with name field"""
    login_res = requests.post(
        f"{BASE_URL}/api/auth",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        headers=HEADERS, timeout=TIMEOUT,
    )
    token = login_res.json()["access_token"]
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}

    res = requests.get(f"{BASE_URL}/api/profiles/me", headers=auth_headers, timeout=TIMEOUT)
    assert res.status_code == 200, f"Status {res.status_code}"
    data = res.json()
    assert "name" in data, "Profile /me missing name"
    assert isinstance(data["name"], str), "name is not a string"
    assert "email" in data, "Profile /me missing email"

run_test("GET /api/profiles/me", test_profiles_me_get)


def test_profiles_me_update_valid():
    """PUT /api/profiles/me — update name"""
    login_res = requests.post(
        f"{BASE_URL}/api/auth",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        headers=HEADERS, timeout=TIMEOUT,
    )
    token = login_res.json()["access_token"]
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}

    # Get current profile
    get_res = requests.get(f"{BASE_URL}/api/profiles/me", headers=auth_headers, timeout=TIMEOUT)
    profile = get_res.json()

    updated = profile.copy()
    updated["name"] = "TC009 Updated Name"
    res = requests.put(
        f"{BASE_URL}/api/profiles/me", json=updated,
        headers=auth_headers, timeout=TIMEOUT,
    )
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"

    # Verify persistence
    verify_res = requests.get(f"{BASE_URL}/api/profiles/me", headers=auth_headers, timeout=TIMEOUT)
    assert verify_res.json()["name"] == "TC009 Updated Name", "Name not persisted"

run_test("PUT /api/profiles/me valid update", test_profiles_me_update_valid)


def test_profiles_me_update_empty_name():
    """PUT /api/profiles/me — empty name returns 400"""
    login_res = requests.post(
        f"{BASE_URL}/api/auth",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        headers=HEADERS, timeout=TIMEOUT,
    )
    token = login_res.json()["access_token"]
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}

    res = requests.put(
        f"{BASE_URL}/api/profiles/me",
        json={"name": "", "email": TEST_EMAIL},
        headers=auth_headers, timeout=TIMEOUT,
    )
    assert res.status_code == 400, f"Expected 400, got {res.status_code}"

run_test("PUT /api/profiles/me empty name -> 400", test_profiles_me_update_empty_name)


# ===========================================================================
# H) SELECT-ROLE API TESTS
# ===========================================================================
print("\n=== H) Select-Role API Tests ===")


def get_auth_headers():
    login_res = requests.post(
        f"{BASE_URL}/api/auth",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        headers=HEADERS, timeout=TIMEOUT,
    )
    token = login_res.json()["access_token"]
    return {**HEADERS, "Authorization": f"Bearer {token}"}


def test_select_role_client():
    """POST /api/select-role — select Client confirmed"""
    auth_h = get_auth_headers()
    res = requests.post(
        f"{BASE_URL}/api/select-role",
        json={"role": "Client", "confirmed": True},
        headers=auth_h, timeout=TIMEOUT,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "Client"
    assert data["confirmed"] is True

run_test("Select role Client confirmed", test_select_role_client)


def test_select_role_lawyer():
    """POST /api/select-role — select Lawyer confirmed"""
    auth_h = get_auth_headers()
    res = requests.post(
        f"{BASE_URL}/api/select-role",
        json={"role": "Lawyer", "confirmed": True},
        headers=auth_h, timeout=TIMEOUT,
    )
    assert res.status_code == 200
    assert res.json()["role"] == "Lawyer"

run_test("Select role Lawyer confirmed", test_select_role_lawyer)


def test_select_role_office():
    """POST /api/select-role — select Office confirmed"""
    auth_h = get_auth_headers()
    res = requests.post(
        f"{BASE_URL}/api/select-role",
        json={"role": "Office", "confirmed": True},
        headers=auth_h, timeout=TIMEOUT,
    )
    assert res.status_code == 200
    assert res.json()["role"] == "Office"

run_test("Select role Office confirmed", test_select_role_office)


def test_select_role_invalid():
    """POST /api/select-role — invalid role returns 400"""
    auth_h = get_auth_headers()
    res = requests.post(
        f"{BASE_URL}/api/select-role",
        json={"role": "SuperAdmin", "confirmed": True},
        headers=auth_h, timeout=TIMEOUT,
    )
    assert res.status_code == 400, f"Expected 400, got {res.status_code}"

run_test("Select role invalid -> 400", test_select_role_invalid)


def test_select_role_missing():
    """POST /api/select-role — missing role returns 400"""
    auth_h = get_auth_headers()
    res = requests.post(
        f"{BASE_URL}/api/select-role",
        json={"confirmed": True},
        headers=auth_h, timeout=TIMEOUT,
    )
    assert res.status_code == 400, f"Expected 400, got {res.status_code}"

run_test("Select role missing field -> 400", test_select_role_missing)


# ===========================================================================
# I) FRONTEND PAGE TESTS — ensure pages render (status 200, contain HTML)
# ===========================================================================
print("\n=== I) Frontend Page Tests ===")

FRONTEND_PAGES = [
    ("/", "Landing page"),
    ("/login", "Login page"),
    ("/signup", "Signup page"),
    ("/discovery", "Discovery page"),
    ("/consultations", "Consultations page"),
]


def make_page_test(path, label):
    def test_fn():
        res = requests.get(f"{BASE_URL}{path}", timeout=TIMEOUT)
        assert res.status_code == 200, f"{label} returned {res.status_code}"
        assert "text/html" in res.headers.get("Content-Type", ""), f"{label} is not HTML"
        text = res.text.lower()
        assert "<html" in text or "<!doctype" in text or "<div" in text, f"{label} has no HTML content"
        assert len(res.text) > 500, f"{label} response too short ({len(res.text)} chars)"
    return test_fn


for path, label in FRONTEND_PAGES:
    run_test(f"Page {label} ({path})", make_page_test(path, label))


def test_dashboard_page_redirects_unauthenticated():
    """GET /dashboard — unauthenticated users should be redirected to /login"""
    res = requests.get(f"{BASE_URL}/dashboard/client", timeout=TIMEOUT, allow_redirects=True)
    # After redirect chain, the final URL should be the login page
    assert res.status_code == 200, f"Expected 200 after redirect, got {res.status_code}"
    # Should end up at login page
    assert "login" in res.url or "login" in res.text.lower() or "password" in res.text.lower(), \
        "Dashboard did not redirect to login for unauthenticated user"

run_test("Dashboard page redirects unauthenticated -> /login", test_dashboard_page_redirects_unauthenticated)


def test_select_role_page():
    """GET /select-role — page renders"""
    res = requests.get(f"{BASE_URL}/select-role", timeout=TIMEOUT)
    assert res.status_code == 200, f"Select-role page returned {res.status_code}"

run_test("Page Select-Role (/select-role)", test_select_role_page)


# ===========================================================================
# J) DATABASE INTEGRATION TESTS
# ===========================================================================
print("\n=== J) Database Integration Tests ===")


def test_db_signup_creates_persistent_user():
    """Signup → login proves user was persisted to DB"""
    unique_email = f"dbtest_{uuid.uuid4().hex[:8]}@example.com"
    signup_res = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json={"email": unique_email, "password": "DbTestPass123!"},
        headers=HEADERS, timeout=TIMEOUT,
    )
    assert signup_res.status_code in (200, 201), f"Signup failed: {signup_res.text}"

    # Now verify login works (proves DB persistence)
    login_res = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": unique_email, "password": "DbTestPass123!"},
        headers=HEADERS, timeout=TIMEOUT,
    )
    assert login_res.status_code == 200, f"Login after signup failed: {login_res.text}"
    assert "access_token" in login_res.json(), "No access_token after DB login"

run_test("Signup persists user to DB -> login succeeds", test_db_signup_creates_persistent_user)


def test_db_profile_update_persists():
    """Profile update → re-fetch proves DB write"""
    login_res = requests.post(
        f"{BASE_URL}/api/auth",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        headers=HEADERS, timeout=TIMEOUT,
    )
    token = login_res.json()["access_token"]
    auth_h = {**HEADERS, "Authorization": f"Bearer {token}"}

    new_name = f"Persistent_{uuid.uuid4().hex[:6]}"
    requests.put(
        f"{BASE_URL}/api/profiles/me",
        json={"name": new_name, "email": TEST_EMAIL},
        headers=auth_h, timeout=TIMEOUT,
    )

    # Re-fetch and verify
    get_res = requests.get(f"{BASE_URL}/api/profiles/me", headers=auth_h, timeout=TIMEOUT)
    assert get_res.json()["name"] == new_name, "Profile name didn't persist in DB"

run_test("Profile update persists in DB", test_db_profile_update_persists)


# ===========================================================================
# K) CROSS-FLOW INTEGRATION — Full user journey
# ===========================================================================
print("\n=== K) Full User Journey Integration ===")


def test_full_user_journey():
    """
    Complete end-to-end flow:
    1. Signup new user
    2. Login via REST API
    3. View profile
    4. Update profile name
    5. Select role (Client, confirmed)
    6. Access dashboard with role-specific data
    7. Browse discovery
    8. Create a consultation
    9. Create a booking
    10. View client records
    """
    journey_email = f"journey_{uuid.uuid4().hex[:8]}@example.com"
    journey_password = "JourneyPass123!"
    session = requests.Session()

    # Step 1: Signup
    signup_res = session.post(
        f"{BASE_URL}/api/auth/signup",
        json={"email": journey_email, "password": journey_password},
        headers=HEADERS, timeout=TIMEOUT,
    )
    assert signup_res.status_code in (200, 201), f"Journey signup failed: {signup_res.text}"

    # Step 2: Login
    login_res = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": journey_email, "password": journey_password},
        headers=HEADERS, timeout=TIMEOUT,
    )
    assert login_res.status_code == 200, f"Journey login failed"
    token = login_res.json()["access_token"]
    auth_h = {**HEADERS, "Authorization": f"Bearer {token}"}

    # Step 3: View profile
    profile_res = session.get(f"{BASE_URL}/api/profiles/me", headers=auth_h, timeout=TIMEOUT)
    assert profile_res.status_code == 200, "Journey: couldn't fetch profile"
    profile = profile_res.json()
    assert "name" in profile

    # Step 4: Update name
    update_res = session.put(
        f"{BASE_URL}/api/profiles/me",
        json={"name": "Journey User", "email": journey_email},
        headers=auth_h, timeout=TIMEOUT,
    )
    assert update_res.status_code == 200, "Journey: profile update failed"

    # Step 5: Select Client role
    role_res = session.post(
        f"{BASE_URL}/api/select-role",
        json={"role": "Client", "confirmed": True},
        headers=auth_h, timeout=TIMEOUT,
    )
    assert role_res.status_code == 200, "Journey: role select failed"

    # Step 6: Dashboard with role-specific data
    dash_res = session.get(f"{BASE_URL}/api/dashboard", headers=auth_h, timeout=TIMEOUT)
    assert dash_res.status_code == 200, "Journey: dashboard failed"
    dash_data = dash_res.json()
    assert "sidebar" in dash_data, "Journey: dashboard missing sidebar"
    assert "Client Dashboard" in dash_data["sidebar"].get("title", "")

    # Step 7: Browse discovery
    disc_res = session.get(f"{BASE_URL}/api/discovery", headers=auth_h, timeout=TIMEOUT)
    assert disc_res.status_code == 200, "Journey: discovery failed"
    assert "lawyers" in disc_res.json()

    # Step 8: Create consultation
    consult_res = session.post(
        f"{BASE_URL}/api/consultations",
        json={"question_text": "Journey test consultation question"},
        headers=auth_h, timeout=TIMEOUT,
    )
    assert consult_res.status_code == 201, "Journey: consultation creation failed"

    # Step 9: Create booking
    booking_res = session.post(
        f"{BASE_URL}/api/booking",
        json={"lawyerId": 1, "datetime": "2027-12-01T10:00:00Z"},
        headers=auth_h, timeout=TIMEOUT,
    )
    assert booking_res.status_code == 201, "Journey: booking creation failed"

    # Step 10: View client records
    client_res = session.get(f"{BASE_URL}/api/client", headers=auth_h, timeout=TIMEOUT)
    assert client_res.status_code == 200, "Journey: client list failed"

run_test("Full user journey (10 steps)", test_full_user_journey)


def test_role_switching_journey():
    """
    Test switching between all 3 roles and verifying each dashboard:
    Client → Lawyer → Office
    """
    auth_h = get_auth_headers()
    roles_expected = {
        "Client": ("Client Dashboard", "consultations"),
        "Lawyer": ("Lawyer Dashboard", "case_management"),
        "Office": ("Office Dashboard", "client_management"),
    }

    for role, (expected_title, expected_feature) in roles_expected.items():
        # Select role confirmed
        select_res = requests.post(
            f"{BASE_URL}/api/select-role",
            json={"role": role, "confirmed": True},
            headers=auth_h, timeout=TIMEOUT,
        )
        assert select_res.status_code == 200, f"Select {role} failed"

        # Check dashboard
        dash_res = requests.get(f"{BASE_URL}/api/dashboard", headers=auth_h, timeout=TIMEOUT)
        assert dash_res.status_code == 200, f"Dashboard for {role} failed"
        data = dash_res.json()
        assert expected_title in data.get("sidebar", {}).get("title", ""), \
            f"Dashboard title for {role} wrong"
        assert expected_feature in data.get("workspace", {}).get("features", []), \
            f"Dashboard features for {role} missing {expected_feature}"

run_test("Role switching journey (Client->Lawyer->Office)", test_role_switching_journey)


# ===========================================================================
# FINAL SUMMARY
# ===========================================================================
print("\n" + "=" * 60)
print(f"  TOTAL: {passed + failed} tests | {passed} passed | {failed} failed")
print("=" * 60)

if errors:
    print("\nFailed tests:")
    for name, err in errors:
        print(f"  - {name}: {err}")

import sys
sys.exit(0 if failed == 0 else 1)
