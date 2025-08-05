// ============================================================================
// LEGACY TYPE COMPATIBILITY - For Gradual Migration
// ============================================================================
// This file provides backward compatibility during the transition period
// All these types will be removed once migration is complete

// Participant type aliases
export type { ParticipantInput as GamePlayerInput } from '../participants';
export type { ParticipantInput as GameParticipantInput } from '../participants';
export type { ParticipantResolved as GameParticipantResolved } from '../participants';
export type { ParticipantInput as PodPlayerForm } from '../participants';

// Pod type aliases (Game → Pod terminology fix)
export type { PodInput as CreateGameRequest_Legacy } from '../pods';
export type { PodInput as GameCreateInput } from '../pods';
export type { PodInput as GameInput } from '../pods';
export type { PodResolved as GameCreateResolved } from '../pods';
export type { PodResolved as GameResolved } from '../pods';
export type { PodResolved as CreatePodInput } from '../pods';
export type { PodInput as PodSubmission } from '../pods';
export type { PodDisplay as CreatedGame } from '../pods';
export type { PodDisplay as GameDisplay } from '../pods';

// Player type aliases
export type { PlayerInput as CreatePlayerInput } from '../players';
export type { PlayerInput as CreatePlayerRequest_Legacy } from '../players';

// League type aliases
export type { LeagueInput as CreateLeagueInput } from '../leagues';
export type { LeagueInput as CreateLeagueRequest_Legacy } from '../leagues';

// AI parsing aliases
export type { ParseRequest as AIParseRequest } from '../parsing';
export type { ParseResponse as AIParseResponse } from '../parsing';
export type { ParsedPodData as ParsedGameData } from '../parsing';

// Generic response alias
export type { ResponseBase as APIResponse } from '../common/base';

// Request aliases (Game → Pod)
export type { CreatePodRequest as CreateGameRequest } from '../requests';
export type { ListPodsRequest as ListGamesRequest } from '../requests';

// Response aliases (Game → Pod)  
export type { CreatePodResponse as CreateGameResponse } from '../responses';
export type { ListPodsResponse as ListGamesResponse } from '../responses';
