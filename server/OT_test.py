# Example usage:


from uuid import uuid4

from Models.CollaborativeFile import CollaborativeDocument, Operation
from utils.OT_Transformer import OperationalTransform, TextOperation


document = CollaborativeDocument(id=str(uuid4()), name="name", channelId="file", content="Hello world", operations=[])

# User 1 applies an operation
operation1 = Operation(userId="asdf", type="insert", index= 1, text="abcd")
textOp1 = TextOperation()
textOp1.add(operation1)
new_text = textOp1.apply(document.content)
print(new_text)
# User 2 applies an operation
operation2 = Operation(userId="bcd", type="insert", index=7, text="x")
operation3 = Operation(userId="bcd", type="delete", index=0, text="def")
textOp2 = TextOperation()
textOp2.add(operation2)
textOp2.add(operation3)

textOp2.transform(textOp1)
new_text2 = textOp2.apply(new_text)
document.content = new_text2

print(new_text2)


# Get the current content of the document
print(document.content)
