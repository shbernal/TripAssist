import type { Confirmation, ConfirmationKind, ConfirmationStatus, Traveler } from './types'

// ── The operator (the "chief" who bought TripAssist) ────────────────────────
export const operator = {
  name: 'Sylvie Lambert',
  role: 'Responsable groupes',
  agency: 'Évasion Sereine',
  agencyTagline: 'Voyages accompagnés · seniors & personnes à mobilité réduite',
} as const

// ── The group trip ──────────────────────────────────────────────────────────
export const trip = {
  origin: 'Paris',
  originCode: 'CDG',
  destination: 'Nice',
  destinationCode: 'NCE',
  departDate: '18 juillet 2026',
  returnDate: '25 juillet 2026',
  legs: [
    { label: 'Assistance & embarquement', place: 'Aéroport Paris-Charles-de-Gaulle' },
    { label: 'Vol AF · CDG → NCE', place: '1 h 35 de vol' },
    { label: 'Transfert adapté', place: 'Aéroport de Nice → hôtel' },
    { label: 'Séjour · 7 nuits', place: 'Hôtel Aston La Scala, Nice' },
  ],
} as const

// ── Providers the agent called ──────────────────────────────────────────────
const PROVIDER = {
  airport: 'Aéroports de Paris · Assistance PMR (CDG)',
  hotel: 'Hôtel Aston La Scala ★★★★ · Nice',
  transfer: 'Riviera Access · Transfert adapté',
} as const

const LABEL: Record<ConfirmationKind, string> = {
  airport: 'Assistance aéroport',
  hotel: 'Hébergement adapté',
  transfer: 'Transfert porte-à-porte',
}

const REF_PREFIX: Record<ConfirmationKind, string> = {
  airport: 'ADP-PMR',
  hotel: 'ASL-ACC',
  transfer: 'RA-TR',
}

// Deterministic reference numbers so the "traceable registry" reads real.
let seq = 4820
const nextRef = (kind: ConfirmationKind) => `${REF_PREFIX[kind]}-${seq++}`

const conf = (
  kind: ConfirmationKind,
  status: ConfirmationStatus,
  detail: string,
  at: string,
  note?: string,
): Confirmation => ({
  kind,
  status,
  label: LABEL[kind],
  provider: PROVIDER[kind],
  detail,
  reference: nextRef(kind),
  at,
  note,
})

