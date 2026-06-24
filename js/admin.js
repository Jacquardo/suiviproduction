/* =========================
   PAGE ADMINISTRATEUR
   Suivi Production ARC+
========================= */

let allAgents     = [];
let allProduction = [];
let allSections   = [];
let allMessages   = [];
let currentAdminUser = null;

/* ================================================
   INITIALISATION
================================================ */

document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(async (user, reason) => {
    if (!user) {
      if (reason === "unauthorized") showAuthMsg("Ce compte Google n'est pas autorisé.", "error");
      showAdminLoginScreen();
      return;
    }
    if (!ACCESS_CONTROL.isAdmin(user.email)) {
      showAuthMsg("Vous n'avez pas les droits administrateur pour ce compte.", "error");
      showAdminLoginScreen();
      return;
    }
    currentAdminUser = user;
    renderAdminUserBadge(user);
    showAdminContent();
    await loadAdminData();
    initAdminTabs();
  });

  document.getElementById("adminGoogleSignInBtn")?.addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Connexion en cours…`;
    const result = await signInWithGoogle();
    if (!result.success) {
      showAuthMsg(result.message, "error");
      btn.disabled = false;
      btn.innerHTML = `<img src="https://developers.google.com/identity/images/g-logo.png" alt="G" width="18"/> Se connecter avec Google`;
    }
  });

  document.getElementById("logoutBtn")?.addEventListener("click", () => signOutUser());
  bindAdminEvents();
});

/* ================================================
   AUTH UI
================================================ */

function showAdminLoginScreen() {
  document.getElementById("loginSection")?.classList.remove("hidden");
  document.getElementById("adminContent")?.classList.add("hidden");
}

function showAdminContent() {
  document.getElementById("loginSection")?.classList.add("hidden");
  document.getElementById("adminContent")?.classList.remove("hidden");
}

function showAuthMsg(msg, type = "error") {
  const el = document.getElementById("adminLoginMessage");
  if (el) { el.textContent = msg; el.className = `message ${type}`; }
}

function renderAdminUserBadge(user) {
  const badge = document.getElementById("adminUserBadge");
  if (badge) badge.classList.remove("hidden");
  setEl("adminUserName", user.name || user.email);
  const photo = document.getElementById("adminUserPhoto");
  if (photo && user.photo) { photo.src = user.photo; photo.classList.remove("hidden"); }
}

/* ================================================
   TABS
================================================ */

function initAdminTabs() {
  const tabs = document.querySelectorAll(".admin-tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".admin-tab-panel").forEach(p => p.classList.add("hidden"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.target)?.classList.remove("hidden");
    });
  });
  if (tabs.length) tabs[0].click();
}

/* ================================================
   CHARGEMENT DES DONNÉES
================================================ */

async function loadAdminData() {
  try {
    [allAgents, allProduction] = await Promise.all([getAgents(), getProduction()]);
    renderAgentsTable(allAgents);
    renderAgentSelects(allAgents);
    renderProductionTable(allProduction);
    renderFilters(allAgents, allProduction);
    updateKpis(allProduction);
    updateDashboard(allProduction);
    setDefaultProgramDate();
    await Promise.all([loadSections(), loadAnnouncements(), loadAdminMessages()]);
    if (typeof renderCharts === "function") renderCharts(allProduction);
  } catch (err) {
    console.error("Erreur chargement données admin :", err);
  }
}

/* ================================================
   TABLEAU DE BORD
================================================ */

function updateDashboard(rows) {
  const today      = getTodayDate();
  const weekStart  = getWeekStart();
  const monthStart = getMonthStart();

  const todayRows  = rows.filter(r => r.date === today);
  const weekRows   = rows.filter(r => r.date >= weekStart);
  const monthRows  = rows.filter(r => r.date >= monthStart);

  setEl("dashTodayTotal",  todayRows.reduce((s, r)  => s + Number(r.quantity || 0), 0));
  setEl("dashWeekTotal",   weekRows.reduce((s, r)   => s + Number(r.quantity || 0), 0));
  setEl("dashMonthTotal",  monthRows.reduce((s, r)  => s + Number(r.quantity || 0), 0));
  setEl("dashAgentCount",  allAgents.filter(a => a.role !== "admin" && a.active).length);

  renderTopAgents("dashTopAgents", todayRows);
  renderWeeklyAgentTable("dashWeeklyTable", weekRows);
}

function renderTopAgents(containerId, rows) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const grouped = {};
  rows.forEach(r => {
    const k = r.agentName || r.agentEmail || "Inconnu";
    grouped[k] = (grouped[k] || 0) + Number(r.quantity || 0);
  });
  const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (!sorted.length) {
    container.innerHTML = `<p class="empty-message">Aucune production enregistrée aujourd'hui.</p>`;
    return;
  }
  container.innerHTML = sorted.map(([name, qty], i) => `
    <div class="top-agent-row">
      <span class="rank-badge rank-${i + 1}">${i + 1}</span>
      <span class="agent-name-label">${name}</span>
      <strong class="agent-qty-label">${qty} unités</strong>
    </div>
  `).join("");
}

