<div align="center">

# TripAssist

### Un voyage accessible **garanti et traçable**, et non quelque chose que le voyageur doit courir après.

TripAssist est un agent IA qui sécurise l'accessibilité de bout en bout **avant le départ**. Dès
qu'un voyage est réservé, il lit l'itinéraire et **appelle lui-même les prestataires** :
l'aéroport pour l'assistance en fauteuil roulant, l'hôtel pour une douche accessible de
plain-pied. Il obtient des confirmations structurées et les enregistre toutes. Le voyageur n'a
plus qu'à recevoir la bonne nouvelle.

**[▶ Voir l'histoire de Camille](https://shbernal.github.io/TripAssist/)** &nbsp;·&nbsp; **[▶ Ouvrir le tableau de bord opérateur](https://shbernal.github.io/TripAssist/dashboard/)**

</div>

---

### L'agent passe les appels. Camille reçoit simplement les confirmations.

[![L'histoire : l'agent appelle l'aéroport, puis Camille reçoit deux confirmations sur son téléphone](./public/media/story.gif)](https://shbernal.github.io/TripAssist/)

_Une histoire animée : l'agent reçoit l'itinéraire Paris → Nice de Camille, **appelle
l'aéroport** pour l'assistance à l'embarquement, **appelle l'hôtel** pour une douche accessible
de plain-pied, et elle reçoit **deux confirmations sur son téléphone**. Rien à organiser, rien à
expliquer._

### Un opérateur, vingt voyageurs, chaque garantie suivie.

[![Le tableau de bord opérateur : une visite guidée du panorama du groupe, des confirmations proactives, du suivi par voyageur et du registre d'audit](./public/media/dashboard.gif)](https://shbernal.github.io/TripAssist/dashboard/)

_Un voyagiste qui gère environ 20 seniors et voyageurs en situation de handicap sur le même
voyage. Une visite guidée parcourt le panorama du groupe, les confirmations proactives des
prestataires, le suivi des garanties par voyageur, et un **registre d'audit traçable**. Camille
est la voyageuse n°1, ce qui relie les deux vues._

---

## Pourquoi c'est important

Aujourd'hui, le voyage accessible repose sur le travail du voyageur lui-même : une série
d'appels aux compagnies aériennes, aux aéroports et aux hôtels, chacun répété, rien de garanti,
et aucune preuve au bout du compte. Une seule confirmation perdue peut laisser quelqu'un bloqué
à une porte d'embarquement ou dans une chambre qu'il ne peut pas utiliser.

TripAssist inverse la logique :

- **Proactif.** L'agent sécurise l'accessibilité dès la réservation, avant le départ, sans
  attendre qu'on le lui demande.
- **Garanti.** Chaque besoin est suivi jusqu'à un résultat confirmé, et non laissé à l'état de
  simple demande pleine d'espoir.
- **Traçable.** Chaque confirmation est enregistrée avec le prestataire, la référence et
  l'horodatage. L'accessibilité devient prouvable, pas seulement promise.

Persona : **Camille Moreau**, 34 ans, fauteuil roulant électrique. Voyage : **Paris → Nice**.
Interface et voix en **français**.

## L'accessibilité est le produit

Pas une touche finale : les démos sont elles-mêmes accessibles. **WCAG AA**, navigation complète
au clavier, focus visible, `prefers-reduced-motion` respecté, `aria-live` sur les régions
dynamiques, points de repère sémantiques. La page d'histoire obtient un score **Lighthouse
accessibilité 100/100** ; la visite guidée du tableau de bord est pilotable au clavier avec un
piège de focus et des changements d'étape annoncés.

## Les deux démos

| Démo                                            | Ce que c'est                                                                                           | En ligne                                               |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| **Page d'histoire** (`src/story`)               | Une histoire animée en sept scènes d'un seul voyage, du point de vue du voyageur.                      | **<https://shbernal.github.io/TripAssist/>**           |
| **Tableau de bord opérateur** (`src/dashboard`) | La salle de contrôle d'un voyagiste, adossée à des données fictives, avec une visite guidée d'accueil. | **<https://shbernal.github.io/TripAssist/dashboard/>** |

Les deux sont **statiques, sans clé et déterministes** : tous les médias générés par IA
(visages, audio des appels) sont commités, si bien qu'ils se construisent et se déploient sans
aucun secret. Les deux se renvoient l'un vers l'autre pour que vous puissiez passer de
l'histoire individuelle à la vue opérateur.

---

## Les branches Concept et Demo

Le projet vit sur deux branches, chacune avec un rôle clair et distinct.

- **`concept`** : la **branche concept** (cette branche, celle par défaut). Deux démos
  statiques et soignées qui montrent ce que fait TripAssist et pourquoi c'est important : la
  page d'histoire et le tableau de bord opérateur, déployées sur GitHub Pages. Pas de backend,
  pas de clés, rien à installer : cela fonctionne simplement dans un navigateur. C'est ce que
  lisent les évaluateurs.

- **`mvp`** : la **branche demo**. Le même produit construit pour fonctionner réellement:
  Express + React avec des agents Claude qui passent les vrais appels aux prestataires (Vapi),
  des plugins de données ouvertes, et un registre SQLite pour les confirmations. Elle nécessite
  des clés API et un serveur en fonctionnement. C'est là que vit le logiciel fonctionnel, et où
  se poursuit tout le travail fonctionnel futur.

En bref : **`concept` montre la vision, `mvp` la fait tourner.** Les garder séparées permet à la
vitrine de rester un site statique propre et autonome pendant que le système fonctionnel évolue
de son côté.

Narratif canonique, carte du dépôt et conventions : [`AGENTS.md`](AGENTS.md). Docs par point
d'entrée : [`src/story/README.md`](src/story/README.md) ·
[`src/dashboard/README.md`](src/dashboard/README.md).
