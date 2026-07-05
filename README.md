<div align="center">

# TripAssist

**L'accessibilité du voyage, garantie et tracée, orchestrée par l'IA.**

_Un agent IA sécurise chaque maillon d'un trajet pour une personne en situation de handicap,
avant le départ, en appelant lui-même les prestataires et en consignant chaque confirmation._

</div>

---

## Le problème

Pour une personne en situation de handicap, un voyage n'est pas une suite de réservations :
c'est une chaîne de dépendances fragiles. Un fauteuil qui ne peut pas embarquer, une chambre
sans douche à l'italienne, un taxi non adapté, et tout l'aval s'effondre. Aujourd'hui, la charge
de vérifier, rappeler, re-confirmer et trouver des solutions repose entièrement sur le voyageur
ou son aidant. Une confirmation obtenue à J-14 n'a aucune valeur si personne ne la re-confirme.

## La solution

TripAssist transforme cette chaîne passive en un système vivant et traçable. **Dès qu'un voyage
est réservé, un agent IA prend la main :** il lit l'itinéraire, **appelle de lui-même les
prestataires** (l'aéroport pour l'assistance fauteuil, l'hôtel pour la douche à l'italienne),
obtient des confirmations structurées, et les inscrit à un registre. Le voyageur ne court plus
après personne : il reçoit simplement la preuve que tout est en place.

Trois promesses :

- **Traçabilité.** Chaque étape possède un registre de confirmations (qui a confirmé quoi, par
  quel canal, quand, avec quelle référence). C'est une preuve d'accessibilité, pas une simple
  réservation.
- **Proactivité.** L'IA sécurise l'accessibilité **avant le départ**, sans attendre que le
  voyageur s'en inquiète.
- **Résilience.** Si un imprévu menace un maillon (retard SNCF, chambre réattribuée), un agent
  re-planifie sans jamais transiger sur les besoins d'accessibilité, puis rappelle pour
  re-confirmer.

## Essayer TripAssist

> **Le meilleur moyen de découvrir TripAssist est la démo hébergée.** Les fonctions les plus
> riches (raisonnement Claude réel, appel vocal en direct) reposent sur des clés d'API délicates
> à provisionner en local. La démo en ligne les a déjà branchées, et elle inclut **l'appel
> vocal dans le navigateur** : vous jouez le rôle du prestataire au bout du fil, en direct.

**➡️ Démo en ligne : `<URL_DEMO>`** _(l'expérience recommandée, avec l'appel vocal web)_

Ce que vous pouvez y faire :

- suivre un voyage se sécuriser étape par étape, en temps réel ;
- **passer / recevoir l'appel IA dans votre navigateur** et voir la transcription défiler ;
- lire le registre de confirmations, les données open-data réelles (SNCF, météo, lieux
  accessibles), et le raisonnement des agents.

L'exécution locale est bien sûr possible et pleinement supportée (voir plus bas), mais sans clés
elle bascule sur des données de référence vérifiées et un appel scripté : parfait pour lire et
tester le code, moins pour ressentir le produit branché en réel.

## Ce que fait le produit

- **Ingestion de réservation.** Un texte de réservation libre devient un trajet structuré
  (étapes, dépendances, besoins d'accessibilité).
- **Agents IA que l'on voit travailler.** Planificateur, extracteur, vision, veille, appelant :
  chacun narre son raisonnement en direct.
- **Appel téléphonique réel.** L'IA appelle un prestataire (par téléphone ou dans le
  navigateur), mène la conversation en français, en extrait une confirmation structurée et
  l'archive.
- **Vérification par vision.** Une photo d'un lieu est comparée aux besoins du voyageur ; l'IA
  rend un verdict argumenté (« ressaut de douche estimé à 15 cm, non conforme »).
- **Données ouvertes réelles.** Régularité SNCF, assistance PMR en gare, lieux accessibles
  (OpenStreetMap), météo, trajets, itinéraires fauteuil : sept flux, chacun avec repli vérifié.
- **Registre et rapport.** Une piste d'audit imprimable de toute l'accessibilité du voyage.

## La persona

Toute la démonstration s'articule autour d'une voyageuse et d'un trajet, pour une expérience
nette et reproductible.

**Camille Moreau**, 34 ans, fauteuil roulant électrique (Permobil M3). Besoins : itinéraire sans
marche, douche à l'italienne, assistance à l'embarquement et au débarquement. Trajet :
**Paris → Nice**. Interface et voix **en français**.

## L'accessibilité comme produit

L'accessibilité n'est pas une finition, c'est l'exigence centrale, y compris pour l'application
elle-même : HTML sémantique, contraste **WCAG AA**, navigation **100 % clavier**, focus visible,
`aria-live` sur les régions dynamiques, `prefers-reduced-motion` respecté, thème clair/sombre.
L'application est conçue pour être utilisée au lecteur d'écran.

## Pour aller plus loin

Ce README présente le produit et son intention. Toute la technique vit sous [`docs/`](docs/) et
dans [`AGENTS.md`](AGENTS.md) :

- **[`AGENTS.md`](AGENTS.md)** : la référence qui fait foi (narratif, carte du dépôt) et un guide
  de revue pour les évaluateurs (humains ou agents IA).
- **[`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md)** : la carte
  technique : diagramme, agents, plugins open-data, tableau réel-vs-live, comment vérifier.
- **[`docs/architecture/data-model.md`](docs/architecture/data-model.md)** : le modèle de
  données et les invariants d'intégrité.
- **[`docs/product/brief.md`](docs/product/brief.md)** : le brief produit complet.
- **[`docs/guides/vapi-setup.md`](docs/guides/vapi-setup.md)** : activer l'appel téléphonique
  réel.

## Développement local

Application unique : un process Node (Express, SSE, agents, SQLite) qui sert l'API et le front
React. Les outils sont invoqués via `node node_modules/...` (le `:` du chemin de travail casse
le shim de `.bin`).

```bash
pnpm install
pnpm dev           # Express (3000) + Vite (5173), ouvrir http://localhost:5173
pnpm test          # 94 tests (Vitest)
pnpm typecheck     # TypeScript strict, front + back
```

Copiez `.env.example` → `.env` pour activer les modes live (Claude, Vapi, tokens open-data).
Sans clés, l'application tourne hors-ligne avec des données de référence vérifiées : rien ne se
casse.

---

<div align="center">
<sub>TripAssist, parce qu'un voyageur ne devrait jamais avoir à prouver son droit à voyager.</sub>
</div>
