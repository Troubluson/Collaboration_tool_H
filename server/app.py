import asyncio
import copy
import json
from typing import Optional
from fastapi import FastAPI, HTTPException, Request
from sse_starlette import EventSourceResponse
from pydantic import BaseModel
from uuid import uuid4

from Models.Requests import CreateChannelRequest
from server.utils.helpers import findFromList


class IUser(BaseModel):
    id: Optional[str] = None
    username: str
    isActive: Optional[bool] = False

class IMessage(BaseModel):
    id: Optional[str] = None
    content: str
    sender: IUser
    channelId: str

class IChannel(BaseModel):
    id: Optional[str] = None
    name: str
    users: list[IUser] = []
    messages: list[IMessage] = []

app = FastAPI()

users: list[IUser] = []
channels: list[IChannel] = []

def serialize_message(message: IMessage):
    message_copy = copy.copy(message)
    message_copy.sender = message.sender.__dict__
    return message_copy.__dict__

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/stream/{channel_id}")
async def event_stream(req: Request, channel_id: str):
    channel = findFromList(channels, 'id', channel_id)
    if channel is None: 
        raise HTTPException(status_code=400, detail="Channel does not exit")
    async def event_publisher():
        messages_seen = 0
        try:
            while True:
                channel_messages = channel.messages
                if messages_seen < len(channel_messages):
                    # Loop new massages
                    for message in channel_messages[messages_seen:]:
                        yield json.dumps(serialize_message(message))
                    messages_seen = len(channel_messages)
                await asyncio.sleep(0.1)
        except asyncio.CancelledError as e:
          print(f"Disconnected from client (via refresh/close) {req.client}")
          # Do any other cleanup, if any
          raise e
    return EventSourceResponse(event_publisher())

@app.post("/channel/message")
async def send_message(message: IMessage):
    channelId = message.channelId
    channel = findFromList(channels, 'id', channelId)
    if channel is None: 
        raise HTTPException(status_code=400, detail="Channel does not exit")
    message.id = str(uuid4())
    channel.messages.append(message)
    return message

@app.post("/login")
async def login(sentUser: IUser):
    username = sentUser.username.strip()
    if username == "":
        raise HTTPException(status_code=400, detail=f"Username cannot be empty")
    user = IUser(id=uuid4, username=username, isActive=True)
    users.append(user)
    return user

@app.get("/channels")
async def get_channels():
    return channels

@app.post("/channels")
async def create_channel(request: CreateChannelRequest):
    base_error = "Channel cannot be created"
    channel_name = request.name
    user_id = request.userId
    user = findFromList(users, "id", user_id)

    if user is None:
        raise HTTPException(status_code=400, detail=f"{base_error}, user does not exit")
    if any(existingChannel for existingChannel in channels if existingChannel.name == channel_name):
        raise HTTPException(status_code=400, detail=f"{base_error}, channel with name {channel_name} already exists")
    
    channel = IChannel(id=str(uuid4()), name=channel_name, users=[user])
    print(channel.model_dump())
    channels.append(channel)
    return channel

@app.post("/channels/{channel_id}/join")
async def join_channel(channel_id, user: IUser):
    index = next((index for (index, c) in enumerate(channels) if c.id == channel_id), None)
    if index is None: return "Channel not found", 400
    channels[index].users.append(user)
    return channels[index]
