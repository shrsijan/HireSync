"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Calendar, Clock, Building2, TrendingUp, Award, CheckCircle2 } from "lucide-react"

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
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        completed: 0,
        upcoming: 0
    })

    useEffect(() => {
        fetchInvitations()
    }, [session])

    const fetchInvitations = async () => {
        try {
            // @ts-ignore
            const token = session?.user?.accessToken || ""
            const email = session?.user?.email || ""

            const res = await fetch(`http://localhost:5001/api/invitations/candidate/${email}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })

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
                // Fallback to mock data if API fails
                setInvitations([
                    {
                        _id: "1",
                        companyName: "Tech Corp",
                        role: "Software Engineer",
                        status: "pending",
                        title: "Technical Assessment",
                        assessment: {
                            timeLimit: 60,
                            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                        },
                        createdAt: new Date().toISOString()
                    }
                ])
                setStats({ total: 1, pending: 1, completed: 0, upcoming: 1 })
            }
        } catch (err) {
            console.error("Error fetching invitations:", err)
            // Use mock data on error
            setInvitations([
                {
                    _id: "1",
                    companyName: "Tech Corp",
                    role: "Software Engineer",
                    status: "pending",
                    title: "Technical Assessment",
                    assessment: {
                        timeLimit: 60,
                        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                    },
                    createdAt: new Date().toISOString()
                }
            ])
            setStats({ total: 1, pending: 1, completed: 0, upcoming: 1 })
        } finally {
            setLoading(false)
        }
    }

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
        <div className="container mx-auto p-6 space-y-8">
            {/* Welcome Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold tracking-tight">
                    Welcome back, {session?.user?.name?.split(' ')[0] || 'Candidate'}!
                </h1>
                <p className="text-muted-foreground text-lg">
                    Track your interview invitations and start your technical assessments
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Invitations</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.upcoming}</div>
                        <p className="text-xs text-muted-foreground">Pending assessments</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.completed}</div>
                        <p className="text-xs text-muted-foreground">Finished assessments</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">Completion rate</p>
                    </CardContent>
                </Card>
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
                        {invitations.map((invite) => (
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
                                        <Button className="w-full" variant="outline" disabled>
                                            {invite.status === 'completed' ? 'Completed' : 'Not Available'}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
