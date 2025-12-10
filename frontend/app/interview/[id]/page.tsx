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
import {
    Clock,
    Building2,
    Play,
    Send,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Circle,
    AlertTriangle,
    Terminal,
    MessageSquare,
    FileCode,
    Lightbulb,
    X
} from "lucide-react"

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function InterviewPage() {
    const router = useRouter()
    const { id: inviteCode } = useParams()

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
    const [showHint, setShowHint] = useState(false)
    const [questionProgress, setQuestionProgress] = useState<Record<number, 'pending' | 'attempted' | 'passed'>>({})

    const [messages, setMessages] = useState<any[]>([
        {
            id: "intro",
            role: "assistant",
            content: "Hello! I'm your AI interviewer. Ready to start the technical interview?",
        },
    ])
    const [invitationId, setInvitationId] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        const fetchAssessment = async () => {
            if (!inviteCode) return;

            try {
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
                setInvitationId(data.invitationId); // Save ID for submission
                setTotalQuestions(data.assessment.questions.length);
                setTimeLeft(data.assessment.timeLimit * 60);

                // Initialize progress tracking
                const initialProgress: Record<number, 'pending' | 'attempted' | 'passed'> = {}
                data.assessment.questions.forEach((_: any, i: number) => {
                    initialProgress[i + 1] = 'pending'
                })
                setQuestionProgress(initialProgress)

                if (data.assessment.questions.length > 0) {
                    const q = data.assessment.questions[0]
                    setCode(q.starterCode || `# ${q.title}\n\ndef solution():\n    # Your code here\n    pass`)
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

    useEffect(() => {
        if (!assessment || isSubmitting) return

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    // Optional: auto-submit or show time's up modal
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [assessment, isSubmitting])

    const handleCodeChange = (newCode: string | undefined) => {
        if (newCode !== undefined) {
            console.log("[InterviewPage] Code changed:", newCode.length);
            setCode(newCode)
        }
    }

    // Run code feature removed requested by user

    const handleSubmit = async () => {
        if (!confirm("Are you sure you want to submit? This cannot be undone.")) return;

        setIsSubmitting(true);
        try {
            const API_URL = "http://localhost:5001/api";
            const res = await fetch(`${API_URL}/interviews/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invitationId, // Use the ID we saved
                    code,
                    language,
                    messages
                })
            });

            if (res.ok) {
                const data = await res.json();
                alert(`Assessment Submitted!\n\nScore: ${data.score}/100\n\nFeedback: ${data.feedback}`);
                router.push("/dashboard/candidate");
            } else {
                alert("Submission failed. Please try again.");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred during submission.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const navigateQuestion = (direction: 'prev' | 'next') => {
        const newQ = direction === 'next' ? currentQuestion + 1 : currentQuestion - 1
        if (newQ >= 1 && newQ <= totalQuestions) {
            setCurrentQuestion(newQ)
            const q = assessment.questions[newQ - 1]
            setCode(q.starterCode || `# ${q.title}\n\ndef solution():\n    pass`)
            // Ideally we should save the code for the previous question before switching
            // For now, we just switch context specific to the question
            // setOutput("")
            // setError("")
            // setTestResults(null)
        }
    }


    const getTimeStatus = () => {
        if (timeLeft < 300) { // 5 mins
            return { bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800", color: "text-red-700 dark:text-red-400" }
        }
        if (timeLeft < 600) { // 10 mins
            return { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", color: "text-amber-700 dark:text-amber-400" }
        }
        return { bg: "bg-slate-50 dark:bg-slate-800/50", border: "border-slate-200 dark:border-slate-800", color: "text-slate-700 dark:text-slate-300" }
    }

    const timeStatus = getTimeStatus()

    if (isLoading || !assessment) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="text-center space-y-4">
                    <div className="relative w-16 h-16 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />
                        <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                    </div>
                    <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">Loading your assessment</p>
                        <p className="text-sm text-slate-500">Preparing questions and environment...</p>
                    </div>
                </div>
            </div>
        )
    }

    const currentQ = assessment.questions[currentQuestion - 1]

    return (
        <div className="h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-950">
            {/* Compact Header */}
            <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center px-4 gap-4 shrink-0">
                {/* Company Info */}
                <div className="flex items-center gap-3 pr-4 border-r border-slate-200 dark:border-slate-700">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="leading-tight">
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{assessment.companyName}</p>
                        <p className="text-xs text-slate-500">{assessment.role}</p>
                    </div>
                </div>

                {/* Question Progress */}
                <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalQuestions }, (_, i) => {
                        const qNum = i + 1
                        const status = questionProgress[qNum]
                        const isCurrent = qNum === currentQuestion

                        return (
                            <button
                                key={qNum}
                                onClick={() => {
                                    setCurrentQuestion(qNum)
                                    const q = assessment.questions[qNum - 1]
                                    setCode(q.starterCode || `# ${q.title}\n\ndef solution():\n    pass`)
                                }}
                                className={`
                                    relative w-8 h-8 rounded-lg text-xs font-medium transition-all
                                    ${isCurrent
                                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }
                                `}
                            >
                                {status === 'passed' ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute -top-1 -right-1" />
                                ) : status === 'attempted' ? (
                                    <Circle className="w-3 h-3 text-amber-500 absolute -top-0.5 -right-0.5 fill-current" />
                                ) : null}
                                {qNum}
                            </button>
                        )
                    })}
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Timer */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${timeStatus.bg} ${timeStatus.border}`}>
                    <Clock className={`w-4 h-4 ${timeStatus.color}`} />
                    <span className={`font-mono font-bold text-lg tabular-nums ${timeStatus.color}`}>
                        {formatTime(timeLeft)}
                    </span>
                </div>

                {/* Submit */}
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                    {/* Left: Question Panel */}
                    <ResizablePanel defaultSize={40} minSize={20} maxSize={60}>
                        <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
                            {/* Question Header */}
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                                                Question {currentQuestion}
                                            </span>
                                            <span className={`
                                                px-2 py-0.5 text-xs font-medium rounded-full
                                                ${currentQ?.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : ''}
                                                ${currentQ?.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : ''}
                                                ${currentQ?.difficulty === 'Hard' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : ''}
                                            `}>
                                                {currentQ?.difficulty || 'Medium'}
                                            </span>
                                        </div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                            {currentQ?.title}
                                        </h2>
                                    </div>
                                </div>
                            </div>

                            {/* Question Content */}
                            <div className="flex-1 overflow-auto p-4">
                                <div className="prose prose-slate dark:prose-invert prose-sm max-w-none">
                                    <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed break-words">
                                        {currentQ?.description}
                                    </p>

                                    {currentQ?.examples && currentQ.examples.length > 0 && (
                                        <div className="mt-6 space-y-3">
                                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Examples</h4>
                                            {currentQ.examples.map((ex: any, i: number) => (
                                                <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 font-mono text-xs space-y-1">
                                                    <div><span className="text-slate-500">Input:</span> <span className="text-slate-900 dark:text-slate-100">{ex.input}</span></div>
                                                    <div><span className="text-slate-500">Output:</span> <span className="text-emerald-600 dark:text-emerald-400">{ex.output}</span></div>
                                                    {ex.explanation && (
                                                        <div className="text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700 mt-2">
                                                            {ex.explanation}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {currentQ?.constraints && (
                                        <div className="mt-6">
                                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Constraints</h4>
                                            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 font-mono">
                                                {currentQ.constraints.map((c: string, i: number) => (
                                                    <li key={i}>• {c}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {currentQ?.image && (
                                        <img
                                            src={currentQ.image}
                                            alt="Question diagram"
                                            className="mt-4 rounded-lg border border-slate-200 dark:border-slate-700"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Question Navigation */}
                            <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigateQuestion('prev')}
                                    disabled={currentQuestion === 1}
                                    className="gap-1"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Previous
                                </Button>

                                {currentQ?.hint && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowHint(!showHint)}
                                        className="gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                    >
                                        <Lightbulb className="w-4 h-4" />
                                        Hint
                                    </Button>
                                )}

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigateQuestion('next')}
                                    disabled={currentQuestion === totalQuestions}
                                    className="gap-1"
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Hint Drawer */}
                            {showHint && currentQ?.hint && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-950 border-t border-amber-200 dark:border-amber-800">
                                    <div className="flex items-start gap-2">
                                        <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-sm text-amber-800 dark:text-amber-200">{currentQ.hint}</p>
                                        <button onClick={() => setShowHint(false)} className="shrink-0 p-1 hover:bg-amber-100 dark:hover:bg-amber-900 rounded">
                                            <X className="w-3 h-3 text-amber-600" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* Center: Code Editor */}
                    <ResizablePanel defaultSize={32} minSize={20}>
                        <div className="h-full flex flex-col">
                            <CodeEditor
                                code={code}
                                onChange={handleCodeChange}
                                language={language}
                                onLanguageChange={setLanguage}
                            />

                            {/* Footer: Language Indicator Only */}
                            <div className="h-8 bg-slate-900 border-t border-slate-700 flex items-center px-4">
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <FileCode className="w-3 h-3" />
                                    <span>{language}</span>
                                </div>
                            </div>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* Right: Chat Only */}
                    <ResizablePanel defaultSize={28} minSize={20}>
                        <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
                            <ChatInterface
                                code={code}
                                language={language}
                                consoleOutput={output}
                                executionError={error}
                                testResults={testResults}
                                messages={messages}
                                setMessages={setMessages}
                            />
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    )
}