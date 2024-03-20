
from typing import List, TypeVar
from Models.Entities import IChannelEvent
from state import *

T = TypeVar('T')

def findFromList(list: List[T], targetProperty: str, target: T):
    return next((entity for entity in list if getattr(entity, targetProperty) == target), None)

def toggleUserStatus(user_id: str, status: bool):
    channels_with_user = [channel for channel in channels if user_id in [user_in_channel.id for user_in_channel in channel.users]]
    for channel in channels_with_user:
        for user in channel.users:
            if user.id == user_id:
                user.isActive = status
                channel.events.append(IChannelEvent(type="user_status_change", content=user))
                break  
