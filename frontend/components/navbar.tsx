// components/navbar.tsx
"use client"

import Link from "next/link"
import Image from "next/image"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const { data: session, status } = useSession()

  return (
    <nav className="border-b">
      <div className="container mx-auto relative flex h-24 items-center px-10">

        {/* Logo (left) */}
        <Link
          href="/"
          className="mr-8 flex items-center"
          aria-label="Hiresync home"
        >
          <Image
            src="/logo.svg"
            alt="Hiresync"
            width={350}
            height={150}
            priority
          />
        </Link>

        {/* Dashboard (true center) */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link
            href="/dashboard"
            className="text-xl font-semibold hover:underline"
          >
            Dashboard
          </Link>
        </div>

        {/* Right side (Login / Logout) */}
        <div className="ml-auto flex items-center space-x-6">
          {status === "loading" ? (
            <div className="h-9 w-32" />
          ) : session ? (
            <Button
              variant="ghost"
              className="text-lg font-bold mt-1.5"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Logout
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                className="text-base font-medium mt-1.5"
              >
                <Link href="/login">Login</Link>
              </Button>

              <Button
                asChild
                className="text-base font-medium mt-1.5"
              >
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

      </div>
    </nav>
  )
}
