"use client"

import Link from "next/link"
import Image from "next/image"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const { data: session, status } = useSession()

  return (
    <nav className="border-b">
      <div className="container mx-auto flex h-16 items-center px-10">
        <Link href="/" className="mr-6" aria-label="Hiresync home">
          <Image
            src="/logo.svg"
            alt="Hiresync"
            width={120}
            height={28}
            sizes="120px"
            priority
          />
        </Link>

        {status === "authenticated" && (
          <div className="mx-6 flex items-center space-x-4 lg:space-x-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Dashboard
            </Link>
          </div>
        )}

        <div className="ml-auto flex items-center space-x-4">
          {status === "loading" ? (
            <div className="h-9 w-32" />
          ) : session ? (
            <Button
              variant="ghost"
              className="text-sm font-medium"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Logout
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="text-sm font-medium">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="text-sm font-medium">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
