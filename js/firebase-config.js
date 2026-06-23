/* =========================
   CONFIGURATION FIREBASE
   Suivi Production ARC+
========================= */

/**
 * GUIDE D'INSTALLATION FIREBASE (à faire une seule fois) :
 *
 * 1. Allez sur https://console.firebase.google.com
 * 2. Créez un nouveau projet (ex : "suivi-production-arc")
 * 3. Dans "Authentication" → "Sign-in method" → activez "Google"
 *    → Ajoutez le domaine de votre app dans "Domaines autorisés"
 * 4. Dans "Firestore Database" → "Créer une base de données" → mode "test"
 * 5. Dans "Project settings" → "Vos applications" → ajoutez une app Web (</>)
 * 6. Copiez la configuration Firebase et remplacez les valeurs ci-dessous.
 *
 * RÈGLES FIRESTORE (Firebase Console → Firestore → Règles) :
 *
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /{document=**} {
 *       allow read, write: if request.auth != null;
 *     }
 *   }
 * }
 */

const FIREBASE_CONFIG = {
  apiKey:            "VOTRE_API_KEY",
  authDomain:        "VOTRE_PROJECT.firebaseapp.com",
  projectId:         "VOTRE_PROJECT_ID",
  storageBucket:     "VOTRE_PROJECT.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId:             "VOTRE_APP_ID"
};

/**
 * Contrôle d'accès — modifiez cette liste pour gérer les autorisations.
 *
 * admins  : accès à la page administrateur (admin.html)
 * users   : accès à la page utilisateur (agent.html)
 * Un admin peut aussi avoir accès aux deux si son email est dans les deux listes.
 */
const ACCESS_CONTROL = {
  admins: [
    "tahina.k0011@keobiz.fr",
    "sedra.k1736@keobiz.fr"
  ],
  users: [
    "sedra.k1736@keobiz.fr",
    "sedrajacquardo@gmail.com"
  ],
  isAdmin(email) {
    return this.admins.map(e => e.toLowerCase()).includes((email || "").toLowerCase());
  },
  isUser(email) {
    return this.users.map(e => e.toLowerCase()).includes((email || "").toLowerCase());
  },
  hasAccess(email) {
    return this.isAdmin(email) || this.isUser(email);
  },
  getRole(email) {
    if (this.isAdmin(email)) return "admin";
    if (this.isUser(email))  return "user";
    return null;
  }
};
