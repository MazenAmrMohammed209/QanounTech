import requests
import uuid
import time

BASE_URL = "http://localhost:3000"
AUTH_LOGIN_URL = f"{BASE_URL}/api/auth"
CONSULTATIONS_URL = f"{BASE_URL}/api/consultations"
HEADERS_JSON = {"Content-Type": "application/json"}
TIMEOUT = 30

USERNAME = "lamplampkok39@gmail.com"
PASSWORD = "lamplampkok39"

def authenticate(email: str, password: str):
    payload = {"email": email, "password": password}
    try:
        resp = requests.post(AUTH_LOGIN_URL, json=payload, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        # Expected token in data.accessToken or data.token or similar
        token = data.get("accessToken") or data.get("token") or data.get("access_token")
        if not token:
            raise ValueError("Authentication token not found in response")
        return token
    except Exception as e:
        raise RuntimeError(f"Authentication failed: {str(e)}")

def create_consultation(token: str, question_text: str, attachments: list = None):
    if attachments is None:
        attachments = []
    payload = {
        "question": question_text,
        "attachments": attachments,
    }
    headers = {
        "Authorization": f"Bearer {token}",
        **HEADERS_JSON,
    }
    resp = requests.post(CONSULTATIONS_URL, json=payload, headers=headers, timeout=TIMEOUT)
    return resp

def delete_consultation(token: str, consultation_id: str):
    url = f"{CONSULTATIONS_URL}/{consultation_id}"
    headers = {
        "Authorization": f"Bearer {token}",
    }
    resp = requests.delete(url, headers=headers, timeout=TIMEOUT)
    return resp

def consultations_submission_and_validation():
    # Authenticate user
    token = authenticate(USERNAME, PASSWORD)

    # 1) Submit a valid consultation with required question text and optional attachments
    question_text = f"Test consultation question at {int(time.time())} - {uuid.uuid4()}"

    attachments = [
        # Simulate attachments metadata, actual file upload might require multipart/form-data
        {"filename": "testdoc.pdf", "url": "https://example.com/testdoc.pdf", "type": "application/pdf"},
        {"filename": "image1.png", "url": "https://example.com/image1.png", "type": "image/png"},
    ]

    consultation_id = None
    try:
        resp = create_consultation(token, question_text, attachments)
        assert resp.status_code == 201 or resp.status_code == 200, f"Expected 200/201 but got {resp.status_code} for valid consultation"
        data = resp.json()
        # Validate returned consultation structure
        consultation_id = data.get("id") or data.get("_id") or data.get("consultationId")
        assert consultation_id, "Consultation ID missing in response"
        assert data.get("question") == question_text, "Question text mismatch in response"
        # attachments may be returned differently, validate if present
        assert "attachments" in data, "Attachments missing in response"
        assert isinstance(data["attachments"], list), "Attachments should be a list"
        # Validate attachments content roughly matches
        for att in attachments:
            assert any(a.get("filename") == att["filename"] for a in data["attachments"]), f"Attachment {att['filename']} missing in response"

        # 2) Submit a consultation with empty required question text - expect validation error
        resp_invalid = create_consultation(token, question_text="")
        assert resp_invalid.status_code == 400 or resp_invalid.status_code == 422, f"Expected 400/422 but got {resp_invalid.status_code} for empty question text"
        err_data = resp_invalid.json()
        # Validation error message expected
        # Typical structure contains an error key or message
        error_msg = err_data.get("error") or err_data.get("message") or ""
        assert error_msg, "Expected an error message for empty question text submission"

    finally:
        # Cleanup created consultation if exists
        if consultation_id:
            del_resp = delete_consultation(token, consultation_id)
            assert del_resp.status_code == 200 or del_resp.status_code == 204, f"Failed to delete consultation {consultation_id}"

consultations_submission_and_validation()
