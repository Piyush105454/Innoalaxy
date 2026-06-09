def build_audit_prompt(process_description: str, industry: str, team_size: str, additional_context: str = "") -> str:
    return f"""
You are auditing an Indian SME workflow for AI automation potential.

Business context:
- Industry: {industry}
- Team size: {team_size}
- Process description: {process_description}
- Uploaded context: {additional_context or "None"}

Consider Indian operating realities: WhatsApp-first communication, Tally/GST workflows, IndiaMART and Justdial leads,
Excel-heavy reporting, manual follow-ups, regional language data, and owner-led decision making.

Return ONLY valid JSON with this exact shape:
{{
  "automation_score": 0,
  "hours_wasted_weekly": 0.0,
  "automatable_percentage": 0,
  "pain_points": [
    {{
      "title": "",
      "description": "",
      "time_wasted_hours": 0.0,
      "automation_type": "data_extraction",
      "priority": "high",
      "complexity": "simple"
    }}
  ],
  "summary": "",
  "industry_context": ""
}}

Rules:
- Give realistic time estimates. Do not exaggerate.
- If the description is vague, infer cautiously and say what needs confirmation in summary.
- Use only these automation_type values: data_extraction, communication, reporting, scheduling, data_entry, monitoring.
- Use only these priority values: high, medium, low.
- Use only these complexity values: simple, medium, complex.
- No markdown, no prose outside JSON.
""".strip()

