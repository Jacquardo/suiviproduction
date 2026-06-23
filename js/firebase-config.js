/* =========================
   CONFIGURATION FIREBASE
   Suivi Production ARC+
   Projet : suiviproduction-dd184
========================= */

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDgdmYpyv8UudvdI06Hmbhnxfi_y3XmC-Y",
  authDomain:        "suiviproduction-dd184.firebaseapp.com",
  projectId:         "suiviproduction-dd184",
  storageBucket:     "suiviproduction-dd184.firebasestorage.app",
  messagingSenderId: "1045369772892",
  appId:             "1:1045369772892:web:7976679ec7bf965e6f7f99",
  measurementId:     "G-7CSKQTT1HD"
};

/**
 * Contrôle d'accès — liste des emails autorisés.
 *
 * admins  : accès à la page administrateur (admin.html)
 * users   : accès à la page utilisateur (agent.html)
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
