/* =========================
   IMPORT EXCEL
   Suivi Production ARC+
========================= */

/**
 * Stock temporaire des lignes prévisualisées.
 */
let previewedExcelRows = [];

/**
 * Normalise le nom d’une colonne Excel.
 */
function normalizeColumnName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "")
    .replaceAll("_", "")
    .replaceAll("-", "");
}

/**
 * Essaie de trouver une valeur dans une ligne Excel avec plusieurs noms possibles.
 */
function findValue(row, possibleNames) {
  const keys = Object.keys(row);

  for (const possibleName of possibleNames) {
    const normalizedPossibleName = normalizeColumnName(possibleName);

    const foundKey = keys.find(key => {
      return normalizeColumnName(key) === normalizedPossibleName;
    });

    if (foundKey) {
      return row[foundKey];
    }
  }

  return "";
}

/**
 * Convertit une date Excel ou texte en format YYYY-MM-DD.
 */
function normalizeExcelDate(value) {
  if (!value) {
    return getTodayDate();
  }

  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return date.toISOString().split("T")[0];
  }

  const rawValue = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return rawValue;
  }

  const frenchDateMatch = rawValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (frenchDateMatch) {
    const day = frenchDateMatch[1].padStart(2, "0");
    const month = frenchDateMatch[2].padStart(2, "0");
    const year = frenchDateMatch[3];

    return `${year}-${month}-${day}`;
  }

  const parsedDate = new Date(rawValue);

  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString().split("T")[0];
  }

  return getTodayDate();
}

/**
 * Transforme les lignes Excel en format production standard.
 *
 * Important :
 * Les noms de colonnes exacts de votre Excel peuvent varier.
 * On accepte donc plusieurs noms possibles.
 */
function mapExcelRowsToProduction(rows) {
  return rows
    .map(row => {
      const date = findValue(row, [
        "date",
        "jour",
        "date production",
        "date_production"
      ]);

      const agentId = findValue(row, [
        "agentId",
        "id agent",
        "matricule",
        "code agent",
        "id"
      ]);

      const agentName = findValue(row, [
        "agent",
        "nom",
        "agentName",
        "nom agent",
        "collaborateur"
      ]);

      const team = findValue(row, [
        "team",
        "équipe",
        "equipe",
        "groupe",
        "pôle",
        "pole"
      ]);

      const activity = findValue(row, [
        "activity",
        "activité",
        "activite",
        "type",
        "tâche",
        "tache",
        "production"
      ]);

      const quantity = findValue(row, [
        "quantity",
        "quantité",
        "quantite",
        "nombre",
        "total",
        "réalisé",
        "realise",
        "prod"
      ]);

      return {
        id: generateId("prod"),
        date: normalizeExcelDate(date),
        agentId: String(agentId || "").trim(),
        agentName: String(agentName || "").trim(),
        team: String(team || "").trim(),
        activity: String(activity || "").trim(),
        quantity: Number(quantity || 0),
        source: "excel"
      };
    })
    .filter(row => {
      return row.agentName || row.agentId || row.activity || row.quantity > 0;
    });
}

/**
 * Lit le fichier Excel sélectionné.
 */
async function readExcelFile(file) {
  if (!file) {
    throw new Error("Aucun fichier sélectionné.");
  }

  if (typeof XLSX === "undefined") {
    throw new Error("La librairie XLSX n’est pas chargée.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  if (!workbook.SheetNames.length) {
    throw new Error("Le fichier Excel ne contient aucune feuille.");
  }

  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  const rawRows = XLSX.utils.sheet_to_json(sheet, {
    defval: ""
  });

  const productionRows = mapExcelRowsToProduction(rawRows);

  return {
    sheetName: firstSheetName,
    rawRows,
    productionRows
  };
}

/**
 * Prévisualisation du fichier Excel.
 */
async function previewExcelImport() {
  const fileInput = document.getElementById("excelFile");
  const importStatus = document.getElementById("importStatus");

  if (!fileInput || !importStatus) return;

  const file = fileInput.files[0];

  try {
    importStatus.textContent = "Lecture du fichier Excel en cours...";
    importStatus.className = "message warning";

    const result = await readExcelFile(file);

    previewedExcelRows = result.productionRows;

    importStatus.textContent =
      `${previewedExcelRows.length} ligne(s) détectée(s) dans la feuille "${result.sheetName}".`;

    importStatus.className = "message success";

    if (typeof renderProductionTable === "function") {
      renderProductionTable(previewedExcelRows);
    }

    if (typeof updateKpis === "function") {
      updateKpis(previewedExcelRows);
    }
  } catch (error) {
    console.error(error);
    importStatus.textContent = error.message;
    importStatus.className = "message error";
  }
}

/**
 * Enregistrement des lignes prévisualisées.
 */
async function savePreviewedExcelRows() {
  const importStatus = document.getElementById("importStatus");

  if (!importStatus) return;

  if (!previewedExcelRows.length) {
    importStatus.textContent = "Aucune donnée à enregistrer. Prévisualisez d’abord un fichier.";
    importStatus.className = "message error";
    return;
  }

  try {
    const result = await addProductionRows(previewedExcelRows);

    importStatus.textContent = result.message;
    importStatus.className = "message success";

    previewedExcelRows = [];

    if (typeof loadAdminData === "function") {
      await loadAdminData();
    }
  } catch (error) {
    console.error(error);
    importStatus.textContent = "Erreur pendant l’enregistrement des données.";
    importStatus.className = "message error";
  }
}
