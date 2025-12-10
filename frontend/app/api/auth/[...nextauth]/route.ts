// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GithubProvider from "next-auth/providers/github"

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const API_URL = "http://localhost:5001/api"

          const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            headers: { "Content-Type": "application/json" },
          })

          console.log("NextAuth Response Status:", res.status)
          const data = await res.json()
          console.log("NextAuth Response Data:", data)

          if (res.ok && data.token) {
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              role: data.user.role,
              accessToken: data.token,
            }
          }
          console.log("NextAuth Login Failed:", data)
          return null
        } catch (e) {
          console.error("NextAuth Error:", e)
          return null
        }
      },
    }),

    // 🔹 Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),

    // 🔹 GitHub OAuth
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }: any) {
      // For credentials login
      if (user && user.role) {
        token.role = user.role
      }
      if (user && user.accessToken) {
        token.accessToken = user.accessToken
      }

      // For OAuth (Google / GitHub), keep the provider access token if you need it
      if (account && account.access_token) {
        token.providerAccessToken = account.access_token
      }

      // Optional: default role for OAuth users if you want
      // if (!token.role) token.role = "candidate"

      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        ;(session.user as any).role = token.role
        ;(session.user as any).accessToken = token.accessToken
        ;(session.user as any).providerAccessToken = token.providerAccessToken
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})

export { handler as GET, handler as POST }
