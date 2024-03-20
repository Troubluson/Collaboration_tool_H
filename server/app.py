import asyncio
import copy
import time
from typing import List
from fastapi import FastAPI, File, Form, Request, Response, UploadFile, WebSocket, WebSocketDisconnect

from fastapi.responses import FileResponse
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sse_starlette import EventSourceResponse
from uuid import uuid4
from utils.WebSocketConnectionManager import WebSocketConnectionManager
from state import *
from Routers.CollaborativeDocument import collaborate_router
from Models.Requests import CreateChannelRequest, LatencyRequest
from Models.Exceptions import AlreadyExists, BadParameters, EntityDoesNotExist, InvalidSender
from Models.Entities import IChannelEvent, IMeasurement, IMessage, IWebSocketMessage
from utils.helpers import findFromList, toggleUserStatus
from datetime import datetime
import base64

app = FastAPI()
app.include_router(collaborate_router)

def serialize_message(event: IChannelEvent):
    event_copy = copy.deepcopy(event)
    return event_copy.json()

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    reformatted_message = ""
    for pydantic_error in exc.errors():
        loc, msg = pydantic_error["loc"], pydantic_error["msg"]
        filtered_loc = loc[1:] if loc[0] in ("body", "query", "path") else loc
        field_string = ".".join(filtered_loc)  # nested fields with dot-notation
        reformatted_message = f"'{field_string}' {msg}"

    return JSONResponse(
        status_code=422,
        content=jsonable_encoder(
            {"type": "Invalid request", "why": reformatted_message}
        ),
    )

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
        try:
            events_seen = len(channel.events)
            sync_event = IChannelEvent(type='channel_sync', content=channel)
            yield serialize_message(sync_event)
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

@app.post("/channel/file")
async def send_file(senderId: str = Form(...), channelId: str = Form(...), file: UploadFile = File(...)):
    channel = findFromList(channels, 'id', channelId)
    if channel is None:
        raise EntityDoesNotExist("Channel")
    user = findFromList(users, 'id', senderId)
    if user is None:
        raise EntityDoesNotExist("User")
    fileId = str(uuid4())
    files[fileId] = await file.read()

    message: IMessage = {
        "id": str(uuid4()),
        "content": file.filename,
        "file": fileId,
        "sender": user.id,
        "channelId": channel.id
    }
    event = IChannelEvent(type="new_message", content=message)
    channel.events.append(event)
    return event

@app.get("/file/{file_id}")
async def get_file(file_id: str):
    if file_id not in files:
        raise EntityDoesNotExist("File")
    file = files[file_id]
    return Response(file)

@app.post("/throughput")
async def measure_throughput(request: Request, start_time: str = Form(...), file: UploadFile = File(...)):
    try:
        size = int(request.headers.get('content-length'))
        end = datetime.now()
        data = await file.read()
        start = datetime.fromtimestamp(int(start_time) / 1000)
        seconds = (end-start).total_seconds()
        MB = int(size) / 1000000
        return {
            'upload_throughput': str(MB/seconds),
            'start_time': time.time() * 1000,
            'file': base64.b64encode(data)
        }
    except Exception as e:
        print(e)

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
async def get_channels(req: Request):
    async def event_publisher():
        events_seen = len(channel_operation_events)
        try:
            # Send initial channel list
            event = IChannelOperations(type='channel_sync', content=[c for c in channels if not c.deleted])
            yield serialize_message(event)
            while True:
                if events_seen < len(channel_operation_events):
                    # Loop new events
                    for event in channel_operation_events[events_seen:]:
                        yield serialize_message(event)
                    events_seen = len(channel_operation_events)
                await asyncio.sleep(0.1)
        except asyncio.CancelledError as e:
          print(f"Disconnected from client (via refresh/close) {req.client}")
          raise e
    return EventSourceResponse(event_publisher())

@app.post("/channels")
async def create_channel(request: CreateChannelRequest):
    channel_name = request.name
    user_id = request.userId
    user = findFromList(users, "id", user_id)

    if user is None:
        raise InvalidSender()
    if any(existingChannel for existingChannel in channels if existingChannel.name == channel_name and not existingChannel.deleted):
        raise AlreadyExists(what="Channel")
    
    channel = IChannel(id=str(uuid4()), name=channel_name)
    channels.append(channel)
    event = IChannelOperations(type='channel_created', content=channel)
    channel_operation_events.append(event)
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
    if len(channel.users) == 0:
        event = IChannelOperations(type='channel_deleted', content=channel)
        channel_operation_events.append(event)
        channel.deleted = True
    return channel

# Adds data to measurements dictionary for the user. There is no error handeling.
@app.post("/latency/{user_id}")
async def receive_data(user_id: str, body: LatencyRequest):
    user_to_latency[user_id] = body.latency
    return ""

manager = WebSocketConnectionManager()
# Made to enable latency testing. Not tested
@app.websocket("/latency/{user_id}")
async def get_test(user_id: str, websocket: WebSocket):
    await manager.connect(websocket)
    try:
        toggleUserStatus(user_id, True)       
        while True:
            message: IWebSocketMessage = await websocket.receive_json()
            match message["event"]:
                case "ping":
                    await manager.send_json_message({"event": "pong", "data": message["data"]}, websocket)
                case _:
                    print("Noop")
    except WebSocketDisconnect:
        toggleUserStatus(user_id, False)       
        manager.disconnect(websocket)
        await manager.send_message("Bye!!!", websocket)

# Return the latency of a specific user
@app.get("/users/{user_id}/latency")
async def get_channel_test_info(user_id: str) -> IMeasurement:    
    user = findFromList(users, 'id', user_id)
    if not user:
        raise EntityDoesNotExist("user")

    return IMeasurement(user_id=user_id, latency=user_to_latency[user.id] if user.id in user_to_latency else None)
