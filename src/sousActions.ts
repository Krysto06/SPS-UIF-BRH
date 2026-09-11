import { supabase } from './supabase'

export type SousAction = { id: string; action_id: string; titre: string; fait: boolean }

// Charge les sous-actions de plusieurs actions
export async function chargerSousActions(actionIds: string[]): Promise<SousAction[]> {
  if (actionIds.length === 0) return []
  const { data } = await supabase
    .from('sous_actions')
    .select('id, action_id, titre, fait')
    .in('action_id', actionIds)
    .order('created_at', { ascending: true })
  return (data ?? []) as SousAction[]
}

export async function ajouterSousAction(actionId: string, titre: string): Promise<SousAction | null> {
  const { data } = await supabase
    .from('sous_actions')
    .insert({ action_id: actionId, titre })
    .select('id, action_id, titre, fait')
    .single()
  return (data as SousAction) ?? null
}

export async function basculerSousAction(id: string, fait: boolean) {
  await supabase.from('sous_actions').update({ fait }).eq('id', id)
}

export async function supprimerSousAction(id: string) {
  await supabase.from('sous_actions').delete().eq('id', id)
}

// Regroupe une liste plate de sous-actions par action_id
export function grouper(liste: SousAction[]): Record<string, SousAction[]> {
  const r: Record<string, SousAction[]> = {}
  for (const s of liste) (r[s.action_id] ??= []).push(s)
  return r
}
