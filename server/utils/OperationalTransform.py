
from typing import List

from Models.Entities import IOperation

class TextOperation:
    def __init__(self, type, index, text=""):
        self.type = type  # 'insert' or 'delete'
        self.index = index  # position where the operation is applied
        self.text = text  # text to be inserted or deleted

    def toOperation(self, userId: str):
        return IOperation(userId=userId, index=self.index, text=self.text, type=self.type)
        
    def apply(self, doc):
        if self.type == 'insert':
            return doc[:self.index] + self.text + doc[self.index:]
        elif self.type == 'delete':
            return doc[:self.index] + doc[self.index + len(self.text):]
        else:
            raise ValueError("Invalid operation type")

class OperationalTransform:
    @staticmethod
    def transform(operation1, operation2):
        # Text insertion
        if operation1.type == 'insert' and operation2.type == 'insert':
            if operation1.index < operation2.index:
                return operation1, TextOperation(operation2.type, operation2.index + len(operation1.text), operation2.text)
            elif operation1.index == operation2.index:
                return TextOperation(operation1.type, operation1.index, operation1.text), TextOperation(operation2.type, operation2.index + len(operation1.text), operation2.text)
            else:
                return TextOperation(operation1.type, operation1.index + len(operation2.text), operation1.text), operation2

        # Text deletion
        elif operation1.type == 'delete' and operation2.type == 'delete':
            if operation1.index < operation2.index:
                return operation1, TextOperation(operation2.type, operation2.index - len(operation1.text), operation2.text)
            elif operation1.index == operation2.index:
                return TextOperation('noop', 0), TextOperation('noop', 0)
            else:
                return TextOperation(operation1.type, operation1.index - len(operation2.text), operation1.text), operation2

        # Insert and delete
        elif (operation1.type == 'insert' and operation2.type == 'delete') or (operation1.type == 'delete' and operation2.type == 'insert'):
            if operation1.type == 'insert':
                if operation1.index <= operation2.index:
                    return operation1, TextOperation(operation2.type, operation2.index + len(operation1.text), operation2.text)
                else:
                    return TextOperation(operation1.type, operation1.index + len(operation2.text), operation1.text), operation2
            else:
                if operation1.index < operation2.index:
                    return operation1, TextOperation(operation2.type, operation2.index - len(operation1.text), operation2.text)
                else:
                    return TextOperation(operation1.type, operation1.index - len(operation2.text), operation1.text), operation2

        else:
            return operation1, operation2

    @staticmethod
    def apply_concurrent_operations(operation: TextOperation, concurrent_operations: List[IOperation]):
        for op in concurrent_operations:
            concurrent_op = TextOperation(op.type, op.index, op.text)
            (operation, _) = OperationalTransform.transform(operation, concurrent_op)
        
        return operation
