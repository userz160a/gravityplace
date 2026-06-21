'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type GameResult = {
  id: string
  username: string
  outcome: string
  final_boss_index: number
  final_boss_name: string
  survived_seconds: number
  event_log: Array<{ type: string; t: number; [key: string]: unknown }>
  created_at: string
}

function formatIstanbulTime(isoString: string) {
  return new Date(isoString).toLocaleString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function LeaderboardPage() {
  const [results, setResults] = useState<GameResult[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchResults() {
      const { data, error } = await supabase
        .from('game_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) {
        setResults(data as GameResult[])
      }
      setLoading(false)
    }
    fetchResults()
  }, [])

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-wide">SON OYUNLAR</h1>
          <div className="flex gap-3">
            <Link
              href="/live"
              className="border-2 border-green-500 text-green-400 px-4 py-2 text-sm hover:bg-green-600 hover:text-white transition-colors"
            >
              CANLI İZLE
            </Link>
            <Link
              href="/play"
              className="border-2 border-white px-4 py-2 text-sm hover:bg-white hover:text-black transition-colors"
            >
              OYNA
            </Link>
          </div>
        </div>

        {loading && <p className="text-gray-400">Yükleniyor...</p>}
        {!loading && results.length === 0 && (
          <p className="text-gray-400">Henüz kaydedilmiş bir oyun yok.</p>
        )}

        <div className="space-y-3">
          {results.map((r) => (
            <div key={r.id} className="border-2 border-white/30 p-4">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
              >
                <div className="space-y-1">
                  <p className="font-bold">
                    {r.username}{' '}
                    <span
                      className={
                        r.outcome === 'WIN' ? 'text-green-400' : 'text-red-400'
                      }
                    >
                      {r.outcome === 'WIN' ? '— ZAFER' : '— DÜŞTÜ'}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {r.final_boss_name} · {r.survived_seconds}s ·{' '}
                    {formatIstanbulTime(r.created_at)} (TR)
                  </p>
                </div>
                <span className="text-gray-400 text-sm">
                  {expandedId === r.id ? '▲' : '▼'}
                </span>
              </div>

              {expandedId === r.id && (
                <div className="mt-4 pt-4 border-t border-white/20 space-y-1 max-h-64 overflow-y-auto">
                  <p className="text-xs text-gray-500 mb-2">OYUN OLAY KAYDI</p>
                  {r.event_log.map((e, idx) => (
                    <p key={idx} className="text-xs text-gray-300">
                      <span className="text-gray-500">[{e.t}s]</span> {e.type}
                      {e.bossName ? ` — ${e.bossName}` : ''}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}