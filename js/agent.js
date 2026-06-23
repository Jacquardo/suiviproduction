btn" data-target="agentTabKpis">📊 Indicateurs</button>
      <button class="agent-tab-btn" data-target="agentTabProgramme">📅 Programme</button>
      <button class="agent-tab-btn" data-target="agentTabAnnouncements">
        📢 Annonces <span id="announcementsCount" class="tab-badge" style="display:none;">0</span>
      </button>
      <button class="agent-tab-btn" data-target="agentTabMessages">
        ✉️ Messages <span id="messagesCount" class="tab-badge" style="display:none;">0</span>
      </button>
      <button class="agent-tab-btn" data-target="agentTabSections">📄 Informations</button>
      <button class="agent-tab-btn" data-target="agentTabProduction">✏️ Ma production</button>
    </nav>

    <!-- =================== ONGLET INDICATEURS =================== -->
    <div id="agentTabKpis" class="agent-tab-panel hidden">
      <section class="agent-section">
        <div class="section-header">
          <h2>Mes indicateurs</h2>
          <p>Résumé rapide de votre production.</p>
        </div>
        <div class="agent-kpi-grid">
          <div class="agent-kpi-card">
            <span>Production du jour</span>
            <strong id="agentKpiToday">0</strong>
          </div>
          <div class="agent-kpi-card">
            <span>Objectif du jour</span>
            <strong id="agentKpiTarget">0</strong>
          </div>
          <div class="agent-kpi-card">
            <span>Taux d'atteinte</span>
            <strong id="agentKpiRate">0%</strong>
          </div>
          <div class="agent-kpi-card">
            <span>Total historique</span>
            <strong id="agentKpiTotal">0</strong>
          </div>
        </div>
      </section>
    </div>

    <!-- =================== ONGLET PROGRAMME =================== -->
    <div id="agentTabProgramme" class="agent-tab-panel hidden">
      <section class="agent-section">
        <div class="section-header">
          <h2>Mon programme</h2>
          <p>Programme publié par le manager pour aujourd'hui.</p>
        </div>
        <div id="agentProgramCard" class="program-card">
          <p class="empty-message">Aucun programme disponible pour aujourd'hui.</p>
        </div>
      </section>
    </div>

    <!-- =================== ONGLET ANNONCES =================== -->
    <div id="agentTabAnnouncements" class="agent-tab-panel hidden">
      <section class="agent-section">
        <div class="section-header">
          <h2>Annonces</h2>
          <p>Informations publiées par l'administration.</p>
        </div>
        <div id="agentAnnouncementsList">
          <p class="empty-message">Chargement…</p>
        </div>
      </section>
    </div>

    <!-- =================== ONGLET MESSAGES =================== -->
    <div id="agentTabMessages" class="agent-tab-panel hidden">
      <section class="agent-section">
        <div class="section-header">
          <h2>Mes messages</h2>
          <p>Messages reçus de l'administration.</p>
        </div>
        <div id="agentMessagesList">
          <p class="empty-message">Chargement…</p>
        </div>
      </section>
    </div>

    <!-- =================== ONGLET SECTIONS / INFORMATIONS =================== -->
    <div id="agentTabSections" class="agent-tab-panel hidden">
      <section class="agent-section">
        <div class="section-header">
          <h2>Informations</h2>
          <p>Documents et ressources mis à disposition par l'administration.</p>
        </div>
        <div id="agentSectionsList">
          <p class="empty-message">Chargement…</p>
        </div>
      </section>
    </div>

    <!-- =================== ONGLET PRODUCTION =================== -->
    <div id="agentTabProduction" class="agent-tab-panel hidden">

      <section class="agent-section">
        <div class="section-header">
          <h2>📝 Saisir ma production du jour</h2>
          <p>Sélectionnez une désignation, une affectation et entrez la quantité traitée.</p>
        </div>
        <div id="productionEntryContainer">
          <p class="empty-message">Chargement du formulaire…</p>
        </div>
      </section>

      <section class="agent-section">
        <div class="section-header">
          <h2>Mon tableau de production</h2>
          <p>Votre suivi personnel de production.</p>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th><th>Activité</th><th>Quantité</th><th>Source</th>
              </tr>
            </thead>
            <tbody id="agentProductionTableBody">
              <tr><td colspan="4" class="empty-table">Aucune production disponible.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

    </div>

  </div><!-- /agent-container -->
</div><!-- /agentContent -->

<footer class="app-footer">
  <p>Suivi Production ARC+ &nbsp;·&nbsp; Espace utilisateur</p>
</footer>

<!-- Firebase -->
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
<!-- App -->
<script src="./js/firebase-config.js"></script>
<script src="./js/auth.js"></script>
<script src="./js/app.js"></script>
<script src="./js/api.js"></script>
<script src="./js/production-entry.js"></script>
<script src="./js/agent.js"></script>

</body>
</html>
