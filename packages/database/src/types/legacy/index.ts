// ============================================================================
// LEGACY TYPE COMPATIBILITY - For Gradual Migration
// ============================================================================
// This file provides backward compatibility during the transition period
// All these types will be removed once migration is complete

// Participant type aliases
export type { ParticipantInput as GamePlayerInput } from '../participants/index.js';
export type { ParticipantInput as GameParticipantInput } from '../participants/index.js';
export type { ParticipantResolved as GameParticipantResolved } from '../participants/index.js';
export type { ParticipantInput as PodPlayerForm } from '../participants/index.js';

// Pod type aliases (Game → Pod terminology fix)
export type { PodInput as CreateGameRequest_Legacy } from '../pods/index.js';
export type { PodInput as GameCreateInput } from '../pods/index.js';
export type { PodInput as GameInput } from '../pods/index.js';
export type { PodResolved as GameCreateResolved } from '../pods/index.js';
export type { PodResolved as GameResolved } from '../pods/index.js';
export type { PodResolved as CreatePodInput } from '../pods/index.js';
export type { PodInput as PodSubmission } from '../pods/index.js';
export type { PodDisplay as CreatedGame } from '../pods/index.js';
export type { PodDisplay as GameDisplay } from '../pods/index.js';

// Player type aliases
export type { PlayerInput as CreatePlayerInput } from '../players/index.js';
export type { PlayerInput as CreatePlayerRequest_Legacy } from '../players/index.js';

// League type aliases
export type { LeagueInput as CreateLeagueInput } from '../leagues/index.js';
export type { LeagueInput as CreateLeagueRequest_Legacy } from '../leagues/index.js';

// AI parsing aliases
export type { ParseRequest as AIParseRequest } from '../parsing/index.js';
export type { ParseResponse as AIParseResponse } from '../parsing/index.js';
export type { ParsedPodData as ParsedGameData } from '../parsing/index.js';

// Generic response alias
export type { ResponseBase as APIResponse } from '../common/base.js';

// Request aliases (Game → Pod)
export type { CreatePodRequest as CreateGameRequest } from '../requests/index.js';
export type { ListPodsRequest as ListGamesRequest } from '../requests/index.js';

// Response aliases (Game → Pod)  
export type { CreatePodResponse as CreateGameResponse } from '../responses/index.js';
export type { ListPodsResponse as ListGamesResponse } from '../responses/index.js';
