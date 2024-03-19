from fastapi import UploadFile
from Models.Entities import IChannel, IChannelOperations, ICollaborativeDocument, IUser


baseuser = IUser(id="c3f5452c-370a-4064-a8f3-190d260d0636", username="nick", isActive=False)

users: list[IUser] = [baseuser]

channels: list[IChannel] = [IChannel(id="660ee7a5-1a64-42f2-840f-602b00b3655a", name="Channel1", users=[baseuser], messages=[])]

collaborative_files:dict[str, ICollaborativeDocument] = {
    "660ee7a5-1a64-42f2-840f-602b00b3655a": ICollaborativeDocument(id="660ee7a5-1a64-42f2-840f-602b00b3655a", channelId="660ee7a5-1a64-42f2-840f-602b00b3655a", name="file", content="", operations=[])
    }

user_to_latency: dict[str, float] = {}

files: dict[str, UploadFile] = {}

channel_operation_events: list[IChannelOperations] = []
