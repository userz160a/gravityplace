'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function PlayPage() {
  const [username, setUsername] = useState('')
  const [started, setStarted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const sessionIdRef = useRef<string>('')
  const router = useRouter()

  function handleStart() {
    if (username.trim().length < 2) {
      setError('Lütfen en az 2 karakterli bir kullanıcı adı gir.')
      return
    }
    setError('')
    sessionIdRef.current = crypto.randomUUID()
    setStarted(true)
  }

  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      if (!event.data || !event.data.type) return

      if (event.data.type === 'LIVE_UPDATE') {
        await supabase.from('live_sessions').upsert({
          id: sessionIdRef.current,
          username: username.trim(),
          boss_index: event.data.bossIndex,
          boss_name: event.data.bossName,
          sanity: event.data.sanity,
          outcome: 'PLAYING',
          updated_at: new Date().toISOString(),
        })
        return
      }

      if (event.data.type !== 'GAME_OVER') return
      if (saving || saved) return

      setSaving(true)

      const { outcome, finalBossIndex, finalBossName, survivedSeconds, eventLog } = event.data

      const { error: insertError } = await supabase.from('game_results').insert({
        username: username.trim(),
        outcome,
        final_boss_index: finalBossIndex,
        final_boss_name: finalBossName,
        survived_seconds: survivedSeconds,
        event_log: eventLog,
      })

      await supabase.from('live_sessions').upsert({
        id: sessionIdRef.current,
        username: username.trim(),
        boss_index: finalBossIndex,
        boss_name: finalBossName,
        sanity: outcome === 'WIN' ? 100 : 0,
        outcome,
        updated_at: new Date().toISOString(),
      })

      setSaving(false)

      if (insertError) {
        setError('Sonuç kaydedilemedi: ' + insertError.message)
      } else {
        setSaved(true)
      }
    },
    [username, saving, saved]
  )

  useEffect(() => {
    if (!started) return
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [started, handleMessage])

  if (!started) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md border-4 border-white p-8 space-y-6">
          <h1 className="text-xl font-bold tracking-wide text-center">GRAVITYPLACE</h1>
          <p className="text-sm text-gray-300 text-center">
            Kabuslar zincirine girmeden önce kullanıcı adını gir.
          </p>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-gray-400">
              Kullanıcı Adınızı Giriniz
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              maxLength={20}
              className="w-full bg-black border-2 border-white px-4 py-3 text-white outline-none focus:border-red-500"
              placeholder="örn: mert160a"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={handleStart}
            className="w-full bg-red-600 hover:bg-red-700 transition-colors py-3 font-bold tracking-wide"
          >
            OYUNU BAŞLAT
          </button>
          <button
            onClick={() => router.push('/leaderboard')}
            className="w-full border-2 border-white hover:bg-white hover:text-black transition-colors py-3 font-bold tracking-wide"
          >
            GEÇMİŞ OYUNLARI GÖR
          </button>
          <button
            onClick={() => router.push('/live')}
            className="w-full border-2 border-green-500 text-green-400 hover:bg-green-600 hover:text-white transition-colors py-3 font-bold tracking-wide"
          >
            CANLI OYUNLARI İZLE
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <div className="p-3 flex items-center justify-between border-b border-white/20">
        <span className="text-sm">
          Oyuncu: <span className="text-red-400 font-bold">{username}</span>
        </span>
        {saving && <span className="text-xs text-yellow-400">Kaydediliyor...</span>}
        {saved && <span className="text-xs text-green-400">Sonuç kaydedildi ✓</span>}
      </div>

      <div className="flex-1 flex items-center justify-center bg-black p-4">
        <iframe
          ref={iframeRef}
          src={`/game.html?username=${encodeURIComponent(username.trim())}`}
          className="border-0"
          style={{ width: '80vw', height: '80vh' }}
        />
      </div>

      {saved && (
        <div className="p-4 border-t border-white/20 flex justify-center gap-4">
          <button
            onClick={() => router.push('/leaderboard')}
            className="border-2 border-white px-6 py-2 hover:bg-white hover:text-black transition-colors"
          >
            SONUÇLARI GÖR
          </button>
          <button
            onClick={() => window.location.reload()}
            className="border-2 border-red-500 text-red-400 px-6 py-2 hover:bg-red-600 hover:text-white transition-colors"
          >
            YENİDEN OYNA
          </button>
        </div>
      )}
    </main>
  )
}