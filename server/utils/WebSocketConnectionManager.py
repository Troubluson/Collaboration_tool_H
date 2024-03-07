from typing import List
from fastapi import WebSocket
import json

class WebSocketConnectionManager:
    """Class defining socket events"""
    def __init__(self):
        """init method, keeping track of connections"""
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        """connect event"""
        await websocket.accept()
        self.active_connections.append(websocket)

    async def send_message(self, message: str, websocket: WebSocket):
        """Direct Message"""
        await websocket.send_text(message)

    async def send_json_message(self, message: str, websocket: WebSocket):
        """Direct Message"""
        await websocket.send_json(json.dumps(message))

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_json(message)

    async def broadcast_others(self, message: dict, sourceSocket: WebSocket):
        for connection in self.active_connections:
            if connection != sourceSocket:
                await connection.send_json(json.dumps(message))
    
    def disconnect(self, websocket: WebSocket):
        """disconnect event"""
        self.active_connections.remove(websocket)
