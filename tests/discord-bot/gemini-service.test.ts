import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the Gemini AI at the right level - your ai-parser.ts uses GoogleGenerativeAI
const mockGenerateContent = vi.fn()
const mockResponse = {
  response: {
    text: vi.fn()
  }
}

// Mock Google's Gemini AI service properly
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: mockGenerateContent
    })
  }))
}))

// Mock environment variable that your GeminiService constructor needs
beforeEach(() => {
  process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'test-gemini-key'
  vi.clearAllMocks()
})

describe('Gemini AI Service', () => {
  it('should import parseWithAI function correctly', async () => {
    // Test that we can import your actual function
    const { parseWithAI } = await import('@dadgic/shared')
    
    expect(parseWithAI).toBeDefined()
    expect(typeof parseWithAI).toBe('function')
  })

  it('should parse valid game description with mocked response', async () => {
    const gameText = "Alice won with Atraxa, Bob second with Krenko, Charlie third with Meren"
    
    // Mock the AI response in the format your code expects
    const mockResponseText = JSON.stringify({
      date: "2025-07-21",
      players: [
        { name: 'Alice', commander: 'Atraxa', result: 'win' },
        { name: 'Bob', commander: 'Krenko', result: 'lose' },
        { name: 'Charlie', commander: 'Meren', result: 'lose' }
      ]
    })

    // Set up the mock chain properly
    mockResponse.response.text.mockReturnValue(mockResponseText)
    mockGenerateContent.mockResolvedValue(mockResponse)

    // Import and call your actual parseWithAI function
    const { parseWithAI } = await import('@dadgic/shared')
    
    const result = await parseWithAI(gameText)
    
    // Check that your parseWithAI function was called
    expect(mockGenerateContent).toHaveBeenCalled()
    
    // Check the result structure matches your AIParseResult interface
    expect(result).toHaveProperty('success')
    expect(result.success).toBe(true)
    expect(result).toHaveProperty('data')
    expect(result.data?.players).toBeDefined()
  })

  it('should handle API failures gracefully', async () => {
    const gameText = "Some game description"
    
    // Mock API failure
    mockGenerateContent.mockRejectedValue(new Error('API timeout'))

    const { parseWithAI } = await import('@dadgic/shared')
    
    const result = await parseWithAI(gameText)
    
    // Your parseWithAI should return { success: false } on error
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(mockGenerateContent).toHaveBeenCalled()
  })

  it('should handle malformed JSON responses', async () => {
    const gameText = "Alice won with Atraxa"
    
    // Mock response with invalid JSON
    mockResponse.response.text.mockReturnValue('invalid json response')
    mockGenerateContent.mockResolvedValue(mockResponse)

    const { parseWithAI } = await import('@dadgic/shared')
    
    const result = await parseWithAI(gameText)
    
    // Should handle parsing error gracefully
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should test the prompt building concept', async () => {
    const gameText = "Scott beat everyone with Teysa"
    
    // Mock successful response
    const mockResponseText = JSON.stringify({
      date: "2025-07-21",
      players: [
        { name: 'Scott', commander: 'Teysa, Orzhov Scion', result: 'win' }
      ]
    })

    mockResponse.response.text.mockReturnValue(mockResponseText)
    mockGenerateContent.mockResolvedValue(mockResponse)

    const { parseWithAI } = await import('@dadgic/shared')
    
    await parseWithAI(gameText)
    
    // Check that the prompt was built with the game text
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.stringContaining(gameText)
    )
  })

  it('should test confidence calculation works', async () => {
    const gameText = "Detailed game: Alice won with Atraxa after 120 minutes and 15 turns"
    
    // Mock detailed response that should have high confidence
    const mockResponseText = JSON.stringify({
      date: "2025-07-21",
      game_length_minutes: 120,
      turns: 15,
      players: [
        { name: 'Alice', commander: 'Atraxa', result: 'win' },
        { name: 'Bob', commander: 'Krenko', result: 'lose' },
        { name: 'Charlie', commander: 'Meren', result: 'lose' },
        { name: 'Diana', commander: 'Urza', result: 'lose' }
      ],
      notes: "Great game!"
    })

    mockResponse.response.text.mockReturnValue(mockResponseText)
    mockGenerateContent.mockResolvedValue(mockResponse)

    const { parseWithAI } = await import('@dadgic/shared')
    
    const result = await parseWithAI(gameText)
    
    // Should have higher confidence due to complete data
    expect(result.confidence).toBeGreaterThan(0.7)
  })
})
