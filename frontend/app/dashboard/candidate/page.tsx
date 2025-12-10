"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Calendar, Clock, Building2, TrendingUp, Award, CheckCircle2, Plus, X, Loader2 } from "lucide-react"

interface Invitation {
    _id: string
    companyName: string
    role: string
    status: string
    title: string
    assessment?: {
        timeLimit: number
        expiryDate: string
    }
    createdAt?: string
}

export default function CandidateDashboard() {
    const { data: session } = useSession()
    const router = useRouter()
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        completed: 0,
        upcoming: 0
    })

    // Modal State
    const [showAssessmentModal, setShowAssessmentModal] = useState(false)
    const [assessmentCode, setAssessmentCode] = useState("")
    const [verifying, setVerifying] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (session) {
            // fetchInvitations() // Disabled per user request (manual entry only)
            setLoading(false);
        }
    }, [session])

    const fetchInvitations = async () => {
        try {
            // @ts-ignore
            const token = session?.user?.accessToken || ""
            const email = session?.user?.email || ""

            // Ensure absolute URL if running server-side or if proxy not set
            // Ideally use config
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"

            const res = await fetch(`${API_URL}/invitations/candidate/${email}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })

            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                if (res.ok) {
                    const data = await res.json()
                    setInvitations(data)

                    // Calculate stats
                    const pending = data.filter((inv: Invitation) => inv.status === 'pending').length
                    const completed = data.filter((inv: Invitation) => inv.status === 'completed').length
                    const upcoming = pending

                    setStats({
                        total: data.length,
                        pending,
                        completed,
                        upcoming
                    })
                } else {
                    console.error("Failed to fetch invitations", await res.text())
                    // Keep empty or show error state
                }
            } else {
                console.error("Received non-JSON response from API", await res.text())
            }

        } catch (err) {
            console.error("Error fetching invitations:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setVerifying(true);
        setError("");

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"

            const res = await fetch(`${API_URL}/invitations/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: assessmentCode })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.msg || "Invalid code");
            }

            // If valid, redirect to interview page with token
            router.push(`/interview/${assessmentCode}`);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setVerifying(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            case 'completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            case 'expired':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            default:
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        }
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading your assessments...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-8 relative">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-bold tracking-tight">
                        Welcome back, {session?.user?.name?.split(' ')[0] || 'Candidate'}!
                    </h1>
                </div>
                {/* New Assessment Button */}
                <Button
                    onClick={() => setShowAssessmentModal(true)}
                    className="gap-2 shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                >
                    <Plus className="h-5 w-5" />
                    New Assessment
                </Button>
            </div>

            {/* Invitations Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">Your Assessments</h2>
                    <span className="text-sm text-muted-foreground">
                        {invitations.length} total
                    </span>
                </div>

                {invitations.length === 0 ? (
                    <Card className="p-12">
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                <Calendar className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">No invitations yet</h3>
                                <p className="text-muted-foreground max-w-md mx-auto">
                                    You haven't received any interview invitations yet. When recruiters send you assessments, they'll appear here.
                                </p>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {invitations.map((invite: any) => (
                            <Card key={invite._id} className="w-full hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                <Building2 className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{invite.companyName}</CardTitle>
                                                <CardDescription className="text-sm">{invite.role}</CardDescription>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full w-fit ${getStatusColor(invite.status)}`}>
                                        {invite.status}
                                    </span>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm text-muted-foreground font-medium">
                                        {invite.title}
                                    </p>
                                    <div className="space-y-2 pt-2 border-t">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span>Duration: {invite.assessment?.timeLimit || 60} mins</span>
                                        </div>
                                        {invite.assessment?.expiryDate && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                <span>Expires: {formatDate(invite.assessment.expiryDate)}</span>
                                            </div>
                                        )}
                                        {invite.status === 'completed' && invite.score !== undefined && (
                                            <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 mt-2">
                                                <Award className="h-4 w-4" />
                                                <span>Score: {invite.score}/100</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    {invite.status.toLowerCase() === 'pending' ? (
                                        <Link href={`/interview/new?invite=${invite._id}`} className="w-full">
                                            <Button className="w-full group">
                                                Start Assessment
                                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Button className="w-full" variant="secondary" disabled>
                                            Assessment Completed
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Assessment Code Modal */}
            {showAssessmentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md p-6 m-4 relative animate-in zoom-in-95 duration-200 border border-gray-100">
                        <button
                            onClick={() => setShowAssessmentModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                            disabled={verifying}
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="mb-6">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Enter Assessment Code
                            </h2>
                            <p className="text-gray-500 mt-2">
                                Enter the unique code provided by your recruiter to access the assessment.
                            </p>
                        </div>

                        <form onSubmit={handleVerifyCode} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Assessment Code</Label>
                                <Input
                                    id="code"
                                    placeholder="e.g. 8f3a2..."
                                    value={assessmentCode}
                                    onChange={(e) => setAssessmentCode(e.target.value)}
                                    className="text-lg tracking-wide font-mono"
                                    required
                                    disabled={verifying}
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-center gap-2">
                                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold h-11"
                                disabled={verifying || !assessmentCode}
                            >
                                {verifying ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Start Assessment"
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
