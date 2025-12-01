"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
    id: string
    role: "user" | "assistant"
    content: string
}

interface ChatInterfaceProps {
    code?: string
    language?: string
}

export function ChatInterface({ code, language }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content: "Hello! I'm your AI interviewer. Ready to start the technical interview?",
        },
    ])
    const [input, setInput] = useState("")
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = async () => {
        if (!input.trim()) return

        const newMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
        }

        setMessages((prev) => [...prev, newMessage])
        setInput("")

        try {
            // Import API_URL dynamically or use hardcoded for now to avoid import issues in this snippet
            const API_URL = "http://localhost:5001/api";

            const response = await fetch(`${API_URL}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [...messages, newMessage].map(m => ({ role: m.role, content: m.content })),
                    code: code || "",
                    language: language || "javascript"
                }),
            });

            const data = await response.json();

            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.message.content,
            }
            setMessages((prev) => [...prev, aiResponse])
        } catch (error) {
            console.error("Error sending message:", error);
            const errorResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Sorry, I encountered an error processing your request.",
            }
            setMessages((prev) => [...prev, errorResponse])
        }
    }


    return (
        <div className="flex flex-col h-full border rounded-md overflow-hidden bg-background">
            <div className="p-4 border-b bg-muted/50">
                <h3 className="font-semibold">AI Interviewer</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={cn(
                            "flex w-max max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                            message.role === "user"
                                ? "ml-auto bg-primary text-primary-foreground"
                                : "bg-muted"
                        )}
                    >
                        {message.content}
                    </div>
                ))}
            </div>
            <div className="p-4 border-t bg-background">
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        handleSend()
                    }}
                    className="flex items-center gap-2"
                >
                    <Input
                        placeholder="Type your answer..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1"
                    />
                    <Button type="submit" size="icon">
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
            </div>
        </div>
    )
}
