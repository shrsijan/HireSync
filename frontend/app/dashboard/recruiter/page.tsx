"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Send, Trash2, Image as ImageIcon } from "lucide-react"

interface Question {
    title: string
    description: string
    image?: File | null
    timeLimit: number
    difficulty: "easy" | "medium" | "hard"
}

interface Assessment {
    _id: string
    title: string
    role: string
    timeLimit: number
    expiryDate: string
}

export default function RecruiterDashboard() {
    const { data: session } = useSession()
    const [assessments, setAssessments] = useState<Assessment[]>([])
    const [showCreate, setShowCreate] = useState(false)
    const [newAssessment, setNewAssessment] = useState({
        title: "",
        role: "",
        timeLimit: 60,
        expiryDate: ""
    })
    const [questions, setQuestions] = useState<Question[]>([])
    const [inviteEmail, setInviteEmail] = useState("")
    const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null)
    const [inviteStatus, setInviteStatus] = useState<string>("")

    useEffect(() => {
        fetchAssessments()
    }, [])

    const fetchAssessments = async () => {
        try {
            // @ts-ignore
            const token = session?.user?.accessToken || ""
            const res = await fetch("http://localhost:5001/api/assessments", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
            if (res.ok) {
                const data = await res.json()
                setAssessments(data)
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleAddQuestion = () => {
        setQuestions([...questions, {
            title: "",
            description: "",
            image: null,
            timeLimit: 15,
            difficulty: "medium"
        }])
    }

    const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
        const newQuestions = [...questions]
        // @ts-ignore
        newQuestions[index][field] = value
        setQuestions(newQuestions)
    }

    const handleRemoveQuestion = (index: number) => {
        const newQuestions = [...questions]
        newQuestions.splice(index, 1)
        setQuestions(newQuestions)
    }

    const handleCreateAssessment = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const formData = new FormData()
            formData.append('title', newAssessment.title)
            formData.append('role', newAssessment.role)
            formData.append('timeLimit', newAssessment.timeLimit.toString())
            formData.append('expiryDate', newAssessment.expiryDate)

            // Append questions as JSON string (excluding images)
            const questionsData = questions.map(q => ({
                title: q.title,
                description: q.description,
                timeLimit: q.timeLimit,
                difficulty: q.difficulty
            }))
            formData.append('questions', JSON.stringify(questionsData))

            // Append images
            questions.forEach((q, index) => {
                if (q.image) {
                    formData.append(`image_${index}`, q.image)
                }
            })

            // @ts-ignore
            const token = session?.user?.accessToken || ""
            const res = await fetch("http://localhost:5001/api/assessments", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                    // Content-Type is automatically set by browser for FormData
                },
                body: formData
            })

            if (res.ok) {
                setShowCreate(false)
                setNewAssessment({ title: "", role: "", timeLimit: 60, expiryDate: "" })
                setQuestions([])
                fetchAssessments()
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleInvite = async (assessmentId: string) => {
        try {
            setInviteStatus("Sending...")
            // @ts-ignore
            const token = session?.user?.accessToken || ""
            const res = await fetch("http://localhost:5001/api/invitations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    assessmentId,
                    email: inviteEmail
                })
            })

            if (res.ok) {
                const data = await res.json()
                setInviteStatus(`Sent! Preview: ${data.previewUrl}`)
                setInviteEmail("")
                setTimeout(() => setInviteStatus(""), 10000) // Clear after 10s
            } else {
                setInviteStatus("Failed to send")
            }
        } catch (err) {
            console.error(err)
            setInviteStatus("Error sending invite")
        }
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
                <Button onClick={() => setShowCreate(!showCreate)}>
                    <Plus className="mr-2 h-4 w-4" /> Create Assessment
                </Button>
            </div>

            {showCreate && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>New Assessment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateAssessment} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input
                                        value={newAssessment.title}
                                        onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                                        placeholder="e.g. Frontend Developer Assessment"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Input
                                        value={newAssessment.role}
                                        onChange={(e) => setNewAssessment({ ...newAssessment, role: e.target.value })}
                                        placeholder="e.g. Senior React Engineer"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Total Time Limit (minutes)</Label>
                                    <Input
                                        type="number"
                                        value={newAssessment.timeLimit}
                                        onChange={(e) => setNewAssessment({ ...newAssessment, timeLimit: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Expiry Date</Label>
                                    <Input
                                        type="date"
                                        value={newAssessment.expiryDate}
                                        onChange={(e) => setNewAssessment({ ...newAssessment, expiryDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">Questions</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion}>
                                        <Plus className="mr-2 h-4 w-4" /> Add Question
                                    </Button>
                                </div>

                                {questions.map((q, index) => (
                                    <Card key={index} className="p-4 relative">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                            onClick={() => handleRemoveQuestion(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <div className="grid gap-4">
                                            <div className="space-y-2">
                                                <Label>Question Title</Label>
                                                <Input
                                                    value={q.title}
                                                    onChange={(e) => handleQuestionChange(index, 'title', e.target.value)}
                                                    placeholder="e.g. Explain React Hooks"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Description</Label>
                                                <Textarea
                                                    value={q.description}
                                                    onChange={(e) => handleQuestionChange(index, 'description', e.target.value)}
                                                    placeholder="Detailed question description..."
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Time Limit (mins)</Label>
                                                    <Input
                                                        type="number"
                                                        value={q.timeLimit}
                                                        onChange={(e) => handleQuestionChange(index, 'timeLimit', parseInt(e.target.value))}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Image (Optional)</Label>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuestionChange(index, 'image', e.target.files?.[0] || null)}
                                                        />
                                                        {q.image && <ImageIcon className="h-4 w-4 text-green-500" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            <Button type="submit" className="w-full">Create Assessment</Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {assessments.length === 0 ? (
                    <p className="text-muted-foreground col-span-full text-center py-10">
                        No assessments created yet. Click "Create Assessment" to get started.
                    </p>
                ) : (
                    assessments.map((assessment) => (
                        <Card key={assessment._id}>
                            <CardHeader>
                                <CardTitle>{assessment.title}</CardTitle>
                                <CardDescription>{assessment.role}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="text-sm">
                                        <p>Time Limit: {assessment.timeLimit} mins</p>
                                        <p>Expires: {new Date(assessment.expiryDate).toLocaleDateString()}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Candidate Email"
                                                value={selectedAssessment === assessment._id ? inviteEmail : ""}
                                                onChange={(e) => {
                                                    setSelectedAssessment(assessment._id)
                                                    setInviteEmail(e.target.value)
                                                    setInviteStatus("")
                                                }}
                                            />
                                            <Button size="icon" onClick={() => handleInvite(assessment._id)}>
                                                <Send className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        {selectedAssessment === assessment._id && inviteStatus && (
                                            <p className="text-xs text-muted-foreground break-all">{inviteStatus}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
