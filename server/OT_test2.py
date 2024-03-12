# Define two insert operations at the same position
from utils.OperationalTransform import OperationalTransform, TextOperation


op1 = TextOperation('insert', 5, 'hello')
op2 = TextOperation('insert', 5, 'world')

# Define the base document
base_doc = "This is an example document."

# Apply the operations to the base document
doc_after_op1 = op1.apply(base_doc)

# Transform the operations
transformed_op1, transformed_op2 = OperationalTransform.transform(op1, op2)

print(transformed_op2.toOperation("asdf"))
# Apply the transformed operations to the base document
doc_after_transformed_op2 = transformed_op2.apply(doc_after_op1)

# Expected result: Both insertions should be combined
expected_doc = "This helloworld is an example document."

# Check if the final documents match the expected result
print(doc_after_transformed_op2, expected_doc)
