import requests
import time
from requests.exceptions import RequestException

BASE_URL = "http://localhost:3000"
AUTH_ENDPOINT = f"{BASE_URL}/api/auth/login"
DASHBOARD_ENDPOINT = f"{BASE_URL}/api/dashboard"
CONSULTATIONS_ENDPOINT = f"{BASE_URL}/api/consultations"
BOOKING_ENDPOINT = f"{BASE_URL}/api/booking"

USERNAME = "lamplampkok39@gmail.com"
PASSWORD = "lamplampkok39"

TIMEOUT = 30

def test_TC005_user_dashboard_display_and_navigation():
    session = requests.Session()
    token = None
    headers = {"Content-Type": "application/json"}

    try:
        # 1. Authenticate user to get token (Basic token expected, simulate login to get JWT)
        login_payload = {
            "email": USERNAME,
            "password": PASSWORD
        }
        try:
            resp = session.post(AUTH_ENDPOINT, json=login_payload, timeout=TIMEOUT, headers=headers)
        except RequestException as e:
            assert False, f"Network failure during login: {e}"

        assert resp.status_code == 200, f"Login failed with status {resp.status_code}: {resp.text}"
        login_data = resp.json()
        # Validate presence of token or session id in response
        token = login_data.get("token") or login_data.get("accessToken") or login_data.get("jwt") or login_data.get("session") or (login_data.get("user") and login_data.get("user").get("token"))
        assert token, f"Authentication token not found in login response: {login_data}"
        auth_headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        # 2. Access dashboard - should be protected route
        try:
            dash_resp = session.get(DASHBOARD_ENDPOINT, headers=auth_headers, timeout=TIMEOUT)
        except RequestException as e:
            assert False, f"Network failure accessing dashboard: {e}"

        assert dash_resp.status_code == 200, f"Dashboard access failed with status {dash_resp.status_code}: {dash_resp.text}"
        dash_data = dash_resp.json()
        # Validate that dashboard data contains past consultations, summary stats, quick links, etc
        assert isinstance(dash_data, dict), "Dashboard response is not a JSON object"
        assert "pastConsultations" in dash_data, "Dashboard missing 'pastConsultations'"
        assert isinstance(dash_data["pastConsultations"], list), "'pastConsultations' is not a list"
        assert "summaryStats" in dash_data, "Dashboard missing 'summaryStats'"
        assert isinstance(dash_data["summaryStats"], dict), "'summaryStats' is not an object"
        assert "quickLinks" in dash_data, "Dashboard missing 'quickLinks'"
        assert isinstance(dash_data["quickLinks"], list), "'quickLinks' is not a list"

        # 3. From dashboard data, attempt navigation to /consultations API
        try:
            cons_resp = session.get(CONSULTATIONS_ENDPOINT, headers=auth_headers, timeout=TIMEOUT)
        except RequestException as e:
            assert False, f"Network failure accessing consultations: {e}"

        assert cons_resp.status_code == 200, f"Consultations access failed with status {cons_resp.status_code}: {cons_resp.text}"
        cons_data = cons_resp.json()
        assert isinstance(cons_data, list), "Consultations response is not a list"

        # 4. From dashboard data, attempt navigation to /booking API
        try:
            booking_resp = session.get(BOOKING_ENDPOINT, headers=auth_headers, timeout=TIMEOUT)
        except RequestException as e:
            assert False, f"Network failure accessing booking: {e}"

        assert booking_resp.status_code == 200, f"Booking access failed with status {booking_resp.status_code}: {booking_resp.text}"
        booking_data = booking_resp.json()
        assert isinstance(booking_data, list) or isinstance(booking_data, dict), "Booking response unexpected format"

        # 5. Edge Case: Accessing dashboard with expired token (simulate by tampering token)
        expired_headers = {"Authorization": f"Bearer {token}EXPIRED", "Content-Type": "application/json"}
        try:
            expired_resp = session.get(DASHBOARD_ENDPOINT, headers=expired_headers, timeout=TIMEOUT)
        except RequestException as e:
            assert False, f"Network failure accessing dashboard with expired token: {e}"
        assert expired_resp.status_code in (401, 403), f"Expired token access should be denied, got status {expired_resp.status_code}"

        # 6. Edge Case: Access dashboard with invalid JWT/session
        invalid_headers = {"Authorization": "Bearer invalid.jwt.token", "Content-Type": "application/json"}
        try:
            invalid_resp = session.get(DASHBOARD_ENDPOINT, headers=invalid_headers, timeout=TIMEOUT)
        except RequestException as e:
            assert False, f"Network failure accessing dashboard with invalid token: {e}"
        assert invalid_resp.status_code in (401, 403), f"Invalid token access should be denied, got status {invalid_resp.status_code}"

        # 7. Edge Case: No token (unauthenticated)
        try:
            noauth_resp = session.get(DASHBOARD_ENDPOINT, timeout=TIMEOUT)
        except RequestException as e:
            assert False, f"Network failure accessing dashboard unauthenticated: {e}"
        assert noauth_resp.status_code in (401, 403), f"Unauthenticated access should be denied, got status {noauth_resp.status_code}"

        # 8. Edge Case: Simulate backend downtime by requesting invalid port
        downtimed_url = DASHBOARD_ENDPOINT.replace("3000", "9999")
        try:
            session.get(downtimed_url, headers=auth_headers, timeout=10)
            assert False, "Expected connection error due to backend downtime simulation did not occur"
        except requests.exceptions.ConnectionError:
            pass  # Expected

    finally:
        session.close()

test_TC005_user_dashboard_display_and_navigation()
