/* =========================
   PAGE UTILISATEUR / AGENT
   Suivi Production ARC+
========================= */

let currentAgent       = null;
let agentProductionRows = [];
let agentProgrammes    = [];

/* ================================================
   INITIALISATION
================================================ */

document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(async (user, reason) => {
    if (!user) {
      if (reason === "unauthorized") showAgentMsg("Ce compte Google n'est pas autorisé.", "error");
      showAgentLoginSection();
      return;
    }
    if (!ACCESS_CONTROL.isUser(user.email)) {
      showAgentMsg("Vous n'avez pas accès à l'espace utilisateur.", "error");
      showAgentLoginSection();
      return;
    }
    currentAgent = user;
    showAgentContent();
    await loadAgentData();
  });

  document.getElementById("agentGoogleSignInBtn")?.addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Connexion…`;
    const result = await signInWithGoogle();
    if (!result.success) {
      showAgentMsg(result.message, "error");
      btn.disabled = false;
      btn.innerHTML = `<img src="https://developers.google.com/identity/images/g-logo.png" alt="G" width="18"/> Se connecter avec Google`;
    }
  });

  document.getElementById("agentLogoutBtn")?.addEventListener("click", () => signOutUser());
});

/* ================================================
   AUTH UI
================================================ */

function showAgentLoginSection() {
  document.getElementById("agentLoginSection")?.classList.remove("hidden");
  document.getElementById("agentContent")?.classList.add("hidden");
}

function showAgentContent() {
  document.getElementById("agentLoginSection")?.classList.add("hidden");
  document.getElementById("agentContent")?.classList.remove("hidden");
  initAgentTabs();
  initProductionEntry();
  renderAgentHeaderInfo();
}

function showAgentMsg(msg, type = "error") {
  const el = document.getElementById("agentLoginMessage");
  if (el) { el.textContent = msg; el.className = `message ${type}`; }
}

function renderAgentHeaderInfo() {
  if (!currentAgent) return;
  const photo = document.getElementById("agentHeaderPhoto");
  if (photo && currentAgent.photo) { photo.src = currentAgent.photo; photo.classList.remove("hidden"); }
  setEl("agentHeaderName", currentAgent.name || currentAgent.email);
}

/* ================================================
   TABS
================================================ */

function initAgentTabs() {
  const tabs = document.querySelectorAll(".agent-tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".agent-tab-panel").forEach(p => p.classList.add("hidden"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.target)?.classList.remove("hidden");
    });
  });
  if (tabs.length) tabs[0].click();
}

/* ================================================
   CHARGEMENT DES DONNÉES
================================================ */

async function loadAgentData() {
  if (!currentAgent) return;
  try {
    // Charger le profil agent
    const agentProfile = await getOrCreateAgent(currentAgent);
    if (agentProfile) currentAgent = { ...currentAgent, ...agentProfile };

    // Production par email
    const production = await getProduction({ agentEmail: currentAgent.email });
    agentProductionRows = production;

    // Programmes par email
    agentProgrammes = await getProgrammes(currentAgent.email);

    renderAgentIdentity();
    renderAgentProductionTable(agentProductionRows);
    renderAgentProgram();
    updateAgentKpis();

    await loadAgentAnnouncements();
    await loadAgentMessages();
    await loadAgentSections();
  } catch (err) {
    console.error("Erreur chargement données agent :", err);
  }
}

/* ================================================
   IDENTITÉ
================================================ */

function renderAgentIdentity() {
  setEl("agentWelcomeName", currentAgent.name || currentAgent.email);
  setEl("agentTeamName", `Équipe : ${currentAgent.team || "ARC+"}`);
  setEl("todayDateLabel", formatDateFr(getTodayDate()));
}

/* ================================================
   PROGRAMME
================================================ */

function renderAgentProgram() {
  const card  = document.getElementById("agentProgramCard");
  if (!card) return;
  const today = getTodayDate();
  let prog    = agentProgrammes.find(p => p.date === today) || agentProgrammes[0];

  if (!prog) {
    card.innerHTML = `<p class="empty-message">Aucun programme disponible pour aujourd'hui.</p>`;
    return;
  }
  card.innerHTML = `
    <h3 class="program-title">${prog.activity || "Programme"}</h3>
    <div class="program-meta">
      <div class="program-meta-item">
        <span>Date</span><strong>${formatDateFr(prog.date)}</strong>
      </div>
      <div class="program-meta-item">
        <span>Objectif</span><strong>${Number(prog.target || 0)}</strong>
      </div>
      <div class="program-meta-item">
        <span>Priorité</span><strong>${getPriorityLabel(prog.priority)}</strong>
      </div>
    </div>
    <div class="program-message">${prog.message || "Aucune consigne particulière."}</div>
  `;
}

/* ================================================
   KPIs
================================================ */

