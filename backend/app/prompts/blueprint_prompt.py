def build_blueprint_prompt(audit_json: str) -> str:
    return f"""
Create an implementation blueprint for this Innoalaxy AI automation audit.

Audit context:
{audit_json}

INSTRUCTIONS:
1. Generate 3 to 6 practical implementation steps. Each step must have a title, description, and the specific tool used (matching the audit tools).
2. Create an integrations list. DO NOT default to ["Gemini", "Google ADK", "WhatsApp"]! Instead, list the actual tools and platforms recommended in the audit summary and steps (e.g. Docsumo, Signzy, Make.com, Zoho, HubSpot, Tally, etc.).
3. Vary the price range realistically based on the complexity and scope (e.g. ranging from simple automation at ₹30,000 - ₹50,000 to complex enterprise pipelines at ₹1,50,000 - ₹3,50,000).

Return ONLY valid JSON matching this schema:
{{
  "steps": [
    {{
      "title": "Clear action step",
      "description": "How this step is implemented",
      "tool": "Specific tool or API utilized"
    }}
  ],
  "integrations": ["List of actual tools and integrations used"],
  "build_time_weeks": [INT based on complexity],
  "hours_saved_weekly": [FLOAT matching the audit's wasted hours],
  "price_range": "e.g., ₹50,000 - ₹1,20,000"
}}
""".strip()
