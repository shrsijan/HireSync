"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function CandidateDashboard() {
    const { data: session } = useSession()
    // Mock invitations for now since we don't have the full invite flow connected to user account yet
    // In a real app, we'd fetch invites associated with the candidate's email
    const [invitations, setInvitations] = useState([
        {
            _id: "1",
            companyName: "Tech Corp",
            role: "Software Engineer",
            status: "pending",
            title: "Technical Assessment"
        }
    ])

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Candidate Dashboard</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {invitations.map((invite) => (
                    <Card key={invite._id} className="w-full">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                {invite.companyName}
                                <span className="text-xs font-normal px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                    {invite.status}
                                </span>
                            </CardTitle>
                            <CardDescription>{invite.role}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                {invite.title}
                            </p>
                            <div className="text-sm font-medium">
                                Duration: 60 mins
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Link href={`/interview/new?invite=${invite._id}`} className="w-full">
                                <Button className="w-full group">
                                    Start Assessment
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
