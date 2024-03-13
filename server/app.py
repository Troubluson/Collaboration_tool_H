import asyncio
import copy
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from sse_starlette import EventSourceResponse
from uuid import uuid4
from state import *
from Routers.CollaborativeDocument import collaborate_router

from Models.Requests import CreateChannelRequest
from Models.Exceptions import AlreadyExists, BadParameters, EntityDoesNotExist, InvalidSender
from Models.Entities import IChannelEvent, IMessage, LatencyThroughputData
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
    try: 
        username = sentUser.username.strip()
        if username == "" or username is None:
            raise BadParameters(why="Username cannot be empty")
        user = IUser(id=str(uuid4()), username=username, isActive=True)
        users.append(user)
        return user
    except:
        raise HTTPException(500, "An unknown error occured")
    
@app.post("/login_existing")
async def login(sentUser: IUser):
    try: 
        existing_user = findFromList(users, "id", sentUser.id)
        if not existing_user:
            users.append(sentUser)
        print(users)
        return sentUser
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
@app.post("/data/{user_id}")
async def receive_data(user_id: str, data: IMeasurements):
    print(f"Received data {data} from user {user_id}")
    measurements[user_id] = data 
    return {"message": "Data received successfully"}

# This supports old testing without separate latency and throughput. To be deleted after client updated
@app.get("/data")
async def get_test():
    return {"message": "Latency test successfull"}

   
# Made to enable latency testing. Not tested
@app.get("/data/latency")
async def get_test():
    return {"message": "Latency test successfull"}

# returns a file for throughput testing. Tested to work with wget.
@app.get("/data/throughput")
async def get_test():
    # returns some file
    return FileResponse("ping_file.png", filename="ping_file.png")

# Gets channel id and returns all user measurements. Not tested
@app.get("/data/{channel_id}")
async def get_channel_test_info(channel_id):    
    channel = findFromList(channels, 'id', channel_id)
    if not channel:
        raise EntityDoesNotExist("channel")
    users_in_channel = channel.users
    return_list = []

    for user_measuremets in measurements:
        for IUser_channel in users_in_channel:
            if user_measuremets == IUser_channel.id:
                return_list.append(measurements[user_measuremets])

    return return_list

