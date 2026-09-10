import { supabase } from './supabase'

// Écrit une notification pour un utilisateur précis
export async function notifier(userId: string, message: string, lien?: string) {
  await supabase.from('notifications').insert({ user_id: userId, message, lien: lien ?? null })
}

// Écrit une notification pour tous les utilisateurs d'un rôle (ex. 'direction')
export async function notifierRole(role: string, message: string, lien?: string) {
  const { data } = await supabase.from('users').select('id').eq('role', role)
  const lignes = (data ?? []).map((u: any) => ({ user_id: u.id, message, lien: lien ?? null }))
  if (lignes.length) await supabase.from('notifications').insert(lignes)
}
