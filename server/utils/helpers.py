
from typing import List, TypeVar

T = TypeVar('T')

def findFromList(list: List[T], targetProperty: str, target: T):
    return next((entity for entity in list if getattr(entity, targetProperty) == target), None)
