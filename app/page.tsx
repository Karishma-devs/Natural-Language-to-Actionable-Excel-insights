"use client"

import { useState } from "react"
import Header from "@/components/header"
import FileUpload from "@/components/file-upload"
import QueryPanel from "@/components/query-panel"
import ResultsDisplay from "@/components/results-display"
import LightRays from "@/components/light-rays"
import { useToast } from "@/hooks/use-toast"

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleFileUpload = (file: File) => {
    setUploadedFile(file)
    setResults(null)
    toast({
      title: "File uploaded",
      description: `${file.name} is ready for analysis`,
    })
  }

  const handleQuery = async (query: string) => {
    if (!uploadedFile) {
      toast({
        title: "No file uploaded",
        description: "Please upload an Excel file first",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Prepare FormData for file upload
      const formData = new FormData()
      formData.append("file", uploadedFile)
      formData.append("query", query)

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to analyze file")
      }

      const data = await response.json()
      setResults(data)
      toast({
        title: "Analysis complete",
        description: "Your insights are ready",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Analysis failed",
        description: "Please try again with a different query",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="light-rays-bg">
        <LightRays
          raysOrigin="top-center"
          raysColor="#00ffff"
          raysSpeed={1.5}
          lightSpread={0.8}
          rayLength={1.2}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.1}
          distortion={0.05}
        />
      </div>

      <div className="relative z-10">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-6">
              <FileUpload onFileUpload={handleFileUpload} fileName={uploadedFile?.name} />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <QueryPanel onQuery={handleQuery} loading={loading} />
              {results && <ResultsDisplay results={results} />}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
