from uuid import uuid4
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from Models.Entities import IWebSocketMessage
from Models.Events import ChangeData, ChangeEvent, OperationEvent, SyncData, SyncEvent
from Models.Exceptions import EntityDoesNotExist
from Models.Requests import CreateFileRequest
from utils.helpers import findFromList
from utils.OperationalTransform import OperationalTransform, TextOperation
from utils.WebSocketConnectionManager import WebSocketConnectionManager
from state import *

collaborate_router = APIRouter()

manager = WebSocketConnectionManager()


@collaborate_router.get("/channels/{channel_id}/collaborate")
async def get_collaborative_files(channel_id):
    index = next((index for (index, c) in enumerate(channels) if c.id == channel_id), None)
    if index is None: return "Channel not found", 400
    files = [value for value in collaborative_files.values() if value.channelId == channel_id]
    return files

@collaborate_router.post("/channels/{channel_id}/collaborate")
async def create_collaborative_file(request: CreateFileRequest, channel_id):
    index = next((index for (index, c) in enumerate(channels) if c.id == channel_id), None)
    if index is None: return "Channel not found", 400
    collaborative_doc = ICollaborativeDocument(id=str(uuid4()), name=request.name, channelId=channel_id, content="", operations=[])
    collaborative_files[collaborative_doc.id] = collaborative_doc
    return collaborative_doc

@collaborate_router.delete("/channels/{channel_id}/collaborate/{file_id}")
async def delete_file(file_id, channel_id):
    # TODO: Check if user is in channel
    file = collaborative_files.get(file_id, None)
    if not file:
        raise EntityDoesNotExist("file")
    collaborative_files.pop(file_id)
    return 

@collaborate_router.websocket("/channels/{channel_id}/collaborate/{file_id}")
async def collaborative_file(channel_id: str, file_id: str, websocket: WebSocket):
    await manager.connect(websocket)
    try:
        if next((channel for channel in channels if getattr(channel, "id") == channel_id), None) == None:
            print(f"No such channel {channel_id}")
        document = collaborative_files.get(file_id, None)
        if document == None:
            print(f"No such file {file_id}")
            raise WebSocketDisconnect
        while True:
            message: IWebSocketMessage = await websocket.receive_json()
            if message["event"] == "Edit":
                await handleEditEvent(message, document)
            if message["event"] == "sync_document":
                handleSyncEvent(message, document, websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.send_message("Bye!!!", websocket)


async def handleEditEvent(message: IWebSocketMessage, document: ICollaborativeDocument):
    new_operation_event = OperationEvent(**message['data'])
    
    new_text_op = TextOperation(new_operation_event.type, new_operation_event.index, new_operation_event.text)
    # revision is the version the client thinks they are editing
    concurrent_operations = document.operations[new_operation_event.revision:]
    new_text_op = OperationalTransform.apply_concurrent_operations(new_text_op, concurrent_operations)
    new_op = new_text_op.toOperation(new_operation_event.userId)
    document.content = new_text_op.apply(document.content)
    document.operations.append(new_op)

    change_to_broadcast = ChangeEvent(data=ChangeData(operation=new_op, revision=len(document.operations)))
    print(change_to_broadcast)
    await manager.broadcast(change_to_broadcast.model_dump_json())

async def handleSyncEvent(message: IWebSocketMessage, document: ICollaborativeDocument, websocket: WebSocket):
    sync_event = SyncEvent(data=SyncData(content=document.content, revision=len(document.operations)))
    await manager.send_json_message(sync_event.model_dump_json(), websocket)
