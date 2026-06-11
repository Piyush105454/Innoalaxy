import asyncio
import litellm

async def main():
    try:
        response = await litellm.acompletion(
            model="gemini/gemini-2.5-flash",
            messages=[{"role": "user", "content": "Hello"}],
        )
        print("Gemini Response:", response.choices[0].message.content)
    except Exception as e:
        print("Gemini Error:", type(e), str(e))
        
    try:
        response = await litellm.acompletion(
            model="groq/llama-3.1-8b-instant",
            messages=[{"role": "user", "content": "Hello"}],
        )
        print("Groq Response:", response.choices[0].message.content)
    except Exception as e:
        print("Groq Error:", type(e), str(e))

asyncio.run(main())
