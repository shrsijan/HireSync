// app/dashboard/page.tsx
"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import RecruiterDashboard from "./recruiter/page"
import CandidateDashboard from "./candidate/page"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (!session) {
    router.push("/login")
    return null
  }

  const sessionRole = (session.user as any)?.role as "candidate" | "recruiter" | undefined
  const urlRole = searchParams.get("role") as "candidate" | "recruiter" | null

  // 🧠 Priority:
  // 1. backend role (credentials login)
  // 2. role from URL (?role=...)
  // 3. default candidate
  const role = sessionRole || urlRole || "candidate"

  if (role === "recruiter") {
    return <RecruiterDashboard />
  }

  return <CandidateDashboard />
}
