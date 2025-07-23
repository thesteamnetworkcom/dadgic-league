// ============================================================================
// AI PARSING SERVICE
// ============================================================================

import type { GameParseResult, GameParticipantInput } from '../types';

export interface AIParsingOptions {
  timeout?: number;
  retries?: number;
}

export class AIParsingService {
  static async parseGameText(
    text: string, 
    options: AIParsingOptions = {}
  ): Promise<GameParseResult> {
    // Implementation will be moved from existing ai-parser or created
    throw new Error('AIParsingService.parseGameText not implemented yet');
  }
}

// Legacy export for backward compatibility
export const parseWithAI = AIParsingService.parseGameText;
