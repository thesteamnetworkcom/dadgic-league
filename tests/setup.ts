import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.DISCORD_CLIENT_ID = 'test-client-id'
process.env.DISCORD_CLIENT_SECRET = 'test-client-secret'
process.env.GEMINI_API_KEY = 'test-gemini-key'

// Mock your actual Supabase client path
vi.mock('@dadgic/database/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis()
    }))
  }
}))

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/'
  }))
}))

// Mock Discord.js with more complete mocking
vi.mock('discord.js', () => ({
  Client: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    login: vi.fn(),
    user: { id: 'bot-id' },
    ws: { ping: 50 }
  })),
  GatewayIntentBits: {
    Guilds: 1,
    GuildMessages: 2,
    MessageContent: 4
  },
  Events: {
    Ready: 'ready',
    InteractionCreate: 'interactionCreate'
  },
  SlashCommandBuilder: vi.fn().mockImplementation(() => ({
    setName: vi.fn().mockReturnThis(),
    setDescription: vi.fn().mockReturnThis(),
    addStringOption: vi.fn().mockReturnThis(),
    addUserOption: vi.fn().mockReturnThis()
  }))
}))

// Mock Gemini AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({ 
            players: [
              { name: 'Test Player', commander: 'Test Commander', result: 'win' }
            ]
          })
        }
      })
    })
  }))
}))

// Global test utilities
global.fetch = vi.fn()

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks()
})
