"use client"

import React, { useState } from "react"
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
    const [currentLanguage, setCurrentLanguage] = useState(language)

    const handleLanguageChange = (value: string) => {
        if (onLanguageChange) {
            onLanguageChange(value)
        }
    }

    return (
        <div className="flex flex-col h-full border rounded-md overflow-hidden">
            <div className="flex items-center justify-between p-2 bg-muted border-b">
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
                    onClick={onRun}
                    className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-medium hover:bg-primary/90"
                >
                    Run Code
                </button>
            </div>
            <div className="flex-1">
                <Editor
                    height="100%"
                    language={language}
                    value={code}
                    theme={theme === "dark" ? "vs-dark" : "light"}
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
