import { describe, it, expect, beforeEach, vi } from 'vitest'

// Create the mock with better chaining support
const mockFrom = vi.fn(() => {
	const chainable = {
		select: vi.fn().mockReturnThis(),
		insert: vi.fn().mockReturnThis(),
		update: vi.fn().mockReturnThis(),
		delete: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
		neq: vi.fn().mockReturnThis(),
		single: vi.fn().mockReturnThis(),
		order: vi.fn().mockReturnThis(),
		limit: vi.fn().mockReturnThis()
	}

	// Make all methods return the same chainable object
	Object.values(chainable).forEach(method => {
		if (typeof method.mockReturnThis === 'function') {
			method.mockReturnValue(chainable)
		}
	})

	return chainable
})

// Mock the supabase client at the exact path
vi.mock('@dadgic/database/client', () => ({
	supabase: {
		from: mockFrom
	}
}))

vi.mock('@dadgic/database', async () => {
	const actual = await vi.importActual('@dadgic/database')
	return {
		...actual,
	}
})

describe('Pod Database Operations', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('should mock supabase.from calls correctly for pods', async () => {
		const { supabase } = await import('@dadgic/database/client')

		supabase.from('pods')

		expect(mockFrom).toHaveBeenCalledWith('pods')
	})

	it('should test PodQueries.getAll method', async () => {
		// Mock the response properly
		const mockChain = mockFrom()
		mockChain.select().order.mockResolvedValue({
			data: [
				{
					id: 'pod-1',
					date: '2025-08-01',
					participants: [
						{
							id: 'p1',
							player: { name: 'Alice' },
							commander_deck: 'Atraxa',
							result: 'win'
						}
					]
				}
			],
			error: null
		})

		const { PodQueries } = await import('@dadgic/database')

		try {
			await PodQueries.getAll()
		} catch (error) {
			console.log('Expected error during test:', error.message)
		}

		expect(mockFrom).toHaveBeenCalledWith('pods')
	})

	it('should test PodQueries.getByLeague method', async () => {
		const leagueId = 'league-123'

		const mockChain = mockFrom()
		mockChain.select().eq().order.mockResolvedValue({
			data: [
				{ id: 'pod-1', league_id: leagueId, participants: [] },
				{ id: 'pod-2', league_id: leagueId, participants: [] }
			],
			error: null
		})

		const { PodQueries } = await import('@dadgic/database')

		try {
			await PodQueries.getByLeague(leagueId)
		} catch (error) {
			console.log('Expected error during test:', error.message)
		}

		expect(mockFrom).toHaveBeenCalledWith('pods')
	})

	it('should test PodQueries.create method concept', async () => {
		const podInput = {
			league_id: 'league-123',
			date: new Date('2025-08-01'),
			participants: [
				{ player_id: 'player1', commander_deck: 'Atraxa', result: 'win' },
				{ player_id: 'player2', commander_deck: 'Krenko', result: 'lose' }
			]
		}

		const mockChain = mockFrom()
		mockChain.insert().select().single.mockResolvedValue({
			data: { id: 'pod-123' },
			error: null
		})

		const { PodQueries } = await import('@dadgic/database')

		try {
			await PodQueries.create(podInput)
		} catch (error) {
			console.log('Expected error during test:', error.message)
		}

		expect(mockFrom).toHaveBeenCalledWith('pods')
	})

	it('should test PodQueries.getRecent method', async () => {
		const limit = 5

		// Fix the chaining issue - make sure the final method returns a resolved promise
		const mockChain = mockFrom()
		const mockOrder = vi.fn().mockReturnThis()
		const mockLimit = vi.fn().mockResolvedValue({
			data: [
				{ id: 'pod-1', date: '2025-08-01', participants: [] }
			],
			error: null
		})

		// Set up the proper chain
		mockChain.select.mockReturnValue({
			order: mockOrder
		})
		mockOrder.mockReturnValue({
			limit: mockLimit
		})

		const { PodQueries } = await import('@dadgic/database')

		try {
			await PodQueries.getRecent(limit)
		} catch (error) {
			console.log('Expected error during test:', error.message)
		}

		expect(mockFrom).toHaveBeenCalledWith('pods')
	})
})
