/* =========================
   AUTHENTIFICATION GOOGLE
   Suivi Production ARC+
========================= */

let _db   = null;
let _auth = null;
let _currentUser = null;

/**
 * Initialise Firebase une seule fois et retourne les instances.
 */
function getFirebaseInstances() {
  if (!_auth) {
    firebase.initializeApp(FIREBASE_CONFIG);
    _auth = firebase.auth();
    _db   = firebase.firestore();
    // Persistance locale (survit au rechargement de page)
    _auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  }
  return { auth: _auth, db: _db };
}

/**
 * Raccourci Firestore — utilisé partout dans l'app.
 */
function getDb() {
  return getFirebaseInstances().db;
}

/**
 * Connexion via Google OAuth (popup).
 */
async function signInWithGoogle() {
  const { auth } = getFirebaseInstances();
  const provider  = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const result = await auth.signInWithPopup(provider);
    const email  = result.user.email;

    if (!ACCESS_CONTROL.hasAccess(email)) {
      await auth.signOut();
      return {
        success: false,
        message: `Le compte ${email} n'est pas autorisé à accéder à cette application.`
      };
    }

    _currentUser = {
      uid:   result.user.uid,
      email: result.user.email,
      name:  result.user.displayName || email,
      photo: result.user.photoURL    || "",
      role:  ACCESS_CONTROL.getRole(email)
    };

    return { success: true, user: _currentUser };
  } catch (error) {
    console.error("Erreur Sign-In :", error);
    if (error.code === "auth/popup-closed-by-user") {
      return { success: false, message: "Connexion annulée." };
    }
    return {
      success: false,
      message: "Erreur lors de la connexion Google. Vérifiez que les popups sont autorisés."
    };
  }
}

/**
 * Déconnexion.
 */
async function signOutUser() {
  const { auth } = getFirebaseInstances();
  _currentUser   = null;
  await auth.signOut();
}

/**
 * Écoute les changements d'état d'authentification.
 * Appelé automatiquement au chargement (session persistée).
 * @param {Function} callback - appelée avec (user | null, reason?)
 */
function onAuthStateChanged(callback) {
  getFirebaseInstances();
  firebase.auth().onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      const email = firebaseUser.email;
      if (!ACCESS_CONTROL.hasAccess(email)) {
        await firebase.auth().signOut();
        callback(null, "unauthorized");
        return;
      }
      _currentUser = {
        uid:   firebaseUser.uid,
        email: firebaseUser.email,
        name:  firebaseUser.displayName || email,
        photo: firebaseUser.photoURL    || "",
        role:  ACCESS_CONTROL.getRole(email)
      };
      callback(_currentUser);
    } else {
      _currentUser = null;
      callback(null);
    }
  });
}

/**
 * Retourne l'utilisateur courant (en mémoire).
 */
function getCurrentUser() {
  return _currentUser;
}

/**
 * Vérifie si l'utilisateur est connecté en tant qu'admin.
 */
function isManagerLoggedIn() {
  return !!(_currentUser && _currentUser.role === "admin");
}

/**
 * Alias de compatibilité.
 */
function logoutUser() {
  signOutUser();
}
