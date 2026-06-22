/* =========================
   APP GLOBAL
   Suivi Production ARC+
========================= */

console.log("Application Suivi Production ARC+ chargée");

/**
 * Enregistrement du Service Worker pour la PWA.
 * Le fichier service-worker.js sera créé plus tard.
 */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(() => {
        console.log("Service Worker enregistré avec succès");
      })
      .catch(error => {
        console.warn("Service Worker non enregistré :", error);
      });
  });
}

/**
 * Fonction utilitaire pour formater une date.
 */
function formatDateFr(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("fr-FR");
}

/**
 * Fonction utilitaire pour générer un identifiant simple.
 */
function generateId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/**
 * Fonction utilitaire pour récupérer la date du jour au format YYYY-MM-DD.
 */
function getTodayDate() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}
