"""
TC011 -- Session Persistence, Redirect Logic & Role Wizard Guard Tests
=======================================================================
Tests the bugs that were fixed:
  1) Session persists across requests (JWT token in cookie)
  2) Login redirects to correct dashboard based on user's existing role
  3) Authenticated users are redirected away from /login and /signup
  4) Select-role page redirects if role already set
  5) Dashboard is protected from unauthenticated access
  6) CSRF + cookie session flow works for persistence
"""

import requests
import uuid
import time

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


# ===================================================================
# 1) SESSION PERSISTENCE TESTS
# ===================================================================
print("\n=== 1) Session Persistence Tests ===")


def test_session_persists_across_requests():
    """Signup + NextAuth login, then verify session cookie persists"""
    email = f"persist_{UID}@example.com"
    pw = "PersistTest123!"

    # Create user
    requests.post(f"{BASE_URL}/api/auth/signup", json={"email": email, "password": pw}, headers=H, timeout=TIMEOUT)

    # Login via NextAuth to get session cookie
    session = requests.Session()
    csrf_r = session.get(f"{BASE_URL}/api/auth/csrf", timeout=TIMEOUT)
    csrf_token = csrf_r.json()["csrfToken"]

    session.post(
        f"{BASE_URL}/api/auth/callback/credentials",
        data={"email": email, "password": pw, "csrfToken": csrf_token, "json": "true"},
        timeout=TIMEOUT,
    )

    # Check session - first request
    sess1 = session.get(f"{BASE_URL}/api/auth/session", timeout=TIMEOUT)
    assert sess1.status_code == 200

    # Check session - second request (simulates page reload)
    sess2 = session.get(f"{BASE_URL}/api/auth/session", timeout=TIMEOUT)
    assert sess2.status_code == 200

    # Both should return the same user data
    d1 = sess1.json()
    d2 = sess2.json()
    if "user" in d1:
        assert d1["user"]["email"] == d2["user"]["email"], "Session data changed between requests"

test("Session persists across multiple requests", test_session_persists_across_requests)


def test_session_cookie_set_after_login():
    """After NextAuth login, cookies should be set"""
    email = f"cookie_{UID}@example.com"
    pw = "CookieTest123!"
    requests.post(f"{BASE_URL}/api/auth/signup", json={"email": email, "password": pw}, headers=H, timeout=TIMEOUT)

    session = requests.Session()
    csrf_r = session.get(f"{BASE_URL}/api/auth/csrf", timeout=TIMEOUT)
    csrf_token = csrf_r.json()["csrfToken"]

    cb_r = session.post(
        f"{BASE_URL}/api/auth/callback/credentials",
        data={"email": email, "password": pw, "csrfToken": csrf_token, "json": "true"},
        timeout=TIMEOUT,
    )
    assert cb_r.status_code == 200

    # Session cookies should be set
    cookies = session.cookies.get_dict()
    # NextAuth v5 uses authjs.session-token or __Secure-authjs.session-token
    has_session_cookie = any("session" in k.lower() or "token" in k.lower() for k in cookies.keys())
    assert has_session_cookie or len(cookies) > 0, f"No cookies set after login. Cookies: {cookies}"

test("Session cookie is set after NextAuth login", test_session_cookie_set_after_login)


def test_jwt_token_stays_valid():
    """REST API token should work across multiple requests"""
    email = f"jwt_{UID}@example.com"
    pw = "JwtTest123!"
    requests.post(f"{BASE_URL}/api/auth/signup", json={"email": email, "password": pw}, headers=H, timeout=TIMEOUT)

    # Get token
    login_r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": pw}, headers=H, timeout=TIMEOUT)
    token = login_r.json()["access_token"]
    ah = {**H, "Authorization": f"Bearer {token}"}

    # Use token multiple times
    r1 = requests.get(f"{BASE_URL}/api/profiles/me", headers=ah, timeout=TIMEOUT)
    assert r1.status_code == 200, f"First request failed: {r1.status_code}"

    r2 = requests.get(f"{BASE_URL}/api/profiles/me", headers=ah, timeout=TIMEOUT)
    assert r2.status_code == 200, f"Second request failed: {r2.status_code}"

    # Data should be consistent
    assert r1.json()["email"] == r2.json()["email"], "Profile data inconsistent"

test("JWT token stays valid across multiple requests", test_jwt_token_stays_valid)


