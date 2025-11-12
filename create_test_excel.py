import pandas as pd

# Create sample data
data = {
    'Product': ['Laptop', 'Phone', 'Tablet', 'Desk', 'Chair', 'Monitor', 'Keyboard', 'Mouse', 'Book', 'Notebook'],
    'Category': ['Electronics', 'Electronics', 'Electronics', 'Furniture', 'Furniture', 'Electronics', 'Electronics', 'Electronics', 'Stationery', 'Stationery'],
    'Price': [1200, 800, 500, 300, 150, 400, 50, 25, 20, 10],
    'Quantity': [50, 100, 75, 20, 40, 60, 120, 200, 300, 500],
    'Revenue': [60000, 80000, 37500, 6000, 6000, 24000, 6000, 5000, 6000, 5000]
}

df = pd.DataFrame(data)

# Save to Excel
df.to_excel('test_data.xlsx', index=False)
print("Test Excel file created successfully!")