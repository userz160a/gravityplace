'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type LiveSession = {
  id: string
  username: string
  boss_index: number
  boss_name: string
  sanity: number
  outcome: string
  updated_at: string
}

export default function LivePage() {
  const [sessions, setSessions] = useState<LiveSession[]>([])

  useEffect(() => {
    async function fetchActive() {
      const cutoff = new Date(Date.now() - 15000).toISOString()
      const { data } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('outcome', 'PLAYING')
        .gte('updated_at', cutoff)
        .order('updated_at', { ascending: false })

      if (data) setSessions(data as LiveSession[])
    }

    fetchActive()
    const interval = setInterval(fetchActive, 5000)

    const channel = supabase
      .channel('live_sessions_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_sessions' },
        () => {
          fetchActive()
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-wide">CANLI OYUNLAR</h1>
          <div className="flex gap-3">
            <Link
              href="/leaderboard"
              className="border-2 border-white px-4 py-2 text-sm hover:bg-white hover:text-black transition-colors"
            >
              GEÇMİŞ
            </Link>
            <Link
              href="/play"
              className="border-2 border-red-500 text-red-400 px-4 py-2 text-sm hover:bg-red-600 hover:text-white transition-colors"
            >
              OYNA
            </Link>
          </div>
        </div>

        {sessions.length === 0 && (
          <p className="text-gray-400">Şu anda aktif oyuncu yok.</p>
        )}

        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="border-2 border-white/30 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  {s.username}
                </p>
                <span className="text-xs text-gray-400">{s.boss_name}</span>
              </div>
              <div className="w-full h-3 border border-white/40 bg-black">
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, s.sanity))}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">Akıl sağlığı: %{Math.ceil(s.sanity)}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}