function renderWeeklyAgentTable(containerId, rows) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const agents = {};
  rows.forEach(r => {
    const k = r.agentName || r.agentEmail || "Inconnu";
    if (!agents[k]) agents[k] = { name: k, total: 0, days: {} };
    agents[k].total += Number(r.quantity || 0);
    agents[k].days[r.date] = (agents[k].days[r.date] || 0) + Number(r.quantity || 0);
  });
  const sorted   = Object.values(agents).sort((a, b) => b.total - a.total);
  const weekDays = getWeekDays();
  if (!sorted.length) {
    container.innerHTML = `<p class="empty-message">Aucune production cette semaine.</p>`;
    return;
  }
  container.innerHTML = `
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Agent</th>
            ${weekDays.map(d => `<th>${formatDateFrShort(d)}</th>`).join("")}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map(a => `
            <tr>
              <td><strong>${a.name}</strong></td>
              ${weekDays.map(d => `<td>${a.days[d] || 0}</td>`).join("")}
              <td><strong>${a.total}</strong></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>`;
}

/* ================================================
   SECTIONS
================================================ */

async function loadSections() {
  allSections = await getAllSections();
  renderSectionsAdmin(allSections);
}

function renderSectionsAdmin(sections) {
  const container = document.getElementById("sectionsListAdmin");
  if (!container) return;
  if (!sections.length) {
    container.innerHTML = `<p class="empty-message">Aucune section créée.</p>`;
    return;
  }
  container.innerHTML = sections.map(s => `
    <div class="section-item ${s.active ? "" : "section-item-inactive"}">
      <div class="section-item-header">
        <span class="section-item-icon">${s.icon || "📄"}</span>
        <div class="section-item-info">
          <strong>${s.title}</strong>
          <span class="section-item-category">${s.category || "général"}</span>
        </div>
        <div class="section-item-actions">
          <button class="secondary-button btn-sm" onclick="editSection('${s.id}')">✏️</button>
          <button class="secondary-button btn-sm" onclick="toggleSectionActive('${s.id}', ${!s.active})">
            ${s.active ? "🚫 Masquer" : "✅ Afficher"}
          </button>
          <button class="danger-button btn-sm" onclick="confirmDeleteSection('${s.id}')">🗑️</button>
        </div>
      </div>
      <p class="section-item-preview">${(s.content || "").replace(/<[^>]*>/g, "").substring(0, 100)}…</p>
    </div>
  `).join("");
}

async function handleSaveSection(event) {
  event.preventDefault();
  const status = document.getElementById("sectionStatus");
  const editId = document.getElementById("sectionEditId")?.value || "";
  const section = {
    id:        editId || null,
    title:     document.getElementById("sectionTitle")?.value.trim()   || "",
    content:   document.getElementById("sectionContent")?.value.trim() || "",
    icon:      document.getElementById("sectionIcon")?.value.trim()    || "📄",
    category:  document.getElementById("sectionCategory")?.value       || "general",
    order:     Number(document.getElementById("sectionOrder")?.value   || 0),
    createdBy: currentAdminUser?.email || ""
  };
  if (!section.title || !section.content) {
    status.textContent = "Titre et contenu sont obligatoires.";
    status.className   = "message error";
    return;
  }
  const result = await saveSection(section);
  if (result.success) {
    status.textContent = "Section enregistrée.";
    status.className   = "message success";
    resetSectionForm();
    await loadSections();
  } else {
    status.textContent = "Erreur lors de l'enregistrement.";
    status.className   = "message error";
  }
}

function resetSectionForm() {
  document.getElementById("sectionForm")?.reset();
  const editId = document.getElementById("sectionEditId");
  if (editId) editId.value = "";
  setEl("sectionFormTitle", "Nouvelle section");
}

function editSection(id) {
  const s = allSections.find(x => x.id === id);
  if (!s) return;
  document.getElementById("sectionEditId").value   = s.id;
  document.getElementById("sectionTitle").value    = s.title;
  document.getElementById("sectionContent").value  = s.content;
  document.getElementById("sectionIcon").value     = s.icon || "📄";
  document.getElementById("sectionCategory").value = s.category || "general";
  document.getElementById("sectionOrder").value    = s.order || 0;
  setEl("sectionFormTitle", "Modifier la section");
  document.getElementById("sectionForm")?.scrollIntoView({ behavior: "smooth" });
}

async function confirmDeleteSection(id) {
  if (!confirm("Supprimer cette section ?")) return;
  await deleteSection(id);
  await loadSections();
}

async function toggleSectionActive(id, active) {
  await getDb().collection("sections").doc(id).update({ active });
  await loadSections();
}

/* ================================================
   ANNONCES
================================================ */

async function loadAnnouncements() {
  const list = await getAnnouncements();
  renderAnnouncementsAdmin(list);
}

function renderAnnouncementsAdmin(list) {
  const container = document.getElementById("announcementsListAdmin");
  if (!container) return;
  if (!list.length) {
    container.innerHTML = `<p class="empty-message">Aucune annonce publiée.</p>`;
    return;
  }
  container.innerHTML = list.map(a => `
    <div class="announcement-card priority-${a.priority || "normale"}">
      <div class="announcement-header">
        <div>
          <span class="ann-category">${getCategoryLabel(a.category)}</span>
          <strong class="ann-title">${a.title}</strong>
        </div>
        <div class="ann-meta">
          <span>${formatDateFrFromTimestamp(a.createdAt)}</span>
          <span class="badge-target">${getTargetLabel(a.targetRole)}</span>
          <button class="danger-button btn-sm" onclick="confirmDeleteAnn('${a.id}')">🗑️</button>
        </div>
      </div>
      <p class="ann-content">${a.content}</p>
      <span class="ann-author">Par ${a.author || "Admin"}</span>
    </div>
  `).join("");
}

async function handleSaveAnnouncement(event) {
  event.preventDefault();
  const status = document.getElementById("announcementStatus");
  const ann = {
    title:      document.getElementById("announcementTitle")?.value.trim()   || "",
    content:    document.getElementById("announcementContent")?.value.trim() || "",
    category:   document.getElementById("announcementCategory")?.value       || "info",
    priority:   document.getElementById("announcementPriority")?.value       || "normale",
    targetRole: document.getElementById("announcementTarget")?.value         || "all",
    author:     currentAdminUser?.name || currentAdminUser?.email             || ""
  };
  if (!ann.title || !ann.content) {
    status.textContent = "Titre et contenu obligatoires.";
    status.className   = "message error";
    return;
  }
  const result = await saveAnnouncement(ann);
  if (result.success) {
    status.textContent = "Annonce publiée.";
    status.className   = "message success";
    document.getElementById("announcementForm")?.reset();
    await loadAnnouncements();
  } else {
    status.textContent = "Erreur lors de la publication.";
    status.className   = "message error";
  }
}

async function confirmDeleteAnn(id) {
  if (!confirm("Supprimer cette annonce ?")) return;
  await deleteAnnouncement(id);
  await loadAnnouncements();
}

/* ================================================
   MESSAGES
================================================ */

async function loadAdminMessages() {
  if (!currentAdminUser) return;
  allMessages = await getMessages(currentAdminUser.email);
  renderAdminMessages(allMessages);
  renderMessageTargets();
}

function renderAdminMessages(messages) {
  const container = document.getElementById("messagesListAdmin");
  if (!container) return;
  if (!messages.length) {
    container.innerHTML = `<p class="empty-message">Aucun message.</p>`;
    return;
  }
  container.innerHTML = messages.map(m => {
    const isSent = m.fromEmail === currentAdminUser?.email;
    return `
      <div class="message-card ${isSent ? "" : "message-received"}">
        <div class="message-header">
          <div>
            <strong>${m.subject || "Sans objet"}</strong>
            <span class="message-target-label">
              ${isSent
                ? `→ ${m.targetName || m.targetEmail}`
                : `← ${m.fromName  || m.fromEmail}`}
            </span>
          </div>
          <div class="message-meta">
            <span>${formatDateFrFromTimestamp(m.createdAt)}</span>
            <button class="danger-button btn-sm" onclick="confirmDeleteMsg('${m.id}')">🗑️</button>
          </div>
        </div>
        <p class="message-body">${m.content}</p>
      </div>`;
  }).join("");
}

function renderMessageTargets() {
  const select = document.getElementById("messageTarget");
  if (!select) return;
  select.innerHTML = `<option value="all">📢 Tous les utilisateurs</option>
    ${ACCESS_CONTROL.users.map(email => `<option value="${email}">${email}</option>`).join("")}`;
}

async function handleSendMessage(event) {
  event.preventDefault();
  const status = document.getElementById("messageStatus");
  const sel    = document.getElementById("messageTarget");
  const message = {
    subject:     document.getElementById("messageSubject")?.value.trim()  || "",
    content:     document.getElementById("messageContent")?.value.trim()  || "",
    fromEmail:   currentAdminUser?.email || "",
    fromName:    currentAdminUser?.name  || "",
    targetEmail: sel?.value || "all",
    targetName:  sel?.options[sel.selectedIndex]?.text || "Tous"
  };
  if (!message.content) {
    status.textContent = "Le contenu est obligatoire.";
    status.className   = "message error";
    return;
  }
  const result = await sendMessage(message);
  if (result.success) {
    status.textContent = "Message envoyé.";
    status.className   = "message success";
    document.getElementById("messageForm")?.reset();
    await loadAdminMessages();
  } else {
    status.textContent = "Erreur lors de l'envoi.";
    status.className   = "message error";
  }
}

async function confirmDeleteMsg(id) {
  if (!confirm("Supprimer ce message ?")) return;
  await deleteMessage(id);
  await loadAdminMessages();
}

/* ================================================
   PRODUCTION & FILTRES
================================================ */

function renderProductionTable(rows) {
  const tbody = document.getElementById("productionTableBody");
  if (!tbody) return;
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-table">Aucune donnée disponible.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.slice(0, 300).map(r => `
    <tr>
      <td>${formatDateFr(r.date)}</td>
      <td>${r.agentName || r.agentEmail || "-"}</td>
      <td>${r.team || "-"}</td>
      <td>${r.activity || "-"}</td>
      <td><strong>${Number(r.quantity || 0)}</strong></td>
      <td>${r.source || "-"}</td>
    </tr>
  `).join("");
}

function updateKpis(rows) {
  const total      = rows.reduce((s, r) => s + Number(r.quantity || 0), 0);
  const active     = allAgents.filter(a => a.role !== "admin" && a.active);
  const avg        = active.length ? Math.round(total / active.length) : 0;
  const byAgent    = {};
  rows.forEach(r => {
    const k = r.agentName || r.agentEmail || "Inconnu";
    byAgent[k] = (byAgent[k] || 0) + Number(r.quantity || 0);
  });
  const best = Object.entries(byAgent).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
  setEl("kpiTotalProduction",   total);
  setEl("kpiActiveAgents",      active.length);
  setEl("kpiAverageProduction", avg);
  setEl("kpiBestAgent",         best);
}

function renderFilters(agents, production) {
  const fa = document.getElementById("filterAgent");
  const ft = document.getElementById("filterTeam");
  if (!fa || !ft) return;
  fa.innerHTML = `<option value="">Tous les agents</option>`;
  ft.innerHTML = `<option value="">Toutes les équipes</option>`;
  agents.filter(a => a.role !== "admin").forEach(a => {
    const opt = document.createElement("option");
    opt.value = a.email; opt.textContent = a.name;
    fa.appendChild(opt);
  });
  const teams = [...new Set([...agents, ...production].map(x => x.team).filter(Boolean))];
  teams.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t; opt.textContent = t;
    ft.appendChild(opt);
  });
}

function renderAgentSelects(agents) {
  const sel = document.getElementById("programAgent");
  if (!sel) return;
  sel.innerHTML = `<option value="">Sélectionner un agent</option>`;
  agents.filter(a => a.role !== "admin").forEach(a => {
    const opt = document.createElement("option");
    opt.value = a.email;
    opt.textContent = `${a.name} (${a.team || "ARC+"})`;
    sel.appendChild(opt);
  });
}

/* ---- Remplacez renderAgentsTable() par ceci ---- */

function renderAgentsTable(agents) {
  const tbody = document.getElementById("agentsTableBody");
  if (!tbody) return;
  const visible = agents.filter(a => a.role !== "admin");
  if (!visible.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-table">Aucun agent enregistré.</td></tr>`;
    return;
  }
  tbody.innerHTML = visible.map(a => `
    <tr class="${a.active ? "" : "row-inactive"}">
      <td><strong>${a.name || "-"}</strong></td>
      <td>${a.email || "-"}</td>
      <td>${a.team || "-"}</td>
      <td><span class="role-badge role-${a.role || "agent"}">${a.role === "admin" ? "Admin" : "Agent"}</span></td>
      <td><span class="${a.active ? "status-active" : "status-inactive"}">${a.active ? "✅ Actif" : "🚫 Inactif"}</span></td>
      <td class="actions-cell">
        <button class="secondary-button btn-sm" onclick="editAgent('${a.id}')">✏️ Modifier</button>
        <button class="secondary-button btn-sm" onclick="toggleAgentActive('${a.id}', ${!a.active})">
          ${a.active ? "🚫 Désactiver" : "✅ Activer"}
        </button>
        <button class="danger-button btn-sm" onclick="confirmDeleteAgent('${a.id}', '${(a.name || a.email).replace(/'/g, "\\'")}')">🗑️</button>
      </td>
    </tr>
  `).join("");
}

