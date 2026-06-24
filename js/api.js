/* =========================
   API FIRESTORE
   Suivi Production ARC+
========================= */

/* ================================================
   AGENTS
================================================ */

async function getAgents() {
  const db   = getDb();
  const snap = await db.collection("agents").get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getAgentByEmail(email) {
  const db   = getDb();
  const snap = await db.collection("agents").where("email", "==", email).get();
  if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
  return null;
}

async function getOrCreateAgent(user) {
  const existing = await getAgentByEmail(user.email);
  if (existing) return existing;
  const data = {
    name:   user.name  || user.email,
    email:  user.email,
    team:   "ARC+",
    role:   ACCESS_CONTROL.isAdmin(user.email) ? "admin" : "agent",
    active: true
  };
  const ref = await getDb().collection("agents").add(data);
  return { id: ref.id, ...data };
}

async function saveAgent(agentData) {
  const db       = getDb();
  const existing = await db.collection("agents").where("email", "==", agentData.email).get();
  const data = {
    name:   agentData.name   || "",
    email:  agentData.email  || "",
    team:   agentData.team   || "ARC+",
    role:   agentData.role   || "agent",
    active: agentData.active !== false
  };
  if (!existing.empty) {
    await existing.docs[0].ref.update(data);
    return { success: true, id: existing.docs[0].id };
  }
  const ref = await db.collection("agents").add(data);
  return { success: true, id: ref.id };
}

async function updateAgentById(id, data) {
  await getDb().collection("agents").doc(id).update(data);
  return { success: true };
}

async function deleteAgent(id) {
  await getDb().collection("agents").doc(id).delete();
  return { success: true };
}

/* ================================================
   PRODUCTION
================================================ */

async function getProduction(filters = {}) {
  const db   = getDb();
  let query  = db.collection("production");

  // On filtre côté serveur sur un seul champ pour éviter les index composites
  if (filters.agentEmail) {
    query = query.where("agentEmail", "==", filters.agentEmail);
  } else if (filters.agentId) {
    query = query.where("agentId", "==", filters.agentId);
  } else if (filters.team) {
    query = query.where("team", "==", filters.team);
  }

  const snap    = await query.get();
  let results   = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Filtres complémentaires côté client
  if (filters.date)    results = results.filter(r => r.date === filters.date);
  if (filters.team && !filters.agentEmail && !filters.agentId)
                       results = results.filter(r => r.team === filters.team);

  return results.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

async function addProductionRows(rows) {
  const db    = getDb();
  const batch = db.batch();
  const newRows = rows.map(row => {
    const ref  = db.collection("production").doc();
    const data = {
      date:        row.date        || getTodayDate(),
      agentId:     row.agentId     || "",
      agentName:   row.agentName   || "",
      agentEmail:  row.agentEmail  || "",
      team:        row.team        || "",
      activity:    row.activity    || "",
      affectation: row.affectation || "",
      info:        row.info        || "",
      quantity:    Number(row.quantity || 0),
      source:      row.source      || "manual",
      createdAt:   firebase.firestore.FieldValue.serverTimestamp()
    };
    batch.set(ref, data);
    return { id: ref.id, ...data };
  });
  await batch.commit();
  return { success: true, message: `${rows.length} ligne(s) ajoutée(s).`, rows: newRows };
}

async function saveProduction(productionRows) {
  return addProductionRows(productionRows);
}

/* ================================================
   PROGRAMMES
================================================ */

async function getProgrammes(agentEmail = null) {
  const db   = getDb();
  let query  = db.collection("programmes");
  if (agentEmail) query = query.where("agentEmail", "==", agentEmail);
  const snap = await query.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

async function saveProgramme(programme) {
  const db  = getDb();
  const snap = await db.collection("programmes")
    .where("agentEmail", "==", programme.agentEmail)
    .where("date",       "==", programme.date)
    .get();

  const data = {
    date:       programme.date,
    agentId:    programme.agentId    || "",
    agentEmail: programme.agentEmail || "",
    agentName:  programme.agentName  || "",
    activity:   programme.activity   || "",
    target:     Number(programme.target || 0),
    priority:   programme.priority   || "normale",
    message:    programme.message    || "",
    updatedBy:  programme.updatedBy  || "",
    updatedAt:  firebase.firestore.FieldValue.serverTimestamp()
  };

  if (!snap.empty) {
    await snap.docs[0].ref.update(data);
    return { success: true, message: "Programme mis à jour.", id: snap.docs[0].id };
  }
  const ref = await db.collection("programmes").add({
    ...data,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  return { success: true, message: "Programme enregistré.", id: ref.id };
}

/* ================================================
   ANNONCES
================================================ */

async function getAnnouncements() {
  const db   = getDb();
  const snap = await db.collection("announcements")
    .where("active", "==", true)
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tb - ta;
    });
}

async function saveAnnouncement(announcement) {
  const db   = getDb();
  const data = {
    title:      announcement.title      || "",
    content:    announcement.content    || "",
    category:   announcement.category   || "info",
    priority:   announcement.priority   || "normale",
    targetRole: announcement.targetRole || "all",
    author:     announcement.author     || "",
    active:     true,
    updatedAt:  firebase.firestore.FieldValue.serverTimestamp()
  };
  if (announcement.id) {
    await db.collection("announcements").doc(announcement.id).update(data);
    return { success: true, id: announcement.id };
  }
  const ref = await db.collection("announcements").add({
    ...data,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  return { success: true, id: ref.id };
}

async function deleteAnnouncement(id) {
  await getDb().collection("announcements").doc(id).update({ active: false });
  return { success: true };
}

/* ================================================
   MESSAGES
================================================ */

async function getMessages(userEmail) {
  const db   = getDb();
  const snap = await db.collection("messages").get();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(m => m.targetEmail === "all" || m.targetEmail === userEmail || m.fromEmail === userEmail)
    .sort((a, b) => {
      const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tb - ta;
    });
}

async function sendMessage(message) {
  const ref = await getDb().collection("messages").add({
    subject:     message.subject     || "",
    content:     message.content     || "",
    fromEmail:   message.fromEmail   || "",
    fromName:    message.fromName    || "",
    targetEmail: message.targetEmail || "all",
    targetName:  message.targetName  || "Tous les utilisateurs",
    readBy:      [],
    createdAt:   firebase.firestore.FieldValue.serverTimestamp()
  });
  return { success: true, id: ref.id };
}

async function markMessageRead(messageId, userEmail) {
  await getDb().collection("messages").doc(messageId).update({
    readBy: firebase.firestore.FieldValue.arrayUnion(userEmail)
  });
}

async function deleteMessage(id) {
  await getDb().collection("messages").doc(id).delete();
  return { success: true };
}

/* ================================================
   SECTIONS (blocs d'info pour les utilisateurs)
================================================ */

async function getSections() {
  const db   = getDb();
  const snap = await db.collection("sections").where("active", "==", true).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

async function getAllSections() {
  const db   = getDb();
  const snap = await db.collection("sections").get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

async function saveSection(section) {
  const db   = getDb();
  const data = {
    title:      section.title      || "",
    content:    section.content    || "",
    icon:       section.icon       || "📄",
    category:   section.category   || "general",
    order:      Number(section.order || 0),
    active:     section.active !== false,
    createdBy:  section.createdBy  || "",
    updatedAt:  firebase.firestore.FieldValue.serverTimestamp()
  };
  if (section.id) {
    await db.collection("sections").doc(section.id).update(data);
    return { success: true, id: section.id };
  }
  const ref = await db.collection("sections").add({
    ...data,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  return { success: true, id: ref.id };
}

async function deleteSection(id) {
  await getDb().collection("sections").doc(id).update({ active: false });
  return { success: true };
}
