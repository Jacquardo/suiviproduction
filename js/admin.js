/* =========================
   PAGE ADMINISTRATEUR
   Suivi Production ARC+
========================= */

let allAgents = [];
let allProduction = [];

/**
 * Démarrage de la page admin.
 */
document.addEventListener("DOMContentLoaded", async () => {
  initializeLocalDatabase();
  bindAdminEvents();

  if (isManagerLoggedIn()) {
    showAdminContent();
    await loadAdminData();
  } else {
    showLoginSection();
  }
});

/**
 * Brancher les événements.
 */
function bindAdminEvents() {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  const previewExcelBtn = document.getElementById("previewExcelBtn");
  const saveExcelBtn = document.getElementById("saveExcelBtn");

  const applyFiltersBtn = document.getElementById("applyFiltersBtn");
  const resetFiltersBtn = document.getElementById("resetFiltersBtn");

  const programForm = document.getElementById("programForm");

  if (loginBtn) {
    loginBtn.addEventListener("click", handleManagerLogin);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  if (previewExcelBtn) {
    previewExcelBtn.addEventListener("click", previewExcelImport);
  }

  if (saveExcelBtn) {
    saveExcelBtn.addEventListener("click", savePreviewedExcelRows);
  }

  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", applyProductionFilters);
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", resetProductionFilters);
  }

  if (programForm) {
    programForm.addEventListener("submit", handleSaveProgramme);
  }
}

/**
 * Afficher la section connexion.
 */
function showLoginSection() {
  const loginSection = document.getElementById("loginSection");
  const adminContent = document.getElementById("adminContent");

  if (loginSection) {
    loginSection.classList.remove("hidden");
  }

  if (adminContent) {
    adminContent.classList.add("hidden");
  }
}

/**
 * Afficher le contenu administrateur.
 */
function showAdminContent() {
  const loginSection = document.getElementById("loginSection");
  const adminContent = document.getElementById("adminContent");

  if (loginSection) {
    loginSection.classList.add("hidden");
  }

  if (adminContent) {
    adminContent.classList.remove("hidden");
  }
}

/**
 * Connexion manager.
 */
async function handleManagerLogin() {
  const emailInput = document.getElementById("managerEmail");
  const codeInput = document.getElementById("managerCode");
  const loginMessage = document.getElementById("loginMessage");

  const email = emailInput.value.trim();
  const code = codeInput.value.trim();

  if (!email || !code) {
    loginMessage.textContent = "Veuillez saisir l’email et le code d’accès.";
    loginMessage.className = "message error";
    return;
  }

  const result = await loginManager(email, code);

  if (!result.success) {
    loginMessage.textContent = result.message;
    loginMessage.className = "message error";
    return;
  }

  loginMessage.textContent = result.message;
  loginMessage.className = "message success";

  showAdminContent();
  await loadAdminData();
}

/**
 * Déconnexion.
 */
function handleLogout() {
  logoutUser();
  showLoginSection();
}

/**
 * Charger toutes les données admin.
 */
async function loadAdminData() {
  allAgents     = await getAgents();
  allProduction = await getProduction();

  renderAgentsTable(allAgents);
  renderAgentSelects(allAgents);
  renderProductionTable(allProduction);
  renderFilters(allAgents, allProduction);
  updateKpis(allProduction);
  setDefaultProgramDate();

  // NOUVEAU : rend les graphiques
  if (typeof renderCharts === "function") {
    renderCharts(allProduction);
  }
}

/**
 * Remplir les filtres agent et équipe.
 */
function renderFilters(agents, production) {
  const filterAgent = document.getElementById("filterAgent");
  const filterTeam = document.getElementById("filterTeam");

  if (!filterAgent || !filterTeam) return;

  filterAgent.innerHTML = `<option value="">Tous les agents</option>`;
  filterTeam.innerHTML = `<option value="">Toutes les équipes</option>`;

  agents
    .filter(agent => agent.role === "agent")
    .forEach(agent => {
      const option = document.createElement("option");
      option.value = agent.id;
      option.textContent = agent.name;
      filterAgent.appendChild(option);
    });

  const teams = [...new Set([
    ...agents.map(agent => agent.team).filter(Boolean),
    ...production.map(row => row.team).filter(Boolean)
  ])];

  teams.forEach(team => {
    const option = document.createElement("option");
    option.value = team;
    option.textContent = team;
    filterTeam.appendChild(option);
  });
}

/**
 * Remplir les listes d’agents.
 */
function renderAgentSelects(agents) {
  const programAgent = document.getElementById("programAgent");

  if (!programAgent) return;

  programAgent.innerHTML = `<option value="">Sélectionner un agent</option>`;

  agents
    .filter(agent => agent.role === "agent")
    .forEach(agent => {
      const option = document.createElement("option");
      option.value = agent.id;
      option.textContent = `${agent.name} (${agent.team})`;
      programAgent.appendChild(option);
    });
}

/**
 * Afficher le tableau des agents.
 */
