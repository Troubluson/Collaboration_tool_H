import asyncio
from hypercorn.config import Config
from hypercorn.asyncio import serve
from fastapi.middleware.cors import CORSMiddleware

from app import app

origins = [
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

asyncio.run(serve(app, Config()))
