// app/login/page.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
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
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialRole =
    (searchParams.get("role") === "recruiter" ? "recruiter" : "candidate") as
      | "candidate"
      | "recruiter"

  const [role] = useState<"candidate" | "recruiter">(initialRole)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const dashboardPath =
    role === "recruiter"
      ? "/dashboard?role=recruiter"
      : "/dashboard?role=candidate"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    })

    if (result?.error) {
      setError("Invalid email or password")
    } else {
      router.push(dashboardPath)
    }
  }

  const handleOAuthSignIn = (provider: "google" | "github") => {
    signIn(provider, {
      callbackUrl: dashboardPath,
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Login as {role === "recruiter" ? "Recruiter" : "Candidate"}</CardTitle>
          <CardDescription>
            Choose a method below to log in to your account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Social Auth */}
          <div className="flex flex-col gap-3 mb-4">
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => handleOAuthSignIn("google")}
            >
              {/* Optional logo – only if you added /public/icons/google.svg */}
              {/* <Image src="/icons/google.svg" alt="Google" width={18} height={18} /> */}
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => handleOAuthSignIn("github")}
            >
              {/* <Image src="/icons/github.svg" alt="GitHub" width={18} height={18} /> */}
              Continue with GitHub
            </Button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or continue with email
              </span>
            </div>
          </div>

          {/* Email / password form */}
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
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
            {error && (
              <p className="text-sm text-red-500 mt-2">{error}</p>
            )}
            <Button className="w-full mt-6" type="submit">
              Login
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href={`/signup?role=${role}`}
              className="text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