/* ---- Nouvelles fonctions à ajouter ---- */

async function handleSaveAgent(event) {
  event.preventDefault();
  const status  = document.getElementById("agentFormStatus");
  const editId  = document.getElementById("agentEditId")?.value || "";
  const agentData = {
    name:   document.getElementById("agentName")?.value.trim()   || "",
    email:  document.getElementById("agentEmail")?.value.trim().toLowerCase() || "",
    team:   document.getElementById("agentTeam")?.value.trim()   || "ARC+",
    role:   document.getElementById("agentRole")?.value          || "agent",
    active: document.getElementById("agentActiveSelect")?.value  === "true"
  };

  if (!agentData.name || !agentData.email) {
    status.textContent = "Le nom et l'email sont obligatoires.";
    status.className   = "message error full-width";
    return;
  }

  status.textContent = "Enregistrement en cours…";
  status.className   = "message full-width";

  let result;
  if (editId) {
    // Mise à jour par ID
    result = await updateAgentById(editId, agentData);
  } else {
    // Création ou mise à jour par email
    result = await saveAgent(agentData);
  }

  if (result.success) {
    status.textContent = editId ? "Agent mis à jour avec succès." : "Agent ajouté avec succès.";
    status.className   = "message success full-width";
    resetAgentForm();
    allAgents = await getAgents();
    renderAgentsTable(allAgents);
    renderAgentSelects(allAgents);
    renderFilters(allAgents, allProduction);
    updateKpis(allProduction);
  } else {
    status.textContent = "Erreur lors de l'enregistrement.";
    status.className   = "message error full-width";
  }
}

