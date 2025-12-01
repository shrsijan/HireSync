"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export default function SignupPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [companyName, setCompanyName] = useState("")
    const [role, setRole] = useState("candidate")
    const [error, setError] = useState("")

    useEffect(() => {
        const roleParam = searchParams.get("role")
        if (roleParam === "recruiter" || roleParam === "candidate") {
            setRole(roleParam)
        }
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        try {
            const API_URL = "http://localhost:5001/api"
            const res = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    role,
                    companyName: role === 'recruiter' ? companyName : undefined
                }),
            })

            const data = await res.json()

            if (res.ok) {
                // Auto-login after successful signup
                const result = await signIn("credentials", {
                    redirect: false,
                    email,
                    password,
                })

                if (result?.error) {
                    // Fallback to login page if auto-login fails
                    router.push("/login")
                } else {
                    router.push("/dashboard")
                }
            } else {
                setError(data.msg || "Signup failed")
            }
        } catch (err) {
            setError("An error occurred. Please try again.")
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Sign Up as {role === 'recruiter' ? 'Recruiter' : 'Candidate'}</CardTitle>
                    <CardDescription>Create a new account to get started.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            {role === 'recruiter' && (
                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="companyName">Company Name</Label>
                                    <Input
                                        id="companyName"
                                        placeholder="Acme Inc."
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        required
                                    />
                                </div>
                            )}
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    placeholder="name@example.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                        <Button className="w-full mt-6" type="submit">Sign Up</Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="text-primary hover:underline">
                            Login
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
