// ============================================================================
// TYPE UTILITIES - Conversion and Validation Helpers
// ============================================================================

import type {
	GameCreateInput,
	GameCreateResolved,
	GameParticipantInput,
	GameParticipantResolved,
	Player,
	// Legacy types for conversion
	CreatePodInput,
	PodSubmission,
	PodPlayerForm
} from './core';

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

export class GameTypeConverter {
	/**
	 * Convert legacy CreatePodInput to new GameCreateInput
	 */
	static fromCreatePodInput(input: CreatePodInput): GameCreateInput {
		return {
			league_id: input.league_id,
			date: input.date,
			game_length_minutes: input.game_length_minutes,
			turns: input.turns,
			notes: input.notes,
			participants: input.participants.map(p => ({
				discord_username: '', // Will need to be resolved from player_id
				commander_deck: p.commander_deck,
				result: p.result
			}))
		};
	}

	/**
	 * Convert legacy PodSubmission to new GameCreateInput
	 */
	static fromPodSubmission(submission: PodSubmission): GameCreateInput {
		return {
			league_id: submission.league_id,
			date: submission.date,
			game_length_minutes: submission.game_length_minutes,
			turns: submission.turns,
			notes: submission.notes,
			participants: submission.participants || []
		};
	}

	/**
	 * Convert new GameCreateInput to legacy CreatePodInput
	 * (for backward compatibility during transition)
	 */
	static toCreatePodInput(
		input: GameCreateInput,
		players: Player[]
	): CreatePodInput {
		const resolvedParticipants: GameParticipantResolved[] = [];

		for (const participant of input.participants) {
			const player = players.find(p =>
				p.discord_username === participant.discord_username ||
				p.name === participant.discord_username
			);

			if (!player) {
				throw new Error(`Player "${participant.discord_username}" not found`);
			}

			resolvedParticipants.push({
				player_id: player.id,
				commander_deck: participant.commander_deck,
				result: participant.result
			});
		}

		return {
			league_id: input.league_id,
			date: input.date,
			game_length_minutes: input.game_length_minutes,
			turns: input.turns,
			notes: input.notes,
			participants: resolvedParticipants
		};
	}

	/**
	 * Resolve participants by looking up players
	 */
	static async resolveParticipants(
		participants: GameParticipantInput[],
		playerLookup: (username: string) => Promise<Player | null>
	): Promise<GameParticipantResolved[]> {
		const resolved: GameParticipantResolved[] = [];

		for (const participant of participants) {
			const player = await playerLookup(participant.discord_username);

			if (!player) {
				throw new Error(`Player "${participant.discord_username}" not found`);
			}

			resolved.push({
				player_id: player.id,
				commander_deck: participant.commander_deck,
				result: participant.result
			});
		}

		return resolved;
	}
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

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

	static validateParticipant(participant: GameParticipantInput): string | null {
		if (!participant.discord_username) return 'Discord username is required';
		if (!participant.commander_deck) return 'Commander deck is required';
		if (!['win', 'lose', 'draw'].includes(participant.result)) {
			return 'Result must be win, lose, or draw';
		}
		return null; // Valid
	}
}

// ============================================================================
// BACKWARD COMPATIBILITY HELPERS
// ============================================================================

export function isPodPlayerForm(obj: any): obj is PodPlayerForm {
	return obj && typeof obj.discord_username === 'string' &&
		typeof obj.commander_deck === 'string' &&
		typeof obj.result === 'string';
}

export function isCreatePodInput(obj: any): obj is CreatePodInput {
	return obj && typeof obj.date === 'string' &&
		Array.isArray(obj.participants);
}

export function isPodSubmission(obj: any): obj is PodSubmission {
	return obj && typeof obj.date === 'string' &&
		Array.isArray(obj.participants);
}
