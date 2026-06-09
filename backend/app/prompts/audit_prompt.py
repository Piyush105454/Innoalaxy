def build_audit_prompt(process_description: str, industry: str, team_size: str, additional_context: str = "") -> str:
    return f"""
You are auditing an Indian SME workflow for AI automation potential.

Business context:
- Industry: {industry}
- Team size: {team_size}
- Process description: {process_description}
- Uploaded file/context data: {additional_context or "None provided"}

Perform a DEEP, REAL-WORLD LIVE RESEARCH analysis of their exact business context and the uploaded file data. Do NOT use generic language. 

You must specifically design a solution involving:
1. Extracting their specific data types using Python/AI parsers.
2. Saving and persisting this data into a Database (DB) with memory persistence.
3. Building custom Google ADK AI Agents that learn from this exact business data.
4. Multiple specialized AI agents communicating to do separate tasks fast.

Include all this rich, highly specific analysis in the "industry_context" and "summary" fields. If they provided a file, reference its contents to prove you read it. Show them the exact AI automation software they need to build.

Return ONLY valid JSON with this exact shape:
{{
  "automation_score": 0,
  "hours_wasted_weekly": 0.0,
  "automatable_percentage": 0,
  "pain_points": [
    {{
      "title": "Specific pain point",
      "description": "Specific description",
      "time_wasted_hours": 0.0,
      "automation_type": "data_extraction",
      "priority": "high",
      "complexity": "simple"
    }}
  ],
  "summary": "Deep research summary explaining data extraction, memory persistence, DB saving, and custom Google ADK agents for their unique problems.",
  "industry_context": "Real-world research facts about their industry and exactly what AI automation software they need."
}}

Rules:
- Give realistic time estimates. Do not exaggerate.
- Use only these automation_type values: data_extraction, communication, reporting, scheduling, data_entry, monitoring.
- Use only these priority values: high, medium, low.
- Use only these complexity values: simple, medium, complex.
- No markdown, no prose outside JSON.
""".strip()

