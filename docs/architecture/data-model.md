# AccessTrip — Modèle de données

Dictionnaire de données du système. Toutes les entités sont typées (TypeScript
strict, `shared/types.ts`), les données de référence sont réelles et vérifiables
(`shared/reference.ts`), et les invariants d'intégrité sont testés
(`server/validate.ts` + `server/validate.test.ts`).

---

## 1. Entités

### Traveler (voyageur)

| Champ                      | Type      | Notes                                                                  |
| -------------------------- | --------- | ---------------------------------------------------------------------- |
| `name`                     | string    | Nom complet                                                            |
| `age`                      | number    |                                                                        |
| `lang`                     | string    | Langue (ISO, ex. `fr`)                                                 |
| `profile_functional_needs` | string[]  | Besoins fonctionnels                                                   |
| `equipment`                | Equipment | Aide à la mobilité                                                     |
| `caregiver`                | Caregiver | Aidant (accès `read-only`)                                             |
| `emergency_contact`        | string    | Contact d'urgence (numéro **partiellement masqué**, minimisation RGPD) |

### Equipment

`type`, `model`, `weight_kg`, `battery` (spécification **conforme IATA DGR**),
`dimensions_cm` {l, w, h}. Ex. Permobil M3, 140 kg, Li-ion 25.2V non-spillable.

### Step (étape de voyage)

| Champ                       | Type       | Invariant                                                                             |
| --------------------------- | ---------- | ------------------------------------------------------------------------------------- |
| `id`                        | string     | **unique** dans le voyage                                                             |
| `title`, `provider`, `when` | string     |                                                                                       |
| `depends_on`                | string[]   | chaque id **doit exister**, pas de cycle                                              |
| `status`                    | StepStatus | ∈ {identified, contacted, confirmed, reconfirmed, in_progress, done, at_risk, failed} |
| `ref`                       | string     | **unique** dans le voyage                                                             |

### LedgerEntry (registre de confirmations)

`step` (**doit référencer une étape existante**), `confirmed_by`, `channel`,
`at`, `ref`, `notes?`, `call?` (archive d'appel : transcription + JSON extrait).

### FleetTraveler (portefeuille B2B)

`id` (**unique**), `name`, `age`, `category` (**∈ référentiel handicap**),
`profileShort`, `client` (**∈ registre clients**), `tripType`, `needs[]`,
`route`, `dates`, `confirmations` (**0 ≤ n ≤ nb d'étapes**), `steps[]` (statuts).

### Extracted (sortie structurée de l'appel)

`confirmed_by`, `role`, `room_available` (bool|null), `room_number`,
`roll_in_shower`, `bed_height_ok`, `reference`, `commitments[]`, `red_flags[]`.

---

## 2. Données de référence (réelles, vérifiables)

`shared/reference.ts` — source unique de vérité, partagée serveur + web.

| Registre       | Contenu                                                                         | Source vérifiable                         |
| -------------- | ------------------------------------------------------------------------------- | ----------------------------------------- |
| `STATIONS`     | 10 gares avec **code UIC 8 chiffres**                                           | data.sncf.com / dataset `liste-des-gares` |
| `SSR_CODES`    | Codes IATA de service spécial (WCHC, WCLB, BLND, DEAF, DPNA, MAAS, OXYG, SVAN…) | Référentiel IATA PRM/SSR                  |
| `CATEGORY_SSR` | Mapping catégorie de handicap → codes SSR                                       |                                           |
| `CLIENTS`      | 5 clients B2B typés (Assureur / Agence)                                         |                                           |
| `STANDARDS`    | Loi 2005-102 · Règlement (UE) 2021/782 · IATA DGR · EN 301 549 / WCAG 2.1 AA    | Textes officiels                          |

Exemples de codes UIC (vérifiés) : Paris Gare de Lyon `87686006`,
Nice-Ville `87756056`, Lyon Part-Dieu `87723197`, Marseille St-Charles `87751008`.

---

## 3. Invariants d'intégrité (testés)

`validateAppState(state)` renvoie la liste des violations (vide = données saines) :

1. Identifiants d'étapes uniques ; `depends_on` référence des étapes existantes ; pas de cycle.
2. Références (`ref`) uniques dans un voyage.
3. Chaque écriture du registre pointe une étape existante.
4. Statuts ∈ énumération `StepStatus`.
5. Flotte : identifiants uniques, au moins une étape, `confirmations` cohérent.
6. Chaque `client` de la flotte existe dans le registre `CLIENTS`.
7. Chaque `category` de la flotte est mappée à au moins un code SSR.
8. Chaque code UIC du référentiel gares est un entier à 8 chiffres.

Couverture : `server/validate.test.ts` (le seed passe tous les invariants + un état
volontairement cassé est bien rejeté).

---

## 4. Sources de données temps réel (open data)

| Plugin               | Donnée                                           | API                                   |
| -------------------- | ------------------------------------------------ | ------------------------------------- |
| `plugins/sncf.ts`    | Régularité axe Sud-Est · assistance PMR par gare | data.sncf.com (Opendatasoft v2.1)     |
| `plugins/weather.ts` | Météo réelle de Nice                             | Open-Meteo                            |
| `plugins/osm.ts`     | Lieux `wheelchair=yes` près de Nice              | OpenStreetMap / Overpass              |
| `plugins/navitia.ts` | Trajet Paris→Nice temps réel + perturbations     | Navitia / api.sncf.com (token requis) |

Toutes ces intégrations ont **timeout + cache + repli** : la démo ne dépend jamais du réseau.

---

## 5. Qualité logicielle

TypeScript strict · Vitest (tests unitaires) · ESLint (flat config) · Prettier ·
hooks Lefthook (pre-commit : format + lint ; pre-push : typecheck + tests).
`pnpm typecheck && pnpm test` doit passer avant tout push.
