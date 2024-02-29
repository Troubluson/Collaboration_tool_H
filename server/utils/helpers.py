
from typing import List, TypeVar

T = TypeVar('T')

def findFromList(list: List[T], targetProperty: str, target: T):
    next((entity for entity in list if entity[targetProperty] == target), None)
