"use client"

import Link from "next/link"
import Image from "next/image"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import Logo from "@/public/logo.svg";

export function Navbar() {
    const { data: session } = useSession()

    return (
        <nav className="border-b">
            <div className="flex h-16 items-center px-10 container mx-auto">
                <Link href="/" className="mr-6">
                    <Image src={Logo} alt="Logo" width={300} height={300} />
                </Link>

                {session && (
                    <div className="flex items-center space-x-4 lg:space-x-6 mx-6">
                        <Link
                            href="/dashboard"
                            className="text-sm font-medium transition-colors hover:text-primary"
                        >
                            Dashboard
                        </Link>
                    </div>
                )}
                <div className="ml-auto flex items-center space-x-4">
                    {session ? (
                        <Button
                            variant="ghost"
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="text-sm font-medium"
                        >
                            Logout
                        </Button>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost" className="text-sm font-medium">
                                    Login
                                </Button>
                            </Link>
                            <Link href="/signup">
                                <Button className="text-sm font-medium">
                                    Sign Up
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}
