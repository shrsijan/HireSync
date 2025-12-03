"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CodeEditor } from "@/components/code-editor"
import { ChatInterface } from "@/components/chat-interface"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { Clock, Building2, AlertCircle, CheckCircle2, Terminal, AlertTriangle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function InterviewPage() {
    const router = useRouter()
    const [code, setCode] = useState("// Start coding here...")
    const [language, setLanguage] = useState("javascript")
    const [output, setOutput] = useState("")
    const [error, setError] = useState("")
    const [isRunning, setIsRunning] = useState(false)
    const [timeLeft, setTimeLeft] = useState(3600) // 60 minutes in seconds
    const [currentQuestion, setCurrentQuestion] = useState(1)
    const [totalQuestions, setTotalQuestions] = useState(3)

    // Mock assessment data - in real app, fetch from API
    const [assessment, setAssessment] = useState({
        companyName: "Tech Corp",
        role: "Software Engineer",
        title: "Technical Assessment",
        question: {
            title: "Two Sum Problem",
            description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nExample:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].",
            difficulty: "Medium"
        }
    })

    // Timer effect
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(timer)
                    handleSubmit()
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const getTimeColor = () => {
        if (timeLeft < 300) return "text-red-600 dark:text-red-400" // < 5 mins
        if (timeLeft < 600) return "text-orange-600 dark:text-orange-400" // < 10 mins
        return "text-green-600 dark:text-green-400"
    }

    const handleCodeChange = (value: string | undefined) => {
        if (value !== undefined) {
            setCode(value)
        }
    }

    const handleRunCode = async () => {
        setIsRunning(true)
        setOutput("")
        setError("")

        try {
            const API_URL = "http://localhost:5001/api"
            const response = await fetch(`${API_URL}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, language })
            })
            const data = await response.json()

            if (data.error) {
                setError(data.error)
            } else {
                setOutput(data.output || "Code executed successfully (no output)")
            }
        } catch (error) {
            setError("Failed to execute code. Please try again.")
        } finally {
            setIsRunning(false)
        }
    }

    const handleSubmit = () => {
        if (confirm("Are you sure you want to submit your solution? This cannot be undone.")) {
            // Submit logic here
            alert("Assessment submitted successfully!")
            router.push("/dashboard")
        }
    }

    const handleNextQuestion = () => {
        if (currentQuestion < totalQuestions) {
            setCurrentQuestion(currentQuestion + 1)
            setCode("// Start coding here...")
            setOutput("")
            setError("")
        }
    }

    return (
        <div className="h-screen w-full flex flex-col bg-background">
            {/* Assessment Header */}
            <div className="border-b bg-card">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <h1 className="font-semibold text-lg">{assessment.companyName}</h1>
                                    <p className="text-sm text-muted-foreground">{assessment.role}</p>
                                </div>
                            </div>
                            <div className="h-8 w-px bg-border" />
                            <div className="text-sm">
                                <div className="text-muted-foreground">Question {currentQuestion} of {totalQuestions}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Clock className={`h-5 w-5 ${getTimeColor()}`} />
                                <span className={`text-xl font-mono font-bold ${getTimeColor()}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                            <Button onClick={handleSubmit} variant="default">
                                Submit Assessment
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                    {/* Left: Question + Code Editor */}
                    <ResizablePanel defaultSize={60} minSize={40}>
                        <ResizablePanelGroup direction="vertical">
                            {/* Question Panel */}
                            <ResizablePanel defaultSize={35} minSize={25}>
                                <div className="h-full overflow-auto p-6 bg-muted/30">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-2xl font-bold">{assessment.question.title}</h2>
                                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                {assessment.question.difficulty}
                                            </span>
                                        </div>
                                        <div className="prose dark:prose-invert max-w-none">
                                            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                                                {assessment.question.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </ResizablePanel>

                            <ResizableHandle withHandle />

                            {/* Code Editor */}
                            <ResizablePanel defaultSize={65} minSize={40}>
                                <CodeEditor
                                    code={code}
                                    onChange={handleCodeChange}
                                    language={language}
                                    onLanguageChange={setLanguage}
                                    onRun={handleRunCode}
                                />
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* Right: Chat + Output */}
                    <ResizablePanel defaultSize={40} minSize={30}>
                        <ResizablePanelGroup direction="vertical">
                            {/* Chat Interface */}
                            <ResizablePanel defaultSize={60} minSize={40}>
                                <ChatInterface code={code} language={language} />
                            </ResizablePanel>

                            <ResizableHandle withHandle />

                            {/* Output Panel */}
                            <ResizablePanel defaultSize={40} minSize={20}>
                                <div className="h-full bg-background border-t">
                                    <Tabs defaultValue="output" className="h-full flex flex-col">
                                        <TabsList className="w-full justify-start rounded-none border-b bg-muted/50">
                                            <TabsTrigger value="output" className="gap-2">
                                                <Terminal className="h-4 w-4" />
                                                Output
                                            </TabsTrigger>
                                            <TabsTrigger value="errors" className="gap-2">
                                                <AlertCircle className="h-4 w-4" />
                                                Errors
                                                {error && <span className="ml-1 flex h-2 w-2 rounded-full bg-red-500" />}
                                            </TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="output" className="flex-1 overflow-auto p-4 m-0 font-mono text-sm">
                                            {isRunning ? (
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                                    Running code...
                                                </div>
                                            ) : output ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs font-semibold">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        Execution Successful
                                                    </div>
                                                    <pre className="text-foreground">{output}</pre>
                                                </div>
                                            ) : (
                                                <div className="text-muted-foreground italic">
                                                    No output yet. Run your code to see results.
                                                </div>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="errors" className="flex-1 overflow-auto p-4 m-0 font-mono text-sm">
                                            {error ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-semibold">
                                                        <AlertTriangle className="h-4 w-4" />
                                                        Execution Error
                                                    </div>
                                                    <pre className="text-red-600 dark:text-red-400 whitespace-pre-wrap">{error}</pre>
                                                </div>
                                            ) : (
                                                <div className="text-muted-foreground italic">
                                                    No errors
                                                </div>
                                            )}
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    )
}
