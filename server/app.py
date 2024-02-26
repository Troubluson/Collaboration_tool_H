import asyncio
import json
from typing import Optional
from fastapi import FastAPI, Request
from sse_starlette import EventSourceResponse
from pydantic import BaseModel
import uuid

app = FastAPI()

channels = {}

class IMessage(BaseModel):
    id: Optional[str] = None
    content: str
    senderId: str
    channelId: str

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/stream/{channel_id}")
async def event_stream(req: Request, channel_id: str):
    async def event_publisher():
        messages_seen = 0
        try:
            while True:
                channel_messages = channels[channel_id] if channel_id in channels else []
                if messages_seen < len(channel_messages):
                    # Loop new massages
                    for message in channel_messages[messages_seen:]:
                        yield json.dumps(message.__dict__)
                    messages_seen = len(channel_messages)
                await asyncio.sleep(1)
        except asyncio.CancelledError as e:
          print(f"Disconnected from client (via refresh/close) {req.client}")
          # Do any other cleanup, if any
          raise e
    return EventSourceResponse(event_publisher())

@app.post("/channel/message")
async def send_message(message: IMessage):
    channelId = message.channelId
    message.id = str(uuid.uuid4())
    messages = channels[channelId] if channelId in channels else []
    messages.append(message)
    channels[channelId] = messages
    return message
