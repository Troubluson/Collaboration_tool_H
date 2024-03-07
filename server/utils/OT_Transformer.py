
from Models.CollaborativeFile import Operation

class TextOperation:
    """
    Represents a text operation in Operational Transform.
    """

    def __init__(self):
        self.ops = []

    def add(self, op: Operation):
        self.ops.append(op)

    def apply(self, text) -> str:
        """
        Applies the operations on the given text.
        """
        offset = 0
        for op in self.ops:
            pos = op.index + offset
            if op.type == 'insert':
                text = text[:pos] + op.text + text[pos:]
                offset += len(op.text)
            elif op.type == 'delete':
                text = text[:pos] + text[pos + len(op.text):]
                offset -= len(op.text)
        return text

    def transform(self, other_text_ops):
        """
        Transforms this operation against another operation.
        """
        new_self_ops = []
        new_other_ops = []
        for self_op in self.ops:
            for other_op in other_text_ops.ops:
                if self_op.type == 'insert' and other_op.type == 'insert':
                    if self_op.index < other_op.index or \
                            (self_op.index == other_op.index and id(self_op) < id(other_op)):
                        new_self_ops.append(self_op)
                        new_other_ops.append(Operation(userId=other_op.userId, type='insert', index= other_op.index + len(self_op.text), text=other_op.text))
                    else:
                        new_self_ops.append(Operation(userId=self_op.userId, type='insert', index= self_op.index + len(other_op.text), text=self_op.text))
                        new_other_ops.append(other_op)
                elif self_op.type == 'insert' and other_op.type == 'delete':
                    if self_op.index < other_op.index:
                        new_self_ops.append(self_op)
                    elif self_op.index < other_op.index + len(other_op.text):
                        new_other_ops.append(Operation(userId=self_op.userId, type='delete', index=other_op.index, text = self_op.text[:other_op.index - self_op.index]))
                        new_self_ops.append(Operation(userId=self_op.userId, type='insert', index=self_op.index, text = self_op.text[other_op.index - self_op.index:]))
                    else:
                        new_self_ops.append(Operation(userId=self_op.userId, type='insert', index=self_op.index - len(other_op.text), text = self_op.text))
                elif self_op.type == 'delete' and other_op.type == 'insert':
                    if self_op.index < other_op.index:
                        new_self_ops.append(self_op)
                    elif self_op.index < other_op.index + len(other_op.text):
                        new_self_ops.append(Operation(userId=self_op.userId, type='delete', index=self_op.index, text = self_op.text[:other_op.index - self_op.index]))
                        new_other_ops.append(Operation(userId=self_op.userId, type='insert', index=other_op.index,text = self_op.text[other_op.index - self_op.index:]))
                    else:
                        new_self_ops.append(Operation(userId=self_op.userId, type='delete', index=self_op.index + len(other_op.text), text = self_op.text))
        if len(new_self_ops) == 0:
            new_self_ops = self.ops
        self.ops = new_self_ops
        other_text_ops.ops = new_other_ops
