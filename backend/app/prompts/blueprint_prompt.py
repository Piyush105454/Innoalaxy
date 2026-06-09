def build_blueprint_prompt(audit_json: str) -> str:
    return f"""
Create an implementation blueprint for this Innoalaxy AI automation audit.

Audit:
{audit_json}

Return ONLY valid JSON:
{{
  "steps": [
    {{"title": "", "description": "", "tool": ""}}
  ],
  "integrations": ["Gemini", "Google ADK", "WhatsApp"],
  "build_time_weeks": 2,
  "hours_saved_weekly": 10.0,
  "price_range": "₹40,000 - ₹90,000"
}}
""".strip()

