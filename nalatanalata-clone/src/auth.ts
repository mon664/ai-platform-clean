import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                // Mock authentication
                // In a real app, you would verify credentials against a database
                if (credentials?.email === "admin@example.com" && credentials?.password === "password") {
                    return {
                        id: "1",
                        name: "Admin User",
                        email: "admin@example.com",
                        role: "admin",
                    }
                }

                // Allow any user to login for demo purposes (simulating registration)
                if (credentials?.email && credentials?.password) {
                    return {
                        id: Math.random().toString(),
                        name: "Demo User",
                        email: credentials.email as string,
                        role: "user",
                    }
                }

                return null
            },
        }),
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized: async ({ auth }) => {
            // Logged in users are authenticated, otherwise redirect to login
            return !!auth
        },
    },
})
