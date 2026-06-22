import requests
from requests.exceptions import RequestException

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Test user credentials for authentication
TEST_EMAIL = "testuser_profiles@example.com"
TEST_PASSWORD = "TestPass123!"

def test_profiles_view_and_edit_validation():
    session = requests.Session()
    headers = {"Content-Type": "application/json"}

    # 1. Signup the user (if not exists)
    signup_payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    try:
        res = session.post(
            f"{BASE_URL}/api/auth/signup",
            json=signup_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        # Accept 201 Created, 200 OK or 409 Conflict (user exists)
        assert res.status_code in (200, 201, 409)
    except RequestException as e:
        raise AssertionError(f"Signup request failed: {e}")

    # 2. Login to get authenticated session and token
    login_payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    try:
        res = session.post(
            f"{BASE_URL}/api/auth/login",
            json=login_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert res.status_code in (200, 201)
        if "application/json" in res.headers.get("Content-Type", ""):
            data = res.json()
            token = data.get("access_token")
            if token:
                session.headers.update({"Authorization": f"Bearer {token}"})
    except RequestException as e:
        raise AssertionError(f"Login request failed: {e}")

    # 3. Get current user profile
    try:
        res = session.get(f"{BASE_URL}/api/profiles/me", timeout=TIMEOUT)
        assert res.status_code == 200
        profile = res.json()
        # Must contain at minimum: 'name' and other required fields
        assert "name" in profile and isinstance(profile["name"], str)
    except RequestException as e:
        raise AssertionError(f"Get profile request failed: {e}")

    # 4. Edit profile with valid changes (change name)
    original_name = profile["name"]
    updated_name = original_name + " Updated"
    update_payload_valid = profile.copy()
    update_payload_valid["name"] = updated_name

    try:
        res = session.put(
            f"{BASE_URL}/api/profiles/me",
            json=update_payload_valid,
            timeout=TIMEOUT
        )
        assert res.status_code == 200 or res.status_code == 204
    except RequestException as e:
        raise AssertionError(f"Update profile valid request failed: {e}")

    # Confirm the changes were saved
    try:
        res = session.get(f"{BASE_URL}/api/profiles/me", timeout=TIMEOUT)
        assert res.status_code == 200
        profile_after_update = res.json()
        assert profile_after_update.get("name") == updated_name
    except RequestException as e:
        raise AssertionError(f"Get profile after valid update request failed: {e}")

    # 5. Attempt to update profile clearing required field 'name'
    update_payload_invalid = profile_after_update.copy()
    update_payload_invalid["name"] = ""

    try:
        res = session.put(
            f"{BASE_URL}/api/profiles/me",
            json=update_payload_invalid,
            timeout=TIMEOUT
        )
        # Expect validation error (400 Bad Request or 422 Unprocessable Entity)
        assert res.status_code in (400, 422)
        # Confirm error message about required fields
        if "application/json" in res.headers.get("Content-Type", ""):
            error_data = res.json()
            error_msg = str(error_data.get("error") or error_data.get("message") or "")
            assert "required" in error_msg.lower() or "name" in error_msg.lower()
    except RequestException as e:
        raise AssertionError(f"Update profile invalid request failed: {e}")

    # 6. Clean-up: revert profile name to original value in try-finally style
    try:
        revert_payload = profile_after_update.copy()
        revert_payload["name"] = original_name
        res = session.put(
            f"{BASE_URL}/api/profiles/me",
            json=revert_payload,
            timeout=TIMEOUT
        )
        assert res.status_code == 200 or res.status_code == 204
    except RequestException as e:
        raise AssertionError(f"Revert profile request failed: {e}")

test_profiles_view_and_edit_validation()
