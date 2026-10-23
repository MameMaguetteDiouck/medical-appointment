# 🏥 Medico — Plateforme de Gestion de Rendez-Vous Médicaux & Suivi Clinique

Plateforme web médicale moderne conçue pour simplifier et sécuriser la prise en charge des patients, la coordination des soins et le travail des praticiens au sein d'un centre pluridisciplinaire.

---

## 🚀 Stack Technique & Architecture

- **Frontend :** [Angular 19+](https://angular.dev) — Architecture **100% Standalone**, contrôle de flux moderne (`@if`, `@for`, `@switch`), et gestion d'état réactive par **Signals** (`signal()`, `computed()`).
- **Styling :** CSS Vanilla modulaire, composants Angular Material, icônes Bootstrap Icons, et charte visuelle ancrée sur l'identité de marque **Gris Ardoise (`#566573`)**.
- **Backend & Données :** [Firebase](https://firebase.google.com/) (Firebase Auth, Cloud Firestore) avec règles de sécurité strictes déployées côté serveur (`firestore.rules`).
- **Impression Médicale :** Moteur d'impression sur iframe isolée garantissant une sortie d'ordonnance officielle sur **1 seule page A4** sans fuite d'interface ni duplication.

---

## 🔑 Comptes de Démonstration & Identifiants par Rôle

Trois profils types sont pré-configurés pour tester l'intégralité des flux métiers de la plateforme :

| Rôle | Utilisateur | Email de connexion | Mot de passe | ID / UID Dossier | Fonctionnalités clés |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **👤 Patient** | **Fatou Ndiaye** | `fatou.ndiaye@medico.sn` | `MedicoPatient2026!` | `9W92e8l58d...` | Prise de RDV en ligne, historique de consultations, consultation et impression des ordonnances délivrées. *(Inscription libre disponible sur `/auth/sign-up`)* |
| **🩺 Médecin** | **Dr. Cheikh Tidiane Sow** *(Médecine Générale)* | `ct.sow@medico.sn` | `DocteurSow2026!` | `xJm6dF39...` | Dashboard praticien, gestion des consultations du jour, saisie d'observations et prescription d'ordonnances avec impression mono-page. |
| **📋 Secrétariat** | **Awa Fall** *(Accueil & Régulation)* | `secretariat@medico.sn` | `Secretaire2026!` | `3VqTdHNuvGa56lXengWqnlbGUXF3` | Validation des demandes de rendez-vous, affectation des créneaux horaires, et gestion des praticiens avec génération de mots de passe temporaires sécurisés. |

---

## 🧭 Espaces & Parcours Métiers

### 1. Espace Patient (`/patients`)
- **Tableau de Bord Réactif :** Vue synthétique sur le prochain rendez-vous, le nombre de demandes en attente et les consultations passées.
- **Prise de Rendez-vous (`/patients/appointment`) :** Sélection par pôle de soins (Cardiologie, Pédiatrie, Dentiste, Médecine Générale, etc.), choix optionnel du praticien préféré, sélecteur de date avec validation anti-date passée, et récapitulatif interactif.
- **Ordonnances Médicales :** Accès direct à l'ordonnance officielle avec en-tête Medico, posologie, durée de validité et bouton d'impression directe.

### 2. Espace Médecin (`/doctors`)
- **Pilotage Quotidien :** KPI en temps réel des rendez-vous d'aujourd'hui, des patients à examiner et des consultations honorées.
- **Consultation & Prescription :** Modale de consultation pour saisir le diagnostic clinique et composer la liste thérapeutique (médicaments, posologies).
- **Répertoire Patients & Registre d'Ordonnances :** Historique complet des consultations par patient et traçabilité des traitements délivrés.

### 3. Espace Secrétariat (`/secretaries`)
- **Régulation des Rendez-vous (`/secretaries/validate-appointment`) :** Validation ou réassignation des demandes de consultation, attribution des horaires précis et du médecin traitant.
- **Gestion des Praticiens (`/secretaries/management-doctor`) :** Ajout de médecins avec génération de mots de passe temporaires cryptographiquement sécurisés et forçage de changement de mot de passe à la première connexion (`mustChangePassword`).

---

## 🔒 Sécurité & Règles Firestore

L'accès aux collections Cloud Firestore est verrouillé par les règles [`firestore.rules`](./firestore.rules) déployées en production :

1. **Cloisonnement Patient :** Chaque patient ne peut lire et modifier que ses propres données (`request.auth.uid == patientId`) et ses propres rendez-vous. Il ne peut ni s'auto-attribuer un statut confirmé ni altérer une ordonnance.
2. **Accès Praticien & Secret Médical :** Seul le personnel soignant habilité (`isDoctor()` ou `isSecretary()`) peut renseigner des observations et prescrire des ordonnances.
3. **Immutabilité des Actes Clôturés :** Une fois la consultation passée (`status == 'Passé'`), les actes médicaux ne peuvent plus être supprimés.
4. **Provisionnement Sécurisé :** Les comptes médecins sont provisionnés avec des mots de passe temporaires uniques générés via l'API Web Cryptography (`generateSecureTemporaryPassword()`).

---

## 💻 Installation & Démarrage Local

### Prérequis
- [Node.js](https://nodejs.org/) (v18+ ou v20+ recommandé)
- [npm](https://www.npmjs.com/)

### Étapes

1. **Cloner le projet et installer les dépendances :**
```bash
git clone <url-du-depot>
cd medical-appointment
npm install
```

2. **Lancer le serveur de développement Angular :**
```bash
npm start
```
L'application est accessible sur [http://localhost:4200](http://localhost:4200).

3. **Déployer les règles de sécurité Firestore (administrateur) :**
```bash
firebase deploy --only firestore:rules
```

---

## 🎨 Charte Graphique & Tokens de Couleur

L'identité de Medico repose sur le **Gris Ardoise Clinique** :

| Token | Code Hexa | Rôle dans l'application |
| :--- | :--- | :--- |
| `--medico-primary` | `#566573` | En-tête, pied de page, boutons d'action principaux, badges actifs |
| `--medico-primary-dark` | `#475461` | États au survol (hover) et menu mobile |
| `--medico-primary-subtle`| `#f1f5f9` | Fonds d'icônes, badges secondaires et cartes légères |
| `--status-success` | `#047857` sur `#ecfdf5` | Consultations clôturées / honorées |
| `--status-warning` | `#b45309` sur `#fffbeb` | Demandes en attente de confirmation |
| `--status-info` | `#1d4ed8` sur `#eff6ff` | Rendez-vous confirmés programmés |

---

## 📄 Licence & Droits

Projet développé pour le **Centre Médical Medico Dakar** — Tous droits réservés &copy; 2025-2026.
