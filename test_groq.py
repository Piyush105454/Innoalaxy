import groq
import json

client = groq.Groq(api_key='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')
prompt = """You are auditing an Indian SME workflow for AI automation potential.
Return ONLY valid JSON with this exact shape:
{
  "automation_score": 0,
  "hours_wasted_weekly": 0.0,
  "automatable_percentage": 0,
  "pain_points": [
    {
      "title": "Specific pain point",
      "description": "Specific description",
      "time_wasted_hours": 0.0,
      "automation_type": "data_extraction",
      "priority": "high",
      "complexity": "simple"
    }
  ],
  "summary": "Deep research",
  "industry_context": "Real world"
}"""

try:
    response = client.chat.completions.create(
        messages=[{'role': 'user', 'content': prompt}], 
        model='llama-3.3-70b-versatile', 
        temperature=0.2
    )
    raw = response.choices[0].message.content
    print("RAW OUTPUT:\n", raw)
    
    start = raw.find('{')
    end = raw.rfind('}') + 1
    extracted = raw[start:end]
    print("\nEXTRACTED:\n", extracted)
    
    parsed = json.loads(extracted)
    print("\nPARSED:\n", parsed)
except Exception as e:
    print("ERROR:", e)
