// Reference master data — the "referentiel" behind AccessTrip. Every value here is
// real and verifiable (SNCF UIC station codes, IATA PRM/SSR codes, EU/FR regulations),
// so the data holds up under scrutiny. Shared by the server (seed + validation) and
// the web (passport rendering) so there is a single source of truth.

// --- SNCF stations (UIC codes verified against data.sncf.com/liste-des-gares) ---

export interface Station {
  uic: string // 8-digit UIC code (RICS 87 = SNCF)
  name: string
  city: string
}

export const STATIONS: Record<string, Station> = {
  'paris-gare-de-lyon': { uic: '87686006', name: 'Paris Gare de Lyon', city: 'Paris' },
  'nice-ville': { uic: '87756056', name: 'Nice-Ville', city: 'Nice' },
  'lyon-part-dieu': { uic: '87723197', name: 'Lyon Part-Dieu', city: 'Lyon' },
  'bordeaux-st-jean': { uic: '87581009', name: 'Bordeaux Saint-Jean', city: 'Bordeaux' },
  'marseille-st-charles': { uic: '87751008', name: 'Marseille Saint-Charles', city: 'Marseille' },
  'lille-flandres': { uic: '87286005', name: 'Lille Flandres', city: 'Lille' },
  'strasbourg-ville': { uic: '87212027', name: 'Strasbourg', city: 'Strasbourg' },
  nantes: { uic: '87481002', name: 'Nantes', city: 'Nantes' },
  'toulouse-matabiau': { uic: '87611004', name: 'Toulouse Matabiau', city: 'Toulouse' },
  rennes: { uic: '87471003', name: 'Rennes', city: 'Rennes' },
}

export function stationByCity(city: string): Station | undefined {
  return Object.values(STATIONS).find((s) => s.city.toLowerCase() === city.toLowerCase())
}

// --- IATA PRM / SSR codes (special service request codes used by carriers) ------

export type DisabilityCategory =
  | 'Moteur'
  | 'Auditif'
  | 'Visuel'
  | 'Cognitif'
  | 'Chronique'
  | 'Âge / Médical'
  | 'Temporaire'
  | 'Sensoriel'

export interface SsrCode {
  code: string
  label: string
}

export const SSR_CODES: Record<string, SsrCode> = {
  WCHR: { code: 'WCHR', label: 'Fauteuil — peut marcher sur de courtes distances (rampe)' },
  WCHS: { code: 'WCHS', label: "Fauteuil — ne peut pas monter/descendre d'escaliers" },
  WCHC: { code: 'WCHC', label: 'Fauteuil — immobile, assistance complète requise' },
  WCBW: { code: 'WCBW', label: 'Fauteuil à batterie liquide (wet cell)' },
  WCLB: { code: 'WCLB', label: 'Fauteuil à batterie lithium' },
  WCMP: { code: 'WCMP', label: 'Fauteuil manuel personnel' },
  BLND: { code: 'BLND', label: 'Déficience visuelle / cécité' },
  DEAF: { code: 'DEAF', label: 'Déficience auditive / surdité' },
  DPNA: { code: 'DPNA', label: 'Handicap intellectuel/développemental, assistance requise' },
  MAAS: { code: 'MAAS', label: 'Assistance à la personne (meet & assist)' },
  OXYG: { code: 'OXYG', label: 'Oxygène médical requis' },
  SVAN: { code: 'SVAN', label: "Chien guide / d'assistance" },
  MEDA: { code: 'MEDA', label: 'Cas médical' },
}

// Map an internal disability category to the standard SSR codes a carrier would use.
export const CATEGORY_SSR: Record<DisabilityCategory, string[]> = {
  Moteur: ['WCHC', 'WCLB', 'MAAS'],
  Auditif: ['DEAF'],
  Visuel: ['BLND', 'SVAN'],
  Cognitif: ['DPNA', 'MAAS'],
  Chronique: ['MEDA', 'MAAS'],
  'Âge / Médical': ['MAAS', 'OXYG'],
  Temporaire: ['WCHS', 'MAAS'],
  Sensoriel: ['DEAF', 'BLND', 'MAAS'],
}

export function ssrForCategory(category: string): SsrCode[] {
  const codes = CATEGORY_SSR[category as DisabilityCategory] ?? ['MAAS']
  return codes.map((c) => SSR_CODES[c]).filter((x): x is SsrCode => Boolean(x))
}

// --- B2B clients (insurers / travel agencies) -----------------------------------

export interface ClientOrg {
  name: string
  type: 'Assureur' | 'Agence de voyage'
}

export const CLIENTS: Record<string, ClientOrg> = {
  'AXA Assistance': { name: 'AXA Assistance', type: 'Assureur' },
  'Groupama Voyage': { name: 'Groupama Voyage', type: 'Assureur' },
  'MAIF Assistance': { name: 'MAIF Assistance', type: 'Assureur' },
  "Handi'Tour": { name: "Handi'Tour", type: 'Agence de voyage' },
  'Voyages Accessibles SA': { name: 'Voyages Accessibles SA', type: 'Agence de voyage' },
}

// --- Regulatory / standards references (real texts) -----------------------------

export interface Standard {
  ref: string
  title: string
}

export const STANDARDS: Standard[] = [
  { ref: 'Loi n° 2005-102', title: 'Égalité des droits et des chances des personnes handicapées' },
  { ref: 'Règlement (UE) 2021/782', title: 'Droits et obligations des voyageurs ferroviaires' },
  { ref: 'IATA DGR', title: 'Transport des aides à la mobilité à batterie (lithium ≤ 300 Wh)' },
  { ref: 'EN 301 549 / WCAG 2.1 AA', title: "Accessibilité numérique de l'application" },
]
