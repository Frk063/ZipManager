# DOSSIER_UNIFIE

## 1. Synthèse des fonctionnalités
**Mode d'emploi et livrables associés :**
Ce dépôt contient le code source de "ZipManager v2.1.2", un gestionnaire d'archives ZIP sous la forme d'une PWA (Progressive Web App) autonome (Air-Gap).
L'outil permet de :
- Créer ou synchroniser des archives (en un seul volume ou multi-volumes) directement dans le navigateur, sans utiliser le réseau, en se basant sur `zip.js`.
- Gérer intelligemment les mises à jour d'archives ZIP existantes via une méthode de type "Pass-Through" et vérification d'intégrité (CRC32).
- Tester ou Extraire les données d'archives existantes.
- Réinitialiser l'interface et la mémoire d'exécution en un clic via un nouveau bouton "Réinitialisation globale".

Livrable : L'application met à disposition les fichiers `index.html` (interface, script et logique embarquée), `sw.js` (Service Worker pour un mode Air-Gap), et `manifest.json` (configuration PWA).

## 2. Rapport d'audit de sécurité
**Vulnérabilités anticipées, criticité, correctifs appliqués :**

- **Absence de traitement "Atomique" ou Fail-safe lors de l'écriture (Criticité : Haute) :**
  - *Problème :* Le script `index.html` modifiait directement les fichiers de destination ou écrivait sans sécurité transactionnelle. Une coupure matérielle ou une erreur I/O corromprait les données.
  - *Correctif :* L'application utilise maintenant des extensions temporelles `.tmp` lors de l'écriture (création d'archive complète, mode multi-volumes, extraction de fichiers). Ces fichiers `.tmp` sont atomiquement renommés uniquement à la fin du processus. En cas de `catch` / `throw`, les `.tmp` incomplets sont supprimés (`removeEntry`).

- **Maintien des mots de passe en mémoire et RAM Purging manquant (Criticité : Modérée à Haute) :**
  - *Problème :* Les variables locales contenant le mot de passe (`pwd`) de création ou d'extraction n'étaient pas explicitement désallouées (nullifiées) en fin de tâche. L'état du DOM conservait aussi l'historique d'interface.
  - *Correctif :* Dans les blocs `finally`, la variable locale `pwd` est maintenant réaffectée à `null`. Les tableaux `filesToZip` et `filesToExtract` sont vidés. Un bouton d'action "Réinitialisation globale" a été intégré, permettant de détruire toutes les valeurs d'entrées (Input), tableaux de travail, et mots de passe afin d'assainir la mémoire et de protéger contre les accès inopportuns (Secure by Design / Zero Trust).

- **Injections et Sanitization (Criticité : Faible) :**
  - *Problème / Constat :* L'application possédait déjà une fonction de type `sanitizeFileName()` qui gère les cas les plus fréquents pour l'évitement de Path Traversal ou Zip-Slip dans les noms de fichiers. La purge des DOM renforce encore cette sécurité.

## 3. Cahier de test
**Plan de validation des fonctionnalités :**
1. **Création Atomique :** Choisir un dossier source, entrer un nom d'archive. Observer (avec les dev tools ou l'API File System) la génération d'un fichier `.tmp`. Vérifier que le fichier est bien renommé en `.zip` (ou `.z01`, etc.) uniquement à la fin sans erreur.
2. **Simulation d'erreur :** Lancer une création, simuler un arrêt I/O ou rafraîchir la page (ce qui déclenchera le `beforeunload` ou un rejet de flux). S'assurer que le système de nettoyage en bloc `catch` détruit bien les fichiers `.tmp`.
3. **Extraction Atomique :** Ouvrir une archive et lancer l'extraction vers un répertoire local. Valider que les fichiers sont temporairement suffixés `.tmp` puis correctement renommés.
4. **Purge RAM et Réinitialisation Globale :** Entrer un mot de passe et sélectionner des dossiers. Cliquer sur "Réinitialisation globale". Valider que les champs `input`, les états de mot de passe (y compris l'œil) et les variables globales sont effacés.
5. **Mode Air-Gap :** S'assurer qu'aucun appel réseau sortant non prévu n'est effectué pour les ressources critiques.

## 4. RETEX / SWOT
**Synthèse des forces, faiblesses, opportunités et menaces de cette version :**
- **Strengths (Forces) :** Une solution légère, client-side uniquement, garantissant une absence de fuite réseau de la data brute. L'implémentation de `zip.js` dans le `index.html` est ingénieuse pour des environnements contraints. La journalisation en CSV intégrée est solide.
- **Weaknesses (Faiblesses) :** Toute l'intelligence étant dans un seul fichier monolithique massif (la base64 de zip.js incluse dans l'`index.html`), le code s'avère difficile à maintenir ou à déboguer par les développeurs front.
- **Opportunities (Opportunités) :** La version atomique et PWA sécurisée (Air-Gap + CRC32 + Purge RAM) peut être labellisée "Confidentialité Maximale" et déployée massivement sans infrastructure serveur.
- **Threats (Menaces) :** L'OOM (Out-of-memory) sur le File System du navigateur (quota local limité) est préempté par une alerte mais peut causer le gel de navigateurs anciens. Les API WritableStream et FileSystem sont assujetties à des changements stricts dans les prochaines versions des navigateurs, imposant un suivi soutenu.
