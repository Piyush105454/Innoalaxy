def test_agent_demo_mode(client, sample_submission_data):
    audit = client.post("/audit/analyze", data=sample_submission_data).json()["data"]
    response = client.post("/agent/run", json={"submission_id": audit["submission_id"], "agent_type": "business_optimization", "demo_mode": True})
    assert response.status_code == 200
    assert response.json()["data"]["run_id"]


def test_admin_submission_list(client, sample_submission_data):
    client.post("/audit/analyze", data=sample_submission_data)
    response = client.get("/submissions", headers={"X-Admin-Key": "test-key"})
    assert response.status_code == 200
    assert len(response.json()["data"]) == 1
