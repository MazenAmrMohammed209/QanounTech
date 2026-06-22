import requests
from requests.exceptions import RequestException, HTTPError, Timeout, ConnectionError

BASE_URL = "http://localhost:3000"
AUTH_ENDPOINT = f"{BASE_URL}/api/auth/login"
PROFILE_ME_ENDPOINT = f"{BASE_URL}/api/profiles/me"
PROFILE_PUBLIC_ENDPOINT = f"{BASE_URL}/api/profiles"  # to get public profiles list or individual profile by slug

USERNAME = "lamplampkok39@gmail.com"
PASSWORD = "lamplampkok39"

TIMEOUT = 30


def test_profiles_view_and_edit_with_validation():
    session = requests.Session()
    try:
        # 1. Authenticate and get token
        auth_payload = {"email": USERNAME, "password": PASSWORD}
        auth_headers = {"Content-Type": "application/json"}

        auth_resp = session.post(
            AUTH_ENDPOINT, json=auth_payload, headers=auth_headers, timeout=TIMEOUT
        )
        assert auth_resp.status_code == 200, f"Login failed: {auth_resp.text}"
        auth_json = auth_resp.json()
        assert "token" in auth_json, "Auth token missing in login response"
        token = auth_json["token"]

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        # 2. View own profile (GET /api/profiles/me)
        me_resp = session.get(PROFILE_ME_ENDPOINT, headers=headers, timeout=TIMEOUT)
        assert me_resp.status_code == 200, f"Failed to get own profile: {me_resp.text}"
        me_profile = me_resp.json()
        # Verify expected fields exist in profile (some basic naive checks)
        assert isinstance(me_profile, dict), "Own profile response not a dict"
        # Required fields to test validation later
        required_fields = ["name", "email"]
        for rf in required_fields:
            assert rf in me_profile, f"Required field '{rf}' missing from own profile data"
            assert me_profile[rf].strip() != "", f"Required field '{rf}' empty in own profile"

        original_profile_data = me_profile.copy()

        # 3. View one or more public profiles (GET /api/profiles)
        public_profiles_resp = session.get(PROFILE_PUBLIC_ENDPOINT, headers=headers, timeout=TIMEOUT)
        assert public_profiles_resp.status_code == 200, f"Failed to get public profiles: {public_profiles_resp.text}"
        public_profiles = public_profiles_resp.json()
        assert isinstance(public_profiles, list), "Public profiles response not a list"
        if len(public_profiles) > 0:
            # Test view public profile details by slug
            first_public = public_profiles[0]
            assert "slug" in first_public, "Public profile missing 'slug' field"
            slug = first_public["slug"]
            public_profile_detail_resp = session.get(
                f"{PROFILE_PUBLIC_ENDPOINT}/{slug}", headers=headers, timeout=TIMEOUT
            )
            assert public_profile_detail_resp.status_code == 200, f"Failed to get public profile detail: {public_profile_detail_resp.text}"
            public_detail = public_profile_detail_resp.json()
            assert isinstance(public_detail, dict), "Public profile detail not an object"
            assert "name" in public_detail, "Public profile detail missing 'name'"

        # 4. Edit own profile with valid changes and save (PUT /api/profiles/me)
        updated_profile = original_profile_data.copy()
        new_name = original_profile_data["name"] + " Updated"
        updated_profile["name"] = new_name

        update_resp = session.put(
            PROFILE_ME_ENDPOINT, headers=headers, json=updated_profile, timeout=TIMEOUT
        )
        assert update_resp.status_code == 200, f"Failed to update profile with valid data: {update_resp.text}"
        updated_profile_resp = update_resp.json()
        # Confirm the update persisted
        assert updated_profile_resp.get("name") == new_name, "Profile name not updated as expected"

        # 5. Attempt to clear a required field (e.g. name) - expect validation error
        invalid_profile = updated_profile.copy()
        invalid_profile["name"] = ""
        invalid_update_resp = session.put(
            PROFILE_ME_ENDPOINT, headers=headers, json=invalid_profile, timeout=TIMEOUT
        )
        # The API should reject with 4xx and an error message
        assert invalid_update_resp.status_code in (400, 422), f"Expected validation error on empty 'name', got {invalid_update_resp.status_code}: {invalid_update_resp.text}"
        invalid_error_resp = invalid_update_resp.json()
        # Validation errors may be in various fields, check message presence
        validation_error_messages = ["required", "cannot be empty", "validation"]
        error_str = str(invalid_error_resp).lower()
        assert any(m in error_str for m in validation_error_messages), "Expected validation error message not found"

        # 6. Revert profile to original valid data to avoid side effects
        revert_resp = session.put(
            PROFILE_ME_ENDPOINT, headers=headers, json=original_profile_data, timeout=TIMEOUT
        )
        assert revert_resp.status_code == 200, f"Failed to revert profile to original: {revert_resp.text}"

    except (RequestException, AssertionError, HTTPError, Timeout, ConnectionError) as err:
        assert False, f"Test TC006 failed: {err}"
    finally:
        session.close()


test_profiles_view_and_edit_with_validation()
