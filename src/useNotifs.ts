import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

// ─────────────────────────────────────────────────────────────
//  Hook partagé : compte les notifications NON LUES par « lien »
//  (chaque lien correspond à une section de menu). Sert à afficher
//  une pastille directement sur la partie concernée, en plus de la
//  cloche. Utilisé par toutes les coquilles (cadre, secrétaire, admin,
//  direction).
// ─────────────────────────────────────────────────────────────
export function useNotifsSections(utilisateurId?: string) {
  const [parLien, setParLien] = useState<Record<string, number>>({})

  const charger = useCallback(async () => {
    if (!utilisateurId) return
    const { data } = await supabase
      .from('notifications')
      .select('lien')
      .eq('user_id', utilisateurId)
      .eq('lu', false)
    const acc: Record<string, number> = {}
    ;(data ?? []).forEach((n: any) => { if (n.lien) acc[n.lien] = (acc[n.lien] ?? 0) + 1 })
    setParLien(acc)
  }, [utilisateurId])

  useEffect(() => {
    charger()
    const t = setInterval(charger, 60000) // rafraîchit chaque minute
    return () => clearInterval(t)
  }, [charger])

  // Marque comme lues les notifications d'un ou plusieurs liens (à l'ouverture d'une section)
  const marquerLu = useCallback(async (liens: string[]) => {
    if (!utilisateurId || liens.length === 0) return
    const aVider = liens.filter((l) => (parLien[l] ?? 0) > 0)
    if (aVider.length === 0) return
    setParLien((p) => { const c = { ...p }; aVider.forEach((l) => delete c[l]); return c })
    await supabase.from('notifications').update({ lu: true }).eq('user_id', utilisateurId).eq('lu', false).in('lien', aVider)
  }, [utilisateurId, parLien])

  return { parLien, charger, marquerLu }
}