function renderAgentsTable(agents) {
  const tbody = document.getElementById("agentsTableBody");

  if (!tbody) return;

  const visibleAgents = agents.filter(agent => agent.role === "agent");

  if (!visibleAgents.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-table">Aucun agent disponible.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = visibleAgents
    .map(agent => {
      const statusClass = agent.active ? "status-active" : "status-inactive";
      const statusText = agent.active ? "Actif" : "Inactif";

      return `
        <tr>
          <td>${agent.id}</td>
          <td>${agent.name}</td>
          <td>${agent.email}</td>
          <td>${agent.team}</td>
          <td><span class="${statusClass}">${statusText}</span></td>
        </tr>
      `;
    })
    .join("");
}

/**
 * Afficher le tableau de production.
 */
function renderProductionTable(rows) {
  const tbody = document.getElementById("productionTableBody");

  if (!tbody) return;

  if (!rows.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-table">
          Aucune donnée disponible pour le moment.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = rows
    .map(row => {
      return `
        <tr>
          <td>${formatDateFr(row.date)}</td>
          <td>${row.agentName || row.agentId || "-"}</td>
          <td>${row.team || "-"}</td>
          <td>${row.activity || "-"}</td>
          <td>${Number(row.quantity || 0)}</td>
          <td>${row.source || "-"}</td>
        </tr>
      `;
    })
    .join("");
}

/**
 * Mettre à jour les indicateurs clés.
 */
function updateKpis(rows) {
  const totalProductionEl = document.getElementById("kpiTotalProduction");
  const activeAgentsEl = document.getElementById("kpiActiveAgents");
  const averageProductionEl = document.getElementById("kpiAverageProduction");
  const bestAgentEl = document.getElementById("kpiBestAgent");

  const totalProduction = rows.reduce((sum, row) => {
    return sum + Number(row.quantity || 0);
  }, 0);

  const activeAgents = allAgents.filter(agent => {
    return agent.role === "agent" && agent.active === true;
  });

  const averageProduction = activeAgents.length
    ? Math.round(totalProduction / activeAgents.length)
    : 0;

  const productionByAgent = {};

  rows.forEach(row => {
    const key = row.agentName || row.agentId || "Inconnu";

    if (!productionByAgent[key]) {
      productionByAgent[key] = 0;
    }

    productionByAgent[key] += Number(row.quantity || 0);
  });

  let bestAgent = "-";
  let bestScore = 0;

  Object.entries(productionByAgent).forEach(([agentName, score]) => {
    if (score > bestScore) {
      bestScore = score;
      bestAgent = agentName;
    }
  });

  if (totalProductionEl) totalProductionEl.textContent = totalProduction;
  if (activeAgentsEl) activeAgentsEl.textContent = activeAgents.length;
  if (averageProductionEl) averageProductionEl.textContent = averageProduction;
  if (bestAgentEl) bestAgentEl.textContent = bestAgent;
}

/**
 * Appliquer les filtres.
 */
function applyProductionFilters() {
  const filterDate = document.getElementById("filterDate").value;
  const filterAgent = document.getElementById("filterAgent").value;
  const filterTeam = document.getElementById("filterTeam").value;

  let filteredRows = [...allProduction];

  if (filterDate) {
    filteredRows = filteredRows.filter(row => row.date === filterDate);
  }

  if (filterAgent) {
    filteredRows = filteredRows.filter(row => row.agentId === filterAgent);
  }

  if (filterTeam) {
    filteredRows = filteredRows.filter(row => row.team === filterTeam);
  }

  if (typeof renderCharts === "function") {
    renderCharts(filteredRows);
  }
}
/**
 * Réinitialiser les filtres.
 */
function resetProductionFilters() {
  const filterDate = document.getElementById("filterDate");
  const filterAgent = document.getElementById("filterAgent");
  const filterTeam = document.getElementById("filterTeam");

  if (filterDate) filterDate.value = "";
  if (filterAgent) filterAgent.value = "";
  if (filterTeam) filterTeam.value = "";

  renderProductionTable(allProduction);
  updateKpis(allProduction);
}

/**
 * Date par défaut du programme.
 */
function setDefaultProgramDate() {
  const programDate = document.getElementById("programDate");

  if (programDate && !programDate.value) {
    programDate.value = getTodayDate();
  }
}

/**
 * Enregistrer le programme agent.
 */
async function handleSaveProgramme(event) {
  event.preventDefault();

  const programAgent = document.getElementById("programAgent");
  const programDate = document.getElementById("programDate");
  const programActivity = document.getElementById("programActivity");
  const programTarget = document.getElementById("programTarget");
  const programPriority = document.getElementById("programPriority");
  const programMessage = document.getElementById("programMessage");
  const status = document.getElementById("programMessageStatus");

  const currentUser = getCurrentUser();

  if (!programAgent.value || !programDate.value || !programActivity.value || !programTarget.value) {
    status.textContent = "Veuillez remplir les champs obligatoires.";
    status.className = "message error full-width";
    return;
  }

  const programme = {
    date: programDate.value,
    agentId: programAgent.value,
    activity: programActivity.value.trim(),
    target: Number(programTarget.value),
    priority: programPriority.value,
    message: programMessage.value.trim(),
    updatedBy: currentUser ? currentUser.email : ""
  };

  const result = await saveProgramme(programme);

  if (result.success) {
    status.textContent = "Programme enregistré avec succès.";
    status.className = "message success full-width";

    programActivity.value = "";
    programTarget.value = "";
    programPriority.value = "normale";
    programMessage.value = "";
  } else {
    status.textContent = "Erreur pendant l’enregistrement du programme.";
    status.className = "message error full-width";
  }
}
