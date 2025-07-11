import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  const { data, error } = await supabase
    .from('matches')
    .select(`
      id,
      commander,
      win,
      win_con,
      player:players (
        id,
        display_name,
        email
      ),
      pod:pods (
        id,
        date,
        location,
        format
      )
    `)
    .range(offset, offset + 999)

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Unknown error' }, { status: 500 })
  }

  // Avoid TS complaining by casting inside map
  const flattened = (data as any[]).map((m) => ({
    match_id: m.id,
    commander: m.commander,
    win: m.win,
    win_con: m.win_con,
    player_id: m.player && m.player.id,
    player_name: m.player && m.player.display_name,
    player_email: m.player && m.player.email,
    pod_id: m.pod && m.pod.id,
    date: m.pod && m.pod.date,
    location: m.pod && m.pod.location,
    format: m.pod && m.pod.format,
  }))

  return NextResponse.json(flattened)
}