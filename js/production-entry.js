/* =========================
   SAISIE DE PRODUCTION (AGENT)
   Suivi Production ARC+
========================= */

let categories = { designations: [], affectations: [] };
let entryRows = [];

/* -------------------------------------------------
   INITIALISATION
------------------------------------------------- */

/**
 * Point d'entrée : appelé depuis agent.js après login.
 */
async function initProductionEntry() {
  await loadCategories();
  buildEntryUI();
  bindEntryEvents();
}

/* -------------------------------------------------
   CHARGEMENT DES CATÉGORIES
------------------------------------------------- */

async function loadCategories() {
  try {
    const res = await fetch("./data/categories.json");
    if (!res.ok) throw new Error("Fetch failed");
    categories = await res.json();
  } catch (_) {
    // Fallback offline
    categories = {
      designations: ["SF", "MAIL", "APPEL SORTANT", "TRAITEMENT"],
      affectations: [
        "CDM", "GP", "PROSPECT", "PRECO", "CREA", "SUPPORT KEOBIZ",
        "FACTURATION", "QUALITE", "BUSINESS PLAN", "CSC", "TRANSFERT",
        "NON TRANSFERT", "RELANCES", "FAUX NUM", "AUTRES", "FISCALITE",
        "ARC+", "COURRIER MA", "JURISTE", "APPEL M+3", "CHATBOT"
      ]
    };
  }
}

/* -------------------------------------------------
   CONSTRUCTION DE L'INTERFACE
------------------------------------------------- */

function buildEntryUI() {
  const container = document.getElementById("productionEntryContainer");
  if (!container) return;

  const designOptions = categories.designations
    .map(d => `<option value="${d}">${d}</option>`)
    .join("");

  const affectOptions = categories.affectations
    .map(a => `<option value="${a}">${a}</option>`)
    .join("");

  container.innerHTML = `
    <!-- Formulaire de saisie rapide -->
    <div class="entry-form-row">
      <div class="form-group">
        <label for="entryDesignation">Désignation</label>
        <select id="entryDesignation">
          <option value="">Sélectionner...</option>
          ${designOptions}
        </select>
      </div>

      <div class="form-group">
        <label for="entryAffectation">Affectation</label>
        <select id="entryAffectation">
          <option value="">Sélectionner...</option>
          ${affectOptions}
        </select>
      </div>

      <div class="form-group">
        <label for="entryInfo">Info <span class="optional-label">(optionnel)</span></label>
        <input type="text" id="entryInfo" placeholder="Remarque, précision..." />
      </div>

      <div class="form-group entry-qty-group">
        <label for="entryQuantity">Quantité</label>
        <input type="number" id="entryQuantity" min="1" value="1" />
      </div>

      <div class="form-group entry-btn-group">
        <label class="invisible-label">&nbsp;</label>
        <button type="button" id="addEntryRowBtn" class="primary-button">
          + Ajouter
        </button>
      </div>
    </div>

    <!-- Message d'erreur inline -->
    <p id="entryValidationMsg" class="message" style="margin-bottom:8px;"></p>

    <!-- Tableau des lignes en cours -->
    <div class="entry-table-wrapper" id="entryTableWrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Désignation</th>
            <th>Affectation</th>
            <th>Info</th>
            <th>Quantité</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="entryTableBody">
          <tr>
            <td colspan="5" class="empty-table">
              Aucune ligne ajoutée — utilisez le formulaire ci-dessus.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pied de formulaire -->
    <div class="entry-footer">
      <div class="entry-total" id="entryTotal" style="display:none;">
        Total : <strong id="entryTotalValue">0</strong> unités
      </div>
      <div class="entry-footer-actions">
        <p id="entrySaveStatus" class="message"></p>
        <button type="button" id="saveEntriesBtn" class="primary-button" disabled>
          💾 Enregistrer ma production
        </button>
      </div>
    </div>
  `;
}

/* -------------------------------------------------
   ÉVÉNEMENTS
------------------------------------------------- */

function bindEntryEvents() {
  // Délégation sur le document (le container est injecté dynamiquement)
  document.addEventListener("click", e => {
    if (e.target.id === "addEntryRowBtn")                  addEntryRow();
    if (e.target.id === "saveEntriesBtn")                  saveEntries();
    if (e.target.classList.contains("btn-remove-entry")) {
      removeEntryRow(Number(e.target.dataset.index));
    }
  });
}

