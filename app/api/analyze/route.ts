// This route will receive multipart form data with file and query
// It will forward the request to the Python backend for processing

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const query = formData.get("query") as string

    // Create a new FormData object for the Python backend
    const backendFormData = new FormData()
    backendFormData.append("file", file)
    
    // First, upload the file to get the file_id
    // Use 127.0.0.1 instead of localhost to avoid IPv6 issues
    const uploadResponse = await fetch("http://127.0.0.1:5000/upload", {
      method: "POST",
      body: backendFormData,
    })

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json()
      return Response.json({ error: errorData.error || "Upload failed" }, { status: uploadResponse.status })
    }

    const uploadData = await uploadResponse.json()
    const fileId = uploadData.file_id

    // Now send the query with the file_id to the Python backend
    const queryResponse = await fetch("http://127.0.0.1:5000/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query,
        file_id: fileId
      }),
    })

    if (!queryResponse.ok) {
      const errorText = await queryResponse.text()
      console.error("Query response error:", errorText)
      return Response.json({ error: "Query processing failed: " + errorText }, { status: queryResponse.status })
    }

    const data = await queryResponse.json()
    return Response.json(data)
  } catch (error) {
    console.error("Analysis error:", error)
    return Response.json({ error: "Analysis failed: " + (error as Error).message }, { status: 500 })
  }
}