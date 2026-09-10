import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { supabase } from './supabase'

// 🔎 Test temporaire : vérifie que l'appli voit la base (on l'enlèvera après)
supabase.from('cadres_strategiques').select('*').then(({ data, error }) => {
  if (error) console.error('❌ Supabase :', error.message)
  else console.log('✅ Supabase connecté ! Lignes reçues :', data)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
