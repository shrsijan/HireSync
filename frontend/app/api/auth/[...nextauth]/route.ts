import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) return null;

                try {
                    // Import API_URL dynamically or use hardcoded
                    const API_URL = "http://localhost:5001/api";

                    const res = await fetch(`${API_URL}/auth/login`, {
                        method: 'POST',
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password
                        }),
                        headers: { "Content-Type": "application/json" }
                    })

                    console.log('NextAuth Response Status:', res.status);
                    const data = await res.json()
                    console.log('NextAuth Response Data:', data);

                    if (res.ok && data.token) {
                        return {
                            id: data.user.id,
                            email: data.user.email,
                            name: data.user.name,
                            role: data.user.role,
                            accessToken: data.token
                        }
                    }
                    console.log('NextAuth Login Failed:', data);
                    return null
                } catch (e) {
                    console.error('NextAuth Error:', e)
                    return null
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.role = user.role
                token.accessToken = user.accessToken
            }
            return token
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.role = token.role
                session.user.accessToken = token.accessToken
            }
            return session
        }
    },
    pages: {
        signIn: '/login',
    }
})

export { handler as GET, handler as POST }