function updateAgentKpis() {
  const today     = getTodayDate();
  const todayRows = agentProductionRows.filter(r => r.date === today);
  const todayProd = todayRows.reduce((s, r) => s + Number(r.quantity || 0), 0);
  const totalProd = agentProductionRows.reduce((s, r) => s + Number(r.quantity || 0), 0);
  const prog      = agentProgrammes.find(p => p.date === today) || agentProgrammes[0];
  const target    = prog ? Number(prog.target || 0) : 0;
  const rate      = target > 0 ? Math.round((todayProd / target) * 100) : 0;

  setEl("agentKpiToday",  todayProd);
  setEl("agentKpiTarget", target);
  setEl("agentKpiTotal",  totalProd);

  const rateEl = document.getElementById("agentKpiRate");
  if (rateEl) {
    rateEl.textContent = `${rate}%`;
    rateEl.className   = rate >= 100 ? "agent-rate-good" : rate >= 70 ? "agent-rate-warning" : "agent-rate-danger";
  }
}

/* ================================================
   TABLEAU PRODUCTION
================================================ */

function renderAgentProductionTable(rows) {
  const tbody = document.getElementById("agentProductionTableBody");
  if (!tbody) return;
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-table">Aucune production disponible.</td></tr>`;
    return;
  }
  tbody.innerHTML = [...rows].sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .map(r => `
      <tr>
        <td>${formatDateFr(r.date)}</td>
        <td>${r.activity || "-"}</td>
        <td><strong>${Number(r.quantity || 0)}</strong></td>
        <td>${r.source || "-"}</td>
      </tr>
    `).join("");
}

/* ================================================
   ANNONCES
================================================ */

async function loadAgentAnnouncements() {
  const list     = await getAnnouncements();
  const filtered = list.filter(a => a.targetRole === "all" || a.targetRole === "user");
  renderAgentAnnouncements(filtered);
  updateTabBadge("announcementsCount", filtered.length);
  updateNotifBell();
}

function renderAgentAnnouncements(list) {
  const container = document.getElementById("agentAnnouncementsList");
  if (!container) return;
  if (!list.length) {
    container.innerHTML = `<p class="empty-message">Aucune annonce pour le moment.</p>`;
    return;
  }
  container.innerHTML = list.map(a => `
    <div class="announcement-card priority-${a.priority || "normale"}">
      <div class="announcement-header">
        <div>
          <span class="ann-category">${getCategoryLabel(a.category)}</span>
          <strong class="ann-title">${a.title}</strong>
        </div>
        <span class="ann-date">${formatDateFrFromTimestamp(a.createdAt)}</span>
      </div>
      <p class="ann-content">${a.content}</p>
    </div>
  `).join("");
}

/* ================================================
   MESSAGES
================================================ */

async function loadAgentMessages() {
  if (!currentAgent) return;
  const messages = await getMessages(currentAgent.email);
  const unread   = messages.filter(m => !(m.readBy || []).includes(currentAgent.email));
  renderAgentMessages(messages);
  updateTabBadge("messagesCount", unread.length);
  updateNotifBell();
}

function renderAgentMessages(messages) {
  const container = document.getElementById("agentMessagesList");
  if (!container) return;
  if (!messages.length) {
    container.innerHTML = `<p class="empty-message">Aucun message reçu.</p>`;
    return;
  }
  container.innerHTML = messages.map(m => {
    const isUnread = !(m.readBy || []).includes(currentAgent.email);
    return `
      <div class="message-card ${isUnread ? "message-unread" : ""}">
        <div class="message-header">
          <div>
            <strong>${m.subject || "Sans objet"}</strong>
            <span class="message-from-label">De : ${m.fromName || m.fromEmail}</span>
          </div>
          <span class="message-date">${formatDateFrFromTimestamp(m.createdAt)}</span>
        </div>
        <p class="message-body">${m.content}</p>
        ${isUnread ? `<button class="secondary-button btn-sm" onclick="markRead('${m.id}')">✓ Marquer comme lu</button>` : `<span class="msg-read-label">✓ Lu</span>`}
      </div>`;
  }).join("");
}

async function markRead(messageId) {
  await markMessageRead(messageId, currentAgent.email);
  await loadAgentMessages();
}

/* ================================================
   SECTIONS
================================================ */

async function loadAgentSections() {
  const sections = await getSections();
  renderAgentSections(sections);
}

function renderAgentSections(sections) {
  const container = document.getElementById("agentSectionsList");
  if (!container) return;
  if (!sections.length) {
    container.innerHTML = `<p class="empty-message">Aucune information disponible pour le moment.</p>`;
    return;
  }
  container.innerHTML = sections.map(s => `
    <div class="info-section-card">
      <div class="info-section-header">
        <span class="section-item-icon">${s.icon || "📄"}</span>
        <div>
          <strong>${s.title}</strong>
          <span class="section-item-category">${s.category || "général"}</span>
        </div>
      </div>
      <div class="info-section-body">${s.content}</div>
    </div>
  `).join("");
}

/* ================================================
   NOTIFICATIONS
================================================ */

function updateTabBadge(id, count) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = count;
  el.style.display = count > 0 ? "inline-flex" : "none";
}

function updateNotifBell() {
  const ann  = Number(document.getElementById("announcementsCount")?.textContent || 0);
  const msgs = Number(document.getElementById("messagesCount")?.textContent      || 0);
  const total = ann + msgs;
  const bell  = document.getElementById("agentHeaderBadge");
  const count = document.getElementById("headerNotifBadge");
  if (!bell || !count) return;
  if (total > 0) {
    count.textContent = total;
    bell.classList.remove("hidden");
  } else {
    bell.classList.add("hidden");
  }
}
