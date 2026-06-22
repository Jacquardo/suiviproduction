/* =========================
   API LOCALE TEMPORAIRE
   Suivi Production ARC+
========================= */

/**
 * Clés utilisées dans localStorage.
 */
const STORAGE_KEYS = {
  agents: "suivi_prod_agents",
  production: "suivi_prod_production",
  programmes: "suivi_prod_programmes",
  currentUser: "suivi_prod_current_user"
};

/**
 * Données de démonstration.
 * Elles servent uniquement au démarrage du prototype.
 */
const DEFAULT_AGENTS = [
  {
    id: "k1736",
    name: "Jacquardo",
    email: "sedra.k1736@keobiz.fr",
    team: "ARC+",
    role: "admin",
    active: true
  },
  {
    id: "k1001",
    name: "Agent 1",
    email: "agent1@keobiz.fr",
    team: "ARC+",
    role: "agent",
    active: true
  },
  {
    id: "k1002",
    name: "Agent 2",
    email: "agent2@keobiz.fr",
    team: "ARC+",
    role: "agent",
    active: true
  },
  {
    id: "k1003",
    name: "Agent 3",
    email: "agent3@keobiz.fr",
    team: "ARC+",
    role: "agent",
    active: false
  }
];

const DEFAULT_PRODUCTION = [
  {
    id: "prod_001",
    date: "2026-06-22",
    agentId: "k1001",
    agentName: "Agent 1",
    team: "ARC+",
    activity: "Relance J+7",
    quantity: 35,
    source: "demo"
  },
  {
    id: "prod_002",
    date: "2026-06-22",
    agentId: "k1002",
    agentName: "Agent 2",
    team: "ARC+",
    activity: "Traitement dossier",
    quantity: 42,
    source: "demo"
  },
  {
    id: "prod_003",
    date: "2026-06-21",
    agentId: "k1001",
    agentName: "Agent 1",
    team: "ARC+",
    activity: "Appel sortant",
    quantity: 28,
    source: "demo"
  }
];

const DEFAULT_PROGRAMMES = [
  {
    id: "prog_001",
    date: "2026-06-22",
    agentId: "k1001",
    activity: "Relance J+7",
    target: 40,
    priority: "haute",
    message: "Priorité sur les relances J+7.",
    updatedBy: "sedra.k1736@keobiz.fr"
  }
];

/**
 * Initialise les données locales si elles n’existent pas encore.
 */
function initializeLocalDatabase() {
  if (!localStorage.getItem(STORAGE_KEYS.agents)) {
    localStorage.setItem(STORAGE_KEYS.agents, JSON.stringify(DEFAULT_AGENTS));
  }

  if (!localStorage.getItem(STORAGE_KEYS.production)) {
    localStorage.setItem(STORAGE_KEYS.production, JSON.stringify(DEFAULT_PRODUCTION));
  }

  if (!localStorage.getItem(STORAGE_KEYS.programmes)) {
    localStorage.setItem(STORAGE_KEYS.programmes, JSON.stringify(DEFAULT_PROGRAMMES));
  }
}

/**
 * Lecture générique dans localStorage.
 */
function readStorage(key) {
  const rawData = localStorage.getItem(key);

  if (!rawData) {
    return [];
  }

  try {
    return JSON.parse(rawData);
  } catch (error) {
    console.error("Erreur de lecture localStorage :", error);
    return [];
  }
}

/**
 * Écriture générique dans localStorage.
 */
function writeStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Connexion manager temporaire.
 * Pour le prototype :
 * email : sedra.k1736@keobiz.fr
 * code : admin123
 */
async function loginManager(email, code) {
  const agents = await getAgents();

  const user = agents.find(agent => {
    return (
      agent.email.toLowerCase() === email.toLowerCase() &&
      agent.role === "admin" &&
      agent.active === true
    );
  });

  if (!user) {
    return {
      success: false,
      message: "Aucun manager actif trouvé avec cet email."
    };
  }

  if (code !== "admin123") {
    return {
      success: false,
      message: "Code d’accès incorrect."
    };
  }

  localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));

  return {
    success: true,
    message: "Connexion réussie.",
    user
  };
}

