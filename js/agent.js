/* =========================
   PAGE UTILISATEUR / AGENT
   Suivi Production ARC+
========================= */

let currentAgent = null;
let agentProductionRows = [];
let agentProgrammes = [];

document.addEventListener("DOMContentLoaded", async () => {
  initializeLocalDatabase();
  bindAgentEvents();

  const savedUser = getCurrentUser();

  if (savedUser && savedUser.role === "agent") {
    currentAgent = savedUser;
    showAgentContent();
    await loadAgentData();
  } else {
    showAgentLoginSection();
  }
});

/**
 * Brancher les événements de la page agent.
 */
function bindAgentEvents() {
  const agentLoginBtn = document.getElementById("agentLoginBtn");
  const agentLogoutBtn = document.getElementById("agentLogoutBtn");

  if (agentLoginBtn) {
    agentLoginBtn.addEventListener("click", handleAgentLogin);
  }

  if (agentLogoutBtn) {
    agentLogoutBtn.addEventListener("click", handleAgentLogout);
  }
}

/**
 * Affiche la connexion agent.
 */
function showAgentLoginSection() {
  const loginSection = document.getElementById("agentLoginSection");
  const agentContent = document.getElementById("agentContent");

  if (loginSection) {
    loginSection.classList.remove("hidden");
  }

  if (agentContent) {
    agentContent.classList.add("hidden");
  }
}

/**
 * Affiche le contenu agent.
 */
function showAgentContent() {
  const loginSection = document.getElementById("agentLoginSection");
  const agentContent = document.getElementById("agentContent");

  if (loginSection) {
    loginSection.classList.add("hidden");
  }

  if (agentContent) {
    agentContent.classList.remove("hidden");
  }
}

/**
 * Connexion agent simple par email.
 */
async function handleAgentLogin() {
  const emailInput = document.getElementById("agentEmail");
  const message = document.getElementById("agentLoginMessage");

  const email = emailInput.value.trim();

  if (!email) {
    message.textContent = "Veuillez saisir votre email.";
    message.className = "message error";
    return;
  }

  const result = await loginAgent(email);

  if (!result.success) {
    message.textContent = result.message;
    message.className = "message error";
    return;
  }

  currentAgent = result.user;

  message.textContent = result.message;
  message.className = "message success";

  showAgentContent();
  await loadAgentData();
}

/**
 * Déconnexion agent.
 */
function handleAgentLogout() {
  logoutUser();
  currentAgent = null;
  showAgentLoginSection();
}

/**
 * Charger les données personnelles de l’agent.
 */
async function loadAgentData() {
  if (!currentAgent) return;

  const production = await getProduction();
  const programmes = await getProgrammes();

  agentProductionRows = production.filter(row => {
    return row.agentId === currentAgent.id;
  });

  agentProgrammes = programmes.filter(programme => {
    return programme.agentId === currentAgent.id;
  });

  renderAgentIdentity();
  renderAgentProductionTable(agentProductionRows);
  renderAgentProgram();
  updateAgentKpis();
}

/**
 * Afficher l’identité de l’agent.
 */
function renderAgentIdentity() {
  const nameEl = document.getElementById("agentWelcomeName");
  const teamEl = document.getElementById("agentTeamName");
  const todayEl = document.getElementById("todayDateLabel");

  if (nameEl) {
    nameEl.textContent = currentAgent.name;
  }

  if (teamEl) {
    teamEl.textContent = `Équipe : ${currentAgent.team || "-"}`;
  }

  if (todayEl) {
    todayEl.textContent = formatDateFr(getTodayDate());
  }
}

/**
 * Afficher le programme de l’agent.
 */
function renderAgentProgram() {
  const programCard = document.getElementById("agentProgramCard");

  if (!programCard) return;

  const today = getTodayDate();

  let todayProgram = agentProgrammes.find(programme => {
    return programme.date === today;
  });

  if (!todayProgram && agentProgrammes.length > 0) {
    todayProgram = agentProgrammes[0];
  }

  if (!todayProgram) {
    programCard.innerHTML = `
      <p class="empty-message">
        Aucun programme disponible pour le moment.
      </p>
    `;
    return;
  }

  const priorityLabel = getPriorityLabel(todayProgram.priority);

  programCard.innerHTML = `
    <h3 class="program-title">${todayProgram.activity || "Programme"}</h3>

    <div class="program-meta">
      <div class="program-meta-item">
        <span>Date</span>
        <strong>${formatDateFr(todayProgram.date)}</strong>
      </div>

      <div class="program-meta-item">
        <span>Objectif</span>
        <strong>${Number(todayProgram.target || 0)}</strong>
      </div>

      <div class="program-meta-item">
        <span>Priorité</span>
        <strong>${priorityLabel}</strong>
      </div>
    </div>

    <div class="program-message">
      ${todayProgram.message || "Aucun message manager."}
    </div>
  `;
}

/**
 * Afficher le tableau personnel de production.
 */
function renderAgentProductionTable(rows) {
  const tbody = document.getElementById("agentProductionTableBody");

  if (!tbody) return;

  if (!rows.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-table">
          Aucune production disponible.
        </td>
      </tr>
    `;
    return;
  }

  const sortedRows = [...rows].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  tbody.innerHTML = sortedRows
    .map(row => {
      return `
        <tr>
          <td>${formatDateFr(row.date)}</td>
          <td>${row.activity || "-"}</td>
          <td>${Number(row.quantity || 0)}</td>
          <td>${row.source || "-"}</td>
        </tr>
      `;
    })
    .join("");
}

/**
 * Mettre à jour les indicateurs agent.
 */
function updateAgentKpis() {
  const today = getTodayDate();

  const todayRows = agentProductionRows.filter(row => {
    return row.date === today;
  });

  const todayProduction = todayRows.reduce((sum, row) => {
    return sum + Number(row.quantity || 0);
  }, 0);

  const totalProduction = agentProductionRows.reduce((sum, row) => {
    return sum + Number(row.quantity || 0);
  }, 0);

  let todayProgram = agentProgrammes.find(programme => {
    return programme.date === today;
  });

  if (!todayProgram && agentProgrammes.length > 0) {
    todayProgram = agentProgrammes[0];
  }

  const target = todayProgram ? Number(todayProgram.target || 0) : 0;

  const rate = target > 0
    ? Math.round((todayProduction / target) * 100)
    : 0;

  const todayEl = document.getElementById("agentKpiToday");
  const targetEl = document.getElementById("agentKpiTarget");
  const rateEl = document.getElementById("agentKpiRate");
  const totalEl = document.getElementById("agentKpiTotal");

  if (todayEl) todayEl.textContent = todayProduction;
  if (targetEl) targetEl.textContent = target;
  if (totalEl) totalEl.textContent = totalProduction;

  if (rateEl) {
    rateEl.textContent = `${rate}%`;

    rateEl.classList.remove(
      "agent-rate-good",
      "agent-rate-warning",
      "agent-rate-danger"
    );

    if (rate >= 100) {
      rateEl.classList.add("agent-rate-good");
    } else if (rate >= 70) {
      rateEl.classList.add("agent-rate-warning");
    } else {
      rateEl.classList.add("agent-rate-danger");
    }
  }
}

/**
 * Libellé priorité.
 */
function getPriorityLabel(priority) {
  if (priority === "haute") return "Haute";
  if (priority === "urgente") return "Urgente";
  return "Normale";
}
