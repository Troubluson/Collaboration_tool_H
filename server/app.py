import asyncio
import json
from typing import Optional
from fastapi import FastAPI, Request
from sse_starlette import EventSourceResponse
from pydantic import BaseModel
import uuid

class IMessage(BaseModel):
    id: Optional[str] = None
    content: str
    senderId: str
    channelId: str
    
class IUser(BaseModel):
    id: Optional[str] = None
    username: str
    isActive: Optional[bool] = False

class IChannel(BaseModel):
    id: Optional[str] = None
    name: str
    users: list[IUser] = []
    messages: list[IMessage] = []

app = FastAPI()

users: list[IUser] = []
channels: list[IChannel] = []

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/stream/{channel_id}")
async def event_stream(req: Request, channel_id: str):
    channel_index = next((index for (index, c) in enumerate(channels) if c.id == channel_id), None)
    if channel_index is None: return "Channel not found", 400
    async def event_publisher():
        messages_seen = 0
        try:
            while True:
                channel_messages = channels[channel_index].messages
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
    index = next((index for (index, c) in enumerate(channels) if c.id == channelId), None)
    if index is None: return "Channel not found", 400
    message.id = str(uuid.uuid4())
    channels[index].messages.append(message)
    return message

@app.post("/login")
async def login(user: IUser):
    user.id = str(uuid.uuid4())
    user.isActive = True
    users.append(user)
    return user

@app.get("/channels")
async def get_channels():
    return channels

@app.post("/channels")
async def create_channel(channel: IChannel):
    channel.id = str(uuid.uuid4())
    channels.append(channel)
    return channel

@app.post("/channels/{channel_id}/join")
async def join_channel(channel_id, user: IUser):
    index = next((index for (index, c) in enumerate(channels) if c.id == channel_id), None)
    if index is None: return "Channel not found", 400
    channels[index].users.append(user)
    return channels[index]
