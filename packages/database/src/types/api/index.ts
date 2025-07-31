// ============================================================================
// API Types - Request/Response Contracts
// ============================================================================

export interface AuthContext {
	user_id: string
	supabase_user_id: string
	is_admin: boolean
	player_role: 'admin' | 'player'
}

export interface DatabaseAuthContext {
	user_id: string
	supabase_user_id: string
	is_admin: boolean
}