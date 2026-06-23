/* =========================
   GRAPHIQUES (ADMIN)
   Suivi Production ARC+
   Dépend : Chart.js (CDN)
========================= */

let chartAffectation = null;
let chartAgent       = null;
let chartDesignation = null;

const CHART_PALETTE = [
  "#2563eb", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4",
  "#84cc16", "#a855f7", "#64748b", "#f43f5e", "#22d3ee"
];

/* -------------------------------------------------
   POINT D'ENTRÉE
------------------------------------------------- */

/**
 * Rend tous les graphiques à partir des données de production.
 * @param {Array} rows - tableau de production filtré ou complet
 */
function renderCharts(rows) {
  if (typeof Chart === "undefined") {
    console.warn("Chart.js non chargé.");
    return;
  }
  renderChartByAffectation(rows);
  renderChartByAgent(rows);
  renderChartByDesignation(rows);
}

/* -------------------------------------------------
   GRAPHIQUE 1 : Production par affectation
------------------------------------------------- */

function renderChartByAffectation(rows) {
  const canvas = document.getElementById("chartByAffectation");
  if (!canvas) return;

  const grouped = groupBy(rows, r => r.affectation || r.activity || "—");
  const labels  = Object.keys(grouped);
  const data    = Object.values(grouped);
  const colors  = labels.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]);

  if (chartAffectation) chartAffectation.destroy();

  chartAffectation = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Unités",
        data,
        backgroundColor: colors.map(c => c + "bb"),
        borderColor:     colors,
        borderWidth:     2,
        borderRadius:    6,
        borderSkipped:   false
      }]
    },
    options: chartBarOptions("Production par affectation")
  });
}

/* -------------------------------------------------
   GRAPHIQUE 2 : Production par agent (Doughnut)
------------------------------------------------- */

function renderChartByAgent(rows) {
  const canvas = document.getElementById("chartByAgent");
  if (!canvas) return;

  const grouped = groupBy(rows, r => r.agentName || r.agentId || "Inconnu");
  const labels  = Object.keys(grouped);
  const data    = Object.values(grouped);
  const colors  = labels.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]);

  if (chartAgent) chartAgent.destroy();

  chartAgent = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.map(c => c + "cc"),
        borderColor:     colors,
        borderWidth:     2,
        hoverOffset:     8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font:    { family: "Inter, sans-serif", size: 12 },
            padding: 14,
            usePointStyle: true,
            pointStyle: "circle"
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label} : ${ctx.parsed} unités`
          }
        },
        title: {
          display: true,
          text:    "Production par agent",
          font:    { family: "Inter, sans-serif", size: 13, weight: "700" },
          color:   "#0f172a",
          padding: { bottom: 12 }
        }
      }
    }
  });
}

/* -------------------------------------------------
   GRAPHIQUE 3 : Production par désignation
------------------------------------------------- */

function renderChartByDesignation(rows) {
  const canvas = document.getElementById("chartByDesignation");
  if (!canvas) return;

  const grouped = groupBy(rows, r => r.activity || "—");
  const labels  = Object.keys(grouped);
  const data    = Object.values(grouped);
  const colors  = labels.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]);

  if (chartDesignation) chartDesignation.destroy();

  chartDesignation = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Unités",
        data,
        backgroundColor: colors.map(c => c + "bb"),
        borderColor:     colors,
        borderWidth:     2,
        borderRadius:    6,
        borderSkipped:   false,
        indexAxis:       "y"   // horizontal
      }]
    },
    options: chartBarOptions("Production par désignation", true)
  });
}

/* -------------------------------------------------
   OPTIONS COMMUNES
------------------------------------------------- */

function chartBarOptions(title, horizontal = false) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? "y" : "x",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.parsed[horizontal ? "x" : "y"]} unités`
        }
      },
      title: {
        display: true,
        text:    title,
        font:    { family: "Inter, sans-serif", size: 13, weight: "700" },
        color:   "#0f172a",
        padding: { bottom: 12 }
      }
    },
    scales: {
      x: {
        grid:  { color: horizontal ? "transparent" : "#f1f5f9" },
        ticks: { font: { family: "Inter, sans-serif", size: 11 }, maxRotation: horizontal ? 0 : 35 }
      },
      y: {
        beginAtZero: true,
        grid:  { color: horizontal ? "#f1f5f9" : "transparent" },
        ticks: { font: { family: "Inter, sans-serif", size: 11 } }
      }
    }
  };
}

/* -------------------------------------------------
   HELPER
------------------------------------------------- */

function groupBy(rows, keyFn) {
  const result = {};
  rows.forEach(row => {
    const k = keyFn(row);
    result[k] = (result[k] || 0) + Number(row.quantity || 0);
  });
  // Tri décroissant
  return Object.fromEntries(
    Object.entries(result).sort((a, b) => b[1] - a[1])
  );
}
