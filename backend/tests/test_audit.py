from app.services.gemini_service import GeminiService


def test_analyze_process_valid_input(client, sample_submission_data):
    response = client.post("/audit/analyze", data=sample_submission_data)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["automation_score"] >= 60
    assert data["submission_id"]
    assert data["pain_points"]


def test_analyze_process_vague_input(client, sample_submission_data):
    sample_submission_data["process_description"] = "We repeatedly update Excel sheets and send follow-up messages to customers every day."
    response = client.post("/audit/analyze", data=sample_submission_data)
    assert response.status_code == 200
    assert response.json()["data"]["hours_wasted_weekly"] >= 4


def test_analyze_process_hindi_mixed(client, sample_submission_data):
    sample_submission_data["process_description"] = "Team roz IndiaMART leads check karta hai, Excel me copy karta hai, phir WhatsApp follow-up bhejta hai. Weekly report bhi manual banti hai."
    response = client.post("/audit/analyze", data=sample_submission_data)
    assert response.status_code == 200
    assert response.json()["data"]["pain_points"]


def test_gemini_fallback_generates_blueprint(sample_submission_data):
    service = GeminiService()
    service.groq_enabled = False
    service.gemini_enabled = False
    audit = service._fallback_audit(sample_submission_data)
    assert audit.automation_score > 0

