# Innoalaxy MVP

Full-stack MVP for Innoalaxy, an AI workflow automation startup for Indian SMEs.

## Stack

- Frontend: React 18, TypeScript, Vite, Tailwind, Zustand, Framer Motion
- Backend: FastAPI, SQLAlchemy, Neon Postgres, Gemini, Twilio WhatsApp
- Deployment: Cloud Run backend, Vercel frontend

## Local Setup

1. Create a Neon project and run `database/neon_schema.sql` in the Neon SQL editor.
2. Copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL`.
3. Copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL`.
4. Start backend with an isolated virtual environment:

```bash
cd backend
py -3.10 -m venv .venv
.venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The MVP includes `google-adk==2.2.0`. On this Windows machine, Python 3.13 failed during venv `ensurepip`, so the working local environment uses Python 3.10. For production, prefer Python 3.11+.

5. Start frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## GCP Setup

```bash
gcloud projects create YOUR_PROJECT_ID
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
gcloud artifacts repositories create innoalaxy --repository-format=docker --location=asia-south1
gcloud secrets create DATABASE_URL --data-file=-
gcloud secrets create GEMINI_API_KEY --data-file=-
gcloud secrets create INNOALAXY_ADMIN_KEY --data-file=-
gcloud builds submit backend --config backend/cloudbuild.yaml
```

Required IAM for CI service account: Cloud Run Admin, Cloud Build Editor, Artifact Registry Writer, Secret Manager Secret Accessor, Service Account User.

## WhatsApp

Use Twilio WhatsApp sandbox first. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_WHATSAPP_FROM`. Keep `WHATSAPP_DEMO_MODE=true` until templates and production sender are approved.

## Google ADK Agent Setup

The live demo in the audit flow now runs a Business Optimization Agent. It detects likely business software from the submitted workflow, maps integration candidates, and writes a Neon-backed agent run report.

Current demo integrations:

- Lead sources: IndiaMART, Justdial, website forms
- Communication: WhatsApp Business, Gmail, Google Calendar
- Finance: Tally, Zoho Books, GST workflows
- Productivity: Excel, Google Sheets, Drive
- Sales and ops: Zoho CRM, HubSpot, ERPNext, Odoo, custom dashboards
- HR: Keka, Zoho People, greytHR

Local verification:

```bash
cd backend
.venv/Scripts/activate
python -c "import google.adk; from google.adk.agents import Agent; print('google-adk ok')"
pytest tests
```

Production path:

- Use Google ADK agent tools for `inspect_workflow`, `map_integrations`, `design_agent_plan`, `generate_operator_update`, and `mark_complete`.
- Use Neon Postgres as the persistent session/database layer.
- Use Gemini or Vertex AI as the model backend.
- Use WhatsApp Business/Twilio only after approved templates and customer opt-in.
- Add Vertex AI multimodal memory later for files, images, audio, and video-heavy workflows.
