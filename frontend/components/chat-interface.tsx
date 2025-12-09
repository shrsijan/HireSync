"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Send } from "lucide-react"
import { API_URL } from "@/lib/config"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface ChatInterfaceProps {
  code?: string
  language?: string
  accessToken?: string // optional token if you want to auth this call
}

export function ChatInterface({ code, language, accessToken }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "assistant",
      content: "Hello! I'm your AI interviewer. Ready to start the technical interview?",
    },
  ])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return

    const userMsg: Message = {
      id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
      role: "user",
      content: text,
    }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput("")
    setSending(true)

    try {
      const res = await fetch(`${API_URL}/ai/gemini-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
          code: code ?? "",
          language: language ?? "javascript",
        }),
      })

      const ct = res.headers.get("content-type") || ""
      const data = ct.includes("application/json") ? await res.json() : null
      const textContent = data?.message?.content || (res.ok ? "No reply." : "Sorry, I could not generate a reply.")

      const aiMsg: Message = {
        id: globalThis.crypto?.randomUUID?.() ?? String(Date.now() + 1),
        role: "assistant",
        content: textContent,
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      const aiMsg: Message = {
        id: globalThis.crypto?.randomUUID?.() ?? String(Date.now() + 2),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request.",
      }
      setMessages(prev => [...prev, aiMsg])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border bg-background">
      <div className="border-b bg-muted/50 p-4">
        <h3 className="font-semibold">AI Interviewer</h3>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4" ref={scrollRef}>
        {messages.map(message => (
          <div
            key={message.id}
            className={cn(
              "flex w-max max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm break-words",
              message.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-muted"
            )}
          >
            {message.content}
          </div>
        ))}
      </div>

      <div className="border-t bg-background p-4">
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
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={sending} aria-disabled={sending}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  )
}
