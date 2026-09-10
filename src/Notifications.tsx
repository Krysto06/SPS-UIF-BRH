import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

type Notif = { id: string; message: string; lien: string | null; lu: boolean; created_at: string }

function ilYa(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return "à l'instant"
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`
  const j = Math.floor(s / 86400)
  return j === 1 ? 'hier' : `il y a ${j} j`
}

// 🔔 Cloche de notifications (header) — lit la table `notifications` du cadre connecté
export function Cloche({ utilisateurId, onNaviguer }: { utilisateurId?: string; onNaviguer: (lien: string) => void }) {
  const [liste, setListe] = useState<Notif[]>([])
  const [ouvert, setOuvert] = useState(false)

  const charger = useCallback(async () => {
    if (!utilisateurId) return
    const { data } = await supabase
      .from('notifications')
      .select('id, message, lien, lu, created_at')
      .eq('user_id', utilisateurId)
      .order('created_at', { ascending: false })
      .limit(30)
    setListe((data ?? []) as Notif[])
  }, [utilisateurId])

  useEffect(() => {
    charger()
    const t = setInterval(charger, 60000) // rafraîchit chaque minute
    return () => clearInterval(t)
  }, [charger])

  const nonLues = liste.filter((n) => !n.lu).length

  async function marquerLu(ids: string[]) {
    if (ids.length === 0) return
    setListe((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, lu: true } : n)))
    await supabase.from('notifications').update({ lu: true }).in('id', ids)
  }

  async function ouvrir(n: Notif) {
    if (!n.lu) await marquerLu([n.id])
    setOuvert(false)
    if (n.lien) onNaviguer(n.lien)
  }

  return (
    <div className="relative">
      <button onClick={() => setOuvert((v) => !v)} aria-label="Notifications"
        className="relative rounded-lg border border-brh-border bg-white p-2 text-brh-text transition hover:bg-brh-bg">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {nonLues > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brh-danger px-1 text-[10px] font-bold text-white">{nonLues}</span>
        )}
      </button>

      {ouvert && (
        <>
          <div onClick={() => setOuvert(false)} className="fixed inset-0 z-40" />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-brh-border bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-brh-border px-4 py-2.5">
              <span className="text-sm font-semibold text-brh-primary">Notifications</span>
              {nonLues > 0 && (
                <button onClick={() => marquerLu(liste.filter((n) => !n.lu).map((n) => n.id))}
                  className="text-xs font-medium text-brh-primary hover:underline">Tout marquer comme lu</button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {liste.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-brh-muted">Aucune notification.</p>
              ) : (
                liste.map((n) => (
                  <button key={n.id} onClick={() => ouvrir(n)}
                    className={`flex w-full items-start gap-3 border-b border-brh-border/60 px-4 py-3 text-left transition hover:bg-brh-bg ${n.lu ? '' : 'bg-brh-primary/[0.04]'}`}>
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.lu ? 'bg-transparent' : 'bg-brh-secondary'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-snug text-brh-text">{n.message}</span>
                      <span className="mt-0.5 block text-[11px] text-brh-muted">{ilYa(n.created_at)}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
