// Mock Supabase client for v0 preview environment
interface MockUser {
  id: string
  email: string
  user_metadata?: any
  app_metadata?: any
}

interface MockSession {
  user: MockUser
  access_token: string
}

// In-memory storage for mock data
const mockStorage = {
  users: new Map<string, any>(),
  profiles: new Map<string, any>(),
}

// Initialize with demo data
const demoUserId = "demo-user-123"
mockStorage.users.set("demo@swyft.com", {
  id: demoUserId,
  email: "demo@swyft.com",
  password: "demo123",
})

mockStorage.profiles.set(demoUserId, {
  id: demoUserId,
  email: "demo@swyft.com",
  company_name: "Swyft Properties Demo",
  contact_name: "Demo User",
  phone: "+254 700 000 000",
  role: "admin",
  created_at: new Date().toISOString(),
})

// Mock session storage
let currentSession: MockSession | null = null
const authListeners: Array<(event: string, session: MockSession | null) => void> = []

const mockAuth = {
  async getSession() {
    await new Promise((resolve) => setTimeout(resolve, 100))
    return { data: { session: currentSession }, error: null }
  },

  async getUser() {
    await new Promise((resolve) => setTimeout(resolve, 100))
    return { data: { user: currentSession?.user || null }, error: null }
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    await new Promise((resolve) => setTimeout(resolve, 800))

    const userData = mockStorage.users.get(email)
    if (!userData || userData.password !== password) {
      return {
        data: { user: null, session: null },
        error: { message: "Invalid email or password" },
      }
    }

    const user: MockUser = {
      id: userData.id,
      email: userData.email,
      user_metadata: {},
      app_metadata: {},
    }

    currentSession = {
      user,
      access_token: `mock-token-${Date.now()}`,
    }

    // Notify listeners
    authListeners.forEach((callback) => callback("SIGNED_IN", currentSession))

    return { data: { user, session: currentSession }, error: null }
  },

  async signUp({ email, password }: { email: string; password: string }) {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Check if user already exists
    if (mockStorage.users.has(email)) {
      return {
        data: { user: null, session: null },
        error: { message: "User already registered" },
      }
    }

    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const user: MockUser = {
      id: userId,
      email,
      user_metadata: {},
      app_metadata: {},
    }

    // Store user credentials
    mockStorage.users.set(email, {
      id: userId,
      email,
      password,
    })

    currentSession = {
      user,
      access_token: `mock-token-${Date.now()}`,
    }

    // Notify listeners
    authListeners.forEach((callback) => callback("SIGNED_IN", currentSession))

    return { data: { user, session: currentSession }, error: null }
  },

  async signOut() {
    await new Promise((resolve) => setTimeout(resolve, 200))
    currentSession = null

    // Notify listeners
    authListeners.forEach((callback) => callback("SIGNED_OUT", null))

    return { error: null }
  },

  onAuthStateChange(callback: (event: string, session: MockSession | null) => void) {
    authListeners.push(callback)

    // Simulate initial auth state
    setTimeout(() => {
      callback(currentSession ? "SIGNED_IN" : "SIGNED_OUT", currentSession)
    }, 100)

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = authListeners.indexOf(callback)
            if (index > -1) {
              authListeners.splice(index, 1)
            }
          },
        },
      },
    }
  },
}

const mockDatabase = {
  from(table: string) {
    return {
      select(columns = "*") {
        return {
          eq(column: string, value: any) {
            return {
              async single() {
                await new Promise((resolve) => setTimeout(resolve, 200))

                if (table === "users") {
                  const profile = mockStorage.profiles.get(value)
                  return { data: profile || null, error: profile ? null : { message: "Not found" } }
                }

                return { data: null, error: { message: "Not found" } }
              },
            }
          },
          async then(resolve: any) {
            await new Promise((r) => setTimeout(r, 200))
            const data = Array.from(mockStorage.profiles.values())
            return resolve({ data, error: null })
          },
        }
      },

      async insert(values: any) {
        await new Promise((resolve) => setTimeout(resolve, 300))

        if (table === "users") {
          mockStorage.profiles.set(values.id, {
            ...values,
            created_at: new Date().toISOString(),
          })
        }

        return { data: values, error: null }
      },

      update(values: any) {
        return {
          async eq(column: string, value: any) {
            await new Promise((resolve) => setTimeout(resolve, 200))

            if (table === "users") {
              const existing = mockStorage.profiles.get(value)
              if (existing) {
                mockStorage.profiles.set(value, { ...existing, ...values })
              }
            }

            return { data: values, error: null }
          },
        }
      },

      delete() {
        return {
          async eq(column: string, value: any) {
            await new Promise((resolve) => setTimeout(resolve, 200))

            if (table === "users") {
              mockStorage.profiles.delete(value)
            }

            return { data: null, error: null }
          },
        }
      },
    }
  },
}

export const supabase = {
  auth: mockAuth,
  from: mockDatabase.from.bind(mockDatabase),
}
