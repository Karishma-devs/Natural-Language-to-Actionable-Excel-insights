"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface FileUploadProps {
  onFileUpload: (file: File) => void
  fileName?: string
}

export default function FileUpload({ onFileUpload, fileName }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      if (
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel"
      ) {
        onFileUpload(file)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0])
    }
  }

  return (
    <Card
      className={`border-2 border-dashed p-8 text-center transition-all ${
        dragActive
          ? "border-primary bg-primary/5"
          : fileName
            ? "border-border bg-card"
            : "border-border hover:border-primary/50"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={handleChange} className="hidden" />

      <div className="space-y-3">
        <Upload className={`mx-auto h-10 w-10 ${fileName ? "text-primary" : "text-muted-foreground"}`} />
        <div>
          <p className="font-semibold text-foreground">{fileName ? `✓ ${fileName}` : "Upload your Excel file"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {fileName ? "Ready for analysis" : "Drag and drop or click to browse"}
          </p>
        </div>
        {!fileName && (
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} className="mt-4 w-full">
            Select File
          </Button>
        )}
      </div>
    </Card>
  )
}
