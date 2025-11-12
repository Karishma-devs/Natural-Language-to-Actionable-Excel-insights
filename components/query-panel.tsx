"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Mic, Send, Square } from "lucide-react"

interface QueryPanelProps {
  onQuery: (query: string) => void
  loading: boolean
}

export default function QueryPanel({ onQuery, loading }: QueryPanelProps) {
  const [query, setQuery] = useState("")
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'
      
      recognitionRef.current.onstart = () => {
        setIsListening(true)
      }
      
      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
      
      recognitionRef.current.onresult = (event: any) => {
        let transcript = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        setQuery(transcript)
      }
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error)
        setIsListening(false)
      }
    }
  }, [])

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      console.error("Speech recognition not supported")
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      setQuery("") // Clear previous query when starting new recognition
      recognitionRef.current.start()
    }
  }

  const handleSubmit = () => {
    if (query.trim()) {
      onQuery(query.trim())
      setQuery("")
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">Ask your question about the data</label>
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., What are the top 5 products by revenue? Show me sales trends by month..."
          className="min-h-24 resize-none"
          disabled={loading}
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={toggleVoiceInput}
          variant={isListening ? "destructive" : "outline"}
          size="sm"
          className="gap-2"
          disabled={loading}
        >
          {isListening ? (
            <>
              <Square className="h-4 w-4" />
              Stop listening
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              Voice input
            </>
          )}
        </Button>

        <Button onClick={handleSubmit} disabled={!query.trim() || loading} className="flex-1 gap-2">
          <Send className="h-4 w-4" />
          {loading ? "Analyzing..." : "Analyze"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: Be specific about what you want to know. Include column names if you know them.
      </p>
    </Card>
  )
}