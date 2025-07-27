// ============================================================================
// CORE DATABASE ENTITIES
// ============================================================================

export interface Player {
  id: string;
  name: string;
  discord_id: string | null;
  discord_username: string | null;
  email: string | null;
  role: 'player' | 'admin';
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
  status: 'draft' | 'active' | 'completed';
  games_per_player: number; // Note: keeping games_per_player for DB compatibility
  created_at: string;
  updated_at: string;
}

export interface Pod {
  id: string;
  league_id: string | null;
  date: string;
  game_length_minutes: number | null; // Note: keeping game_length for DB compatibility
  turns: number | null;
  winning_commander: string | null;
  participant_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
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

// Extended entity types
export interface PodWithParticipants extends Pod {
  participants: (PodParticipant & { player: Player })[];
}

export interface LeagueWithProgress extends League {
  scheduled_pods: ScheduledPod[];
  completed_count: number;
  total_count: number;
  completion_percentage: number;
}

export interface PlayerStats {
  player_id: string;
  player_name: string;
  pods_played: number; // UPDATED: games_played → pods_played
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  favorite_commanders: string[];
}