/**
 * Déconnexion.
 */
function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.currentUser);
}

/**
 * Utilisateur connecté.
 */
function getCurrentUser() {
  const rawData = localStorage.getItem(STORAGE_KEYS.currentUser);

  if (!rawData) {
    return null;
  }

  try {
    return JSON.parse(rawData);
  } catch (error) {
    return null;
  }
}

/**
 * Vérifie si le manager est connecté.
 */
function isManagerLoggedIn() {
  const user = getCurrentUser();
  return user && user.role === "admin";
}

/**
 * Récupérer les agents.
 */
async function getAgents() {
  initializeLocalDatabase();
  return readStorage(STORAGE_KEYS.agents);
}

/**
 * Récupérer la production.
 */
async function getProduction() {
  initializeLocalDatabase();
  return readStorage(STORAGE_KEYS.production);
}

/**
 * Enregistrer la production complète.
 */
async function saveProduction(productionRows) {
  writeStorage(STORAGE_KEYS.production, productionRows);
  return {
    success: true,
    message: "Production enregistrée localement."
  };
}

/**
 * Ajouter plusieurs lignes de production.
 */
async function addProductionRows(rows) {
  const currentProduction = await getProduction();

  const newRows = rows.map(row => {
    return {
      id: row.id || generateId("prod"),
      date: row.date || getTodayDate(),
      agentId: row.agentId || "",
      agentName: row.agentName || "",
      team: row.team || "",
      activity: row.activity || "",
      quantity: Number(row.quantity || 0),
      source: row.source || "excel"
    };
  });

  const updatedProduction = [...currentProduction, ...newRows];

  await saveProduction(updatedProduction);

  return {
    success: true,
    message: `${newRows.length} ligne(s) ajoutée(s).`,
    rows: newRows
  };
}

/**
 * Récupérer les programmes.
 */
async function getProgrammes() {
  initializeLocalDatabase();
  return readStorage(STORAGE_KEYS.programmes);
}

/**
 * Enregistrer ou mettre à jour un programme agent.
 */
async function saveProgramme(programme) {
  const programmes = await getProgrammes();

  const newProgramme = {
    id: programme.id || generateId("prog"),
    date: programme.date,
    agentId: programme.agentId,
    activity: programme.activity,
    target: Number(programme.target || 0),
    priority: programme.priority || "normale",
    message: programme.message || "",
    updatedBy: programme.updatedBy || ""
  };

  const existingIndex = programmes.findIndex(item => {
    return item.date === newProgramme.date && item.agentId === newProgramme.agentId;
  });

  if (existingIndex >= 0) {
    programmes[existingIndex] = {
      ...programmes[existingIndex],
      ...newProgramme
    };
  } else {
    programmes.push(newProgramme);
  }

  writeStorage(STORAGE_KEYS.programmes, programmes);

  return {
    success: true,
    message: "Programme enregistré.",
    programme: newProgramme
  };
}

/**
 * Réinitialiser les données de démonstration.
 * Fonction utile pendant les tests.
 */
function resetLocalDatabase() {
  localStorage.removeItem(STORAGE_KEYS.agents);
  localStorage.removeItem(STORAGE_KEYS.production);
  localStorage.removeItem(STORAGE_KEYS.programmes);
  localStorage.removeItem(STORAGE_KEYS.currentUser);

  initializeLocalDatabase();
}


/**
 * Connexion agent temporaire par email.
 */
async function loginAgent(email) {
  const agents = await getAgents();

  const user = agents.find(agent => {
    return (
      agent.email.toLowerCase() === email.toLowerCase() &&
      agent.role === "agent" &&
      agent.active === true
    );
  });

  if (!user) {
    return {
      success: false,
      message: "Aucun agent actif trouvé avec cet email."
    };
  }

  localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));

  return {
    success: true,
    message: "Connexion réussie.",
    user
  };
}
