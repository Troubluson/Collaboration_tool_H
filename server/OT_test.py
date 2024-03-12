# Example usage:


from uuid import uuid4

from Models.CollaborativeFile import CollaborativeDocument, Operation
from utils.OT_Transformer import TextOperation


document = CollaborativeDocument(id=str(uuid4()), name="name", channelId="file", content="Hello world", operations=[])

# User 1 applies an operation
operation1 = Operation(userId="asdf", type="insert", index=5, text=" oh")
textOp1 = TextOperation()
textOp1.add(operation1)
new_text1 = textOp1.apply(document.content)
# User 2 applies an operation
operation2 = Operation(userId="bcd", type="insert", index=0, text="x")
operation3 = Operation(userId="bcd", type="delete", index=0, text="He")
textOp2 = TextOperation()
textOp2.add(operation3)
textOp2.add(operation2)

textOp2.transform(textOp1)
new_text2 = textOp2.apply(new_text1)
document.content = new_text2

print(new_text1)
print(new_text2)


# Get the current content of the document
print(document.content)

# Example usage:


from uuid import uuid4

from Models.CollaborativeFile import CollaborativeDocument, Operation
from utils.OT_Transformer import TextOperation


document = CollaborativeDocument(id=str(uuid4()), name="name", channelId="file", content="Hello, world!", operations=[])

# User 1 applies an operation
operation1 = Operation(userId="asdf", type="insert", index=6, text=" beautiful")
textOp1 = TextOperation()
textOp1.add(operation1)
new_text  = textOp1.apply(document.content)
print(new_text )

# User 2 applies an operation
operation2 = Operation(userId="bcd", type="insert", index=0, text="WAWA")
operation3 = Operation(userId="bcd", type="delete", index=11, text="world")
textOp2 = TextOperation()
textOp2.add(operation2)
textOp2.add(operation3)

new_text = textOp2.apply(new_text)
print(new_text )

textOp2.transform(textOp1)

document.content = textOp2.apply(document.content)

print(new_text )


# Get the current content of the document
print(document.content)


