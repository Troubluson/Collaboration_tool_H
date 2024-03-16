import asyncio
import copy
from typing import List
from fastapi import FastAPI, HTTPException, Request

from sse_starlette import EventSourceResponse
from uuid import uuid4
from state import *
from Routers.CollaborativeDocument import collaborate_router
from Models.Requests import CreateChannelRequest, LatencyRequest
from Models.Exceptions import AlreadyExists, BadParameters, EntityDoesNotExist, InvalidSender
from Models.Entities import IChannelEvent, IMeasurement, IMessage
from utils.helpers import findFromList

app = FastAPI()
app.include_router(collaborate_router)

def serialize_message(event: IChannelEvent):
    event_copy = copy.deepcopy(event)
    return event_copy.json()


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
                        yield serialize_message(event)
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

    username = sentUser.username.strip()
    if username == "" or username is None:
        raise BadParameters(why="Username cannot be empty")
    existing_user = findFromList(users, "username", username)
    if existing_user:
        print(existing_user)
        if existing_user.isActive != True:
            existing_user.isActive = True
            return existing_user
        else:
            raise AlreadyExists(f"User with username {username}")
    user = IUser(id=str(uuid4()), username=username, isActive=True)
    users.append(user)
    return user

    
@app.post("/login_existing")
async def login(sentUser: IUser):
    existing_user = findFromList(users, "username", sentUser.username)
    if existing_user and existing_user.id != sentUser.id:
        raise AlreadyExists(f"User with username {sentUser.username}")
    if not existing_user:
        users.append(sentUser)
    return sentUser


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
async def leave_channel(channel_id, leaving_user: IUser):
    user = findFromList(users, "id", leaving_user.id)
    if user is None:
        raise EntityDoesNotExist("User")
    channel = findFromList(channels, "id", channel_id)
    if channel is None:
        raise EntityDoesNotExist("Channel")
    event = IChannelEvent(type="user_leave", content=user)
    channel.events.append(event)
    channel.users = [u for u in channel.users if u.id != user.id]
    return channel

# Adds data to measurements dictionary for the user. There is no error handeling.
@app.post("/latency/{user_id}")
async def receive_data(user_id: str, body: LatencyRequest):
    user_to_latency[user_id] = body.latency
    return "", 200

   
# Made to enable latency testing. Not tested
@app.get("/latency")
async def get_test():
    return {"message": "Pong"}

# returns a file for throughput testing. Tested to work with wget.
@app.get("/throughput")
async def get_test():
    # returns some file
    return FileResponse("ping_file.png", filename="ping_file.png")

# Gets channel id and returns all user measurements. Not tested
@app.get("/channel/{channel_id}/latency")
async def get_channel_test_info(channel_id) -> List[IMeasurement]:    
    channel = findFromList(channels, 'id', channel_id)
    if not channel:
        raise EntityDoesNotExist("channel")
    users_in_channel = [user.id for user in channel.users]
    latencies: List[IMeasurement] = [IMeasurement(user_id=user_id, latency=latency) for [user_id, latency] in user_to_latency.items() if user_id in users_in_channel]

    return latencies

