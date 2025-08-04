// apps/discord-bot/src/services/ConversationManager.ts
import type { ParsedPodData } from '@dadgic/shared'

export interface ConversationState {
  conversationId: string
  userId: string
  originalInput: string
  parsedData: ParsedPodData
  resolvedPlayers: ResolvedPlayer[]
  missingData: MissingDataInfo
  timestamp: number
}

export interface ResolvedPlayer {
  name: string
  player_id: string | null
  discord_username: string | null
  commander: string | null
  result: 'win' | 'lose' | 'draw'
  confidence: number
}

export interface MissingDataInfo {
  commanders: string[]
  gameLength: boolean
  turns: boolean
  notes: boolean
  players: string[] // Players that couldn't be resolved
}

export class ConversationManager {
  private static conversations = new Map<string, ConversationState>()
  private static readonly TTL = 15 * 60 * 1000 // 15 minutes
  private static cleanupInterval: NodeJS.Timeout | null = null

  /**
   * Create a new conversation
   */
  static create(userId: string, originalInput: string): string {
    const conversationId = `${userId}-${Date.now()}`
    
    const conversation: ConversationState = {
      conversationId,
      userId,
      originalInput,
      parsedData: {} as ParsedPodData,
      resolvedPlayers: [],
      missingData: {
        commanders: [],
        gameLength: false,
        turns: false,
        notes: false,
        players: []
      },
      timestamp: Date.now()
    }

    this.conversations.set(conversationId, conversation)
    this.ensureCleanupRunning()
    
    console.log(`💬 Created conversation ${conversationId} for user ${userId}`)
    return conversationId
  }

  /**
   * Get conversation by ID
   */
  static get(conversationId: string): ConversationState | null {
    const conversation = this.conversations.get(conversationId)
    
    if (!conversation) {
      return null
    }

    // Check if expired
    if (Date.now() - conversation.timestamp > this.TTL) {
      this.conversations.delete(conversationId)
      console.log(`⏰ Conversation ${conversationId} expired and removed`)
      return null
    }

    return conversation
  }

  /**
   * Update conversation data
   */
  static update(conversationId: string, updates: Partial<ConversationState>): boolean {
    const conversation = this.get(conversationId)
    if (!conversation) {
      return false
    }

    const updated = {
      ...conversation,
      ...updates,
      timestamp: Date.now() // Refresh timestamp
    }

    this.conversations.set(conversationId, updated)
    console.log(`📝 Updated conversation ${conversationId}`)
    return true
  }

  /**
   * Delete conversation
   */
  static delete(conversationId: string): boolean {
    const deleted = this.conversations.delete(conversationId)
    if (deleted) {
      console.log(`🗑️ Deleted conversation ${conversationId}`)
    }
    return deleted
  }

  /**
   * Get conversation by user ID (latest)
   */
  static getByUserId(userId: string): ConversationState | null {
    for (const conversation of this.conversations.values()) {
      if (conversation.userId === userId) {
        // Return the most recent one
        return this.get(conversation.conversationId)
      }
    }
    return null
  }

  /**
   * Clean up expired conversations
   */
  static cleanup(): number {
    const now = Date.now()
    let cleanedCount = 0

    for (const [id, conversation] of this.conversations.entries()) {
      if (now - conversation.timestamp > this.TTL) {
        this.conversations.delete(id)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired conversations`)
    }

    return cleanedCount
  }

  /**
   * Start automatic cleanup
   */
  private static ensureCleanupRunning(): void {
    if (!this.cleanupInterval) {
      this.cleanupInterval = setInterval(() => {
        this.cleanup()
      }, 5 * 60 * 1000) // Every 5 minutes

      console.log('🕐 Conversation cleanup timer started')
    }
  }

  /**
   * Stop cleanup timer (for shutdown)
   */
  static stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
      console.log('⏹️ Conversation cleanup timer stopped')
    }
  }

  /**
   * Get stats for monitoring
   */
  static getStats(): {
    total: number
    active: number
    expired: number
  } {
    const now = Date.now()
    let active = 0
    let expired = 0

    for (const conversation of this.conversations.values()) {
      if (now - conversation.timestamp > this.TTL) {
        expired++
      } else {
        active++
      }
    }

    return {
      total: this.conversations.size,
      active,
      expired
    }
  }
}