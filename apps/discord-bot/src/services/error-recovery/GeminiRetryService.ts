import { parseWithAI } from '@dadgic/shared'
import type { AIParseResult } from '@dadgic/shared'

export class GeminiRetryService {
  private static readonly MAX_RETRIES = 3
  private static readonly RETRY_DELAYS = [1000, 2000, 4000] // Progressive backoff
  private static readonly TIMEOUT_MS = 15000 // 15 seconds

  static async parseWithRetry(text: string): Promise<AIParseResult> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        console.log(`🤖 Gemini attempt ${attempt + 1}/${this.MAX_RETRIES}`)
        
        // Create timeout promise
        const timeoutPromise = new Promise<AIParseResult>((_, reject) => {
          setTimeout(() => reject(new Error('Gemini API timeout')), this.TIMEOUT_MS)
        })

        // Race between actual API call and timeout
        const result = await Promise.race([
          parseWithAI(text),
          timeoutPromise
        ])

        if (result.success) {
          console.log(`✅ Gemini succeeded on attempt ${attempt + 1}`)
          return result
        } else {
          throw new Error(result.error || 'Gemini parsing failed')
        }
      } catch (error) {
        lastError = error as Error
        console.log(`❌ Gemini attempt ${attempt + 1} failed:`, lastError.message)

        // Don't delay after the last attempt
        if (attempt < this.MAX_RETRIES - 1) {
          const delay = this.RETRY_DELAYS[attempt]
          console.log(`⏱️ Retrying in ${delay}ms...`)
          await this.sleep(delay)
        }
      }
    }

    // All attempts failed
    console.error(`❌ Gemini failed after ${this.MAX_RETRIES} attempts:`, lastError?.message)
    return {
      success: false,
      error: `AI parsing failed after ${this.MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`
    }
  }

  static async parseWithFallback(
    text: string, 
    fallbackHandler?: (error: string) => Promise<any>
  ): Promise<AIParseResult | any> {
    const result = await this.parseWithRetry(text)
    
    if (!result.success && fallbackHandler) {
      console.log('🔄 Using fallback handler for failed Gemini parse')
      try {
        const fallbackResult = await fallbackHandler(result.error || 'Unknown error')
        return fallbackResult
      } catch (fallbackError) {
        console.error('❌ Fallback handler also failed:', fallbackError)
        return result // Return original Gemini failure
      }
    }
    
    return result
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  static isGeminiHealthy(): Promise<boolean> {
    // Quick health check with minimal text
    return this.parseWithRetry('test')
      .then(result => result.success)
      .catch(() => false)
  }
}
