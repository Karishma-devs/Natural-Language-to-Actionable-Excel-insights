import requests

# Test file upload
url = "http://localhost:5000/upload"
with open("test_data.xlsx", "rb") as f:
    files = {"file": f}
    response = requests.post(url, files=files)

print("Upload response:", response.status_code)
print("Upload response data:", response.json())

# If upload successful, test query
if response.status_code == 200:
    upload_data = response.json()
    file_id = upload_data["file_id"]
    
    # Test query
    query_url = "http://localhost:5000/query"
    query_data = {
        "query": "show top 5 products by revenue",
        "file_id": file_id
    }
    
    query_response = requests.post(query_url, json=query_data)
    print("Query response:", query_response.status_code)
    print("Query response data:", query_response.json())