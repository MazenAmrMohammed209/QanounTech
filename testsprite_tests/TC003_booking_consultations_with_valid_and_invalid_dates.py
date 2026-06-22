import requests
import datetime
import time

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
USERNAME = "lamplampkok39@gmail.com"
PASSWORD = "lamplampkok39"

def authenticate():
    url = f"{BASE_URL}/api/auth/login"
    headers = {"Content-Type": "application/json"}
    payload = {"email": USERNAME, "password": PASSWORD}
    resp = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Login failed: {resp.status_code} {resp.text}"
    data = resp.json()
    token = data.get("token") or data.get("access_token") or data.get("accessToken")
    assert token, "Authentication token missing in login response"
    return token

def get_user_role(token):
    """Fetch or select user role; required for booking access."""
    # Try to get current role from /api/profiles/me
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/api/profiles/me", headers=headers, timeout=TIMEOUT)
    if resp.status_code != 200:
        raise Exception(f"Failed to get profile/me for role: {resp.status_code} {resp.text}")
    profile_data = resp.json()
    role = profile_data.get("role")
    if role:
        return role
    # If no role, try to select role Client
    role_select_url = f"{BASE_URL}/api/select-role"
    resp_role = requests.post(role_select_url, headers=headers, json={"role": "Client"}, timeout=TIMEOUT)
    assert resp_role.status_code == 200, f"Role selection failed: {resp_role.status_code} {resp_role.text}"
    return "Client"

def discover_lawyers(token):
    """Call /api/discovery to get list of lawyers."""
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/api/discovery?role=lawyer", headers=headers, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Discovery failed: {resp.status_code} {resp.text}"
    data = resp.json()
    lawyers = data if isinstance(data, list) else data.get("lawyers") or data.get("results")
    assert lawyers and isinstance(lawyers, list), "No lawyers found in discovery"
    return lawyers

def get_lawyer_available_slots(token, lawyer_id):
    """Fetch available booking slots for the lawyer if such API exists."""
    # Since no explicit GET slots endpoint is in PRD, try /api/profiles/[slug] or /api/booking with filters
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/api/booking?lawyer_id={lawyer_id}", headers=headers, timeout=TIMEOUT)
    if resp.status_code != 200:
        # fallback: no slots info, create tentative slots by business hours next days
        today = datetime.datetime.utcnow().date()
        slots = []
        for i in range(1, 4):
            dt = datetime.datetime.combine(today + datetime.timedelta(days=i), datetime.time(hour=10))
            slots.append(dt.isoformat() + "Z")
        return slots
    data = resp.json()
    slots = data.get("available_slots") or data.get("slots") or data
    assert slots and isinstance(slots, list), "No available slots found for lawyer"
    return slots

def book_consultation(token, lawyer_id, datetime_iso):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "lawyer_id": lawyer_id,
        "datetime": datetime_iso
    }
    resp = requests.post(f"{BASE_URL}/api/booking", json=payload, headers=headers, timeout=TIMEOUT)
    return resp

def delete_booking(token, booking_id):
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.delete(f"{BASE_URL}/api/booking/{booking_id}", headers=headers, timeout=TIMEOUT)
    return resp

def test_booking_consultations_with_valid_and_invalid_dates():
    token = authenticate()

    # Ensure role selected for booking (Client role)
    role = get_user_role(token)
    assert role in ["Client", "client"], f"User role not suitable for booking: {role}"

    headers = {"Authorization": f"Bearer {token}"}

    # Discover lawyers to get real dynamic data
    lawyers = discover_lawyers(token)
    lawyer = lawyers[0]
    lawyer_id = lawyer.get("id") or lawyer.get("_id") or lawyer.get("user_id")
    assert lawyer_id, "No lawyer id found"

    available_slots = get_lawyer_available_slots(token, lawyer_id)
    assert len(available_slots) > 0, "No available slots found for lawyer"

    # Pick the earliest valid slot
    valid_slot = available_slots[0]

    # Create an invalid slot datetime in the past
    past_datetime = (datetime.datetime.utcnow() - datetime.timedelta(days=2)).isoformat() + "Z"

    booking_id = None

    # Test booking with valid datetime slot
    resp_valid = book_consultation(token, lawyer_id, valid_slot)
    assert resp_valid.status_code == 201 or resp_valid.status_code == 200, f"Valid booking failed with status {resp_valid.status_code}: {resp_valid.text}"
    booking_data = resp_valid.json() if resp_valid.headers.get("content-type","").startswith("application/json") else {}
    booking_id = booking_data.get("id") or booking_data.get("booking_id") or booking_data.get("_id")
    assert booking_id, "Booking ID missing after successful booking"

    try:
        # Test booking with invalid datetime slot (past)
        resp_invalid = book_consultation(token, lawyer_id, past_datetime)
        # Expect failure - 400 or validation error
        assert resp_invalid.status_code == 400 or resp_invalid.status_code == 422, \
            f"Invalid booking date/time did not fail as expected, status: {resp_invalid.status_code}, response: {resp_invalid.text}"
        err_json = resp_invalid.json() if resp_invalid.headers.get("content-type","").startswith("application/json") else {}
        err_message = err_json.get("error") or err_json.get("message") or ""
        assert any(txt in err_message.lower() for txt in ["valid date", "invalid date", "validation", "past", "choose a valid"]), \
            f"Error message for invalid booking slot unexpected: {err_message}"

    finally:
        if booking_id:
            # Clean up: delete booking
            del_resp = delete_booking(token, booking_id)
            assert del_resp.status_code == 200 or del_resp.status_code == 204, f"Failed to delete booking: {del_resp.status_code} {del_resp.text}"

test_booking_consultations_with_valid_and_invalid_dates()