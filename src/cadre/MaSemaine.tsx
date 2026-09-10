import { useState, useEffect, type ChangeEvent } from 'react'
import { supabase } from '../supabase'
import { telechargerRapportPdf, type RapportPdf } from '../pdf'

const champ =
  'w-full rounded-lg border border-brh-border bg-white px-4 py-2.5 text-sm text-brh-text outline-none transition placeholder:text-brh-muted/60 focus:border-brh-primary focus:ring-4 focus:ring-brh-primary/10'
const label = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brh-muted'
const zoneTexte = champ + ' min-h-[80px] resize-y leading-relaxed'
const serif = { fontFamily: '"Fraunces", Georgia, "Times New Roman", serif' } as const

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

function lundiDeLaSemaine(base = new Date()): Date {
  const d = new Date(base)
  const j = d.getDay()
  const diff = j === 0 ? -6 : 1 - j
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function libelleSemaine(lundi: Date): string {
  const vendredi = new Date(lundi)
  vendredi.setDate(lundi.getDate() + 4)
  if (lundi.getMonth() === vendredi.getMonth())
    return `Semaine du ${lundi.getDate()} au ${vendredi.getDate()} ${MOIS[vendredi.getMonth()]} ${vendredi.getFullYear()}`
  return `Semaine du ${lundi.getDate()} ${MOIS[lundi.getMonth()]} au ${vendredi.getDate()} ${MOIS[vendredi.getMonth()]} ${vendredi.getFullYear()}`
}
function formatEnvoi(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MOIS[d.getMonth()]} à ${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`
}

const BAREME: { v: number; label: string; desc: string }[] = [
  { v: 0, label: 'Pas encore commencée', desc: "rien d'entamé" },
  { v: 25, label: 'Démarrée', desc: 'travail engagé' },
  { v: 50, label: 'Bien avancée', desc: 'à mi-parcours' },
  { v: 75, label: 'Terminée — attente de révision', desc: 'le travail est fait (direction)' },
  { v: 90, label: "Révisée — attente d'approbation", desc: 'validée par la direction (conseil)' },
  { v: 100, label: 'Approuvée', desc: 'approuvée par le conseil' },
]
function etapeDe(pct: number) {
  let r = BAREME[0]
  for (const b of BAREME) if (pct >= b.v) r = b
  return r
}
function etapeCls(pct: number): string {
  if (pct >= 100) return 'bg-brh-success/10 text-brh-success'
  if (pct >= 90) return 'bg-brh-secondary/15 text-brh-secondary'
  if (pct >= 75) return 'bg-orange-50 text-brh-warning'
  if (pct >= 25) return 'bg-blue-50 text-blue-700'
  return 'bg-gray-100 text-gray-600'
}

type ActionSem = { id: string; nom: string; axe: string; echeance: string | null; echeanceFr: string; pct: number }

export function MaSemaine({ utilisateurId, nom }: { utilisateurId?: string; nom: string }) {
  const lundi = lundiDeLaSemaine()
  const semaineStr = isoDate(lundi)
  const jour = new Date().getDay()
  const [apercu, setApercu] = useState(false)
  const montrerDebut = jour === 1 || apercu
  const montrerFin = jour === 5 || apercu

  const [toutes, setToutes] = useState<ActionSem[]>([])
  const [selection, setSelection] = useState<string[]>([])
  const [chargement, setChargement] = useState(true)

  const [questions, setQuestions] = useState('')
  const [debutEnvoi, setDebutEnvoi] = useState<string | null>(null)
  const [msgDebut, setMsgDebut] = useState<{ ok: boolean; t: string } | null>(null)

  const [travauxRealises, setTravauxRealises] = useState('')
  const [difficultes, setDifficultes] = useState('')
  const [besoinsAppui, setBesoinsAppui] = useState('')
  const [recommandations, setRecommandations] = useState('')
  const [finEnvoi, setFinEnvoi] = useState<string | null>(null)
  const [msgFin, setMsgFin] = useState<{ ok: boolean; t: string } | null>(null)

  const [avancements, setAvancements] = useState<Record<string, number>>({})
  const [envoi, setEnvoi] = useState<'debut' | 'fin' | null>(null)

  // Emails : la direction reçoit le rapport ; le cadre peut se mettre en copie (facultatif)
  const [emailDirection, setEmailDirection] = useState('')
  const [emailMoi, setEmailMoi] = useState('')

  const [documents, setDocuments] = useState<{ nom: string; url: string }[]>([])
  const [uploadEnCours, setUploadEnCours] = useState(false)
  const [msgDoc, setMsgDoc] = useState<string | null>(null)

  useEffect(() => {
    if (!utilisateurId) { setChargement(false); return }
    supabase.from('actions').select('id, nom, echeance, pourcentage, cadres_strategiques(nom)').eq('user_id', utilisateurId).order('echeance')
      .then(({ data }) => {
        const l = (data ?? []).map((a: any) => ({
          id: a.id, nom: a.nom, axe: a.cadres_strategiques?.nom ?? '—',
          echeance: a.echeance ?? null,
          echeanceFr: a.echeance ? a.echeance.split('-').reverse().join('/') : '—',
          pct: a.pourcentage ?? 0,
        })) as ActionSem[]
        setToutes(l)
        setAvancements(Object.fromEntries(l.map((a) => [a.id, a.pct])))
        setChargement(false)
      })
    supabase.from('rapports').select('*').eq('user_id', utilisateurId).eq('semaine_debut', semaineStr).maybeSingle()
      .then(({ data }) => {
        if (!data) return
        setQuestions(data.questions ?? '')
        setDebutEnvoi(data.debut_envoi ?? null)
        setTravauxRealises(data.travaux_realises ?? '')
        setDifficultes(data.difficultes ?? '')
        setBesoinsAppui(data.besoins_appui ?? '')
        setRecommandations(data.recommandations ?? '')
        setFinEnvoi(data.fin_envoi ?? null)
        setDocuments(Array.isArray(data.documents) ? data.documents : [])
        setSelection(Array.isArray(data.actions_semaine) ? data.actions_semaine : [])
      })
  }, [utilisateurId, semaineStr])

  const actionsSemaine = toutes.filter((a) => selection.includes(a.id))
  const dispo = toutes.filter((a) => !selection.includes(a.id))

  async function majSelection(ids: string[]) {
    setSelection(ids)
    if (utilisateurId) await supabase.from('rapports').upsert({ user_id: utilisateurId, semaine_debut: semaineStr, actions_semaine: ids }, { onConflict: 'user_id,semaine_debut' })
  }
  function ajouter(id: string) { if (id && !selection.includes(id)) majSelection([...selection, id]) }
  function retirer(id: string) { majSelection(selection.filter((x) => x !== id)) }

  // Ajuster l'avancement d'une action (n'importe quel jour) — enregistré tout de suite
  async function changerAvancement(id: string, val: number) {
    setAvancements((prev) => ({ ...prev, [id]: val }))
    if (utilisateurId) await supabase.from('actions').update({ pourcentage: val, updated_at: new Date().toISOString() }).eq('id', id)
  }

  function tagSemaine(echeance: string | null) {
    if (echeance && new Date(echeance) < new Date(new Date().toDateString())) return { label: 'En retard', cls: 'bg-brh-danger/10 text-brh-danger' }
    return { label: 'Cette semaine', cls: 'bg-orange-50 text-brh-warning' }
  }

  async function envoyerDebut() {
    if (!utilisateurId) return
    if (selection.length === 0) { setMsgDebut({ ok: false, t: 'Choisis au moins une action de la semaine.' }); return }
    setEnvoi('debut'); setMsgDebut(null)
    const now = new Date().toISOString()
    const { error } = await supabase.from('rapports').upsert({
      user_id: utilisateurId, semaine_debut: semaineStr,
      actions_semaine: selection, questions: questions.trim() || null, debut_envoi: now,
    }, { onConflict: 'user_id,semaine_debut' })
    setEnvoi(null)
    if (error) { setMsgDebut({ ok: false, t: 'Erreur : ' + error.message }); return }
    setDebutEnvoi(now)
    if (emailDirection.trim()) {
      composerEmail('debut')
      setMsgDebut({ ok: true, t: "Rapport enregistré dans l'espace direction — l'email vient de s'ouvrir, clique sur « Envoyer »." })
    } else {
      setMsgDebut({ ok: true, t: "Rapport enregistré dans l'espace direction. Ajoute l'email de la direction pour aussi l'envoyer par mail." })
    }
  }

  async function envoyerFin() {
    if (!utilisateurId) return
    if (travauxRealises.trim() === '') { setMsgFin({ ok: false, t: "Indique au moins ce que tu as accompli." }); return }
    setEnvoi('fin'); setMsgFin(null)
    const now = new Date().toISOString()
    const { error } = await supabase.from('rapports').upsert({
      user_id: utilisateurId, semaine_debut: semaineStr,
      travaux_realises: travauxRealises.trim(),
      difficultes: difficultes.trim() || null,
      besoins_appui: besoinsAppui.trim() || null,
      recommandations: recommandations.trim() || null,
      fin_envoi: now,
    }, { onConflict: 'user_id,semaine_debut' })
    if (error) { setEnvoi(null); setMsgFin({ ok: false, t: 'Erreur : ' + error.message }); return }
    await Promise.all(actionsSemaine.map((a) =>
      supabase.from('actions').update({ pourcentage: avancements[a.id] ?? a.pct, updated_at: now }).eq('id', a.id)
    ))
    setEnvoi(null); setFinEnvoi(now)
    if (emailDirection.trim()) {
      composerEmail('fin')
      setMsgFin({ ok: true, t: "Rapport de fin enregistré — l'email vient de s'ouvrir, clique sur « Envoyer ». Avancement en attente de validation." })
    } else {
      setMsgFin({ ok: true, t: "Rapport de fin enregistré dans l'espace direction. Avancement en attente de validation. (Ajoute l'email de la direction pour l'envoyer par mail.)" })
    }
  }

  async function ajouterDocument(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !utilisateurId) return
    setUploadEnCours(true); setMsgDoc(null)
    const chemin = `${utilisateurId}/${semaineStr}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('documents').upload(chemin, file)
    if (error) { setUploadEnCours(false); setMsgDoc('Erreur : ' + error.message); e.target.value = ''; return }
    const url = supabase.storage.from('documents').getPublicUrl(chemin).data.publicUrl
    const maj = [...documents, { nom: file.name, url }]
    setDocuments(maj)
    await supabase.from('rapports').upsert({ user_id: utilisateurId, semaine_debut: semaineStr, documents: maj }, { onConflict: 'user_id,semaine_debut' })
    setUploadEnCours(false); e.target.value = ''
  }
  async function retirerDocument(url: string) {
    if (!utilisateurId) return
    const maj = documents.filter((d) => d.url !== url)
    setDocuments(maj)
    await supabase.from('rapports').upsert({ user_id: utilisateurId, semaine_debut: semaineStr, documents: maj }, { onConflict: 'user_id,semaine_debut' })
  }

  // Ouvre un email : destinataire = la direction, copie (CC) = le cadre s'il a mis son email
  function composerEmail(type: 'debut' | 'fin') {
    const entete = [libelleSemaine(lundi), `Cadre : ${nom}`, '']
    let sujet = ''
    let lignes: string[] = []
    if (type === 'debut') {
      sujet = `Rapport de début de semaine — ${nom} — ${libelleSemaine(lundi)}`
      lignes = [...entete, '— DÉBUT DE SEMAINE —', 'Actions de la semaine :',
        ...(actionsSemaine.length ? actionsSemaine.map((a) => ` - ${a.nom}`) : [' - (aucune)']),
        '', `Questions : ${questions || '—'}`]
    } else {
      sujet = `Rapport de fin de semaine — ${nom} — ${libelleSemaine(lundi)}`
      lignes = [...entete, '— FIN DE SEMAINE —', `Réalisations : ${travauxRealises || '—'}`,
        '', 'Avancement proposé :',
        ...(actionsSemaine.length ? actionsSemaine.map((a) => { const p = avancements[a.id] ?? a.pct; return ` - ${a.nom} : ${p}% (${etapeDe(p).label})` }) : [' - (aucune)']),
        '', `Difficultés / contraintes : ${difficultes || '—'}`,
        `Besoins d'appui : ${besoinsAppui || '—'}`,
        `Recommandations : ${recommandations || '—'}`,
        '', 'Documents joints :', ...(documents.length ? documents.map((d) => ` - ${d.nom} : ${d.url}`) : [' - (aucun)'])]
    }
    const cc = emailMoi.trim() ? `&cc=${encodeURIComponent(emailMoi.trim())}` : ''
    window.location.href = `mailto:${encodeURIComponent(emailDirection.trim())}?subject=${encodeURIComponent(sujet)}${cc}&body=${encodeURIComponent(lignes.join('\n'))}`
  }

  // Prépare les données du PDF à partir de l'état courant
  function pdfData(type: 'debut' | 'fin'): RapportPdf {
    const d = new Date()
    const emisLe = `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} à ${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`
    return {
      type, cadre: nom, semaine: libelleSemaine(lundi), emisLe,
      actions: actionsSemaine.map((a) => { const p = avancements[a.id] ?? a.pct; return { nom: a.nom, axe: a.axe, etape: etapeDe(p).label, pct: p } }),
      questions, realisations: travauxRealises, difficultes, besoins: besoinsAppui, recommandations, documents,
    }
  }

  // Bloc d'envoi commun aux deux fiches (email direction + ma copie + boutons)
  function blocEnvoi(onEnvoyer: () => void, enCours: boolean, type: 'debut' | 'fin') {
    return (
      <div className="space-y-3 border-t border-brh-border/70 pt-4">
        <div>
          <label className={label}>Email de la direction (destinataire)</label>
          <input type="email" value={emailDirection} onChange={(e) => setEmailDirection(e.target.value)} placeholder="direction@brh.ht" className={champ} />
        </div>
        <div>
          <label className={label}>Mon email — pour recevoir une copie (optionnel)</label>
          <input type="email" value={emailMoi} onChange={(e) => setEmailMoi(e.target.value)} placeholder="ton.email@brh.ht" className={champ} />
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          <button onClick={() => telechargerRapportPdf(pdfData(type))} className="rounded-lg border border-brh-border bg-white px-4 py-2 text-sm font-semibold text-brh-text transition hover:bg-brh-bg">
            Télécharger le PDF
          </button>
          <button onClick={onEnvoyer} disabled={enCours} className="rounded-lg bg-brh-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brh-deep disabled:opacity-60">
            {enCours ? 'Envoi…' : 'Envoyer à la direction'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-brh-primary" style={serif}>Ma semaine</h1>
          <p className="mt-1 text-sm text-brh-muted">{libelleSemaine(lundi)}</p>
        </div>
        <button onClick={() => setApercu((v) => !v)} className="rounded-lg border border-brh-border bg-white px-3 py-1.5 text-xs font-semibold text-brh-muted transition hover:bg-brh-bg">
          {apercu ? "Masquer l'aperçu" : 'Aperçu des fiches (test)'}
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
        <span>Rythme hebdomadaire : la fiche de début s'ouvre le <b>lundi</b>, la fiche de fin le <b>vendredi</b>. Un rappel est envoyé le lundi matin et le vendredi après-midi.</span>
      </div>

      {/* 1) Mes actions de la semaine */}
      <section className="rounded-2xl border border-brh-border bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-brh-primary" style={serif}>Mes actions de la semaine</h3>
        <p className="mt-0.5 text-xs text-brh-muted">Ajuste l'avancement quand tu veux dans la semaine — c'est enregistré automatiquement.</p>
        {chargement ? (
          <p className="mt-4 text-sm text-brh-muted">Chargement…</p>
        ) : actionsSemaine.length === 0 ? (
          <p className="mt-4 rounded-lg bg-brh-bg px-4 py-3 text-sm text-brh-muted">Aucune action choisie. Remplis ta fiche du lundi pour définir tes actions de la semaine.</p>
        ) : (
          <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
            {actionsSemaine.map((a) => {
              const pct = avancements[a.id] ?? a.pct
              const et = etapeDe(pct)
              const ts = tagSemaine(a.echeance)
              return (
                <div key={a.id} className="rounded-xl border border-brh-border/70 bg-brh-bg/40 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-brh-text">{a.nom}</p>
                      <p className="text-xs text-brh-muted">{a.axe} · Échéance : {a.echeanceFr}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${etapeCls(pct)}`}>{et.label}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${ts.cls}`}>{ts.label}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <select value={pct} onChange={(e) => changerAvancement(a.id, Number(e.target.value))} className={`${champ} flex-1`}>
                      {BAREME.map((b) => (<option key={b.v} value={b.v}>{b.label} ({b.v} %)</option>))}
                    </select>
                    <span className="w-12 shrink-0 text-right text-sm font-bold text-brh-primary">{pct} %</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brh-bg"><div className="h-full rounded-full bg-brh-primary transition-all" style={{ width: `${pct}%` }} /></div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 2) Les deux rapports en parallèle */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">

        {/* DÉBUT */}
        <section className="overflow-hidden rounded-2xl border border-brh-border bg-white shadow-sm">
          <div className="flex items-start justify-between gap-3 border-b border-brh-border/70 bg-gradient-to-b from-brh-primary/5 to-transparent px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brh-primary text-white"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12h14M13 6l6 6-6 6" /></svg></div>
              <div><p className="font-semibold text-brh-text" style={serif}>Rapport de début de semaine</p><p className="text-[11px] text-brh-muted">Ouvert le lundi</p></div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="rounded-full bg-brh-secondary/15 px-2.5 py-0.5 text-[11px] font-bold text-brh-secondary">Obligatoire · Lundi</span>
              {debutEnvoi && <span className="text-[11px] font-medium text-brh-success">✓ Envoyé le {formatEnvoi(debutEnvoi)}</span>}
            </div>
          </div>
          {!montrerDebut && (
            <div className="flex items-center gap-2 border-b border-brh-border/70 bg-brh-bg px-5 py-2.5 text-xs font-semibold text-brh-muted">
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
              Consultation seule — cette fiche s'ouvre le lundi.
            </div>
          )}
          <div className={`space-y-4 p-5 ${montrerDebut ? '' : 'pointer-events-none select-none opacity-60'}`}>
            <div>
              <label className={label}>Mes actions de la semaine — à choisir</label>
              <select value="" onChange={(e) => ajouter(e.target.value)} className={champ}>
                <option value="">+ Choisir parmi mes actions du trimestre…</option>
                {dispo.map((a) => (<option key={a.id} value={a.id}>{a.nom}</option>))}
              </select>
              {actionsSemaine.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {actionsSemaine.map((a) => (
                    <span key={a.id} className="inline-flex items-center gap-1.5 rounded-full border border-brh-border bg-brh-bg px-3 py-1 text-xs font-semibold text-brh-text">
                      {a.nom}<button onClick={() => retirer(a.id)} className="text-brh-muted hover:text-brh-danger">✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className={label}>Mes questions / points à clarifier (optionnel)</label>
              <textarea value={questions} onChange={(e) => setQuestions(e.target.value)} placeholder="Ce sur quoi j'ai besoin d'une réponse ou d'une décision…" className={zoneTexte} />
            </div>
            {msgDebut && <p className={`rounded-lg px-3 py-2 text-sm ${msgDebut.ok ? 'bg-brh-success/10 text-brh-success' : 'bg-brh-danger/10 text-brh-danger'}`}>{msgDebut.t}</p>}
            {blocEnvoi(envoyerDebut, envoi === 'debut', 'debut')}
          </div>
        </section>

        {/* FIN */}
        <section className="overflow-hidden rounded-2xl border border-brh-border bg-white shadow-sm">
          <div className="flex items-start justify-between gap-3 border-b border-brh-border/70 bg-gradient-to-b from-brh-primary/5 to-transparent px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brh-primary text-white"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 6 9 17l-5-5" /></svg></div>
              <div><p className="font-semibold text-brh-text" style={serif}>Rapport de fin de semaine</p><p className="text-[11px] text-brh-muted">Ouvert le vendredi</p></div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="rounded-full bg-brh-secondary/15 px-2.5 py-0.5 text-[11px] font-bold text-brh-secondary">Obligatoire · Vendredi</span>
              {finEnvoi && <span className="text-[11px] font-medium text-brh-success">✓ Envoyé le {formatEnvoi(finEnvoi)}</span>}
            </div>
          </div>
          {!montrerFin && (
            <div className="flex items-center gap-2 border-b border-brh-border/70 bg-brh-bg px-5 py-2.5 text-xs font-semibold text-brh-muted">
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
              Consultation seule — cette fiche s'ouvre le vendredi.
            </div>
          )}
          <div className={`space-y-4 p-5 ${montrerFin ? '' : 'pointer-events-none select-none opacity-60'}`}>
            <div>
              <label className={label}>Ce que j'ai accompli</label>
              <textarea value={travauxRealises} onChange={(e) => setTravauxRealises(e.target.value)} placeholder="Les travaux réalisés cette semaine…" className={zoneTexte} />
            </div>

            <div>
              <label className={label}>Avancement proposé (la direction valide au final)</label>
              {actionsSemaine.length === 0 ? (
                <p className="rounded-lg bg-brh-bg px-4 py-3 text-sm text-brh-muted">Choisis d'abord tes actions dans la fiche du lundi.</p>
              ) : (
                <div className="space-y-4 rounded-xl border border-brh-border/70 bg-brh-bg/40 p-4">
                  {actionsSemaine.map((a) => {
                    const p = avancements[a.id] ?? a.pct
                    return (
                      <div key={a.id}>
                        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                          <span className="text-brh-text">{a.nom}</span>
                          <span className="text-brh-primary">{p} %</span>
                        </div>
                        <select value={p} onChange={(e) => setAvancements((prev) => ({ ...prev, [a.id]: Number(e.target.value) }))} className={champ}>
                          {BAREME.map((b) => (<option key={b.v} value={b.v}>{b.label} ({b.v} %)</option>))}
                        </select>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="mt-3 rounded-xl border border-brh-border/70 bg-brh-bg/40 p-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-brh-muted">Barème d'avancement</p>
                <ul className="space-y-1.5">
                  {BAREME.map((b) => (
                    <li key={b.v} className="flex gap-2.5 text-xs">
                      <span className="w-10 shrink-0 font-bold tabular-nums text-brh-text">{b.v} %</span>
                      <span><span className="font-semibold text-brh-text">{b.label}</span> <span className="text-brh-muted">— {b.desc}</span></span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <label className={label}>Difficultés / contraintes (optionnel)</label>
              <textarea value={difficultes} onChange={(e) => setDifficultes(e.target.value)} placeholder="Obstacles, contraintes, retards…" className={zoneTexte} />
            </div>
            <div>
              <label className={label}>Besoins d'appui (optionnel)</label>
              <textarea value={besoinsAppui} onChange={(e) => setBesoinsAppui(e.target.value)} placeholder="Ressources ou soutien nécessaires…" className={zoneTexte} />
            </div>
            <div>
              <label className={label}>Recommandations pour la suite (optionnel)</label>
              <textarea value={recommandations} onChange={(e) => setRecommandations(e.target.value)} placeholder="Propositions, points à porter à la direction…" className={zoneTexte} />
            </div>

            <div>
              <label className={label}>Documents joints</label>
              {documents.length > 0 && (
                <ul className="mb-2.5 space-y-2">
                  {documents.map((d) => (
                    <li key={d.url} className="flex items-center justify-between gap-2 rounded-lg border border-brh-border/70 bg-brh-bg/40 px-4 py-2.5">
                      <a href={d.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm font-semibold text-brh-primary hover:underline">{d.nom}</a>
                      <button onClick={() => retirerDocument(d.url)} className="shrink-0 text-xs font-semibold text-brh-danger hover:underline">Retirer</button>
                    </li>
                  ))}
                </ul>
              )}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-brh-border px-4 py-3 text-sm font-semibold text-brh-muted transition hover:border-brh-primary hover:text-brh-primary">
                <input type="file" onChange={ajouterDocument} disabled={uploadEnCours} className="hidden" />
                {uploadEnCours ? 'Téléversement…' : '+ Ajouter un document'}
              </label>
              {msgDoc && <p className="mt-2 rounded-lg bg-brh-danger/10 px-3 py-2 text-sm text-brh-danger">{msgDoc}</p>}
            </div>

            {msgFin && <p className={`rounded-lg px-3 py-2 text-sm ${msgFin.ok ? 'bg-brh-success/10 text-brh-success' : 'bg-brh-danger/10 text-brh-danger'}`}>{msgFin.t}</p>}
            {blocEnvoi(envoyerFin, envoi === 'fin', 'fin')}
          </div>
        </section>

      </div>
    </div>
  )
}
