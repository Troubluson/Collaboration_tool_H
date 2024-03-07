import asyncio
import copy
import json
from typing import Literal, Optional, Union
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from sse_starlette import EventSourceResponse
from pydantic import BaseModel
from uuid import uuid4

from Models.Requests import CreateChannelRequest
from Models.Exceptions import AlreadyExists, BadParameters, EntityDoesNotExist, InvalidSender
from Models.Events import ChangeData, ChangeEvent, SyncData, SyncEvent
from utils.OT_Transformer import OperationalTransform, TextOperation
from utils.helpers import findFromList

from Models.CollaborativeFile import CollaborativeDocument, CreateFileRequest, IWebSocketMessage, Operation, OperationEvent

from utils.WebSocketConnectionManager import WebSocketConnectionManager

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
manager = WebSocketConnectionManager()

baseuser = IUser(id="c3f5452c-370a-4064-a8f3-190d260d0636", username="nick", isActive=False)
users: list[IUser] = [baseuser]
channels: list[IChannel] = [IChannel(id="660ee7a5-1a64-42f2-840f-602b00b3655a", name="Channel1", users=[baseuser], messages=[])]
collaborative_files:dict[str, CollaborativeDocument] = {
    "660ee7a5-1a64-42f2-840f-602b00b3655a": CollaborativeDocument(id="660ee7a5-1a64-42f2-840f-602b00b3655a", channelId="660ee7a5-1a64-42f2-840f-602b00b3655a", name="file", content="", operations=[])
    }

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

@app.get("/channels/{channel_id}/collaborate")
async def get_collaborative_files(channel_id):
    index = next((index for (index, c) in enumerate(channels) if c.id == channel_id), None)
    if index is None: return "Channel not found", 400
    files = [value for key, value in collaborative_files.items() if value.channelId == channel_id]
    return files

@app.post("/channels/{channel_id}/collaborate")
async def create_collaborative_file(request: CreateFileRequest, channel_id):
    index = next((index for (index, c) in enumerate(channels) if c.id == channel_id), None)
    if index is None: return "Channel not found", 400
    collaborative_doc = CollaborativeDocument(id=str(uuid4()), name=request.name, channelId=channel_id, content="", operations=[])
    collaborative_files[collaborative_doc.id] = collaborative_doc
    return collaborative_doc

@app.websocket("/channels/{channel_id}/collaborate/{file_id}")
async def collaborative_file(channel_id: str, file_id: str, websocket: WebSocket):
    await manager.connect(websocket)
    try:
        if next((channel for channel in channels if getattr(channel, "id") == channel_id), None) == None:
            print(f"No such channel {channel_id}")
        file = collaborative_files.get(file_id, None)
        if file == None:
            print(f"No such file {file_id}")
            raise WebSocketDisconnect
        while True:
            message: IWebSocketMessage = await websocket.receive_json()
            if message["event"] == "Edit":
                new_operation = OperationEvent(**message['data'])
                last_op_by_user = next((index for (index, op) in enumerate(reversed(file.operations)) if op.userId == new_operation.userId), None)
                # Note reversed, so essentially >= last_op_by_user >= revision
                if last_op_by_user and last_op_by_user < new_operation.revision:
                    print("something happened")
                
                new_text_op = TextOperation()
                new_text_op.add(Operation(**new_operation.model_dump()))
                concurrent_operations = file.operations[new_operation.revision:]
                other_operations = TextOperation()
                for operation in concurrent_operations:
                    other_operations.add(operation)
                
                new_text_op.transform(other_operations)
                
                file.operations.extend(new_text_op.ops)
                file.content = new_text_op.apply(file.content)
                print(file.content)

                change_to_broadcast = ChangeEvent(data=ChangeData(operation=new_text_op.ops[0], revision=len(file.operations)))
                await manager.broadcast(change_to_broadcast.model_dump_json())
            if message["event"] == "sync_document":
                print("syncing")
                await manager.send_json_message(SyncEvent(data=SyncData(content=file.content, revision=len(file.operations))).model_dump_json(), websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.send_message("Bye!!!",websocket)
