import { BaseQueries } from "./base"
import { ClientType } from "../client-factory";
import { ScheduledPod } from "../types"
export class ScheduledPodQueries extends BaseQueries {
	static async findByPlayers(playerIds: string[], clientType: ClientType = 'user'): Promise<ScheduledPod | null> {
		const supabase = this.getClient(clientType);
		// Move logic from LeagueQueries.findMatchingScheduledPod
		// Sort playerIds for consistent comparison
		const sortedIds = [...playerIds].sort()

		const { data, error } = await supabase
			.from('scheduled_pods')
			.select('*')
			.is('completed_pod_id', null)

		if (error) throw error

		// Find match by comparing sorted arrays
		return data?.find(sp => {
			const scheduledIds = [...sp.player_ids].sort()
			return scheduledIds.length === sortedIds.length &&
				scheduledIds.every((id, i) => id === sortedIds[i])
		}) || null
	}

	static async markCompleted(scheduledPodId: string, podId: string): Promise<void> {
		const { error } = await this.getClient()
			.from('scheduled_pods')
			.update({ completed_pod_id: podId })
			.eq('id', scheduledPodId);

		if (error) throw error;
	}

	static async countIncomplete(leagueId: string): Promise<number> {
		const { count, error } = await this.getClient()
			.from('scheduled_pods')
			.select('*', { count: 'exact', head: true })
			.eq('league_id', leagueId)
			.is('completed_pod_id', null)

		if (error) throw error
		return count || 0
	}
}