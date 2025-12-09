"use client"

import React from "react"
import Editor from "@monaco-editor/react"
import { useTheme } from "next-themes"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CodeEditorProps {
  code?: string
  language?: string
  onChange?: (value: string | undefined) => void
  onLanguageChange?: (value: string) => void
  onRun?: () => void
}

export function CodeEditor({
  code = "// Start coding here...",
  language = "javascript",
  onChange,
  onLanguageChange,
  onRun,
}: CodeEditorProps) {
  const { theme } = useTheme()

  const handleLanguageChange = (value: string) => {
    onLanguageChange?.(value)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border">
      <div className="flex items-center justify-between border-b bg-muted p-2">
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="javascript">JavaScript</SelectItem>
            <SelectItem value="typescript">TypeScript</SelectItem>
            <SelectItem value="python">Python</SelectItem>
            <SelectItem value="java">Java</SelectItem>
            <SelectItem value="cpp">C++</SelectItem>
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={onRun}
          className="rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Run Code
        </button>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme={theme === "dark" ? "vs-dark" : "vs-light"}
          onChange={onChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  )
}
