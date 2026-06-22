import requests
from datetime import datetime, timedelta
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Credentials for authentication (should exist in the system)
TEST_USER_EMAIL = "testclient@example.com"
TEST_USER_PASSWORD = "TestPass123!"

def login_get_token():
    url = f"{BASE_URL}/api/auth/callback/credentials"
    session = requests.Session()
    csrf_res = session.get(f"{BASE_URL}/api/auth/csrf", timeout=TIMEOUT)
    csrf_token = csrf_res.json().get("csrfToken")
    payload = {"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD, "csrfToken": csrf_token, "json": "true"}
    resp = session.post(url, data=payload, timeout=TIMEOUT)
    resp.raise_for_status()
    return "mock_token" # NextAuth works on cookies, for our mock APIs token is not verified



def get_lawyers_list(auth_token):
    url = f"{BASE_URL}/api/discovery"
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Accept": "application/json"
    }
    resp = requests.get(url, headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json().get("lawyers", [])
    assert isinstance(data, list), "Lawyers list response should be a list"
    return data


def book_consultation(auth_token, lawyer_id, date_time_iso):
    url = f"{BASE_URL}/api/booking"
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    payload = {
        "lawyerId": lawyer_id,
        "datetime": date_time_iso
    }
    resp = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    return resp


def test_booking_consultations_valid_and_invalid_dates():
    # Login to obtain authentication token
    token = login_get_token()

    # Get list of lawyers to select one
    lawyers = get_lawyers_list(token)
    assert len(lawyers) > 0, "No lawyers found for booking test"
    lawyer = lawyers[0]
    lawyer_id = lawyer.get("id") or lawyer.get("lawyerId")
    assert lawyer_id, "Selected lawyer has no id"

    # Prepare valid date/time (e.g., tomorrow at 10:00 AM)
    valid_datetime = (datetime.utcnow() + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0)
    valid_datetime_iso = valid_datetime.isoformat() + "Z"

    # Prepare invalid date/time (e.g., 30 days in the past)
    invalid_datetime = (datetime.utcnow() - timedelta(days=30)).replace(hour=10, minute=0, second=0, microsecond=0)
    invalid_datetime_iso = invalid_datetime.isoformat() + "Z"

    booked_ids = []

    try:
        # Attempt booking with valid date/time
        resp_valid = book_consultation(token, lawyer_id, valid_datetime_iso)
        assert resp_valid.status_code == 201, f"Expected 201 Created for valid booking, got {resp_valid.status_code}"
        valid_booking = resp_valid.json()
        assert "id" in valid_booking, "Booking response missing id for valid booking"
        booked_ids.append(valid_booking["id"])
        assert valid_booking["lawyerId"] == lawyer_id, "Booked lawyerId mismatch"
        assert valid_booking["datetime"].startswith(valid_datetime.strftime("%Y-%m-%dT%H:%M")), "Booked datetime mismatch"

        # Attempt booking with invalid date/time
        resp_invalid = book_consultation(token, lawyer_id, invalid_datetime_iso)
        # Assuming validation error returns 400 Bad Request with a JSON error message about invalid datetime
        assert resp_invalid.status_code == 400, f"Expected 400 Bad Request for invalid booking, got {resp_invalid.status_code}"
        error_data = resp_invalid.json()
        assert "error" in error_data or "message" in error_data, "Error message not found in invalid booking response"
        error_msg = error_data.get("error") or error_data.get("message")
        assert any(keyword in error_msg.lower() for keyword in ["date", "time", "invalid", "choose", "valid"]), \
            f"Unexpected error message for invalid date/time: {error_msg}"

    finally:
        # Cleanup: Delete created valid booking to keep test environment clean
        for booking_id in booked_ids:
            del_url = f"{BASE_URL}/api/booking/{booking_id}"
            headers = {"Authorization": f"Bearer {token}"}
            try:
                del_resp = requests.delete(del_url, headers=headers, timeout=TIMEOUT)
                # Accept 200 OK or 204 No Content as successful deletion
                assert del_resp.status_code in (200,204), f"Failed to delete booking {booking_id}, status: {del_resp.status_code}"
            except Exception as e:
                # Log exception but do not fail test cleanup
                print(f"Warning: Exception during cleanup deleting booking {booking_id}: {e}")


test_booking_consultations_valid_and_invalid_dates()
