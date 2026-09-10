import { jsPDF } from 'jspdf'

export type RapportPdf = {
  type: 'debut' | 'fin'
  cadre: string
  semaine: string
  emisLe: string
  actions: { nom: string; axe: string; etape: string; pct: number }[]
  questions?: string
  realisations?: string
  difficultes?: string
  besoins?: string
  recommandations?: string
  documents: { nom: string; url: string }[]
}

const NAVY = [18, 53, 91]
const GOLD = [201, 162, 39]
const INK = [23, 43, 77]
const MUTED = [100, 116, 139]
const LINE = [224, 231, 240]
const BODY = [51, 65, 92]

// jsPDF (polices standard) ne gère pas le tiret cadratin « — » : on le remplace par « - »
function net(s: string): string {
  return (s || '').replace(/—/g, '-').replace(/’/g, "'")
}

export function telechargerRapportPdf(r: RapportPdf) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 40
  const cW = W - M * 2

  const fill = (c: number[]) => doc.setFillColor(c[0], c[1], c[2])
  const stroke = (c: number[]) => doc.setDrawColor(c[0], c[1], c[2])
  const text = (c: number[]) => doc.setTextColor(c[0], c[1], c[2])

  // ── En-tête ──
  fill(NAVY); doc.rect(0, 0, W, 104, 'F')
  fill(GOLD); doc.rect(0, 104, W, 3, 'F')
  text([255, 255, 255])
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
  doc.text("Banque de la République d'Haïti", M, 32)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); text([200, 212, 230])
  doc.text("UNITÉ D'INCLUSION FINANCIÈRE", M, 45)
  text([255, 255, 255]); doc.setFont('times', 'bold'); doc.setFontSize(20)
  doc.text(r.type === 'fin' ? 'Rapport de fin de semaine' : 'Rapport de début de semaine', M, 78)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); text([200, 212, 230])
  doc.text('Système de Pilotage Stratégique interne · SPS-UIF', M, 94)

  let y = 140

  // ── Méta (cadre / semaine / émis le) ──
  const metaH = 42
  stroke(LINE); doc.setLineWidth(1); doc.roundedRect(M, y, cW, metaH, 4, 4, 'S')
  const col = cW / 3
  const metas: [string, string][] = [['CADRE', r.cadre], ['SEMAINE', r.semaine], ['ÉMIS LE', r.emisLe]]
  metas.forEach(([k, v], i) => {
    const x = M + col * i + 12
    if (i > 0) { stroke(LINE); doc.line(M + col * i, y, M + col * i, y + metaH) }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); text(MUTED); doc.text(k, x, y + 15)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); text(INK)
    doc.text(doc.splitTextToSize(net(v), col - 20), x, y + 29)
  })
  y += metaH + 28

  function titre(t: string) {
    doc.setFont('times', 'bold'); doc.setFontSize(12); text(NAVY); doc.text(t, M, y)
    y += 6; stroke(LINE); doc.setLineWidth(1.2); doc.line(M, y, M + cW, y); y += 16
  }
  function para(labelTxt: string, val: string) {
    if (labelTxt) { doc.setFont('helvetica', 'bold'); doc.setFontSize(9); text(MUTED); doc.text(labelTxt, M, y); y += 13 }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); text(BODY)
    const lines = doc.splitTextToSize(net(val) || '-', cW)
    doc.text(lines, M, y)
    y += lines.length * 13 + 10
  }

  // ── Actions ──
  titre(r.type === 'fin' ? 'Avancement des actions de la semaine' : 'Actions prévues cette semaine')
  if (r.actions.length === 0) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); text(MUTED); doc.text('Aucune action ciblée.', M, y); y += 20
  } else {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); text(MUTED)
    doc.text('ACTION', M, y)
    doc.text('CADRE', M + cW * 0.5, y)
    if (r.type === 'fin') { doc.text('ÉTAPE', M + cW * 0.72, y); doc.text('%', M + cW, y, { align: 'right' }) }
    y += 5; stroke(LINE); doc.setLineWidth(1.2); doc.line(M, y, M + cW, y); y += 14
    r.actions.forEach((a) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); text(INK)
      const nomLines = doc.splitTextToSize(net(a.nom), cW * 0.46)
      doc.text(nomLines, M, y)
      text(BODY); doc.setFontSize(9)
      doc.text(doc.splitTextToSize(net(a.axe), cW * 0.2), M + cW * 0.5, y)
      if (r.type === 'fin') {
        doc.setFontSize(8); text(BODY)
        doc.text(doc.splitTextToSize(net(a.etape), cW * 0.26), M + cW * 0.72, y)
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); text(NAVY)
        doc.text(`${a.pct} %`, M + cW, y, { align: 'right' })
      }
      const h = Math.max(nomLines.length, 1) * 12 + 8
      y += h; stroke(LINE); doc.setLineWidth(0.6); doc.line(M, y - 5, M + cW, y - 5)
    })
    y += 14
  }

  // ── Compte rendu (fin) ou Questions (début) ──
  if (r.type === 'fin') {
    titre('Compte rendu')
    para("Ce que j'ai accompli", r.realisations || '-')
    para('Difficultés / contraintes', r.difficultes || '-')
    para("Besoins d'appui", r.besoins || '-')
    para('Recommandations pour la suite', r.recommandations || '-')
  } else {
    titre('Questions / points à clarifier')
    para('', r.questions || '-')
  }

  // ── Documents ──
  titre('Documents joints')
  if (r.documents.length === 0) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); text(MUTED); doc.text('Aucun document.', M, y); y += 16
  } else {
    r.documents.forEach((d) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); text(NAVY)
      doc.textWithLink('• ' + net(d.nom), M, y, { url: d.url })
      y += 16
    })
  }

  // ── Pied de page ──
  stroke(LINE); doc.setLineWidth(1); doc.line(M, H - 42, W - M, H - 42)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); text(MUTED)
  doc.text("© Banque de la République d'Haïti · Unité d'Inclusion Financière", M, H - 28)
  doc.text('SPS-UIF · Page 1/1', W - M, H - 28, { align: 'right' })

  const nomFichier = `Rapport_${r.type}_${r.cadre.replace(/\s+/g, '_')}.pdf`
  doc.save(nomFichier)
}
