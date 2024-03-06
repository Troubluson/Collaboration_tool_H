import asyncio
import copy
import json
from typing import Literal, Optional, Union
from fastapi import FastAPI, HTTPException, Request
from sse_starlette import EventSourceResponse
from pydantic import BaseModel
from uuid import uuid4

from Models.Requests import CreateChannelRequest
from Models.Exceptions import AlreadyExists, BadParameters, EntityDoesNotExist, InvalidSender
from utils.helpers import findFromList


class IUser(BaseModel):
    id: Optional[str] = None
    username: str
    isActive: Optional[bool] = False

class IMessage(BaseModel):
    id: Optional[str] = None
    content: str
    sender: IUser
    channelId: str

class IChannelEvent(BaseModel):
    type: Literal["new_message", "user_join", "user_leave", "user_status_change"]
    content: Union[IUser, IMessage, dict]

class IChannel(BaseModel):
    id: Optional[str] = None
    name: str
    users: list[IUser] = []
    events: list[IChannelEvent] = []
    
app = FastAPI()

users: list[IUser] = []
channels: list[IChannel] = []

def serialize_message(event: IChannelEvent):
    event_copy = copy.copy(event)
    content_copy = copy.copy(event.content)
    if isinstance(content_copy, IMessage):
        content_copy.sender = content_copy.sender.__dict__
    event_copy.content = content_copy.__dict__
    return event_copy.__dict__

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/stream/{channel_id}")
async def event_stream(req: Request, channel_id: str, user_id: str):
    channel = findFromList(channels, 'id', channel_id)
    if channel is None: 
        raise EntityDoesNotExist("Channel")
    user = findFromList(users, "id", user_id)
    if user is None:
        raise EntityDoesNotExist("User")
    user.isActive = True
    channel.events.append(IChannelEvent(type="user_status_change", content=user))
    async def event_publisher():
        events_seen = 0
        try:
            while True:
                channel_events = channel.events
                if events_seen < len(channel_events):
                    # Loop new massages
                    for event in channel_events[events_seen:]:
                        yield json.dumps(serialize_message(event))
                    events_seen = len(channel_events)
                await asyncio.sleep(0.1)
        except asyncio.CancelledError as e:
          print(f"Disconnected from client (via refresh/close) {req.client}")
          user.isActive = False
          channel.events.append(IChannelEvent(type="user_status_change", content=user))
          raise e
    return EventSourceResponse(event_publisher())

@app.post("/channel/message")
async def send_message(message: IMessage):
    if len(message.content.strip()) == 0:
        raise BadParameters(why="A message is required")
    channelId = message.channelId
    channel = findFromList(channels, 'id', channelId)
    if channel is None: 
        raise EntityDoesNotExist("Channel")
    message.id = str(uuid4())
    event = IChannelEvent(type="new_message", content=message)
    channel.events.append(event)
    return event

@app.post("/login")
async def login(sentUser: IUser):
    try: 
        username = sentUser.username.strip()
        if username == "" or username is None:
            raise BadParameters(why="Username cannot be empty")
        user = IUser(id=str(uuid4()), username=username, isActive=True)
        users.append(user)
        return user
    except:
        raise HTTPException(500, "An unknown error occured")

@app.get("/channels")
async def get_channels():
    return channels

@app.post("/channels")
async def create_channel(request: CreateChannelRequest):
    channel_name = request.name
    user_id = request.userId
    user = findFromList(users, "id", user_id)

    if user is None:
        raise InvalidSender()
    if any(existingChannel for existingChannel in channels if existingChannel.name == channel_name):
        raise AlreadyExists(what="Channel")
    
    channel = IChannel(id=str(uuid4()), name=channel_name)
    channels.append(channel)
    await join_channel(channel.id, user)
    return channel

@app.post("/channels/{channel_id}/join")
async def join_channel(channel_id, user: IUser):
    channel = findFromList(channels, "id", channel_id)
    if channel is None:
        raise EntityDoesNotExist("Channel")
    if findFromList(users, "id", user.id) is None:
        return BadParameters(why="User already in channel")
    event = IChannelEvent(type="user_join", content=user)
    channel.events.append(event)
    channel.users.append(user)
    return channel

@app.post("/channels/{channel_id}/leave")
async def leave_channel(channel_id, user: IUser):
    channel = findFromList(channels, "id", channel_id)
    if channel is None:
        raise EntityDoesNotExist("Channel")
    event = IChannelEvent(type="user_leave", content=user)
    channel.events.append(event)
    channel.users = [u for u in channels if u.id != user.id]
    return channel
