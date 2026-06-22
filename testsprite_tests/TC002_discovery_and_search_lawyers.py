import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_discovery_and_search_lawyers():
    session = requests.Session()

    # Assume we need authentication since /discovery requires auth
    # First, login as a valid user to get auth cookie or token
    csrf_res = session.get(f"{BASE_URL}/api/auth/csrf", timeout=TIMEOUT)
    csrf_token = csrf_res.json().get("csrfToken")
    login_payload = {
        "email": "testuser@example.com",
        "password": "StrongPass123!",
        "csrfToken": csrf_token,
        "json": "true"
    }

    login_response = session.post(
        f"{BASE_URL}/api/auth/callback/credentials",
        data=login_payload,
        timeout=TIMEOUT
    )
    assert login_response.status_code == 200, f"Login failed with status {login_response.status_code}"
    # Assuming that after login cookie/session is set automatically in session

    # Test search with various criteria and filters
    search_tests = [
        # Search by specialty, location, language filters
        {
            "query": {"specialty": "family law", "location": "Cairo", "language": "Arabic"},
            "expected_min_results": 1,
        },
        # Broad search term without filters
        {
            "query": {"searchTerm": "lawyer"},
            "expected_min_results": 1,
        },
        # Search by language only
        {
            "query": {"language": "English"},
            "expected_min_results": 1,
        },
    ]

    for test_case in search_tests:
        params = test_case["query"]
        response = session.get(
            f"{BASE_URL}/api/discovery",
            params=params,
            timeout=TIMEOUT
        )
        assert response.status_code == 200, f"Discovery search failed with status {response.status_code}"
        data = response.json()
        assert isinstance(data, dict), "Response is not a JSON object"
        lawyers = data.get("lawyers", [])
        offices = data.get("offices", [])
        total_results = len(lawyers) + len(offices)
        assert total_results >= test_case["expected_min_results"], (
            f"Expected at least {test_case['expected_min_results']} results, got {total_results}"
        )

        # Check structure of first lawyer and office profile if available
        if lawyers:
            lawyer = lawyers[0]
            assert "id" in lawyer and isinstance(lawyer["id"], (int, str))
            assert "name" in lawyer and isinstance(lawyer["name"], str) and lawyer["name"]
            assert "specialty" in lawyer
            assert "profileUrl" in lawyer and isinstance(lawyer["profileUrl"], str) and lawyer["profileUrl"].startswith("/profiles")

            # Verify viewing profile endpoint returns 200
            profile_url = lawyer["profileUrl"]
            profile_response = session.get(
                f"{BASE_URL}/api{profile_url}",
                timeout=TIMEOUT
            )
            assert profile_response.status_code == 200, f"Profile view failed with status {profile_response.status_code}"

        if offices:
            office = offices[0]
            assert "id" in office and isinstance(office["id"], (int, str))
            assert "name" in office and isinstance(office["name"], str) and office["name"]
            assert "location" in office
            assert "profileUrl" in office and isinstance(office["profileUrl"], str) and office["profileUrl"].startswith("/profiles")

            profile_url = office["profileUrl"]
            profile_response = session.get(
                f"{BASE_URL}/api{profile_url}",
                timeout=TIMEOUT
            )
            assert profile_response.status_code == 200, f"Office profile view failed with status {profile_response.status_code}"


test_discovery_and_search_lawyers()