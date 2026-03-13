# DOSSIER_UNIFIE

## 1. Synthèse des fonctionnalités
**Mode d'emploi et livrables associés :**
Ce dépôt contient le code source de "ZipManager v2.1.3", un gestionnaire d'archives ZIP sous la forme d'une PWA (Progressive Web App) autonome (Air-Gap).
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
**Protocole pas-à-pas ultra précis de validation RedTeam :**

1. **Vérification de la Création Atomique (Fail-Safe) :**
   - Lancer l'application (`python3 -m http.server 8000`).
   - Ouvrir les DevTools (F12) du navigateur.
   - Sélectionner un dossier source volumineux via le bouton "1. SÉLECTIONNER DOSSIER SOURCE".
   - Saisir un nom d'archive (ex: `TestAtomic`).
   - Lancer le traitement ("2. CHOISIR DESTINATION ET TRAITER") et sélectionner un dossier de destination.
   - PENDANT l'écriture, inspecter le dossier de destination dans votre explorateur de fichiers OS : valider la présence de `TestAtomic.zip.tmp`.
   - Attendre la fin du processus. Vérifier que le fichier `TestAtomic.zip.tmp` a été renommé instantanément en `TestAtomic.zip`.

2. **Vérification de la Résilience aux Crashs (Disaster Recovery) :**
   - Reprendre l'étape 1.
   - PENDANT l'écriture (quand la barre de progression avance), forcer la fermeture de la page ou simuler une déconnexion matérielle du SSD virtuel.
   - Ouvrir le dossier de destination : s'assurer que le système a intercepté l'interruption ou que le bloc `catch` (via simulation d'erreur logicielle) a correctement effacé le fichier résiduel `.tmp`.

3. **Vérification de la Purge RAM (Sanitization) :**
   - Ouvrir l'application.
   - Saisir un mot de passe dans "Mot de passe - Optionnel" (ex: `Secret123!`).
   - Cocher "Afficher" pour valider qu'il est en mémoire vive dans le DOM.
   - Sélectionner des fichiers bidons pour peupler les variables `filesToZip` (création) et `filesToExtract` (action).
   - Cliquer sur le nouveau bouton rouge "🔄 Réinitialisation globale" en haut de la page.
   - Résultat attendu : Les champs de mot de passe sont vides et le type de l'input est réinitialisé (masqué). Les fichiers sélectionnés sont effacés (`0 fichier(s) prêt(s)`). Une recherche de `Secret123!` dans la heap memory via les DevTools ne doit remonter que l'input initial et aucune variable de rétention.

4. **Vérification de l'Extraction Atomique :**
   - Uploader une archive `.zip` saine.
   - Sélectionner "Extraire vers dossier local".
   - Lancer l'extraction et choisir un répertoire.
   - S'assurer (via explorateur) que chaque fichier extrait porte l'extension temporaire `.tmp` avant d'être finalisé sous son nom d'origine.

## 4. RETEX / SWOT
**Synthèse des forces, faiblesses, opportunités et menaces de cette version :**
- **Strengths (Forces) :** Une solution légère, client-side uniquement, garantissant une absence de fuite réseau de la data brute. L'implémentation de `zip.js` dans le `index.html` est ingénieuse pour des environnements contraints. La journalisation en CSV intégrée est solide.
- **Weaknesses (Faiblesses) :** Toute l'intelligence étant dans un seul fichier monolithique massif (la base64 de zip.js incluse dans l'`index.html`), le code s'avère difficile à maintenir ou à déboguer par les développeurs front.
- **Opportunities (Opportunités) :** La version atomique et PWA sécurisée (Air-Gap + CRC32 + Purge RAM) peut être labellisée "Confidentialité Maximale" et déployée massivement sans infrastructure serveur.
- **Threats (Menaces) :** L'OOM (Out-of-memory) sur le File System du navigateur (quota local limité) est préempté par une alerte mais peut causer le gel de navigateurs anciens. Les API WritableStream et FileSystem sont assujetties à des changements stricts dans les prochaines versions des navigateurs, imposant un suivi soutenu.