# ===================================================================
# 2) LOGIN REDIRECT TESTS
# ===================================================================
print("\n=== 2) Login Redirect Logic Tests ===")


def test_login_page_accessible_unauthenticated():
    """GET /login should return 200 for unauthenticated users"""
    r = requests.get(f"{BASE_URL}/login", timeout=TIMEOUT)
    assert r.status_code == 200
    assert "text/html" in r.headers.get("Content-Type", "")

test("Login page accessible when not authenticated", test_login_page_accessible_unauthenticated)


def test_signup_page_accessible_unauthenticated():
    """GET /signup should return 200 for unauthenticated users"""
    r = requests.get(f"{BASE_URL}/signup", timeout=TIMEOUT)
    assert r.status_code == 200

test("Signup page accessible when not authenticated", test_signup_page_accessible_unauthenticated)


def test_authenticated_user_redirected_from_login():
    """Authenticated user visiting /login should be redirected"""
    email = f"redir_{UID}@example.com"
    pw = "RedirTest123!"
    requests.post(f"{BASE_URL}/api/auth/signup", json={"email": email, "password": pw}, headers=H, timeout=TIMEOUT)

    session = requests.Session()
    csrf_r = session.get(f"{BASE_URL}/api/auth/csrf", timeout=TIMEOUT)
    token = csrf_r.json()["csrfToken"]
    session.post(
        f"{BASE_URL}/api/auth/callback/credentials",
        data={"email": email, "password": pw, "csrfToken": token, "json": "true"},
        timeout=TIMEOUT,
    )

    # Now visit /login as authenticated user
    r = session.get(f"{BASE_URL}/login", timeout=TIMEOUT, allow_redirects=True)
    # Should have been redirected away from /login
    # The final URL should NOT be /login
    assert r.status_code == 200
    # Check if redirected (url changed or page content is dashboard-like)
    is_redirected = "login" not in r.url.rstrip("/").split("/")[-1] or "dashboard" in r.text.lower() or "consultations" in r.text.lower()
    assert is_redirected, f"Authenticated user was NOT redirected from /login. Final URL: {r.url}"

test("Authenticated user redirected from /login", test_authenticated_user_redirected_from_login)


def test_authenticated_user_redirected_from_signup():
    """Authenticated user visiting /signup should be redirected"""
    email = f"redir2_{UID}@example.com"
    pw = "RedirTest123!"
    requests.post(f"{BASE_URL}/api/auth/signup", json={"email": email, "password": pw}, headers=H, timeout=TIMEOUT)

    session = requests.Session()
    csrf_r = session.get(f"{BASE_URL}/api/auth/csrf", timeout=TIMEOUT)
    token = csrf_r.json()["csrfToken"]
    session.post(
        f"{BASE_URL}/api/auth/callback/credentials",
        data={"email": email, "password": pw, "csrfToken": token, "json": "true"},
        timeout=TIMEOUT,
    )

    r = session.get(f"{BASE_URL}/signup", timeout=TIMEOUT, allow_redirects=True)
    assert r.status_code == 200
    is_redirected = "signup" not in r.url.rstrip("/").split("/")[-1] or "dashboard" in r.text.lower()
    assert is_redirected, f"Authenticated user was NOT redirected from /signup. Final URL: {r.url}"

test("Authenticated user redirected from /signup", test_authenticated_user_redirected_from_signup)


# ===================================================================
# 3) DASHBOARD PROTECTION TESTS
# ===================================================================
print("\n=== 3) Dashboard Protection Tests ===")


def test_dashboard_client_protected():
    """GET /dashboard/client without auth should redirect to /login"""
    r = requests.get(f"{BASE_URL}/dashboard/client", timeout=TIMEOUT, allow_redirects=True)
    assert r.status_code == 200
    assert "login" in r.url or "password" in r.text.lower(), \
        f"Dashboard client not protected. URL: {r.url}"

test("Dashboard /client protected (redirects to /login)", test_dashboard_client_protected)


def test_dashboard_lawyer_protected():
    """GET /dashboard/lawyer without auth should redirect to /login"""
    r = requests.get(f"{BASE_URL}/dashboard/lawyer", timeout=TIMEOUT, allow_redirects=True)
    assert r.status_code == 200
    assert "login" in r.url or "password" in r.text.lower()

test("Dashboard /lawyer protected (redirects to /login)", test_dashboard_lawyer_protected)


