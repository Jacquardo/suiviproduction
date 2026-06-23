/* =========================
   APP GLOBAL
   Suivi Production ARC+
========================= */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(() => console.log("Service Worker enregistré."))
      .catch(err => console.warn("Service Worker non enregistré :", err));
  });
}

/** Formate une date YYYY-MM-DD en date française lisible. */
function formatDateFr(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString + "T00:00:00");
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("fr-FR");
}

/** Formate une date en JJ/MM court. */
function formatDateFrShort(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString + "T00:00:00");
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

/** Formate un Timestamp Firestore en date lisible. */
function formatDateFrFromTimestamp(ts) {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Génère un identifiant local simple. */
function generateId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/** Retourne la date du jour au format YYYY-MM-DD. */
function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

/** Définit le texte d'un élément par son ID. */
function setEl(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/** Retourne le lundi de la semaine courante (YYYY-MM-DD). */
function getWeekStart() {
  const d   = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

/** Retourne le premier jour du mois courant (YYYY-MM-DD). */
function getMonthStart() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Retourne les 5 jours ouvrés de la semaine courante. */
function getWeekDays() {
  const start = new Date(getWeekStart() + "T00:00:00");
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

/** Labels catégories annonces. */
function getCategoryLabel(cat) {
  const labels = {
    info:      "ℹ️ Info",
    processus: "📋 Processus",
    absence:   "🏖️ Absence",
    urgent:    "🚨 Urgent",
    actu:      "📰 Actualité"
  };
  return labels[cat] || cat || "ℹ️ Info";
}

/** Labels destinataires. */
function getTargetLabel(target) {
  if (target === "admin") return "Administrateurs";
  if (target === "user")  return "Utilisateurs";
  return "Tous";
}

/** Label priorité programme. */
function getPriorityLabel(p) {
  if (p === "haute")   return "⚠️ Haute";
  if (p === "urgente") return "🚨 Urgente";
  return "✅ Normale";
}
