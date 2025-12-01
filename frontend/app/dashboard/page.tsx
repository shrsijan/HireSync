"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import RecruiterDashboard from "./recruiter/page"
import CandidateDashboard from "./candidate/page"

export default function DashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    if (status === "loading") {
        return <div>Loading...</div>
    }

    if (!session) {
        router.push("/login")
        return null
    }

    console.log("Current User Role:", session.user?.role)
    const role = session.user?.role

    if (role === "recruiter") {
        return <RecruiterDashboard />
    }

    return <CandidateDashboard />
}
