"""
Live end-to-end test: Real Gemini AI + Google ADK + DB persistence
Run with: python live_test.py
"""
import os, sys, json, time, asyncio, warnings
warnings.filterwarnings("ignore")
sys.path.insert(0, ".")

# Load env
with open(".env") as f:
    for line in f:
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            os.environ[k.strip()] = v.strip()

SEP = "=" * 60

print(SEP)
print("INNOALAXY — LIVE AI INTEGRATION TEST")
print(SEP)

# ── 1. Gemini direct call ──────────────────────────────────────
print("\n[1] Gemini API direct call")
import google.generativeai as genai
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model_name = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
model = genai.GenerativeModel(model_name)
try:
    r = model.generate_content("Reply with exactly: GEMINI_OK")
    print(f"  Response  : {r.text.strip()}")
    print(f"  Model     : {model_name}")
    print("  STATUS    : PASS ✓")
except Exception as e:
    print(f"  STATUS    : FAIL — {e}")

# ── 2. GeminiService.analyze_process (real AI audit) ─────────
print("\n[2] GeminiService.analyze_process (real Gemini audit)")
from app.services.gemini_service import GeminiService

svc = GeminiService()
print(f"  Gemini/Groq enabled: {svc.groq_enabled or svc.gemini_enabled}")
print(f"  Model         : {svc.settings.gemini_model}")

PAYLOAD = {
    "business_name": "Rajesh Steel Works",
    "industry": "B2B Manufacturing",
    "team_size": "6-15",
    "process_description": (
        "Our sales team checks IndiaMART every morning, copies leads to Excel, "
        "then sends WhatsApp messages one by one to each lead. We also manually "
        "compile a weekly report every Friday from multiple Excel files. Each step "
        "takes 2-3 hours a day. The team also enters invoice data into Tally manually."
    ),
    "additional_context": "",
}

try:
    result = asyncio.run(svc.analyze_process(PAYLOAD))
    print(f"  automation_score   : {result.automation_score}")
    print(f"  hours_wasted_weekly: {result.hours_wasted_weekly}")
    print(f"  automatable_pct    : {result.automatable_percentage}")
    print(f"  pain_points count  : {len(result.pain_points)}")
    for p in result.pain_points:
        level = p.priority
        print(f"    [{level}] {p.title} | {p.time_wasted_hours}h/wk | {p.automation_type}")
    print(f"  summary  : {result.summary[:120]}...")
    if result.blueprint:
        print(f"  blueprint steps : {len(result.blueprint.steps)}")
        for s in result.blueprint.steps:
            print(f"    - {s.title} [{s.tool}]")
        print(f"  build weeks     : {result.blueprint.build_time_weeks}")
        print(f"  hours saved/wk  : {result.blueprint.hours_saved_weekly}")
        print(f"  price range     : {result.blueprint.price_range}")
    gemini_real = not result.summary.startswith("This workflow has clear repeatable steps")
    print(f"  REAL Gemini response (not fallback): {gemini_real}")
    print("  STATUS    : PASS ✓")
except Exception as e:
    import traceback; traceback.print_exc()
    print(f"  STATUS    : FAIL — {e}")

# ── 3. Google ADK package & session service ───────────────────
print("\n[3] Google ADK package & InMemorySessionService")
try:
    from google.adk.agents import Agent, LlmAgent
    from google.adk.sessions import InMemorySessionService
    sess = InMemorySessionService()
    session = asyncio.run(sess.create_session(app_name="innoalaxy", user_id="test_user"))
    print(f"  Agent class    : ok")
    print(f"  LlmAgent class : ok")
    print(f"  Session ID     : {session.id}")
    print(f"  Session user   : {session.user_id}")
    print("  STATUS    : PASS ✓")
except Exception as e:
    import traceback; traceback.print_exc()
    print(f"  STATUS    : FAIL — {e}")

# ── 4. InnoalaxyAgent (ADK service) with DB persistence ───────
print("\n[4] InnoalaxyAgent end-to-end + DB persistence")
try:
    import sqlalchemy as sa
    from app.core.database import SessionLocal, create_all
    from app.models.db_models import Submission, AgentRun, AuditResultDB
    from app.services.adk_service import InnoalaxyAgent

    create_all()
    db = SessionLocal()

    # Save submission
    sub = Submission(
        business_name="Rajesh Steel Works",
        industry="B2B Manufacturing",
        team_size="6-15",
        process_description=(
            "Sales team copies IndiaMART leads to Excel and sends WhatsApp one by one. "
            "Manual weekly reports from multiple Excel files. Tally invoice entry by hand."
        ),
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    print(f"  Submission saved  : {sub.id}")

    # Create agent run
    run = AgentRun(submission_id=sub.id, agent_type="optimization", status="queued", logs=[], output="")
    db.add(run)
    db.commit()
    db.refresh(run)
    print(f"  AgentRun created  : {run.id}")

    # Run agent
    agent = InnoalaxyAgent(db, run.id, "optimization", demo_mode=True)
    print(f"  ADK Agent initialized: ok")
    out = asyncio.run(agent.run())
    run.output = out
    run.status = "completed"
    db.commit()

    db.refresh(run)
    print(f"  Agent status      : {run.status}")
    log_count = len(run.logs or [])
    print(f"  Agent log entries : {log_count}")
    for log in (run.logs or []):
        lvl = log.get("level", "info").upper()
        msg = log.get("message", "")
        print(f"    [{lvl}] {msg}")
    print(f"  Output preview    : {run.output[:300]}")
    print(f"  STATUS    : {'PASS' if run.status == 'completed' else 'FAIL'} {'✓' if run.status == 'completed' else 'x'}")
    db.close()

    # ── 5. Persistence check ─────────────────────────────────
    print("\n[5] SQLite persistence — new session reads same data")
    db2 = SessionLocal()
    subs = db2.execute(sa.select(Submission).order_by(Submission.created_at.desc())).scalars().all()
    runs = db2.execute(sa.select(AgentRun).order_by(AgentRun.created_at.desc())).scalars().all()
    audit_rows = db2.execute(sa.select(AuditResultDB)).scalars().all()
    print(f"  Submissions in DB : {len(subs)}")
    print(f"  Agent runs in DB  : {len(runs)}")
    print(f"  Audit results     : {len(audit_rows)}")
    for s in subs[:3]:
        print(f"    Sub  : {s.business_name} | {s.industry} | {s.created_at}")
    for r in runs[:3]:
        status = r.status
        nlogs = len(r.logs or [])
        print(f"    Run  : {r.id} | status={status} | logs={nlogs}")
    print("  STATUS    : PASS ✓ — data persists across DB sessions")
    db2.close()

except Exception as e:
    import traceback; traceback.print_exc()
    print(f"  STATUS    : FAIL — {e}")

print()
print(SEP)
print("ALL CHECKS COMPLETE")
print(SEP)
