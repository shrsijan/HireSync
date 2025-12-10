// app/recruiter/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Send, Trash2, Image as ImageIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null)

  // Manual Invite State
  const [inviteEmail, setInviteEmail] = useState("")
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [activeTab, setActiveTab] = useState("manual")

  // Bulk Invite State
  const [bulkFile, setBulkFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState("")
  const [generatedInvites, setGeneratedInvites] = useState<any[]>([])

  // Create assessment status
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const API_URL =
    process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5001/api"

  useEffect(() => {
    fetchAssessments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchAssessments = async () => {
    try {
      // @ts-ignore
      const token = session?.user?.accessToken || ""
      const res = await fetch(`${API_URL}/assessments`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setAssessments(data)
      } else {
        console.error("Failed to fetch assessments:", await res.text())
      }
    } catch (err) {
      console.error("Error fetching assessments:", err)
    }
  }

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        title: "",
        description: "",
        image: null,
        timeLimit: 15,
        difficulty: "medium"
      }
    ])
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
    setSubmitting(true)
    setSubmitError("")

    try {
      // @ts-ignore
      const token = session?.user?.accessToken || ""

      if (!token) {
        setSubmitError(
          "Missing access token. Make sure you are logged in with an account that has API access (usually email/password for now)."
        )
        return
      }

      const formData = new FormData()
      formData.append("title", newAssessment.title)
      formData.append("role", newAssessment.role)
      formData.append("timeLimit", newAssessment.timeLimit.toString())
      formData.append("expiryDate", newAssessment.expiryDate)

      const questionsData = questions.map(q => ({
        title: q.title,
        description: q.description,
        timeLimit: q.timeLimit,
        difficulty: q.difficulty
      }))
      formData.append("questions", JSON.stringify(questionsData))

      questions.forEach((q, index) => {
        if (q.image) {
          formData.append(`image_${index}`, q.image)
        }
      })

      const res = await fetch(`${API_URL}/assessments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
          // Content-Type is automatically set for FormData
        },
        body: formData
      })

      if (res.ok) {
        setShowCreate(false)
        setNewAssessment({ title: "", role: "", timeLimit: 60, expiryDate: "" })
        setQuestions([])
        await fetchAssessments()
      } else {
        const text = await res.text()
        console.error("Failed to create assessment:", text)
        setSubmitError(
          "Failed to create assessment. Check the console/network tab for details."
        )
      }
    } catch (err) {
      console.error("Error creating assessment:", err)
      setSubmitError("Error creating assessment. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleManualInvite = async () => {
    if (!selectedAssessment) return
    try {
      // @ts-ignore
      const token = session?.user?.accessToken || ""
      const res = await fetch(`${API_URL}/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          assessmentId: selectedAssessment,
          email: inviteEmail
        })
      })

      if (res.ok) {
        const data = await res.json()
        setGeneratedInvites(prev => [
          {
            email: inviteEmail,
            token: data.token,
            firstName: "-",
            lastName: "-"
          },
          ...prev
        ])
        setInviteEmail("")
      } else {
        console.error("Failed to create invitation:", await res.text())
      }
    } catch (err) {
      console.error("Error creating invitation:", err)
    }
  }

  const handleBulkUpload = async () => {
    if (!selectedAssessment || !bulkFile) return

    try {
      setUploadStatus("Uploading...")
      const formData = new FormData()
      formData.append("file", bulkFile)
      formData.append("assessmentId", selectedAssessment)

      // @ts-ignore
      const token = session?.user?.accessToken || ""
      const res = await fetch(`${API_URL}/invitations/bulk`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
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
        console.error("Bulk upload failed:", await res.text())
      }
    } catch (err) {
      console.error("Error during bulk upload:", err)
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
                    onChange={e =>
                      setNewAssessment({ ...newAssessment, title: e.target.value })
                    }
                    placeholder="e.g. Frontend Developer Assessment"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input
                    value={newAssessment.role}
                    onChange={e =>
                      setNewAssessment({ ...newAssessment, role: e.target.value })
                    }
                    placeholder="e.g. Senior React Engineer"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Time Limit (minutes)</Label>
                  <Input
                    type="number"
                    value={newAssessment.timeLimit}
                    onChange={e =>
                      setNewAssessment({
                        ...newAssessment,
                        timeLimit: parseInt(e.target.value || "0", 10)
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={newAssessment.expiryDate}
                    onChange={e =>
                      setNewAssessment({
                        ...newAssessment,
                        expiryDate: e.target.value
                      })
                    }
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
                          onChange={e => handleQuestionChange(index, "title", e.target.value)}
                          placeholder="e.g. Explain React Hooks"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={q.description}
                          onChange={e =>
                            handleQuestionChange(index, "description", e.target.value)
                          }
                          placeholder="Detailed question description..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Time Limit (mins)</Label>
                          <Input
                            type="number"
                            value={q.timeLimit}
                            onChange={e =>
                              handleQuestionChange(
                                index,
                                "timeLimit",
                                parseInt(e.target.value || "0", 10)
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Image (Optional)</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) =>
                                handleQuestionChange(
                                  index,
                                  "image",
                                  e.target.files?.[0] || null
                                )
                              }
                            />
                            {q.image && (
                              <ImageIcon className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {submitError && (
                <p className="text-sm text-red-500">{submitError}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create Assessment"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Existing assessment cards + invite section remain unchanged */}
      {/* ... KEEP YOUR REST OF COMPONENT HERE (assessments list, invite section, etc.) ... */}
      {/* I truncated here to keep the message shorter – you can paste the bottom of your original file after this point, or ask me to re-send the whole thing including the invite section. */}
    </div>
  )
}
