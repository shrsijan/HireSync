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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
    const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null)

    // Manual Invite State
    const [inviteEmail, setInviteEmail] = useState("")
    const [showInviteModal, setShowInviteModal] = useState(false) // Toggle invite section
    const [activeTab, setActiveTab] = useState("manual")

    // Bulk Invite State
    const [bulkFile, setBulkFile] = useState<File | null>(null)
    const [uploadStatus, setUploadStatus] = useState("")
    const [generatedInvites, setGeneratedInvites] = useState<any[]>([])

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

    const handleManualInvite = async () => {
        if (!selectedAssessment) return;
        try {
            // @ts-ignore
            const token = session?.user?.accessToken || ""
            const res = await fetch("http://localhost:5001/api/invitations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    assessmentId: selectedAssessment,
                    email: inviteEmail
                })
            })

            if (res.ok) {
                const data = await res.json()
                // Append to generated invites list for consistency
                setGeneratedInvites(prev => [{
                    email: inviteEmail,
                    token: data.token,
                    firstName: "-",
                    lastName: "-"
                }, ...prev])
                setInviteEmail("")
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleBulkUpload = async () => {
        if (!selectedAssessment || !bulkFile) return;

        try {
            setUploadStatus("Uploading...")
            const formData = new FormData()
            formData.append('file', bulkFile)
            formData.append('assessmentId', selectedAssessment)

            // @ts-ignore
            const token = session?.user?.accessToken || ""
            const res = await fetch("http://localhost:5001/api/invitations/bulk", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            })

            if (res.ok) {
                const data = await res.json()
                setGeneratedInvites(prev => [...data.invitations, ...prev])
                setUploadStatus(`Success! Generated ${data.count} codes.`)
                setBulkFile(null)
            } else {
                setUploadStatus("Upload failed")
            }
        } catch (err) {
            console.error(err)
            setUploadStatus("Error uploading file")
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

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                {assessments.length === 0 ? (
                    <p className="text-muted-foreground col-span-full text-center py-10">
                        No assessments created yet. Click "Create Assessment" to get started.
                    </p>
                ) : (
                    assessments.map((assessment) => (
                        <Card
                            key={assessment._id}
                            className={`cursor-pointer transition-all ${selectedAssessment === assessment._id ? 'border-primary ring-2 ring-primary/20' : ''}`}
                            onClick={() => {
                                setSelectedAssessment(assessment._id)
                                setShowInviteModal(true)
                                setGeneratedInvites([]) // Clear previous session results
                            }}
                        >
                            <CardHeader>
                                <CardTitle>{assessment.title}</CardTitle>
                                <CardDescription>{assessment.role}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm">
                                    <p>Time Limit: {assessment.timeLimit} mins</p>
                                    <p>Expires: {new Date(assessment.expiryDate).toLocaleDateString()}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Invite Generation Section */}
            {selectedAssessment && showInviteModal && (
                <Card className="mb-8 border-2">
                    <CardHeader>
                        <CardTitle>Generate Invitations</CardTitle>
                        <CardDescription>Select an assessment above and choose a method to generate access codes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="manual" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                                <TabsTrigger value="bulk">Bulk Upload (CSV)</TabsTrigger>
                            </TabsList>

                            <TabsContent value="manual" className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Candidate Email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                    />
                                    <Button onClick={handleManualInvite} disabled={!inviteEmail}>
                                        <Plus className="mr-2 h-4 w-4" /> Generate Code
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="bulk" className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Upload CSV (FirstName, LastName, Email)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="file"
                                            accept=".csv"
                                            onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                                        />
                                        <Button onClick={handleBulkUpload} disabled={!bulkFile}>
                                            Upload & Generate
                                        </Button>
                                    </div>
                                    {uploadStatus && <p className="text-sm text-muted-foreground">{uploadStatus}</p>}
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Results Table */}
                        {generatedInvites.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold mb-4">Generated Access Codes</h3>
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Access Code</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {generatedInvites.map((invite, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>{invite.email}</TableCell>
                                                    <TableCell>{invite.firstName} {invite.lastName}</TableCell>
                                                    <TableCell className="font-mono font-bold text-primary">{invite.token}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