// ── The roster ──────────────────────────────────────────────────────────────
// ~20 travelers, a realistic senior + PWD mix. Camille Moreau (the traveler from
// the story landing page) is traveler #1: the two demos are the same trip seen
// from the individual's side and the operator's side.
export const travelers: Traveler[] = [
  {
    id: 'camille-moreau',
    name: 'Camille Moreau',
    age: 34,
    category: 'Fauteuil roulant',
    profile: 'Fauteuil électrique · Permobil M3',
    needs: ['Embarquement assisté (WCHC)', 'Douche à l’italienne', 'Transfert sans marche'],
    confirmations: [
      conf(
        'airport',
        'confirmed',
        'Assistance WCHC, fauteuil accompagné porte-à-porte',
        '3 juil., 14:02',
      ),
      conf(
        'hotel',
        'confirmed',
        'Chambre PMR, douche à l’italienne (siège mural)',
        '3 juil., 14:09',
      ),
      conf('transfer', 'confirmed', 'Véhicule à plancher surbaissé, rampe', '3 juil., 14:15'),
    ],
  },
  {
    id: 'marc-dubois',
    name: 'Marc Dubois',
    age: 61,
    category: 'Déficience auditive',
    profile: 'Malentendant · appareillé',
    needs: ['Annonces visuelles', 'Alerte vibrante en chambre'],
    confirmations: [
      conf(
        'airport',
        'confirmed',
        'Notifications visuelles porte d’embarquement',
        '3 juil., 14:20',
      ),
      conf(
        'hotel',
        'confirmed',
        'Kit chambre sourds : réveil vibrant, alerte incendie lumineuse',
        '3 juil., 14:26',
      ),
      conf('transfer', 'confirmed', 'Chauffeur briefé communication écrite', '3 juil., 14:31'),
    ],
  },
  {
    id: 'fatima-benali',
    name: 'Fatima Benali',
    age: 58,
    category: 'Déficience visuelle',
    profile: 'Déficience visuelle · chien guide',
    needs: ['Chien guide accepté', 'Accompagnement en aérogare'],
    confirmations: [
      conf(
        'airport',
        'confirmed',
        'Chien guide autorisé cabine, accompagnement dédié',
        '3 juil., 14:35',
      ),
      conf('hotel', 'confirmed', 'Chien guide accepté, chambre au calme', '3 juil., 14:40'),
      conf('transfer', 'confirmed', 'Chien guide à bord, chauffeur informé', '3 juil., 14:44'),
    ],
  },
  {
    id: 'jean-pierre-martin',
    name: 'Jean-Pierre Martin',
    age: 74,
    category: 'Condition chronique',
    profile: 'Mobilité réduite · oxygène médical',
    needs: ['Oxygène médical à bord', 'Fauteuil longues distances (WCHR)'],
    confirmations: [
      conf(
        'airport',
        'attention',
        'Oxygène à bord, formulaire médical MEDIF à retourner par le voyageur',
        '3 juil., 15:01',
        'Action requise : joindre le certificat médical du Dr Aubry (délai compagnie : 48 h avant vol).',
      ),
      conf('hotel', 'confirmed', 'Concentrateur d’oxygène en chambre réservé', '3 juil., 15:06'),
      conf('transfer', 'confirmed', 'Transport avec bouteille d’appoint', '3 juil., 15:10'),
    ],
  },
  {
    id: 'elise-rousseau',
    name: 'Élise Rousseau',
    age: 47,
    category: 'Condition chronique',
    profile: 'Sclérose en plaques · fatigabilité',
    needs: ['Fauteuil aéroport', 'Temps de repos planifiés'],
    confirmations: [
      conf('airport', 'confirmed', 'Assistance WCHR, embarquement prioritaire', '3 juil., 15:15'),
      conf('hotel', 'confirmed', 'Chambre proche ascenseur, programme allégé', '3 juil., 15:19'),
      conf('transfer', 'confirmed', 'Trajet direct, sans correspondance', '3 juil., 15:23'),
    ],
  },
  {
    id: 'nathalie-petit',
    name: 'Nathalie Petit',
    age: 52,
    category: 'Mobilité réduite',
    profile: 'Prothèse de hanche · canne',
    needs: ['Pas d’escaliers', 'Siège prioritaire'],
    confirmations: [
      conf(
        'airport',
        'confirmed',
        'Parcours sans marche, siège avec accoudoir relevable',
        '3 juil., 15:28',
      ),
      conf('hotel', 'confirmed', 'Chambre de plain-pied, barres d’appui', '3 juil., 15:33'),
      conf('transfer', 'confirmed', 'Accès sans marche', '3 juil., 15:36'),
    ],
  },
  {
    id: 'lea-girard',
    name: 'Léa Girard',
    age: 29,
    category: 'Trouble cognitif',
    profile: 'Trouble du spectre autistique',
    needs: ['Environnement calme', 'Embarquement anticipé'],
    confirmations: [
      conf(
        'airport',
        'confirmed',
        'Embarquement anticipé, parcours coupe-file sensoriel',
        '3 juil., 15:41',
      ),
      conf(
        'hotel',
        'pending',
        'Chambre au calme, loin de l’ascenseur',
        '3 juil., 15:45',
        'En cours : l’hôtel confirme l’attribution définitive de la chambre 208 sous 24 h.',
      ),
      conf('transfer', 'confirmed', 'Petit véhicule, trajet sans arrêt', '3 juil., 15:49'),
    ],
  },
  {
    id: 'robert-lefevre',
    name: 'Robert Lefèvre',
    age: 78,
    category: 'Mobilité réduite',
    profile: 'Marche difficile · déambulateur',
    needs: ['Fauteuil aéroport (WCHR)', 'Chambre PMR'],
    confirmations: [
      conf(
        'airport',
        'confirmed',
        'Assistance WCHR de l’enregistrement à la porte',
        '3 juil., 15:54',
      ),
      conf('hotel', 'confirmed', 'Chambre PMR, déambulateur autorisé', '3 juil., 15:58'),
      conf('transfer', 'confirmed', 'Accès rampe, rangement déambulateur', '3 juil., 16:02'),
    ],
  },
  {
    id: 'suzanne-morel',
    name: 'Suzanne Morel',
    age: 81,
    category: 'Fauteuil roulant',
    profile: 'Fauteuil manuel',
    needs: ['Assistance WCHC', 'Douche à l’italienne'],
    confirmations: [
      conf('airport', 'confirmed', 'Assistance WCHC, fauteuil en soute étiqueté', '3 juil., 16:07'),
      conf('hotel', 'confirmed', 'Chambre PMR, douche à l’italienne', '3 juil., 16:11'),
      conf('transfer', 'confirmed', 'Véhicule accessible, arrimage fauteuil', '3 juil., 16:15'),
    ],
  },
  {
    id: 'antoine-faure',
    name: 'Antoine Faure',
    age: 66,
    category: 'Déficience visuelle',
    profile: 'Basse vision',
    needs: ['Accompagnement en aérogare', 'Documents en gros caractères'],
    confirmations: [
      conf(
        'airport',
        'confirmed',
        'Accompagnement dédié, cartes d’embarquement gros caractères',
        '3 juil., 16:20',
      ),
      conf('hotel', 'confirmed', 'Signalétique chambre contrastée', '3 juil., 16:24'),
      conf('transfer', 'confirmed', 'Chauffeur assiste à la montée', '3 juil., 16:27'),
    ],
  },
  {
    id: 'helene-bernard',
    name: 'Hélène Bernard',
    age: 70,
    category: 'Déficience auditive',
    profile: 'Sourde · langue des signes (LSF)',
    needs: ['Assistance en LSF au comptoir', 'Alertes visuelles'],
    confirmations: [
      conf(
        'airport',
        'pending',
        'Créneau d’accompagnement LSF au comptoir assistance',
        '3 juil., 16:32',
        'En cours : ADP réserve un agent formé LSF ; confirmation attendue avant le 10 juil.',
      ),
      conf('hotel', 'confirmed', 'Kit chambre sourds, réception avec tablette', '3 juil., 16:36'),
      conf('transfer', 'confirmed', 'Consignes écrites remises au chauffeur', '3 juil., 16:40'),
    ],
  },
  {
    id: 'michel-garnier',
    name: 'Michel Garnier',
    age: 69,
    category: 'Condition chronique',
    profile: 'Insuffisance cardiaque',
    needs: ['Fauteuil longues distances', 'Effort limité'],
    confirmations: [
      conf(
        'airport',
        'confirmed',
        'Assistance WCHR, aucun trajet à pied prolongé',
        '3 juil., 16:45',
      ),
      conf('hotel', 'confirmed', 'Chambre au 1er étage, proche ascenseur', '3 juil., 16:49'),
      conf('transfer', 'confirmed', 'Trajet direct climatisé', '3 juil., 16:52'),
    ],
  },
  {
    id: 'christine-roux',
    name: 'Christine Roux',
    age: 63,
    category: 'Mobilité réduite',
    profile: 'Arthrose sévère',
    needs: ['Pas d’escaliers', 'Siège avec espace jambes'],
    confirmations: [
      conf(
        'airport',
        'confirmed',
        'Parcours sans marche, siège avec espace supplémentaire',
        '4 juil., 09:05',
      ),
      conf('hotel', 'confirmed', 'Chambre de plain-pied', '4 juil., 09:09'),
      conf('transfer', 'confirmed', 'Accès sans marche', '4 juil., 09:12'),
    ],
  },
  {
    id: 'paul-mercier',
    name: 'Paul Mercier',
    age: 75,
    category: 'Fauteuil roulant',
    profile: 'Fauteuil électrique',
    needs: ['Assistance WCHC', 'Douche à l’italienne', 'Transfert adapté'],
    confirmations: [
      conf('airport', 'confirmed', 'Assistance WCHC, batterie fauteuil déclarée', '4 juil., 09:18'),
      conf(
        'hotel',
        'attention',
        'Chambre à douche à l’italienne : conflit de réservation',
        '4 juil., 09:22',
        'Action requise : l’unique chambre à douche à l’italienne restante est double-réservée. L’agent a escaladé auprès du directeur ; décision attendue.',
      ),
      conf(
        'transfer',
        'confirmed',
        'Véhicule surbaissé, arrimage fauteuil électrique',
        '4 juil., 09:26',
      ),
    ],
  },
  {
    id: 'yvonne-lambert',
    name: 'Yvonne Lambert',
    age: 84,
    category: 'Mobilité réduite',
    profile: 'Grand âge · fragilité',
    needs: ['Assistance permanente', 'Rythme lent'],
    confirmations: [
      conf('airport', 'confirmed', 'Assistance WCHR, accompagnement continu', '4 juil., 09:31'),
      conf('hotel', 'confirmed', 'Chambre PMR, service en chambre', '4 juil., 09:35'),
      conf('transfer', 'confirmed', 'Montée assistée, trajet lent', '4 juil., 09:38'),
    ],
  },
  {
    id: 'karim-haddad',
    name: 'Karim Haddad',
    age: 41,
    category: 'Fauteuil roulant',
    profile: 'Paraplégie · fauteuil manuel',
    needs: ['Assistance WCHC', 'Chambre PMR', 'Transfert adapté'],
    confirmations: [
      conf('airport', 'confirmed', 'Assistance WCHC, transfert cabine assisté', '4 juil., 09:43'),
      conf('hotel', 'confirmed', 'Chambre PMR, lit à hauteur adaptée', '4 juil., 09:47'),
      conf('transfer', 'confirmed', 'Véhicule à rampe, arrimage', '4 juil., 09:50'),
    ],
  },
  {
    id: 'denise-fontaine',
    name: 'Denise Fontaine',
    age: 77,
    category: 'Trouble cognitif',
    profile: 'Maladie d’Alzheimer débutante',
    needs: ['Accompagnement constant', 'Chambre facilement repérable'],
    confirmations: [
      conf('airport', 'confirmed', 'Accompagnement dédié, voyage avec aidant', '4 juil., 09:55'),
      conf('hotel', 'confirmed', 'Chambre repérable près de la réception', '4 juil., 09:59'),
      conf('transfer', 'confirmed', 'Trajet accompagné', '4 juil., 10:02'),
    ],
  },
  {
    id: 'georges-chevalier',
    name: 'Georges Chevalier',
    age: 72,
    category: 'Déficience visuelle',
    profile: 'Cécité · canne blanche',
    needs: ['Accompagnement de bout en bout', 'Repérage des lieux'],
    confirmations: [
      conf(
        'airport',
        'confirmed',
        'Accompagnement dédié de l’enregistrement au siège',
        '4 juil., 10:07',
      ),
      conf('hotel', 'confirmed', 'Visite guidée de la chambre à l’arrivée', '4 juil., 10:11'),
      conf(
        'transfer',
        'pending',
        'Véhicule adapté avec chauffeur briefé accompagnement',
        '4 juil., 10:15',
        'En cours : Riviera Access affecte un chauffeur formé à l’accompagnement des personnes aveugles.',
      ),
    ],
  },
  {
    id: 'monique-dupuis',
    name: 'Monique Dupuis',
    age: 68,
    category: 'Condition chronique',
    profile: 'BPCO · oxygénothérapie',
    needs: ['Oxygène à bord', 'Effort limité'],
    confirmations: [
      conf(
        'airport',
        'confirmed',
        'Oxygène à bord validé (MEDIF reçu), assistance WCHR',
        '4 juil., 10:20',
      ),
      conf('hotel', 'confirmed', 'Concentrateur d’oxygène en chambre', '4 juil., 10:24'),
      conf('transfer', 'confirmed', 'Trajet direct avec oxygène d’appoint', '4 juil., 10:27'),
    ],
  },
  {
    id: 'andre-lemaire',
    name: 'André Lemaire',
    age: 79,
    category: 'Mobilité réduite',
    profile: 'Séquelles d’AVC · hémiplégie',
    needs: ['Fauteuil aéroport', 'Chambre PMR', 'Assistance aux repas'],
    confirmations: [
      conf('airport', 'confirmed', 'Assistance WCHR, transfert assisté', '4 juil., 10:32'),
      conf('hotel', 'confirmed', 'Chambre PMR, barres d’appui, aide aux repas', '4 juil., 10:36'),
      conf('transfer', 'confirmed', 'Montée assistée, arrimage', '4 juil., 10:39'),
    ],
  },
]