function editAgent(id) {
  const a = allAgents.find(x => x.id === id);
  if (!a) return;
  document.getElementById("agentEditId").value         = a.id;
  document.getElementById("agentName").value           = a.name  || "";
  document.getElementById("agentEmail").value          = a.email || "";
  document.getElementById("agentEmail").readOnly       = true; // empêche de changer l'email en édition
  document.getElementById("agentTeam").value           = a.team  || "ARC+";
  document.getElementById("agentRole").value           = a.role  || "agent";
  document.getElementById("agentActiveSelect").value   = a.active !== false ? "true" : "false";
  setEl("agentFormTitle", "✏️ Modifier l'agent");
  document.getElementById("agentForm")?.scrollIntoView({ behavior: "smooth" });
}

function resetAgentForm() {
  document.getElementById("agentForm")?.reset();
  const editId = document.getElementById("agentEditId");
  if (editId) editId.value = "";
  const emailField = document.getElementById("agentEmail");
  if (emailField) emailField.readOnly = false;
  const teamField = document.getElementById("agentTeam");
  if (teamField) teamField.value = "ARC+";
  setEl("agentFormTitle", "➕ Ajouter un agent");
  const status = document.getElementById("agentFormStatus");
  if (status) { status.textContent = ""; status.className = "message full-width"; }
}

