import asyncio
import sys

from google.adk.agents import LlmAgent
from google.adk.tools.function_tool import FunctionTool

def send_whatsapp(message: str) -> str:
    """Sends a WhatsApp update."""
    print("TOOL CALLED:", message)
    return "Message sent successfully"

tools = [FunctionTool(send_whatsapp)]

agent = LlmAgent(
    name="Test",
    model="gemini-2.5-flash",
    instruction="You are an agent. Use the tool.",
    tools=tools
)

async def main():
    try:
        output = ""
        # The run method is: async run(self, *, ctx: 'Context', node_input: 'Any') -> 'AsyncGenerator[Event, None]'
        async for event in agent.run(ctx=None, node_input="Send a message saying Hello"):
            if hasattr(event, 'output'):
                output += str(event.output)
            elif isinstance(event, dict) and 'output' in event:
                output += str(event['output'])
            print(event)
        print("FINAL OUTPUT:", output)
    except Exception as e:
        print("ERROR:", type(e), str(e))

asyncio.run(main())