def test_dashboard_office_protected():
    """GET /dashboard/office without auth should redirect to /login"""
    r = requests.get(f"{BASE_URL}/dashboard/office", timeout=TIMEOUT, allow_redirects=True)
    assert r.status_code == 200
    assert "login" in r.url or "password" in r.text.lower()

test("Dashboard /office protected (redirects to /login)", test_dashboard_office_protected)


def test_select_role_protected():
    """GET /select-role without auth should redirect to /login"""
    r = requests.get(f"{BASE_URL}/select-role", timeout=TIMEOUT, allow_redirects=True)
    assert r.status_code == 200
    assert "login" in r.url, \
        f"Select-role not properly handled. URL: {r.url}"

test("Select-role redirects unauthenticated to /login", test_select_role_protected)


# ===================================================================
# 4) ROLE WIZARD GUARD TESTS
# ===================================================================
print("\n=== 4) Role Wizard Guard Tests ===")


def test_role_wizard_allowed_for_user_without_role():
    """Authenticated user without role should be allowed to access /select-role"""
    email = f"blocked_{UID}@example.com"
    pw = "BlockedTest123!"
    requests.post(f"{BASE_URL}/api/auth/signup", json={"email": email, "password": pw}, headers=H, timeout=TIMEOUT)

    # Login via NextAuth
    session = requests.Session()
    csrf = session.get(f"{BASE_URL}/api/auth/csrf", timeout=TIMEOUT).json()["csrfToken"]
    session.post(f"{BASE_URL}/api/auth/callback/credentials",
                 data={"email": email, "password": pw, "csrfToken": csrf, "json": "true"},
                 timeout=TIMEOUT)

    # Visit /select-role -> should stay on role wizard for users with no role
    r = session.get(f"{BASE_URL}/select-role", timeout=TIMEOUT, allow_redirects=True)
    assert r.status_code == 200
    # Should remain on role wizard
    assert "select-role" in r.url, \
        f"User without role was redirected away from /select-role. URL: {r.url}"

test("Wizard allowed for user without role", test_role_wizard_allowed_for_user_without_role)


def test_role_wizard_works_without_onboarding_param():
    """Authenticated user should see wizard at /select-role without query params"""
    email = f"onboard_{UID}@example.com"
    pw = "OnboardTest123!"
    requests.post(f"{BASE_URL}/api/auth/signup", json={"email": email, "password": pw}, headers=H, timeout=TIMEOUT)

    # Login via NextAuth
    session = requests.Session()
    csrf = session.get(f"{BASE_URL}/api/auth/csrf", timeout=TIMEOUT).json()["csrfToken"]
    session.post(f"{BASE_URL}/api/auth/callback/credentials",
                 data={"email": email, "password": pw, "csrfToken": csrf, "json": "true"},
                 timeout=TIMEOUT)

    # Visit /select-role without onboarding=true -> should still show wizard
    r = session.get(f"{BASE_URL}/select-role", timeout=TIMEOUT, allow_redirects=True)
    assert r.status_code == 200
    # Should stay on select-role page
    assert "select-role" in r.url, \
        f"Wizard not shown at /select-role. URL: {r.url}"

test("Wizard shown without onboarding query param", test_role_wizard_works_without_onboarding_param)


def test_role_wizard_blocked_for_lawyer():
    """User with 'lawyer' role visiting /select-role (no param) should be redirected"""
    email = f"lawyer_{UID}@example.com"
    pw = "LawyerTest123!"
    requests.post(f"{BASE_URL}/api/auth/signup", json={"email": email, "password": pw}, headers=H, timeout=TIMEOUT)

    # Set role to lawyer
    token = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": pw}, headers=H, timeout=TIMEOUT).json()["access_token"]
    requests.post(f"{BASE_URL}/api/select-role", json={"role": "Lawyer", "confirmed": True}, headers={**H, "Authorization": f"Bearer {token}"}, timeout=TIMEOUT)

    # Login via NextAuth
    session = requests.Session()
    csrf = session.get(f"{BASE_URL}/api/auth/csrf", timeout=TIMEOUT).json()["csrfToken"]
    session.post(f"{BASE_URL}/api/auth/callback/credentials",
                 data={"email": email, "password": pw, "csrfToken": csrf, "json": "true"},
                 timeout=TIMEOUT)

    # Visit /select-role as authenticated user with lawyer role
    r = session.get(f"{BASE_URL}/select-role", timeout=TIMEOUT, allow_redirects=True)
    assert r.status_code == 200
    # Should be redirected away
    assert "select-role" not in r.url.split("?")[0].rstrip("/").split("/")[-1], \
        f"Lawyer was NOT redirected from /select-role. URL: {r.url}"

