import { createClient } from '@supabase/supabase-js'

// Adresse de ta base + clé publique (sans danger dans le code)
const SUPABASE_URL = 'https://ytpalhkgknngtxysztmj.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0cGFsaGtna25uZ3R4eXN6dG1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTEyNDAsImV4cCI6MjEwNDQ4NzI0MH0.OCJJmmQuNdpyRzKX7wFbjo3qtc2lBnQ1VytH2x1OZoE'

// La « prise » : on l'utilisera partout pour lire/écrire dans la base
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
