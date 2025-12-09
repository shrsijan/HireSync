"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
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

export default function InterviewPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    // Resolving params in Next.js 15+ if needed, but for 14 it's direct. Assuming typical Next 14 usage.
    // If params is a promise in newer Next.js versions, we might need `use(params)` or `await params`. 
    // Given the previous file content didn't use params, I'll assume standard usage.

    // In Next.js 13+ app dir, params are passed as props.
    // However, since this is a client component ("use client"), we might need `useParams` from next/navigation 
    // if we want to be safe, or just use the props. `useParams` is often easier in client components.

    // Let's use useParams to be safe and consistent with "use client"
    // But wait, the component signature was `export default function InterviewPage()`.

    // I will use useParams from next/navigation.

    const { id: inviteCode } = useParams() // Requires import

    const [code, setCode] = useState("# Loading assessment...")
    const [language, setLanguage] = useState("python")
    const [output, setOutput] = useState("")
    const [error, setError] = useState("")
    const [isRunning, setIsRunning] = useState(false)
    const [testResults, setTestResults] = useState<any>(null)
    const [timeLeft, setTimeLeft] = useState(0)
    const [currentQuestion, setCurrentQuestion] = useState(1)
    const [totalQuestions, setTotalQuestions] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    const [assessment, setAssessment] = useState<any>(null)

    useEffect(() => {
        const fetchAssessment = async () => {
            if (!inviteCode) return;

            try {
                // Determine API URL (using localhost for now as in other files, or relative if proxied)
                // Using http://localhost:5001/api based on config
                const API_URL = "http://localhost:5001/api";

                const res = await fetch(`${API_URL}/invitations/validate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: inviteCode })
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.msg || "Failed to load assessment");
                }

                const data = await res.json();
                setAssessment(data.assessment);
                setTotalQuestions(data.assessment.questions.length);
                setTimeLeft(data.assessment.timeLimit * 60);

                // Initialize with first question if available
                if (data.assessment.questions.length > 0) {
                    // Set initial code template if we had one per language, strictly speaking 
                    // users might want a blank slate or template.
                    // For now, setting a generic template.
                    setCode(`# ${data.assessment.questions[0].title}\n# ${data.assessment.questions[0].description}\n\ndef solution():\n    pass`)
                } else {
                    setCode("# No questions found in this assessment.")
                }

            } catch (err: any) {
                console.error(err);
                alert(err.message || "Error loading assessment");
                router.push("/");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAssessment();
    }, [inviteCode, router]);

    // Timer effect
    useEffect(() => {
        if (!assessment || isLoading) return;

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
    }, [assessment, isLoading])

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
        setTestResults(null)

        try {
            const API_URL = "http://localhost:5001/api"
            const testCases = assessment.question.testCases || []

            const response = await fetch(`${API_URL}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    language,
                    testCases: testCases.length > 0 ? testCases : undefined
                })
            })
            const data = await response.json()

            if (data.error) {
                setError(data.output || data.error || "An error occurred")
                if (data.type === 'compilation_error') {
                    setError(`Compilation Error:\n${data.output || data.error}`)
                } else if (data.type === 'runtime_error') {
                    setError(`Runtime Error:\n${data.output || data.error}`)
                }
            } else if (data.type === 'test_results' && data.results) {
                // Test case results
                setTestResults(data)
                setOutput(`Tests: ${data.passed}/${data.total} passed`)
                if (data.passed === data.total) {
                    setError("")
                } else {
                    setError("Some test cases failed. Check the Test Results tab.")
                }
            } else {
                // Regular execution output
                setOutput(data.output || "Code executed successfully (no output)")
                setError("")
            }
        } catch (error) {
            setError("Failed to execute code. Please try again.")
            console.error("Execution error:", error)
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
            setCode("# Two Sum Problem\n# Given an array of integers nums and an integer target,\n# return indices of the two numbers such that they add up to target.\n\ndef twoSum(nums, target):\n    # Your code here\n    pass")
            setOutput("")
            setError("")
            setTestResults(null)
        }
    }

    if (isLoading || !assessment) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading assessment...</p>
                </div>
            </div>
        )
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
                                    {isLoading ? (
                                        <div className="flex h-full items-center justify-center">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                                <p>Loading assessment...</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-2xl font-bold">{assessment.questions[currentQuestion - 1]?.title}</h2>
                                                <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                    {assessment.questions[currentQuestion - 1]?.difficulty || 'Medium'}
                                                </span>
                                            </div>
                                            <div className="prose dark:prose-invert max-w-none">
                                                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                                                    {assessment.questions[currentQuestion - 1]?.description}
                                                </p>
                                                {assessment.questions[currentQuestion - 1]?.image && (
                                                    <img src={assessment.questions[currentQuestion - 1].image} alt="Question Diagram" className="mt-4 rounded-lg border shadow-sm" />
                                                )}
                                            </div>
                                        </div>
                                    )}
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

                    {/* Right: Chat Only (Whiteboard Style) */}
                    <ResizablePanel defaultSize={40} minSize={30}>
                        <ChatInterface code={code} language={language} />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    )
}