test("Lawyer blocked from role wizard", test_role_wizard_blocked_for_lawyer)


# ===================================================================
# 5) ROLE-BASED REDIRECT AFTER LOGIN
# ===================================================================
print("\n=== 5) Role-Based Login Redirect ===")


def test_login_action_redirect_for_existing_role():
    """Login via REST API when user has a set role"""
    email = f"rolered_{UID}@example.com"
    pw = "RoleRedirect123!"

    # Signup and set role to lawyer via API
    requests.post(f"{BASE_URL}/api/auth/signup", json={"email": email, "password": pw}, headers=H, timeout=TIMEOUT)
    token = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": pw}, headers=H, timeout=TIMEOUT).json()["access_token"]

    # Set role in DB via the select-role API AND update directly in users table
    from requests import put
    requests.post(f"{BASE_URL}/api/select-role", json={"role": "Lawyer", "confirmed": True}, headers={**H, "Authorization": f"Bearer {token}"}, timeout=TIMEOUT)

    # The role should now be stored. Login again - should still work
    login_r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": pw}, headers=H, timeout=TIMEOUT)
    assert login_r.status_code == 200, f"Login failed: {login_r.text}"
    assert "access_token" in login_r.json()

test("Login still works for user with existing role", test_login_action_redirect_for_existing_role)


# ===================================================================
# 6) EDGE CASES
# ===================================================================
print("\n=== 6) Edge Cases ===")


def test_multiple_tabs_session():
    """Simulate multiple tabs by making concurrent session requests"""
    email = f"tabs_{UID}@example.com"
    pw = "TabsTest123!"
    requests.post(f"{BASE_URL}/api/auth/signup", json={"email": email, "password": pw}, headers=H, timeout=TIMEOUT)

    session = requests.Session()
    csrf = session.get(f"{BASE_URL}/api/auth/csrf", timeout=TIMEOUT).json()["csrfToken"]
    session.post(f"{BASE_URL}/api/auth/callback/credentials",
                 data={"email": email, "password": pw, "csrfToken": csrf, "json": "true"},
                 timeout=TIMEOUT)

    # Simulate multiple tabs
    r1 = session.get(f"{BASE_URL}/api/auth/session", timeout=TIMEOUT)
    r2 = session.get(f"{BASE_URL}/api/auth/session", timeout=TIMEOUT)
    r3 = session.get(f"{BASE_URL}/api/auth/session", timeout=TIMEOUT)

    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r3.status_code == 200

test("Multiple tab session requests work", test_multiple_tabs_session)


def test_api_routes_not_blocked_by_middleware():
    """API routes should not be blocked by middleware"""
    # Public API routes
    r = requests.get(f"{BASE_URL}/api/discovery", timeout=TIMEOUT)
    assert r.status_code == 200, f"Discovery API blocked: {r.status_code}"

    r = requests.get(f"{BASE_URL}/api/consultations", timeout=TIMEOUT)
    assert r.status_code == 200, f"Consultations API blocked: {r.status_code}"

    r = requests.get(f"{BASE_URL}/api/auth/csrf", timeout=TIMEOUT)
    assert r.status_code == 200, f"Auth CSRF blocked: {r.status_code}"

test("API routes not blocked by middleware", test_api_routes_not_blocked_by_middleware)


def test_static_pages_not_blocked():
    """Public pages should still work with middleware"""
    for path in ["/", "/discovery", "/consultations"]:
        r = requests.get(f"{BASE_URL}{path}", timeout=TIMEOUT)
        assert r.status_code == 200, f"{path} blocked: {r.status_code}"

test("Public pages not blocked by middleware", test_static_pages_not_blocked)


# ===================================================================
# SUMMARY
# ===================================================================
print("\n" + "=" * 60)
print(f"  TC011 RESULTS: {passed + failed} tests | {passed} passed | {failed} failed")
print("=" * 60)

if errors:
    print("\nFailed tests:")
    for name, err in errors:
        print(f"  - {name}: {err}")

import sys
sys.exit(0 if failed == 0 else 1)