async function toggleAgentActive(id, active) {
  await updateAgentById(id, { active });
  allAgents = await getAgents();
  renderAgentsTable(allAgents);
  updateKpis(allProduction);
}

async function confirmDeleteAgent(id, name) {
  if (!confirm(`Supprimer l'agent "${name}" ? Cette action est irréversible.`)) return;
  await deleteAgent(id);
  allAgents = await getAgents();
  renderAgentsTable(allAgents);
  renderAgentSelects(allAgents);
  renderFilters(allAgents, allProduction);
  updateKpis(allProduction);
}

function applyProductionFilters() {
  const date  = document.getElementById("filterDate")?.value  || "";
  const email = document.getElementById("filterAgent")?.value || "";
  const team  = document.getElementById("filterTeam")?.value  || "";
  let filtered = [...allProduction];
  if (date)  filtered = filtered.filter(r => r.date === date);
  if (email) filtered = filtered.filter(r => r.agentEmail === email);
  if (team)  filtered = filtered.filter(r => r.team === team);
  renderProductionTable(filtered);
  updateKpis(filtered);
  if (typeof renderCharts === "function") renderCharts(filtered);
}

function resetProductionFilters() {
  ["filterDate", "filterAgent", "filterTeam"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  renderProductionTable(allProduction);
  updateKpis(allProduction);
  if (typeof renderCharts === "function") renderCharts(allProduction);
}

/* ================================================
   PROGRAMME
================================================ */

function setDefaultProgramDate() {
  const el = document.getElementById("programDate");
  if (el && !el.value) el.value = getTodayDate();
}

async function handleSaveProgramme(event) {
  event.preventDefault();
  const status     = document.getElementById("programMessageStatus");
  const agentEmail = document.getElementById("programAgent")?.value || "";
  const agent      = allAgents.find(a => a.email === agentEmail);

  const prog = {
    date:       document.getElementById("programDate")?.value          || "",
    agentEmail,
    agentId:    agent?.id    || "",
    agentName:  agent?.name  || agentEmail,
    activity:   document.getElementById("programActivity")?.value.trim() || "",
    target:     document.getElementById("programTarget")?.value        || 0,
    priority:   document.getElementById("programPriority")?.value      || "normale",
    message:    document.getElementById("programMessage")?.value.trim() || "",
    updatedBy:  currentAdminUser?.email || ""
  };

  if (!prog.agentEmail || !prog.date || !prog.activity || !prog.target) {
    status.textContent = "Veuillez remplir tous les champs obligatoires.";
    status.className   = "message error full-width";
    return;
  }
  const result = await saveProgramme(prog);
  if (result.success) {
    status.textContent = "Programme enregistré.";
    status.className   = "message success full-width";
    ["programActivity","programTarget","programMessage"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    document.getElementById("programPriority").value = "normale";
  } else {
    status.textContent = "Erreur lors de l'enregistrement.";
    status.className   = "message error full-width";
  }
}

/* ================================================
   BIND EVENTS
================================================ */

function bindAdminEvents() {
   document.getElementById("agentForm")?.addEventListener("submit", handleSaveAgent);
document.getElementById("agentFormResetBtn")?.addEventListener("click",  resetAgentForm);
  document.getElementById("previewExcelBtn")?.addEventListener("click",  previewExcelImport);
  document.getElementById("saveExcelBtn")?.addEventListener("click",     savePreviewedExcelRows);
  document.getElementById("applyFiltersBtn")?.addEventListener("click",  applyProductionFilters);
  document.getElementById("resetFiltersBtn")?.addEventListener("click",  resetProductionFilters);
  document.getElementById("programForm")?.addEventListener("submit",     handleSaveProgramme);
  document.getElementById("announcementForm")?.addEventListener("submit",handleSaveAnnouncement);
  document.getElementById("messageForm")?.addEventListener("submit",     handleSendMessage);
  document.getElementById("sectionForm")?.addEventListener("submit",     handleSaveSection);
}
