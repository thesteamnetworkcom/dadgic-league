// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

import type { GameCreateInput, GameParticipantInput } from '../types';

export class GameValidator {
  static validateGameInput(input: GameCreateInput): string | null {
    if (!input.date) return 'Date is required';
    if (!input.participants || input.participants.length < 2) {
      return 'At least 2 participants are required';
    }
    
    // Check for duplicate participants
    const usernames = input.participants.map(p => p.discord_username);
    const uniqueUsernames = new Set(usernames);
    if (usernames.length !== uniqueUsernames.size) {
      return 'Each participant can only appear once';
    }
    
    // Check participant data
    for (let i = 0; i < input.participants.length; i++) {
      const participant = input.participants[i];
      if (!participant.discord_username) {
        return `Participant ${i + 1} username is required`;
      }
      if (!participant.commander_deck) {
        return `Participant ${i + 1} commander deck is required`;
      }
    }
    
    // Validate results
    const winners = input.participants.filter(p => p.result === 'win');
    if (winners.length === 0) return 'At least one participant must win';
    if (winners.length > 1) return 'Only one participant can win per game';
    
    return null; // Valid
  }
}

// Legacy export
export const validate = GameValidator.validateGameInput;
