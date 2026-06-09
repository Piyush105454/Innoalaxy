"""
Quick backend smoke test: Health, Audit (Gemini), Agent (ADK).
Run with: python test_api.py
"""
import httpx
import time
import json

BASE = "http://localhost:8000"

print("=" * 50)
print("BACKEND SMOKE TEST")
print("=" * 50)

# 1. Health
print("\n[1] Health Check")
r = httpx.get(f"{BASE}/health")
print(f"  Status: {r.status_code}")
print(f"  Response: {r.json()}")
assert r.status_code == 200 and r.json()["status"] == "ok", "Health check failed!"
print("  PASS ✓")

# 2. Audit Analyze (triggers Gemini service)
print("\n[2] Audit Analyze  →  POST /audit/analyze  (Gemini service)")
r = httpx.post(
    f"{BASE}/audit/analyze",
    data={
        "business_name": "Test Manufacturing Co",
        "industry": "manufacturing",
        "team_size": "11-50",
        "process_description": (
            "We manually track leads from IndiaMART and WhatsApp, "
            "update Excel spreadsheets daily, and send follow-up messages "
            "to each lead one by one. Reports are compiled weekly from multiple sheets."
        ),
        "email": "test@test.com",
    },
    timeout=30,
)
print(f"  Status: {r.status_code}")
if r.status_code == 200:
    data = r.json()["data"]
    sid = data["submission_id"]
    print(f"  Submission ID  : {sid}")
    print(f"  Automation Score: {data['automation_score']}")
    print(f"  Hours Wasted/wk : {data['hours_wasted_weekly']}")
    print(f"  Pain Points     : {len(data['pain_points'])}")
    print(f"  Blueprint Steps : {len(data['blueprint']['steps'])}")
    print(f"  Summary (truncated): {data['summary'][:100]}...")
    print("  PASS ✓")
else:
    print(f"  FAIL ✗ — {r.text}")
    sid = None

# 3. ADK Agent Run
print("\n[3] ADK Agent Run  →  POST /agent/run")
if sid:
    r = httpx.post(
        f"{BASE}/agent/run",
        json={
            "submission_id": sid,
            "agent_type": "optimization",
            "demo_mode": True,
        },
        timeout=10,
    )
    print(f"  Status: {r.status_code}")
    if r.status_code == 200:
        rid = r.json()["data"]["run_id"]
        print(f"  Run ID: {rid}")
        print(f"  Message: {r.json()['message']}")
        print("  Waiting 14s for agent to complete...")
        time.sleep(14)
        s = httpx.get(f"{BASE}/agent/{rid}/status", timeout=10)
        if s.status_code == 200:
            d = s.json()["data"]
            print(f"  Agent Status : {d['status']}")
            print(f"  Log Entries  : {len(d.get('logs', []))}")
            for log in d.get("logs", []):
                level = log.get("level", "info").upper()
                msg = log.get("message", "")
                print(f"    [{level}] {msg}")
            print()
            out = d.get("output", "")
            print(f"  ADK in output: {'yes' if 'ADK' in out else 'no'}")
            print(f"  Output preview:\n{out[:500]}")
            if d["status"] == "completed":
                print("  PASS ✓")
            else:
                print("  FAIL ✗ — agent did not complete")
        else:
            print(f"  FAIL ✗ — status fetch: {s.text}")
    else:
        print(f"  FAIL ✗ — {r.text}")
else:
    print("  SKIP (no submission ID from step 2)")

print("\n" + "=" * 50)
print("TEST COMPLETE")
print("=" * 50)
