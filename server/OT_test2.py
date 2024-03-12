# Example usage:



from utils.OperationalTransform import TextOperation, OperationalTransform

document = "Hello, world!"
revision = 1


op1 = TextOperation('insert', 6, ' beautiful')
op2 = TextOperation('delete', 2, 'l')
op3 = TextOperation('insert', 7, 'x')

for op in [op2, op3]:
    op1, transformed_op2 = OperationalTransform.transform(op1, op)
    print("Transformed operation 1:", op1.type, op1.index, op1.text)
    print("Transformed operation 2:", transformed_op2.type, transformed_op2.index, transformed_op2.text)


# Transform the operations

# Display the transformed operations

# Apply the operations to a document
initial_doc = "Hello, world!"
doc_after_op1 = op1.apply(initial_doc)
doc_after_op2 = op2.apply(initial_doc)

print("Document after operation 1:", doc_after_op1)
print("Document after operation 2:", doc_after_op2)
