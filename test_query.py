import requests

# Test file upload
url = "http://127.0.0.1:5000/upload"
with open("test_data.xlsx", "rb") as f:
    files = {"file": f}
    response = requests.post(url, files=files)

print("Upload response:", response.status_code)

if response.status_code == 200:
    upload_data = response.json()
    file_id = upload_data["file_id"]
    
    # Test different queries
    queries = [
        "top 5 by revenue",
        "top 3 by price",
        "show revenue by category"
    ]
    
    for query in queries:
        print(f"\nTesting query: {query}")
        query_url = "http://127.0.0.1:5000/query"
        query_data = {
            "query": query,
            "file_id": file_id
        }
        
        query_response = requests.post(query_url, json=query_data)
        print("Query response:", query_response.status_code)
        if query_response.status_code == 200:
            result = query_response.json()
            print("Summary:", result["summary"])
            print("Number of records:", len(result["data"]))
            if len(result["data"]) > 0:
                print("First record:", result["data"][0])
        else:
            print("Error:", query_response.text)