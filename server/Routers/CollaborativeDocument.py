from uuid import uuid4
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from Models.Entities import IChannelEvent, IWebSocketMessage
from Models.Events import ChangeData, ChangeEvent, ErrorData, ErrorEvent, OperationEvent, SyncData, SyncEvent
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
    channel = findFromList(channels, "id", channel_id)
    if not channel:
        raise EntityDoesNotExist("channel")
    files = [value for value in collaborative_files.values() if value.channelId == channel_id]
    return files

@collaborate_router.post("/channels/{channel_id}/collaborate")
async def create_collaborative_file(request: CreateFileRequest, channel_id):
    channel = findFromList(channels, "id", channel_id)
    if not channel:
        raise EntityDoesNotExist("channel")
    document = ICollaborativeDocument(id=str(uuid4()), name=request.name, channelId=channel_id, content="", operations=[])
    collaborative_files[document.id] = document
    event = IChannelEvent(type="document_created", content=document)
    channel.events.append(event)
    return document

@collaborate_router.delete("/channels/{channel_id}/collaborate/{document_id}")
async def delete_file(document_id, channel_id):
    # TODO: Check if user is in channel
    channel = findFromList(channels, "id", channel_id)
    if not channel:
        raise EntityDoesNotExist("channel")

    document = collaborative_files.get(document_id, None)
    if not document:
        raise EntityDoesNotExist("document")
    collaborative_files.pop(document_id)
    event = IChannelEvent(type="document_deleted", content=document)
    channel.events.append(event)
    return 

@collaborate_router.websocket("/channels/{channel_id}/collaborate/{document_id}")
async def collaborative_file(channel_id: str, document_id: str, websocket: WebSocket):
    await manager.connect(websocket)
    try:
        if next((channel for channel in channels if getattr(channel, "id") == channel_id), None) == None:
            print(f"No such channel {channel_id}")
        document = collaborative_files.get(document_id, None)
        if document == None:
            print(f"No such document {document_id}")
            raise WebSocketDisconnect
        while True:
            message: IWebSocketMessage = await websocket.receive_json()
            match message["event"]:
                case "change":
                    await handleEditEvent(message, document)
                case "sync_document":
                    await handleSyncEvent(message, document, websocket)
                case _:
                    print("Noop")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.send_message("Disconnected", websocket)
    except ValueError:
        await manager.send_json_message(ErrorEvent(data=ErrorData(reason="Operation is not of correct type")).model_dump_json(), websocket)
    except Exception as ex:
        print(ex)
        await manager.send_json_message(ErrorEvent(data=ErrorData(reason="An unknown error occured")).model_dump_json(), websocket)


async def handleEditEvent(message: IWebSocketMessage, document: ICollaborativeDocument):
    new_operation_event = OperationEvent(**message['data'])
    new_text_op = TextOperation(new_operation_event.operation.type, new_operation_event.operation.index, new_operation_event.operation.text)
    
    # revision is the version the client thinks they are editing
    concurrent_operations = document.operations[new_operation_event.revision:]
    new_text_op = OperationalTransform.apply_concurrent_operations(new_text_op, concurrent_operations)
    new_op = new_text_op.toOperation(new_operation_event.operation.userId)
    document.content = new_text_op.apply(document.content)
    document.operations.append(new_op)

    change_to_broadcast = ChangeEvent(data=ChangeData(operation=new_op, revision=len(document.operations)))

    await manager.broadcast(change_to_broadcast.model_dump_json())

async def handleSyncEvent(message: IWebSocketMessage, document: ICollaborativeDocument, websocket: WebSocket):
    sync_event = SyncEvent(data=SyncData(content=document.content, revision=len(document.operations)))
    await manager.send_json_message(sync_event.model_dump_json(), websocket)
