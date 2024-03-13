import asyncio
from fastapi.staticfiles import StaticFiles
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
app.mount("/", StaticFiles(directory="static/", html=True), name="static")

config = Config()
config.bind = ["0.0.0.0:8000"]

asyncio.run(serve(app, config=config))
