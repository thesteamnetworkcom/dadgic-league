// ============================================================================
// AI PARSING TYPES - For AIParsingService
// ============================================================================

import { ResponseBase, RequestBase } from '../common/base';
import { ParticipantInput } from '../participants';

export interface ParseRequest extends RequestBase {
	text: string;
	domain?: string;
}

export interface ParsedPodData {
	date?: string;
	game_length_minutes?: number; // Note: keeping game_length for DB compatibility
	turns?: number;
	notes?: string;
	participants: ParticipantInput[];
}

export interface ParseResponse<T = any> extends ResponseBase<T> {
	data?: T & {
		confidence: number;
		processing_time_ms: number;
	};
	conversationState?: {
		conversationId: string;
		originalText: string;
		parsedData: any;
		timestamp: string;
	};
}

// ============================================================================
// LEGACY COMPATIBILITY - Will be removed gradually
// ============================================================================

/** @deprecated Use ParseRequest instead */
export interface AIParseRequest extends ParseRequest { }

/** @deprecated Use ParseResponse instead */
export interface AIParseResponse extends ParseResponse { }

/** @deprecated Use ParsedPodData instead */
export interface ParsedGameData extends ParsedPodData { }