/* -------------------------------------------------
   LOGIQUE MÉTIER
------------------------------------------------- */

function addEntryRow() {
  const designation = document.getElementById("entryDesignation")?.value || "";
  const affectation = document.getElementById("entryAffectation")?.value || "";
  const info        = document.getElementById("entryInfo")?.value.trim() || "";
  const quantity    = Number(document.getElementById("entryQuantity")?.value || 0);
  const validMsg    = document.getElementById("entryValidationMsg");

  if (!designation || !affectation) {
    showValidation("Veuillez sélectionner une désignation et une affectation.");
    return;
  }
  if (!quantity || quantity < 1) {
    showValidation("La quantité doit être au moins égale à 1.");
    return;
  }

  clearValidation();

  entryRows.push({ designation, affectation, info, quantity });

  // Reset champs
  document.getElementById("entryDesignation").value = "";
  document.getElementById("entryAffectation").value = "";
  document.getElementById("entryInfo").value         = "";
  document.getElementById("entryQuantity").value     = 1;

  renderEntryRows();
}

function removeEntryRow(index) {
  entryRows.splice(index, 1);
  renderEntryRows();
}

function renderEntryRows() {
  const tbody   = document.getElementById("entryTableBody");
  const saveBtn = document.getElementById("saveEntriesBtn");
  const totalEl = document.getElementById("entryTotal");
  const totalV  = document.getElementById("entryTotalValue");

  if (!tbody) return;

  if (!entryRows.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-table">
          Aucune ligne ajoutée — utilisez le formulaire ci-dessus.
        </td>
      </tr>`;
    if (saveBtn)  saveBtn.disabled = true;
    if (totalEl)  totalEl.style.display = "none";
    return;
  }

  tbody.innerHTML = entryRows.map((row, i) => `
    <tr>
      <td><span class="badge-designation">${row.designation}</span></td>
      <td><span class="badge-affectation">${row.affectation}</span></td>
      <td style="color:var(--text-muted);font-size:0.88rem;">${row.info || "—"}</td>
      <td><strong>${row.quantity}</strong></td>
      <td>
        <button
          class="btn-remove-entry"
          data-index="${i}"
          title="Supprimer cette ligne"
          aria-label="Supprimer">✕</button>
      </td>
    </tr>
  `).join("");

  if (saveBtn) saveBtn.disabled = false;

  const total = entryRows.reduce((s, r) => s + r.quantity, 0);
  if (totalEl) totalEl.style.display = "flex";
  if (totalV)  totalV.textContent = total;
}

async function saveEntries() {
  if (!currentAgent || !entryRows.length) return;

  const statusEl = document.getElementById("entrySaveStatus");
  if (statusEl) {
    statusEl.textContent = "Enregistrement en cours...";
    statusEl.className   = "message warning";
  }

  const rows = entryRows.map(row => ({
    date:        getTodayDate(),
    agentId:     currentAgent.id,
    agentName:   currentAgent.name,
    team:        currentAgent.team || "ARC+",
    activity:    row.designation,    // pour compatibilité avec l'existant
    affectation: row.affectation,
    info:        row.info,
    quantity:    row.quantity,
    source:      "agent"
  }));

  const result = await addProductionRows(rows);

  if (result.success) {
    if (statusEl) {
      statusEl.textContent = `✓ Production enregistrée (${rows.length} ligne(s)).`;
      statusEl.className   = "message success";
    }
    entryRows = [];
    renderEntryRows();
    // Rafraîchit les KPI et le tableau de l'agent
    if (typeof loadAgentData === "function") await loadAgentData();
  } else {
    if (statusEl) {
      statusEl.textContent = "Erreur lors de l'enregistrement.";
      statusEl.className   = "message error";
    }
  }
}

/* -------------------------------------------------
   HELPERS VALIDATION
------------------------------------------------- */

function showValidation(msg) {
  const el = document.getElementById("entryValidationMsg");
  if (el) { el.textContent = msg; el.className = "message error"; }
}

function clearValidation() {
  const el = document.getElementById("entryValidationMsg");
  if (el) { el.textContent = ""; el.className = "message"; }
}
