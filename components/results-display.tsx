"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Copy } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface ResultsDisplayProps {
  results: any
}

export default function ResultsDisplay({ results }: ResultsDisplayProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const copyToClipboard = () => {
    const text = JSON.stringify(results, null, 2)
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast({
      title: "Copied to clipboard",
      description: "Results have been copied",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadResults = () => {
    const dataStr = JSON.stringify(results, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "analysis-results.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Analysis Results</h2>
        <div className="flex gap-2">
          <Button onClick={copyToClipboard} variant="outline" size="sm" className="gap-2 bg-transparent">
            <Copy className="h-4 w-4" />
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button onClick={downloadResults} variant="outline" size="sm" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {results.summary && (
            <div className="space-y-2 pb-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Summary</h3>
              <p className="text-sm text-muted-foreground">{results.summary}</p>
            </div>
          )}

          {results.data && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Data</h3>
              {Array.isArray(results.data) ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border">
                      <tr className="bg-muted/50">
                        {Object.keys(results.data[0] || {}).map((key) => (
                          <th key={key} className="px-3 py-2 text-left font-medium text-muted-foreground">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {results.data.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-muted/50">
                          {Object.values(row).map((value: any, colIdx: number) => (
                            <td key={colIdx} className="px-3 py-2 text-foreground text-sm">
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto text-foreground">
                  {JSON.stringify(results.data, null, 2)}
                </pre>
              )}
            </div>
          )}

          {results.insights && (
            <div className="space-y-2 pt-4 border-t border-border">
              <h3 className="font-semibold text-foreground">Key Insights</h3>
              <ul className="space-y-2">
                {results.insights.map((insight: string, idx: number) => (
                  <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
