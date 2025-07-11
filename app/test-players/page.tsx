'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestPlayers() {
    const [players, setPlayers] = useState<any[]>([])
    useEffect(() => {
        const load = async () => {
            const { data } = await supabase.from('players').select('*')
            setPlayers(data || [])
        }
        load()
    }, [])
    return (
        <div className="p-6 text-white">
            <h1 className="text-2xl font-bold mb-4">Test Players</h1>
            <ul>
                {players.map(p=>(
                    <li key={p.id}>{p.display_name} - {p.discord_tag}</li>
                ))}
            </ul>
        </div>
    )
}