# TripAssist · Documentation

Plateforme d'orchestration de voyage pilotée par IA pour les voyageurs en situation de
handicap. Le [`README.md`](../README.md) racine présente le produit et comment l'essayer ;
[`AGENTS.md`](../AGENTS.md) est la référence qui fait foi (narratif, carte du dépôt, guide de
revue). Ce dossier rassemble les documents produit et techniques approfondis.

> **Pour les évaluateurs :** [`AGENTS.md`](../AGENTS.md) contient une section « For reviewers »
> et pointe vers une skill de revue guidée
> ([`.agents/skills/review-code/SKILL.md`](../.agents/skills/review-code/SKILL.md)) qui déroule
> le code fichier par fichier.

## Produit

- [Brief produit](product/brief.md) : la vision, la proposition de valeur, la persona et les
  flux de démonstration.

## Architecture

- [Architecture technique](architecture/ARCHITECTURE.md) : **la carte technique de référence**
  (FR) : diagramme, agents, plugins open-data, tableau réel-vs-live, et comment vérifier sous
  le capot.
- [Modèle de données](architecture/data-model.md) : dictionnaire de données : entités,
  référentiel réel (codes UIC / IATA), invariants d'intégrité testés, sources de données.
- [Spécification de construction](architecture/spec.md) : la spec d'origine (jalons M1→M6,
  centrée sur le flux perturbation → re-planification), livrée et conservée comme référence.

## Guides

- [Configuration Vapi](guides/vapi-setup.md) : activer un appel téléphonique réel avec
  transcription en direct.
- [Déploiement Fly.io](guides/fly-deploy.md) : mettre l'application en ligne (build Docker,
  secrets, coût, activation des clés live).
