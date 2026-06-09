def build_audit_prompt(process_description: str, industry: str, team_size: str, additional_context: str = "") -> str:
    return f"""
You are auditing an Indian SME workflow for AI automation potential.

Business context:
- Industry: {industry}
- Team size: {team_size}
- Process description: {process_description}
- Uploaded context: {additional_context or "None"}

Perform a REAL LIVE RESEARCH analysis of this specific type of business. Draw upon real-world industry facts to find exact places where automation or AI software is needed. 
Identify specific use cases where custom "Google ADK AI Agents" that learn from their business data would solve their exact problems fast. Propose multiple specialized agents doing separate tasks.

Include all this rich, business-specific AI research in the "industry_context" and "summary" fields. Do not use generic filler. Show them what AI automation software they actually need.

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
  "summary": "Deep, real research summary explaining how Google ADK agents and custom software apply to their unique problems.",
  "industry_context": "Real-world research facts about their industry and exactly what AI automation software they need."
}}

Rules:
- Give realistic time estimates. Do not exaggerate.
- If the description is vague, infer cautiously and say what needs confirmation in summary.
- Use only these automation_type values: data_extraction, communication, reporting, scheduling, data_entry, monitoring.
- Use only these priority values: high, medium, low.
- Use only these complexity values: simple, medium, complex.
- No markdown, no prose outside JSON.
""".strip()

