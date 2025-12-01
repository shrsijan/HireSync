"use client"

import { useState } from "react"
import { CodeEditor } from "@/components/code-editor"
import { ChatInterface } from "@/components/chat-interface"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"

export default function InterviewPage({ params }: { params: { id: string } }) {
    const [code, setCode] = useState("// Start coding here...");
    const [language, setLanguage] = useState("javascript");
    const [output, setOutput] = useState("");

    const handleCodeChange = (value: string | undefined) => {
        if (value !== undefined) {
            setCode(value);
        }
    };

    const handleRunCode = async () => {
        setOutput("Running...");
        try {
            // Import API_URL dynamically or use hardcoded
            const API_URL = "http://localhost:5001/api";
            const response = await fetch(`${API_URL}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, language })
            });
            const data = await response.json();
            setOutput(data.output || data.error || "No output");
        } catch (error) {
            setOutput("Error executing code");
        }
    };

    return (
        <div className="h-[calc(100vh-4rem)] w-full p-4 flex flex-col gap-4">
            <ResizablePanelGroup direction="horizontal" className="rounded-lg border flex-1">
                <ResizablePanel defaultSize={60} minSize={30}>
                    <CodeEditor
                        code={code}
                        onChange={handleCodeChange}
                        language={language}
                        onLanguageChange={setLanguage}
                        onRun={handleRunCode}
                    />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={40} minSize={30}>
                    <ChatInterface code={code} language={language} />
                </ResizablePanel>
            </ResizablePanelGroup>

            {output && (
                <div className="h-32 border rounded-md p-4 bg-muted overflow-auto font-mono text-sm">
                    <div className="font-bold mb-2">Output:</div>
                    <pre>{output}</pre>
                </div>
            )}
        </div>
    )
}
