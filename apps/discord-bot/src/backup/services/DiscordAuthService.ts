// apps/discord-bot/src/services/DiscordAuthService.ts
import type { Interaction } from 'discord.js'
import type { DatabaseAuthContext } from '@dadgic/database'

export class DiscordAuthService {
  static buildAuthContext(interaction: Interaction): DatabaseAuthContext {
    return {
      user_id: interaction.user.id,
      supabase_user_id: interaction.user.id, // Discord bot uses Discord ID
      is_admin: true // Discord bot operates with admin privileges
    }
  }
}