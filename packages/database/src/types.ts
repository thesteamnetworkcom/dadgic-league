// packages/database/src/types.ts

export interface Player {
  id: string;
  name: string;
  discord_id: string | null;
  discord_username: string | null;
  email: string | null;
  role: 'player' | 'admin'; // ADD THIS LINE
  created_at: string;
  updated_at: string;
}

export interface League {
  id: string;
  name: string;
  description: string | null;
  player_ids: string[];
  start_date: string;
  end_date: string | null;
  status: 'draft' | 'active' | 'completed'; // ADD THIS LINE
  games_per_player: number | null; // ADD THIS LINE
  created_at: string;
}

export interface Pod {
  id: string;
  league_id: string | null;
  date: string;
  game_length_minutes: number | null;
  turns: number | null;
  winning_commander: string | null;
  participant_count: number;
  notes: string | null;
  created_at: string;
}

export interface PodParticipant {
  id: string;
  pod_id: string;
  player_id: string;
  commander_deck: string;
  result: 'win' | 'lose' | 'draw';
  created_at: string;
}

export interface ScheduledPod {
  id: string;
  league_id: string;
  player_ids: string[];
  completed_pod_id: string | null;
  created_at: string;
}

// Extended types for common queries
export interface PodWithParticipants extends Pod {
  participants: (PodParticipant & { player: Player })[];
}

export interface LeagueWithProgress extends League {
  scheduled_pods: ScheduledPod[];
  completed_count: number;
  total_count: number;
}

export interface PlayerStats {
  player_id: string;
  player_name: string;
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  favorite_commanders: string[];
}

// Input types for creating/updating
export interface CreatePodInput {
  league_id?: string;
  date: string;
  game_length_minutes?: number;
  turns?: number;
  winning_commander?: string;
  notes?: string;
  participants: {
    player_id: string;
    commander_deck: string;
    result: 'win' | 'lose' | 'draw';
  }[];
}

export interface CreateLeagueInput {
  name: string;
  description?: string;
  player_ids: string[];
  start_date: string;
  end_date?: string;
}

export interface UpdatePodInput {
  date?: string;
  game_length_minutes?: number;
  turns?: number;
  winning_commander?: string;
  notes?: string;
}

export interface PodReportForm {
  date: string
  players: PodPlayerForm[]
  game_length_minutes?: number
  turns?: number
  notes?: string
}

export interface PodPlayerForm {
  discord_username: string
  commander_deck: string
  result: 'win' | 'lose' | 'draw'
}

export interface PodSubmission {
  league_id?: string | null
  date: string
  game_length_minutes: number | null
  turns: number | null
  notes: string | null
  participants: {
    player_id: string
    commander_deck: string
    result: 'win' | 'lose' | 'draw'
  }[]
}

// ADD this new interface for the league progress view
export interface LeagueProgress {
  league_id: string;
  league_name: string;
  status: string;
  games_per_player: number;
  total_players: number;
  total_scheduled_pods: number;
  completed_pods: number;
  completion_percentage: number;
}

// UPDATE CreateLeagueInput - add games_per_player
export interface CreateLeagueInput {
  name: string;
  description?: string;
  player_ids: string[];
  start_date: string;
  end_date?: string;
  games_per_player: number; // ADD THIS LINE
}