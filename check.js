
    const actionsButton = document.getElementById('actionsButton');
    const actionsMenu = document.getElementById('actionsMenu');
    const settingsButton = document.getElementById('settingsButton');
    const homePanel = document.getElementById('homePanel');
    const settingsPanel = document.getElementById('settingsPanel');
    const lanesButton = document.getElementById('lanesButton');
    const bowlersButton = document.getElementById('bowlersButton');
    const leaguesButton = document.getElementById('leaguesButton');
    const teamsButton = document.getElementById('teamsButton');
    const teamMembersButton = document.getElementById('teamMembersButton');
    const matchesButton = document.getElementById('matchesButton');
    const lanesListScreen = document.getElementById('lanesListScreen');
    const addLaneScreen = document.getElementById('addLaneScreen');
    const bowlersListScreen = document.getElementById('bowlersListScreen');
    const bowlerFormScreen = document.getElementById('bowlerFormScreen');
    const leaguesListScreen = document.getElementById('leaguesListScreen');
    const leagueFormScreen = document.getElementById('leagueFormScreen');
    const teamsListScreen = document.getElementById('teamsListScreen');
    const teamFormScreen = document.getElementById('teamFormScreen');
    const teamMembersListScreen = document.getElementById('teamMembersListScreen');
    const teamMemberFormScreen = document.getElementById('teamMemberFormScreen');
    const matchesListScreen = document.getElementById('matchesListScreen');
    const matchFormScreen = document.getElementById('matchFormScreen');
    const scoresScreen = document.getElementById('scoresScreen');
    let currentEntity = 'Lanes';
    let editingLaneId = null;
    let editingBowlerId = null;
    let editingLeagueId = null;
    let editingTeamId = null;
    let editingTeamMember = null;
    const messageBackdrop = document.getElementById('appMessageBackdrop');
    const messageText = document.getElementById('appMessageText');
    let messageOkCallback = null;
    function showAppMessage(message, onOk = null) {
      messageText.textContent = message;
      messageOkCallback = onOk;
      const actions = document.getElementById('appMessageActions');
      actions.innerHTML = '<button class="action-button primary" id="appMessageOk" type="button">OK</button>';
      document.getElementById('appMessageOk').addEventListener('click', closeAppMessage);
      messageBackdrop.classList.add('show');
      document.getElementById('appMessageOk').focus();
    }
    function showAppConfirm(message, onYes, onNo = null) {
      messageText.textContent = message;
      messageOkCallback = null;
      const actions = document.getElementById('appMessageActions');
      actions.innerHTML = '<button class="action-button" id="appMessageNo" type="button">No</button><button class="action-button primary" id="appMessageYes" type="button">Yes</button>';
      document.getElementById('appMessageNo').addEventListener('click', () => {
        messageBackdrop.classList.remove('show');
        if (onNo) onNo();
      });
      document.getElementById('appMessageYes').addEventListener('click', async () => {
        messageBackdrop.classList.remove('show');
        await onYes();
      });
      messageBackdrop.classList.add('show');
      document.getElementById('appMessageNo').focus();
    }
    function closeAppMessage() {
      messageBackdrop.classList.remove('show');
      const callback = messageOkCallback;
      messageOkCallback = null;
      if (callback) callback();
    }
    document.getElementById('appMessageOk').addEventListener('click', closeAppMessage);

    function closeMenu() {
      actionsMenu.classList.remove('open');
      actionsButton.setAttribute('aria-expanded', 'false');
    }
    function hideScreens() {
      homePanel.style.display = 'none';
      settingsPanel.style.display = 'none';
      lanesListScreen.style.display = 'none';
      addLaneScreen.style.display = 'none';
      bowlersListScreen.style.display = 'none';
      bowlerFormScreen.style.display = 'none';
      leaguesListScreen.style.display = 'none';
      leagueFormScreen.style.display = 'none';
      teamsListScreen.style.display = 'none';
      teamFormScreen.style.display = 'none';
      teamMembersListScreen.style.display = 'none';
      teamMemberFormScreen.style.display = 'none';
      matchesListScreen.style.display = 'none';
      matchFormScreen.style.display = 'none';
      scoresScreen.style.display = 'none';
    }
    function setLanesActive(active) {
      lanesButton.classList.toggle('active', active);
      lanesButton.setAttribute('aria-pressed', String(active));
    }
    function setBowlersActive(active) {
      bowlersButton.classList.toggle('active', active);
      bowlersButton.setAttribute('aria-pressed', String(active));
    }
    function setLeaguesActive(active) {
      leaguesButton.classList.toggle('active', active);
      leaguesButton.setAttribute('aria-pressed', String(active));
    }
    function setTeamsActive(active) {
      teamsButton.classList.toggle('active', active);
      teamsButton.setAttribute('aria-pressed', String(active));
    }
    function setMatchesActive(active) {
      matchesButton.classList.toggle('active', active);
      matchesButton.setAttribute('aria-pressed', String(active));
    }
    function showHome() {
      hideScreens();
      homePanel.style.display = 'flex';
      setLanesActive(false);
      setBowlersActive(false); setLeaguesActive(false); setTeamsActive(false); setTeamMembersActive(false);
      setMatchesActive(false); closeMenu();
    }
    async function showSettings() {
      settingsReturnToScores = scoresScreen.style.display === 'block' && !!activeScoreMatch;
      if (settingsReturnToScores) preserveScoreDraft();
      hideScreens();
      settingsPanel.style.display = 'block';
      document.getElementById('returnToScoresButton').style.display = settingsReturnToScores ? '' : 'none';
      const orderStatus = document.getElementById('orderSetupStatus');
      orderStatus.textContent = 'Checking team and team-member ordering…';
      try { await ensureDatabaseReady(); const missing = await dbCall('listMissingOrders'); orderStatus.innerHTML = missing.message; } catch (error) { orderStatus.textContent = 'Unable to check ordering: ' + error.message; }
      setLanesActive(false);
      setBowlersActive(false); setLeaguesActive(false); setTeamsActive(false); setTeamMembersActive(false);
      setMatchesActive(false); closeMenu();
    }
    async function showLanesList() {
      currentEntity = 'Lanes';
      hideScreens();
      lanesListScreen.style.display = 'block';
      setLanesActive(true);
      setBowlersActive(false); setLeaguesActive(false); setTeamsActive(false); setTeamMembersActive(false);
      setMatchesActive(false); closeMenu();
      try { await ensureDatabaseReady(); await refreshLanes(); }
      catch (error) { dbStatus.textContent = 'Unable to read BowlingDB: ' + error.message; }
    }
    function prepareLaneForm(mode) {
      editingLaneId = mode === 'change' ? editingLaneId : null;
      hideScreens();
      addLaneScreen.style.display = 'block';
      setLanesActive(true);
      setBowlersActive(false); setLeaguesActive(false); setTeamsActive(false); setTeamMembersActive(false);
      currentEntity = 'Lanes';
      setMatchesActive(false); closeMenu();
      document.querySelector('#addLaneScreen .screen-titlebar h2').textContent = mode === 'change' ? 'Change - Lane Management' : 'Add Lanes Management';
      document.getElementById('laneForm').reset();
      document.getElementById('laneState').value = 'FL';
      document.getElementById('laneTelephone').value = '';
      clearFormMessage();
    }
    function showAddLane() {
      editingLaneId = null;
      prepareLaneForm('add');
    }
    async function showChangeLane() {
      const selected = document.querySelector('input[name="selectedLane"]:checked');
      if (!selected) {
        showAppMessage('Select a record to change.');
        return;
      }
      const laneId = Number(selected.value);
      try {
        const lane = await dbCall('get', { LaneId: laneId });
        if (!lane) {
          await refreshLanes();
          showAppMessage('The selected record is no longer available.');
          return;
        }
        editingLaneId = laneId;
        prepareLaneForm('change');
        document.getElementById('laneName').value = lane.Name || '';
        document.getElementById('laneTelephone').value = lane.Telephone ? phoneMask(lane.Telephone) : '';
        document.getElementById('laneOrder').value = String(lane.Order ?? '');
        document.getElementById('laneAddress1').value = lane.Address1 || '';
        document.getElementById('laneAddress2').value = lane.Address2 || '';
        document.getElementById('laneCity').value = lane.City || '';
        document.getElementById('laneState').value = lane.State || 'FL';
        document.getElementById('laneZip').value = lane.Zip || '';
      } catch (error) {
        showAppMessage('Unable to load the selected lane: ' + error.message);
      }
    }
    async function deleteSelectedLane() {
      const selected = document.querySelector('input[name="selectedLane"]:checked');
      if (!selected) {
        showAppMessage('Please select a row to delete.', () => showLanesList());
        return;
      }
      const laneId = Number(selected.value);
      showAppConfirm('Are you sure you want to delete this record?', async () => {
        try {
          await dbCall('delete', { LaneId: laneId });
          await refreshLanes();
          dbStatus.textContent = 'BowlingDB ready · Lane deleted';
          await showLanesList();
        } catch (error) {
          showAppMessage('Unable to delete the selected lane: ' + error.message);
        }
      }, () => {
        // Do not rerender the list: the selected row stays selected when No is pressed.
        lanesListScreen.style.display = 'block';
        setLanesActive(true);
      });
    }

    async function showBowlersList() {
      currentEntity = 'Bowlers'; hideScreens(); bowlersListScreen.style.display = 'block';
      setLanesActive(false); setBowlersActive(true); setLeaguesActive(false); setTeamsActive(false); setTeamMembersActive(false); setMatchesActive(false); closeMenu();
      try { await ensureDatabaseReady(); await refreshBowlers(); } catch (error) { document.getElementById('bowlersDbStatus').textContent = 'Unable to read BowlingDB: ' + error.message; }
    }
    function prepareBowlerForm(mode) {
      hideScreens(); bowlerFormScreen.style.display = 'block'; setLanesActive(false); setBowlersActive(true); setLeaguesActive(false); setTeamsActive(false); setTeamMembersActive(false); currentEntity = 'Bowlers'; setMatchesActive(false); closeMenu();
      document.getElementById('bowlerFormTitle').textContent = mode === 'change' ? 'Change - Bowler Management' : 'Add Bowler Management';
      document.getElementById('bowlerForm').reset(); document.getElementById('bowlerActive').checked = true; clearBowlerFormMessage();
    }
    function showAddBowler() { editingBowlerId = null; prepareBowlerForm('add'); }
    async function showChangeBowler() {
      const selected = document.querySelector('input[name="selectedBowler"]:checked');
      if (!selected) { showAppMessage('Select a record to change.'); return; }
      const bowlerId = Number(selected.value);
      try {
        const bowler = await dbCall('getBowler', { BowlerId: bowlerId });
        if (!bowler) { await refreshBowlers(); showAppMessage('The selected record is no longer available.'); return; }
        editingBowlerId = bowlerId; prepareBowlerForm('change');
        document.getElementById('bowlerFirstName').value = bowler.FirstName || '';
        document.getElementById('bowlerLastName').value = bowler.LastName || '';
        document.getElementById('bowlerActive').checked = Number(bowler.Active) === 1;
      } catch (error) { showAppMessage('Unable to load the selected bowler: ' + error.message); }
    }
    async function deleteSelectedBowler() {
      const selected = document.querySelector('input[name="selectedBowler"]:checked');
      if (!selected) { showAppMessage('Please select a row to delete.', () => showBowlersList()); return; }
      const bowlerId = Number(selected.value);
      showAppConfirm('Are you sure you want to delete this record?', async () => {
        try { await dbCall('deleteBowler', { BowlerId: bowlerId }); await refreshBowlers(); document.getElementById('bowlersDbStatus').textContent = 'BowlingDB ready · Bowler deleted'; await showBowlersList(); }
        catch (error) { showAppMessage('Unable to delete the selected bowler: ' + error.message); }
      }, () => { bowlersListScreen.style.display = 'block'; setLanesActive(false); setBowlersActive(true); setLeaguesActive(false); setTeamsActive(false); setTeamMembersActive(false); });
    }

    async function showLeaguesList() {
      currentEntity = 'Leagues'; hideScreens(); leaguesListScreen.style.display = 'block';
      setLanesActive(false); setBowlersActive(false); setTeamsActive(false); setTeamMembersActive(false); setLeaguesActive(true); setMatchesActive(false); closeMenu();
      try { await ensureDatabaseReady(); await refreshLeagues(); } catch (error) { document.getElementById('leaguesDbStatus').textContent = 'Unable to read BowlingDB: ' + error.message; }
    }
    async function loadLeagueLocations(selectedLaneId = '') {
      const select = document.getElementById('leagueLocation');
      const lanes = await dbCall('listLocations');
      select.innerHTML = lanes.length
        ? '<option value="">Select a bowling center</option>' + lanes.map(lane => `<option value="${Number(lane.LaneId)}">${escapeHtml(lane.Name)}</option>`).join('')
        : '<option value="">No bowling centers available — add one under Lanes</option>';
      select.disabled = lanes.length === 0;
      select.value = selectedLaneId === null || selectedLaneId === undefined ? '' : String(selectedLaneId);
      const message = document.getElementById('leagueFormMessage');
      if (!lanes.length) { showLeagueFormMessage('No bowling centers are available. Cancel this form, open Lanes, and add a bowling center before adding a league.'); }
      else if (message.textContent.includes('No bowling centers are available.')) clearLeagueFormMessage();
    }
    async function prepareLeagueForm(mode) {
      hideScreens(); leagueFormScreen.style.display = 'block'; currentEntity = 'Leagues';
      setLanesActive(false); setBowlersActive(false); setTeamsActive(false); setTeamMembersActive(false); setLeaguesActive(true); setMatchesActive(false); closeMenu();
      document.getElementById('leagueFormTitle').textContent = mode === 'change' ? 'Change - League Management' : 'Add League Management';
      document.getElementById('leagueForm').reset(); document.getElementById('leagueActive').checked = true;
      clearLeagueFormMessage(); await loadLeagueLocations();
    }
    async function showAddLeague() { editingLeagueId = null; await prepareLeagueForm('add'); }
    async function showChangeLeague() {
      const selected = document.querySelector('input[name="selectedLeague"]:checked');
      if (!selected) { showAppMessage('Select a record to change.'); return; }
      const leagueId = Number(selected.value);
      try {
        const league = await dbCall('getLeague', { LeagueId: leagueId });
        if (!league) { await refreshLeagues(); showAppMessage('The selected record is no longer available.'); return; }
        editingLeagueId = leagueId; await prepareLeagueForm('change');
        document.getElementById('leagueName').value = league.LeagueName || '';
        document.getElementById('leagueStartDate').value = league.StartDate || '';
        document.getElementById('leagueEndDate').value = league.EndDate || '';
        document.getElementById('leagueActive').checked = Number(league.Active) === 1;
        await loadLeagueLocations(league.Location);
      } catch (error) { showAppMessage('Unable to load the selected league: ' + error.message); }
    }
    async function deleteSelectedLeague() {
      const selected = document.querySelector('input[name="selectedLeague"]:checked');
      if (!selected) { showAppMessage('Please select a row to delete.', () => showLeaguesList()); return; }
      const leagueId = Number(selected.value);
      showAppConfirm('Are you sure you want to delete this record?', async () => {
        try { await dbCall('deleteLeague', { LeagueId: leagueId }); await showLeaguesList(); }
        catch (error) { showAppMessage('The league could not be deleted: ' + error.message); }
      }, () => { leaguesListScreen.style.display = 'block'; setLanesActive(false); setBowlersActive(false); setLeaguesActive(true); });
    }
    async function refreshLeagues() {
      const leagues = await dbCall('listLeagues');
      const content = document.getElementById('leaguesListContent');
      if (!leagues.length) { content.innerHTML = '<div class="lanes-empty">No records to display.</div>'; document.getElementById('leaguesDbStatus').textContent = 'BowlingDB ready'; return; }
      const body = leagues.map(league => `<tr><td class="lane-radio"><input type="radio" name="selectedLeague" value="${Number(league.LeagueId)}" aria-label="Select league ${Number(league.LeagueId)}"></td><td>${escapeHtml(league.LeagueName)}</td><td>${escapeHtml(league.StartDate || '')}</td><td>${escapeHtml(league.EndDate || '')}</td><td>${Number(league.Active) === 1 ? 'Yes' : 'No'}</td><td>${escapeHtml(league.LocationName)}</td></tr>`).join('');
      content.innerHTML = `<div class="lanes-table-wrap"><table class="lane-list" aria-label="Leagues"><thead><tr><th aria-label="Select"></th><th>League Name</th><th>Start Date</th><th>End Date</th><th>Active</th><th>Location</th></tr></thead><tbody>${body}</tbody></table></div><p class="list-note">Location shows the bowling center associated with each league.</p>`;
      document.getElementById('leaguesDbStatus').textContent = 'BowlingDB ready';
    }
    function showLeagueFormMessage(message) { const el = document.getElementById('leagueFormMessage'); el.textContent = message; el.classList.add('show'); }
    function clearLeagueFormMessage() { const el = document.getElementById('leagueFormMessage'); el.textContent = ''; el.classList.remove('show'); }
    document.getElementById('saveLeagueButton').addEventListener('click', async event => {
      event.preventDefault(); clearLeagueFormMessage();
      const name = document.getElementById('leagueName').value.trim();
      const date = document.getElementById('leagueStartDate').value;
      const endDate = document.getElementById('leagueEndDate').value;
      const active = document.getElementById('leagueActive').checked ? 1 : 0;
      const location = document.getElementById('leagueLocation').value;
      if (!name) return showLeagueFormMessage('League Name is required.');
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return showLeagueFormMessage('Start Date must use yyyy-mm-dd format.');
      if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return showLeagueFormMessage('End Date must use yyyy-mm-dd format.');
      if (!location) return showLeagueFormMessage('Location is required. Select a bowling center.');
      if (!dbReady) return showLeagueFormMessage('BowlingDB is not ready yet. Please try again in a moment.');
      const btn = document.getElementById('saveLeagueButton'); btn.disabled = true; btn.textContent = 'Saving…';
      try {
        const payload = { LeagueName: name, StartDate: date || null, EndDate: endDate || null, Active: active, Location: Number(location) };
        if (editingLeagueId === null) await dbCall('insertLeague', payload); else await dbCall('updateLeague', { LeagueId: editingLeagueId, ...payload });
        editingLeagueId = null; await showLeaguesList();
      } catch (error) {
        if (/FOREIGN KEY constraint failed/i.test(error.message)) showLeagueFormMessage('Select an existing bowling center for Location.');
        else showLeagueFormMessage('The league could not be saved: ' + error.message);
      } finally { btn.disabled = false; btn.textContent = 'Save'; }
    });
    document.getElementById('leagueForm').addEventListener('submit', event => event.preventDefault());
    document.getElementById('cancelLeagueButton').addEventListener('click', () => { editingLeagueId = null; document.getElementById('leagueForm').reset(); document.getElementById('leagueActive').checked = true; clearLeagueFormMessage(); showLeaguesList(); });

    async function showTeamsList() {
      currentEntity = 'Teams'; hideScreens(); teamsListScreen.style.display = 'block';
      setLanesActive(false); setBowlersActive(false); setLeaguesActive(false); setTeamMembersActive(false); setTeamsActive(true); setMatchesActive(false); closeMenu();
      try { await ensureDatabaseReady(); await refreshTeams(); } catch (error) { document.getElementById('teamsDbStatus').textContent = 'Unable to read BowlingDB: ' + error.message; }
    }
    async function loadTeamLeagues(selectedId = '') {
      const select = document.getElementById('teamLeagueId');
      const leagues = await dbCall('listTeamLeagues');
      select.innerHTML = leagues.length ? '<option value="">Select a league</option>' + leagues.map(league => `<option value="${Number(league.LeagueId)}">${escapeHtml(league.LeagueName)}</option>`).join('') : '<option value="">No leagues available — add one under Leagues</option>';
      select.disabled = leagues.length === 0;
      select.value = selectedId === null || selectedId === undefined ? '' : String(selectedId);
      if (!leagues.length) showTeamFormMessage('No leagues are available. Cancel this form, open Leagues, and add a league before adding a team.');
      else clearTeamFormMessage();
    }
    async function prepareTeamForm(mode) {
      hideScreens(); teamFormScreen.style.display = 'block'; currentEntity = 'Teams';
      setLanesActive(false); setBowlersActive(false); setLeaguesActive(false); setTeamMembersActive(false); setTeamsActive(true); setMatchesActive(false); closeMenu();
      document.getElementById('teamFormTitle').textContent = mode === 'change' ? 'Change - Team Management' : 'Add Team Management';
      document.getElementById('teamForm').reset(); document.getElementById('teamType').value = 'M'; document.getElementById('teamActive').checked = true; document.getElementById('teamOrder').value = ''; clearTeamFormMessage(); await loadTeamLeagues();
    }
    async function showAddTeam() { editingTeamId = null; await prepareTeamForm('add'); }
    async function showChangeTeam() {
      const selected = document.querySelector('input[name="selectedTeam"]:checked');
      if (!selected) { showAppMessage('Select a record to change.'); return; }
      const teamId = Number(selected.value);
      try {
        const team = await dbCall('getTeam', { TeamId: teamId });
        if (!team) { await refreshTeams(); showAppMessage('The selected record is no longer available.'); return; }
        editingTeamId = teamId; await prepareTeamForm('change');
        document.getElementById('teamName').value = team.Name || '';
        document.getElementById('teamType').value = team.TeamType || 'M';
        document.getElementById('teamOrder').value = team.Order ?? '';
        document.getElementById('teamActive').checked = Number(team.Active) === 1;
        await loadTeamLeagues(team.LeagueId);
      } catch (error) { showAppMessage('Unable to load the selected team: ' + error.message); }
    }
    async function deleteSelectedTeam() {
      const selected = document.querySelector('input[name="selectedTeam"]:checked');
      if (!selected) { showAppMessage('Please select a row to delete.', () => showTeamsList()); return; }
      const teamId = Number(selected.value);
      showAppConfirm('Are you sure you want to delete this record?', async () => {
        try { await dbCall('deleteTeam', { TeamId: teamId }); await showTeamsList(); }
        catch (error) { showAppMessage('Unable to delete the selected team: ' + error.message); }
      }, () => { teamsListScreen.style.display = 'block'; setLanesActive(false); setBowlersActive(false); setLeaguesActive(false); setTeamsActive(true); });
    }
    async function refreshTeams() {
      const teams = await dbCall('listTeams'); const content = document.getElementById('teamsListContent');
      if (!teams.length) { content.innerHTML = '<div class="lanes-empty">No records to display.</div>'; document.getElementById('teamsDbStatus').textContent = 'BowlingDB ready'; return; }
      const body = teams.map(team => `<tr><td class="lane-radio"><input type="radio" name="selectedTeam" value="${Number(team.TeamId)}" aria-label="Select team ${Number(team.TeamId)}"></td><td>${escapeHtml(team.Name)}</td><td aria-label="Active: ${Number(team.Active) === 1 ? 'Yes' : 'No'}">${Number(team.Active) === 1 ? 'Yes' : 'No'}</td><td>${escapeHtml(team.LeagueName)}</td><td>${team.TeamType === 'P' ? 'Practice' : 'Match'}</td></tr>`).join('');
      content.innerHTML = `<div class="lanes-table-wrap"><table class="lane-list teams-list" aria-label="Teams"><thead><tr><th aria-label="Select"></th><th>Name</th><th>Active</th><th>League</th><th>Team Type</th></tr></thead><tbody>${body}</tbody></table></div><p class="list-note">Each team is associated with one league. Team Type is P (Practice) or M (Match). Active is shown as Yes or No.</p>`;
      document.getElementById('teamsDbStatus').textContent = 'BowlingDB ready';
    }
    function showTeamFormMessage(message) { const el = document.getElementById('teamFormMessage'); el.textContent = message; el.classList.add('show'); }
    function clearTeamFormMessage() { const el = document.getElementById('teamFormMessage'); el.textContent = ''; el.classList.remove('show'); }
    document.getElementById('saveTeamButton').addEventListener('click', async event => {
      event.preventDefault(); clearTeamFormMessage();
      const name = document.getElementById('teamName').value.trim();
      const leagueId = document.getElementById('teamLeagueId').value;
      const active = document.getElementById('teamActive').checked ? 1 : 0;
      const teamType = document.getElementById('teamType').value;
      const orderRaw = document.getElementById('teamOrder').value.trim();
      const teamOrder = orderRaw === '' ? null : Number(orderRaw);
      if (orderRaw !== '' && (!Number.isInteger(teamOrder) || teamOrder < 1)) return showTeamFormMessage('Order must be a positive whole number or left blank.');
      if (!['P', 'M'].includes(teamType)) return showTeamFormMessage('Team Type must be P (Practice) or M (Match).');
      if (!name) return showTeamFormMessage('Name is required and cannot be blank.');
      if (!leagueId) return showTeamFormMessage('League is required. Select a league.');
      if (!dbReady) return showTeamFormMessage('BowlingDB is not ready yet. Please try again in a moment.');
      const btn = document.getElementById('saveTeamButton'); btn.disabled = true; btn.textContent = 'Saving…';
      try {
        const payload = { Name: name, LeagueId: Number(leagueId), Active: active, TeamType: teamType, Order: teamOrder };
        if (editingTeamId === null) await dbCall('insertTeam', payload); else await dbCall('updateTeam', { TeamId: editingTeamId, ...payload });
        editingTeamId = null; await showTeamsList();
      } catch (error) {
        if (/FOREIGN KEY constraint failed/i.test(error.message)) showTeamFormMessage('Select an existing league.');
        else showTeamFormMessage('The team could not be saved: ' + error.message);
      } finally { btn.disabled = false; btn.textContent = 'Save'; }
    });
    document.getElementById('teamForm').addEventListener('submit', event => event.preventDefault());
    document.getElementById('cancelTeamButton').addEventListener('click', () => { editingTeamId = null; document.getElementById('teamForm').reset(); document.getElementById('teamType').value = 'M'; document.getElementById('teamActive').checked = true; clearTeamFormMessage(); showTeamsList(); });


    function setTeamMembersActive(active) {
      teamMembersButton.classList.toggle('active', active);
      teamMembersButton.setAttribute('aria-pressed', String(active));
    }
    async function showTeamMembersList() {
      currentEntity = 'TeamMembers'; hideScreens(); teamMembersListScreen.style.display = 'block';
      setLanesActive(false); setBowlersActive(false); setLeaguesActive(false); setTeamsActive(false); setTeamMembersActive(false); setTeamMembersActive(true); setMatchesActive(false); closeMenu();
      const status = document.getElementById('teamMembersDbStatus');
      status.textContent = 'Opening BowlingDB…';
      try {
        // The user can open this screen while the first database initialization
        // is still underway. Always await initialization rather than leaving the
        // default All-only filter and empty list on screen.
        const info = await ensureDatabaseReady();
        dbReady = true;
        dbStatus.textContent = `BowlingDB ready${info.version ? ' · SQLite ' + info.version : ''}`;
        await loadTeamMembersFilter();
        await refreshTeamMembers();
      } catch (error) {
        status.textContent = 'Unable to read BowlingDB: ' + error.message;
        console.error('Team Members screen failed to load:', error);
      }
    }
    async function loadTeamMembersFilter() {
      const select = document.getElementById('teamMembersFilter');
      const previous = select.value || '-1';
      const teams = await dbCall('listTeamsForMemberFilter');
      select.innerHTML = '<option value="-1">All</option>' + teams.map(team => `<option value="${Number(team.TeamId)}">${escapeHtml(team.Name)}</option>`).join('');
      select.value = [...select.options].some(option => option.value === previous) ? previous : '-1';
    }
    async function loadTeamMemberChoices(teamId = '', bowlerId = '') {
      const teams = await dbCall('listActiveTeams');
      // Newest teams first so a recently created team is immediately easy to find.
      teams.sort((a, b) => Number(b.TeamId) - Number(a.TeamId));
      const teamSelect = document.getElementById('teamMemberTeamId');
      const bowlerSelect = document.getElementById('teamMemberBowlerId');
      teamSelect.innerHTML = '<option value="">Select a team</option>' + teams.map(x => `<option value="${Number(x.TeamId)}">${escapeHtml(x.Name)}</option>`).join('');
      teamSelect.value = teamId ? String(teamId) : '';
      teamSelect.disabled = !teams.length || editingTeamMember !== null;
      // The Bowler field remains editable in Change mode; the current bowler
      // is included in the choices so the saved value can be displayed.
      await refreshAvailableTeamMemberBowlers(bowlerId);
      if (!teams.length) showTeamMemberFormMessage('An active team is required. Add or activate a team first.');
      else clearTeamMemberFormMessage();
    }
    async function refreshAvailableTeamMemberBowlers(selectedBowlerId = '') {
      const teamSelect = document.getElementById('teamMemberTeamId');
      const bowlerSelect = document.getElementById('teamMemberBowlerId');
      const teamId = Number(teamSelect.value || 0);
      bowlerSelect.innerHTML = '<option value="">Select a bowler</option>';
      if (!teamId) {
        bowlerSelect.disabled = true;
        showTeamMemberFormMessage('Select a team to see its available bowlers.');
        return;
      }
      const selectedTeam = await dbCall('getTeam', { TeamId: teamId });
      const bowlers = await dbCall('listAvailableBowlersForTeam', {
        TeamId: teamId,
        TeamType: selectedTeam?.TeamType || 'M',
        // When changing a membership, keep its current bowler selectable.
        includeBowlerId: editingTeamMember ? editingTeamMember.BowlerId : null
      });
      bowlerSelect.innerHTML = '<option value="">Select a bowler</option>' + bowlers.map(x => `<option value="${Number(x.BowlerId)}">${escapeHtml(x.LastName)}, ${escapeHtml(x.FirstName)}</option>`).join('');
      bowlerSelect.value = selectedBowlerId && [...bowlerSelect.options].some(option => option.value === String(selectedBowlerId)) ? String(selectedBowlerId) : '';
      // In Change mode, includeBowlerId makes the existing member available
      // alongside other unassigned bowlers, and the dropdown must be enabled.
      bowlerSelect.disabled = !bowlers.length;
      if (!bowlers.length) showTeamMemberFormMessage('No unassigned active bowlers are available for this team.');
      else clearTeamMemberFormMessage();
    }
    document.getElementById('teamMemberTeamId').addEventListener('change', async () => {
      try { await refreshAvailableTeamMemberBowlers(); }
      catch (error) { showTeamMemberFormMessage('Unable to load available bowlers: ' + error.message); }
    });
    async function prepareTeamMemberForm(mode) {
      hideScreens(); teamMemberFormScreen.style.display = 'block'; currentEntity = 'TeamMembers';
      setLanesActive(false); setBowlersActive(false); setLeaguesActive(false); setTeamsActive(false); setTeamMembersActive(false); setTeamMembersActive(true); setMatchesActive(false); closeMenu();
      document.getElementById('teamMemberFormTitle').textContent = mode === 'change' ? 'Change - Team Member' : 'Add Team Member';
      document.getElementById('teamMemberForm').reset(); document.getElementById('teamMemberOrder').value = ''; clearTeamMemberFormMessage(); await loadTeamMemberChoices();
    }
    async function showAddTeamMember() { editingTeamMember = null; await prepareTeamMemberForm('add'); }
    async function showChangeTeamMember() {
      const selected = document.querySelector('input[name="selectedTeamMember"]:checked');
      if (!selected) { showAppMessage('Select a membership to change.'); return; }
      const [teamId, bowlerId] = selected.value.split(':').map(Number);
      editingTeamMember = { TeamId: teamId, BowlerId: bowlerId };
      await prepareTeamMemberForm('change');
      document.getElementById('teamMemberTeamId').value = String(teamId);
      // Populate the bowler list only after restoring the selected team. The
      // existing bowler is explicitly included, then selected in the dropdown.
      await refreshAvailableTeamMemberBowlers(String(bowlerId));
      const existingMember = await dbCall('getTeamMember', { TeamId: teamId, BowlerId: bowlerId });
      document.getElementById('teamMemberOrder').value = existingMember?.Order ?? '';
    }
    async function deleteSelectedTeamMember() {
      const selected = document.querySelector('input[name="selectedTeamMember"]:checked');
      if (!selected) { showAppMessage('Please select a membership to delete.'); return; }
      const [TeamId, BowlerId] = selected.value.split(':').map(Number);
      showAppConfirm('Are you sure you want to delete this team membership?', async () => {
        try { await dbCall('deleteTeamMember', { TeamId, BowlerId }); await showTeamMembersList(); }
        catch (error) { showAppMessage('Unable to delete the membership: ' + error.message); }
      }, () => { teamMembersListScreen.style.display = 'block'; setTeamMembersActive(true); });
    }
    async function refreshTeamMembers() {
      const filterControl = document.getElementById('teamMembersFilter');
      const filterValue = filterControl.value === '' ? -1 : Number(filterControl.value);
      const memberships = await dbCall('listTeamMembers', { TeamId: filterValue });
      const content = document.getElementById('teamMembersListContent');
      if (!memberships.length) { content.innerHTML = '<div class="lanes-empty">No records to display.</div>'; document.getElementById('teamMembersDbStatus').textContent = 'BowlingDB ready'; return; }
      const body = memberships.map(x => `<tr><td class="lane-radio"><input type="radio" name="selectedTeamMember" value="${Number(x.TeamId)}:${Number(x.BowlerId)}" aria-label="Select ${escapeHtml(x.TeamName)} membership for ${escapeHtml(x.LastName)}, ${escapeHtml(x.FirstName)}"></td><td>${escapeHtml(x.TeamName)}</td><td>${escapeHtml(x.LastName)}, ${escapeHtml(x.FirstName)}</td></tr>`).join('');
      content.innerHTML = `<div class="lanes-table-wrap"><table class="lane-list team-members-list" aria-label="Team Members"><thead><tr><th aria-label="Select"></th><th>Team</th><th>Bowler</th></tr></thead><tbody>${body}</tbody></table></div><p class="list-note">Each bowler can appear only once on a particular team.</p>`;
      document.getElementById('teamMembersDbStatus').textContent = 'BowlingDB ready';
    }
    document.getElementById('teamMembersFilter').addEventListener('change', async () => {
      try {
        await refreshTeamMembers();
      } catch (error) {
        document.getElementById('teamMembersDbStatus').textContent = 'Unable to filter team members: ' + error.message;
      }
    });
    function showTeamMemberFormMessage(message) { const el = document.getElementById('teamMemberFormMessage'); el.textContent = message; el.classList.add('show'); }
    function clearTeamMemberFormMessage() { const el = document.getElementById('teamMemberFormMessage'); el.textContent = ''; el.classList.remove('show'); }
    document.getElementById('saveTeamMemberButton').addEventListener('click', async event => {
      event.preventDefault(); clearTeamMemberFormMessage();
      const TeamId = Number(document.getElementById('teamMemberTeamId').value);
      const BowlerId = Number(document.getElementById('teamMemberBowlerId').value);
      const orderRaw = document.getElementById('teamMemberOrder').value.trim();
      const Order = orderRaw === '' ? null : Number(orderRaw);
      if (orderRaw !== '' && (!Number.isInteger(Order) || Order < 1)) return showTeamMemberFormMessage('Order must be a positive whole number or left blank.');
      if (!TeamId || !BowlerId) return showTeamMemberFormMessage('Select both a team and a bowler.');
      try {
        if (editingTeamMember === null) await dbCall('insertTeamMember', { TeamId, BowlerId, Order });
        else await dbCall('updateTeamMember', { oldTeamId: editingTeamMember.TeamId, oldBowlerId: editingTeamMember.BowlerId, TeamId, BowlerId, Order });
        editingTeamMember = null; await showTeamMembersList();
      } catch (error) {
        if (/UNIQUE constraint failed|PRIMARY KEY constraint failed/i.test(error.message)) showTeamMemberFormMessage('This bowler is already assigned to that team.');
        else if (/FOREIGN KEY constraint failed/i.test(error.message)) showTeamMemberFormMessage('Select an existing team and bowler.');
        else showTeamMemberFormMessage('The membership could not be saved: ' + error.message);
      }
    });
    document.getElementById('teamMemberForm').addEventListener('submit', event => event.preventDefault());
    document.getElementById('cancelTeamMemberButton').addEventListener('click', () => { editingTeamMember = null; showTeamMembersList(); });


    async function showMatchesList() {
      currentEntity = 'Matches'; hideScreens(); matchesListScreen.style.display = 'block';
      setLanesActive(false); setBowlersActive(false); setLeaguesActive(false); setTeamsActive(false); setTeamMembersActive(false); setMatchesActive(true); closeMenu();
      try { await ensureDatabaseReady(); await refreshMatches(); }
      catch (error) { document.getElementById('matchesDbStatus').textContent = 'Unable to read BowlingDB: ' + error.message; }
    }
    let selectedMatchId = null;
    let editingMatchId = null;
    async function refreshMatches() {
      const allMatches = await dbCall('listMatches');
      const filterType = document.getElementById('showMatchType').value;
      const matches = filterType === 'A' ? allMatches : allMatches.filter(match => match.MatchType === filterType);
      const content = document.getElementById('matchesListContent');
      if (!matches.length) {
        selectedMatchId = null;
        content.innerHTML = allMatches.length && filterType !== 'A' ? '<div class="lanes-empty">No matches of this type to display.</div>' : '<div class="lanes-empty">No records to display.</div>';
      } else {
        if (selectedMatchId != null && !matches.some(match => Number(match.MatchId) === Number(selectedMatchId))) selectedMatchId = null;
        const rowsHtml = matches.map(match => {
          const rawDate = String(match.Date || '').slice(0, 10);
          const dateParts = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          const displayDate = dateParts ? `${dateParts[2]}/${dateParts[3]}/${dateParts[1]}` : rawDate;
          const id = Number(match.MatchId);
          const checked = Number(selectedMatchId) === id ? ' checked' : '';
          return `<tr data-match-row="${id}"><td class="match-select-cell"><input type="radio" name="selectedMatch" aria-label="Select match ${id}" data-select-match="${id}"${checked}></td><td><button class="action-button scores-row-button" type="button" data-scores-match="${id}">Scores</button></td><td class="matches-date-cell">${escapeHtml(displayDate)}</td><td>${escapeHtml(match.OppoTeamName)}</td><td>${escapeHtml(match.OurTeamName)}</td><td>${match.MatchType === 'P' ? 'Practice' : 'Match'}</td><td>${escapeHtml(match.LocationName)}</td><td>${escapeHtml(match.LeagueName)}</td></tr>`;
        }).join('');
        content.innerHTML = `<div class="lane-list-wrap"><table class="lane-list" aria-label="Matches"><thead><tr><th class="match-select-cell" aria-label="Select"></th><th>Action</th><th class="matches-date-cell">Date</th><th>Opponent Team</th><th>Our Team</th><th>Type</th><th>Location</th><th>League</th></tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
        content.querySelectorAll('[data-select-match]').forEach(radio => radio.addEventListener('change', () => {
          selectedMatchId = Number(radio.dataset.selectMatch);
          content.querySelectorAll('tr[data-match-row]').forEach(row => row.classList.toggle('selected-row', Number(row.dataset.matchRow) === selectedMatchId));
        }));
        content.querySelectorAll('[data-match-row]').forEach(row => {
          row.classList.toggle('selected-row', Number(row.dataset.matchRow) === Number(selectedMatchId));
          row.addEventListener('click', event => {
            if (event.target.closest('button')) return;
            const radio = row.querySelector('[data-select-match]');
            if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); }
          });
        });
        content.querySelectorAll('[data-scores-match]').forEach(button => button.addEventListener('click', () => openScores(Number(button.dataset.scoresMatch))));
      }
      document.getElementById('matchesDbStatus').textContent = `BowlingDB ready · ${matches.length} match${matches.length === 1 ? '' : 'es'}`;
    }
    function showMatchFormMessage(message) {
      const el = document.getElementById('matchFormMessage');
      el.textContent = message; el.classList.add('show');
    }
    function clearMatchFormMessage() {
      const el = document.getElementById('matchFormMessage');
      el.textContent = ''; el.classList.remove('show');
    }
    async function showMatchForm(matchToEdit = null) {
      currentEntity = 'Matches'; hideScreens(); matchFormScreen.style.display = 'block';
      setLanesActive(false); setBowlersActive(false); setLeaguesActive(false); setTeamsActive(false); setTeamMembersActive(false); setMatchesActive(true); closeMenu();
      editingMatchId = matchToEdit ? Number(matchToEdit.MatchId) : null;
      document.getElementById('matchForm').reset(); clearMatchFormMessage();
      document.getElementById('matchFormTitle').textContent = editingMatchId == null ? 'Add Match' : 'Change Match';
      document.getElementById('saveMatchButton').textContent = 'Save';
      const now = new Date();
      document.getElementById('matchDate').value = matchToEdit?.Date || `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      try {
        const [locations, leagues, teams] = await Promise.all([
          dbCall('listLocations'), dbCall('listTeamLeagues'), dbCall('listTeams')
        ]);
        const populate = (id, placeholder, records, valueField, labelFn) => {
          const select = document.getElementById(id);
          select.innerHTML = `<option value="">${placeholder}</option>` + records.map(record => `<option value="${Number(record[valueField])}">${escapeHtml(labelFn(record))}</option>`).join('');
          select.disabled = records.length === 0;
        };
        populate('matchLocation', 'Select a bowling center', locations, 'LaneId', row => row.Name);
        populate('matchLeague', 'Select a league', leagues, 'LeagueId', row => row.LeagueName);
        if (matchToEdit) {
          document.getElementById('matchLanesUsed').value = matchToEdit.LanesUsed ?? '';
          document.getElementById('matchTemp').value = matchToEdit.Temp ?? '';
          document.getElementById('matchHumidity').value = matchToEdit.Humidity ?? '';
          document.getElementById('matchType').value = matchToEdit.MatchType || 'M';
          document.getElementById('matchLocation').value = String(matchToEdit.Location);
          document.getElementById('matchLeague').value = String(matchToEdit.LeagueId);
        }
        const populateMatchTeams = (preserveSelections = false) => {
          const type = document.getElementById('matchType').value;
          const ourSelect = document.getElementById('matchOurTeam');
          const oppoSelect = document.getElementById('matchOppoTeam');
          const oldOur = preserveSelections ? ourSelect.value : (matchToEdit ? String(matchToEdit.OurTeamId) : '');
          const oldOppo = preserveSelections ? oppoSelect.value : (matchToEdit ? String(matchToEdit.OppoTeamId) : '');
          const relevantTeams = type ? teams.filter(team => team.TeamType === type) : teams;
          const fillTeamSelect = (select, placeholder, selected) => {
            select.innerHTML = `<option value="">${placeholder}</option>` + relevantTeams.map(team => `<option value="${Number(team.TeamId)}">${escapeHtml(team.Name)}</option>`).join('');
            select.disabled = relevantTeams.length === 0;
            if (relevantTeams.some(team => String(team.TeamId) === selected)) select.value = selected;
          };
          fillTeamSelect(ourSelect, 'Select our team', oldOur);
          fillTeamSelect(oppoSelect, 'Select opponent team', oldOppo);
        };
        populateMatchTeams(false);
        if (!matchToEdit && (!locations.length || !leagues.length || !teams.length)) {
          const missing = [];
          if (!locations.length) missing.push('a bowling center (Lanes)');
          if (!leagues.length) missing.push('a league (Leagues)');
          if (!teams.length) missing.push('teams (Teams)');
          showMatchFormMessage('Before saving a match, add ' + missing.join(', ') + '.');
        }
      } catch (error) { showMatchFormMessage('Unable to load match choices: ' + error.message); }
    }
    async function showAddMatch() { await showMatchForm(null); }
    async function showChangeMatch() {
      if (selectedMatchId == null) return showAppMessage('Select a match in the Matches list before choosing Change.');
      try {
        const match = await dbCall('getMatchForChange', { MatchId: selectedMatchId });
        if (!match) { selectedMatchId = null; await showMatchesList(); return showAppMessage('The selected match could not be found.'); }
        await showMatchForm(match);
      } catch (error) { showAppMessage('Unable to open the selected match: ' + error.message); }
    }
    document.getElementById('saveMatchButton').addEventListener('click', async event => {
      event.preventDefault(); clearMatchFormMessage();
      const DateValue = document.getElementById('matchDate').value;
      const MatchType = document.getElementById('matchType').value;
      const LanesUsedValue = document.getElementById('matchLanesUsed').value.trim();
      const TempText = document.getElementById('matchTemp').value.trim();
      const HumidityText = document.getElementById('matchHumidity').value.trim();
      const Temp = TempText === '' ? null : Number(TempText);
      const Humidity = HumidityText === '' ? null : Number(HumidityText);
      const Location = Number(document.getElementById('matchLocation').value);
      const LeagueId = Number(document.getElementById('matchLeague').value);
      const OurTeamId = Number(document.getElementById('matchOurTeam').value);
      const OppoTeamId = Number(document.getElementById('matchOppoTeam').value);
      if (!DateValue || !Location || !LeagueId || !OurTeamId || !OppoTeamId) return showMatchFormMessage('Please complete the Date, Match Type, Location, League, Our Team, and Opponent Team fields.');
      if (!['M','P'].includes(MatchType)) return showMatchFormMessage('Select a valid Match Type.');
      if (LanesUsedValue.length > 5) return showMatchFormMessage('Lanes must contain no more than 5 characters.');
      if (TempText !== '' && (!/^\d+$/.test(TempText) || !Number.isSafeInteger(Temp) || Temp <= 0)) return showMatchFormMessage('Temp. must be a positive whole number, or left blank.');
      if (HumidityText !== '' && (!/^\d+$/.test(HumidityText) || !Number.isSafeInteger(Humidity) || Humidity <= 0)) return showMatchFormMessage('Hum. must be a positive whole number, or left blank.');
      const parsed = new Date(`${DateValue}T00:00:00`);
      if (Number.isNaN(parsed.getTime()) || parsed.getFullYear() !== Number(DateValue.slice(0,4)) || parsed.getMonth()+1 !== Number(DateValue.slice(5,7)) || parsed.getDate() !== Number(DateValue.slice(8,10))) return showMatchFormMessage('Enter a valid calendar date.');
      if (OurTeamId === OppoTeamId) return showMatchFormMessage('Our Team and Opponent Team must be different.');
      const button = document.getElementById('saveMatchButton'); button.disabled = true;
      const payload = { MatchId: editingMatchId, Location, LeagueId, Date: DateValue, OurTeamId, OppoTeamId, MatchType, LanesUsed: LanesUsedValue || null, Temp, Humidity };
      try {
        if (editingMatchId == null) await dbCall('insertMatch', payload);
        else await dbCall('updateMatch', payload);
        editingMatchId = null;
        await showMatchesList();
      } catch (error) {
        if (/FOREIGN KEY constraint failed/i.test(error.message)) showMatchFormMessage('Select existing values for Location, League, Our Team, and Opponent Team.');
        else if (/CK_Matches_DifferentTeams|CHECK constraint failed/i.test(error.message)) showMatchFormMessage('Our Team and Opponent Team must be different, and the date, lanes, temperature, and humidity must be valid.');
        else showMatchFormMessage('The match could not be saved: ' + error.message);
      } finally { button.disabled = false; }
    });
    document.getElementById('matchType').addEventListener('change', () => {
      const our = document.getElementById('matchOurTeam');
      const oppo = document.getElementById('matchOppoTeam');
      const previousOur = our.value;
      const previousOppo = oppo.value;
      const type = document.getElementById('matchType').value;
      // Team choices are filtered by the selected Match/Practice type. A blank type permits all teams.
      dbCall('listTeams').then(teams => {
        const relevant = type ? teams.filter(team => team.TeamType === type) : teams;
        const fill = (select, placeholder, previous) => {
          select.innerHTML = `<option value="">${placeholder}</option>` + relevant.map(team => `<option value="${Number(team.TeamId)}">${escapeHtml(team.Name)}</option>`).join('');
          select.disabled = relevant.length === 0;
          if (relevant.some(team => String(team.TeamId) === previous)) select.value = previous;
        };
        fill(our, 'Select our team', previousOur);
        fill(oppo, 'Select opponent team', previousOppo);
      }).catch(error => showMatchFormMessage('Unable to load teams: ' + error.message));
    });
    document.getElementById('matchForm').addEventListener('submit', event => event.preventDefault());
    document.getElementById('cancelMatchButton').addEventListener('click', () => { editingMatchId = null; showMatchesList(); });

    let activeScoreMatch = null;
    let activeScoreMatchType = 'M';
    let scoreBowlers = [];
    let scoreGameCount = 0;
    let savedScoreMap = {};
    let persistedScoreMap = {};
    let scoreDraftKey = '';
    let scoreBusy = false;
    function scoreDraftData() {
      const values = {};
      document.querySelectorAll('#scoresTableWrap input[data-bowler][data-game]').forEach(input => {
        const key = `${input.dataset.game}:${input.dataset.bowler}`;
        values[key] = input.value;
      });
      return { matchId: activeScoreMatch, gameCount: scoreGameCount, values };
    }
    function scoreValuesDifferFromSaved(values) {
      for (const [key, rawValue] of Object.entries(values || {})) {
        const value = String(rawValue ?? '').trim();
        const hasSaved = Object.prototype.hasOwnProperty.call(persistedScoreMap, key);
        const saved = hasSaved ? String(persistedScoreMap[key]) : '';
        // Empty draft cells are meaningful only when they clear a previously saved score.
        if (value !== '' && (!hasSaved || value !== saved)) return true;
        if (value === '' && hasSaved) return true;
      }
      return false;
    }
    function preserveScoreDraft() {
      if (!activeScoreMatch || !scoreDraftKey) return;
      try {
        const draft = scoreDraftData();
        if (scoreValuesDifferFromSaved(draft.values)) localStorage.setItem(scoreDraftKey, JSON.stringify(draft));
        else localStorage.removeItem(scoreDraftKey);
      } catch (_) {}
    }
    function scoreInputHtml(bowler, game) {
      const key = `${game}:${bowler.BowlerId}`;
      const value = Object.prototype.hasOwnProperty.call(savedScoreMap, key) ? savedScoreMap[key] : '';
      return `<td><input class="score-entry" type="text" inputmode="numeric" pattern="[0-9]*" enterkeyhint="next" autocomplete="off" data-bowler="${Number(bowler.BowlerId)}" data-game="${game}" aria-label="${escapeHtml(bowler.FullName)} Game ${game}" value="${value === null ? '' : escapeHtml(value)}"></td>`;
    }
    function applyScoreTabIndexOrder() {
      const inputs = [...document.querySelectorAll('#scoresTableWrap input[data-bowler][data-game]')];
      if (!inputs.length) return;
      const mode = document.querySelector('input[name="scoreTabOrder"]:checked')?.value || 'row-first';
      const bowlerIndex = id => scoreBowlers.findIndex(b => Number(b.BowlerId) === Number(id));
      inputs.sort((a, b) => mode === 'column-first'
        ? (Number(a.dataset.game) - Number(b.dataset.game)) || (bowlerIndex(a.dataset.bowler) - bowlerIndex(b.dataset.bowler))
        : (bowlerIndex(a.dataset.bowler) - bowlerIndex(b.dataset.bowler)) || (Number(a.dataset.game) - Number(b.dataset.game)));
      inputs.forEach((input, index) => { input.tabIndex = index + 1; });
      const saveButton = document.getElementById('saveScoresButton');
      if (saveButton) saveButton.tabIndex = inputs.length + 1;
    }
    function renderScoreGrid(focusGame = null) {
      const headers = Array.from({length: scoreGameCount}, (_, i) => `<th>Game ${i+1}</th>`).join('');
      const rowsHtml = scoreBowlers.map(bowler => `<tr><td>${escapeHtml(bowler.FullName)}</td>${Array.from({length: scoreGameCount}, (_, i) => scoreInputHtml(bowler, i+1)).join('')}</tr>`).join('');
      document.getElementById('scoresTableWrap').innerHTML = `<div class="lane-list-wrap"><table class="lane-list score-grid" aria-label="Bowling scores"><thead><tr><th>Bowler</th>${headers}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
      document.querySelectorAll('#scoresTableWrap input').forEach(input => {
        input.addEventListener('input', preserveScoreDraft);
        input.addEventListener('focus', () => {
          // Select an existing score when possible so it can be replaced immediately.
          try { input.select(); } catch (_) {}
        });
        input.addEventListener('keydown', event => {
          // Android's numeric keypad Next action is commonly delivered as Enter.
          if (event.key !== 'Enter' && event.key !== 'NumpadEnter' && event.keyCode !== 13) return;
          event.preventDefault();
          event.stopPropagation();
          const currentGame = Number(input.dataset.game);
          const currentBowlerIndex = scoreBowlers.findIndex(b => Number(b.BowlerId) === Number(input.dataset.bowler));
          const firstMode = document.querySelector('input[name="scoreTabOrder"]:checked')?.value || 'row-first';
          let nextInput = null;
          if (firstMode === 'row-first') {
            // Across games for this bowler, then Game 1 for the next bowler.
            if (currentGame < scoreGameCount) {
              nextInput = document.querySelector(`#scoresTableWrap input[data-game="${currentGame + 1}"][data-bowler="${Number(input.dataset.bowler)}"]`);
            } else if (currentBowlerIndex >= 0 && currentBowlerIndex < scoreBowlers.length - 1) {
              const nextBowler = scoreBowlers[currentBowlerIndex + 1];
              nextInput = document.querySelector(`#scoresTableWrap input[data-game="1"][data-bowler="${Number(nextBowler.BowlerId)}"]`);
            }
          } else {
            // Down the current game column, then the next game column.
            if (currentBowlerIndex >= 0 && currentBowlerIndex < scoreBowlers.length - 1) {
              const nextBowler = scoreBowlers[currentBowlerIndex + 1];
              nextInput = document.querySelector(`#scoresTableWrap input[data-game="${currentGame}"][data-bowler="${Number(nextBowler.BowlerId)}"]`);
            } else if (currentGame < scoreGameCount) {
              const firstBowler = scoreBowlers[0];
              nextInput = document.querySelector(`#scoresTableWrap input[data-game="${currentGame + 1}"][data-bowler="${Number(firstBowler.BowlerId)}"]`);
            }
          }
          if (nextInput) nextInput.focus(); else document.getElementById('saveScoresButton').focus();
        });
      });
      applyScoreTabIndexOrder();
      document.getElementById('nextGameButton').style.display = activeScoreMatchType === 'P' ? '' : 'none';
      document.getElementById('scoresStatus').textContent = `${scoreBowlers.length} bowlers · ${scoreGameCount} game${scoreGameCount === 1 ? '' : 's'} · ${activeScoreMatchType === 'P' ? 'Practice' : 'Match'}`;
      if (focusGame !== null) {
        const firstBowlerId = scoreBowlers.length ? Number(scoreBowlers[0].BowlerId) : null;
        const first = firstBowlerId === null ? null : document.querySelector(`#scoresTableWrap input[data-game="${focusGame}"][data-bowler="${firstBowlerId}"]`);
        if (first) setTimeout(() => { first.focus(); try { first.select(); } catch (_) {} }, 150);
      }
    }
    function setScoresMessage(message) {
      const el = document.getElementById('scoresMessage'); el.textContent = message; el.classList.toggle('show', !!message);
    }
    async function openScores(matchId) {
      try {
        const detail = await dbCall('getMatchForScores', { MatchId: matchId });
        if (!detail) return showAppMessage('The selected match could not be found.');
        activeScoreMatch = matchId; activeScoreMatchType = detail.MatchType;
        const bowlers = await dbCall('listMatchBowlers', { OurTeamId: detail.OurTeamId, OppoTeamId: detail.OppoTeamId });
        const distinctBowlerCount = new Set(bowlers.map(b => Number(b.BowlerId))).size;
        if (activeScoreMatchType === 'M' && (bowlers.length !== 8 || distinctBowlerCount !== 8)) {
          return showAppMessage(`A Match needs eight distinct active bowlers assigned through Team Members (four for each team). The current roster contains ${distinctBowlerCount} distinct bowler${distinctBowlerCount === 1 ? '' : 's'}. Please correct the team rosters before entering scores.`);
        }
        if (activeScoreMatchType === 'P' && distinctBowlerCount === 0) {
          return showAppMessage('This Practice session has no active bowlers assigned through Team Members. Assign at least one active bowler to either team before entering scores.');
        }
        scoreBowlers = bowlers;
        const records = await dbCall('listScores', { MatchId: matchId });
        savedScoreMap = {};
        records.forEach(row => savedScoreMap[`${Number(row.GameNbr)}:${Number(row.BowlerId)}`] = String(row.Score));
        persistedScoreMap = { ...savedScoreMap };
        scoreGameCount = Math.max(activeScoreMatchType === 'M' ? 3 : 1, ...records.map(row => Number(row.GameNbr)), 1);
        scoreDraftKey = `bowling-score-draft-${matchId}`;
        try {
          const draft = JSON.parse(localStorage.getItem(scoreDraftKey) || 'null');
          if (draft && draft.matchId === matchId && draft.values) {
            if (scoreValuesDifferFromSaved(draft.values)) {
              if (confirm('A recoverable unsaved score draft exists for this match. Restore it?')) {
                scoreGameCount = Math.max(scoreGameCount, Number(draft.gameCount) || 1);
                savedScoreMap = { ...savedScoreMap, ...draft.values };
              }
            } else {
              // This draft matches the database; it is stale, not unsaved work.
              localStorage.removeItem(scoreDraftKey);
            }
          }
        } catch (_) {}
        if (activeScoreMatchType === 'M') scoreGameCount = 3;
        const scoreDate = String(detail.Date).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
        const titleDate = scoreDate ? `${scoreDate[2]}/${scoreDate[3]}/${scoreDate[1]}` : String(detail.Date).slice(0, 10);
        document.getElementById('scoresTitle').textContent = `Scores - ${activeScoreMatchType === 'P' ? 'Practice' : 'Match'} - ${titleDate}`;
        currentEntity = 'Scores'; hideScreens(); scoresScreen.style.display = 'block';
        setLanesActive(false); setBowlersActive(false); setLeaguesActive(false); setTeamsActive(false); setTeamMembersActive(false); setMatchesActive(true); closeMenu(); setScoresMessage('');
        renderScoreGrid(1);
      } catch (error) { showAppMessage('Unable to open score entry: ' + error.message); }
    }
    document.getElementById('nextGameButton').addEventListener('click', () => {
      if (activeScoreMatchType !== 'P') return;
      const incomplete = [...document.querySelectorAll(`#scoresTableWrap input[data-game="${scoreGameCount}"]`)].some(input => input.value.trim() === '' || !Number.isInteger(Number(input.value)) || Number(input.value) < 0 || Number(input.value) > 300);
      if (incomplete) return setScoresMessage(`Enter a valid score from 0 through 300 for every bowler in Game ${scoreGameCount} before adding another game.`);
      document.querySelectorAll('#scoresTableWrap input[data-bowler][data-game]').forEach(input => { savedScoreMap[`${input.dataset.game}:${input.dataset.bowler}`] = input.value; });
      scoreGameCount += 1; setScoresMessage(''); renderScoreGrid(scoreGameCount); preserveScoreDraft();
    });
    document.getElementById('saveScoresButton').addEventListener('click', async () => {
      if (scoreBusy) return;
      const values = [];
      for (const input of document.querySelectorAll('#scoresTableWrap input[data-bowler][data-game]')) {
        const raw = input.value.trim(), score = Number(raw);
        if (raw === '' || !Number.isInteger(score) || score < 0 || score > 300) {
          setScoresMessage(`Every score must be a whole number from 0 through 300. Please check ${input.getAttribute('aria-label')}.`); input.focus(); return;
        }
        values.push({ GameNbr: Number(input.dataset.game), BowlerId: Number(input.dataset.bowler), Score: score });
      }
      if (activeScoreMatchType === 'M' && scoreGameCount !== 3) return setScoresMessage('A Match must contain exactly three games.');
      if (values.length !== scoreBowlers.length * scoreGameCount) return setScoresMessage('Every bowler must have a score for every game.');
      scoreBusy = true; const button = document.getElementById('saveScoresButton'); button.disabled = true;
      try {
        const saveResult = await dbCall('saveMatchScores', { MatchId: activeScoreMatch, Scores: values });
        try { localStorage.removeItem(scoreDraftKey); } catch (_) {}
        showAppMessage(`Scores saved successfully. ${saveResult.count} score records were saved for this ${activeScoreMatchType === 'P' ? 'practice session' : 'match'}.`, showMatchesList);
      } catch (error) { setScoresMessage('Scores were not saved. ' + error.message); }
      finally { scoreBusy = false; button.disabled = false; }
    });
    document.getElementById('cancelScoresButton').addEventListener('click', () => { preserveScoreDraft(); showMatchesList(); });

    actionsButton.addEventListener('click', (event) => {
      event.stopPropagation();
      const open = actionsMenu.classList.toggle('open');
      actionsButton.setAttribute('aria-expanded', String(open));
    });
    const scoreTabOrderKey = 'bowling-score-tab-order';
    let settingsReturnToScores = false;
    const scoreTabOrderRadios = document.querySelectorAll('input[name="scoreTabOrder"]');
    try {
      const savedTabOrder = localStorage.getItem(scoreTabOrderKey);
      if (savedTabOrder === 'row-first' || savedTabOrder === 'column-first') {
        const savedRadio = document.querySelector(`input[name="scoreTabOrder"][value="${savedTabOrder}"]`);
        if (savedRadio) savedRadio.checked = true;
      }
    } catch (_) {}
    scoreTabOrderRadios.forEach(radio => radio.addEventListener('change', () => {
      if (!radio.checked) return;
      try { localStorage.setItem(scoreTabOrderKey, radio.value); } catch (_) {}
      applyScoreTabIndexOrder();
    }));
    settingsButton.addEventListener('click', showSettings);
    document.getElementById('homeButton').addEventListener('click', showHome);
    document.getElementById('returnToScoresButton').addEventListener('click', () => {
      if (!settingsReturnToScores || !activeScoreMatch) return;
      hideScreens();
      scoresScreen.style.display = 'block';
      currentEntity = 'Scores';
      setLanesActive(false); setBowlersActive(false); setLeaguesActive(false); setTeamsActive(false); setTeamMembersActive(false); setMatchesActive(true); closeMenu();
      settingsReturnToScores = false;
      renderScoreGrid(1);
    });
    lanesButton.addEventListener('click', showLanesList);
    bowlersButton.addEventListener('click', showBowlersList);
    leaguesButton.addEventListener('click', showLeaguesList);
    teamsButton.addEventListener('click', showTeamsList);
    teamMembersButton.addEventListener('click', showTeamMembersList);
    document.getElementById('showMatchType').addEventListener('change', () => { selectedMatchId = null; refreshMatches().catch(error => { document.getElementById('matchesDbStatus').textContent = 'Unable to read BowlingDB: ' + error.message; }); });
    matchesButton.addEventListener('click', showMatchesList);
    document.getElementById('cancelLaneButton').addEventListener('click', () => {
      editingLaneId = null;
      document.getElementById('laneForm').reset();
      clearFormMessage();
      showLanesList();
    });

    document.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        setMatchesActive(false); closeMenu();
        if (action === 'Add') {
          if (currentEntity === 'Bowlers') showAddBowler(); else if (currentEntity === 'Leagues') showAddLeague(); else if (currentEntity === 'Teams') showAddTeam(); else if (currentEntity === 'TeamMembers') showAddTeamMember(); else if (currentEntity === 'Matches') showAddMatch(); else showAddLane();
        } else if (action === 'Change') {
          if (currentEntity === 'Bowlers') showChangeBowler(); else if (currentEntity === 'Leagues') showChangeLeague(); else if (currentEntity === 'Teams') showChangeTeam(); else if (currentEntity === 'TeamMembers') showChangeTeamMember(); else if (currentEntity === 'Matches') showChangeMatch(); else showChangeLane();
        } else if (action === 'Delete') {
          if (currentEntity === 'Bowlers') deleteSelectedBowler(); else if (currentEntity === 'Leagues') deleteSelectedLeague(); else if (currentEntity === 'Teams') deleteSelectedTeam(); else if (currentEntity === 'TeamMembers') deleteSelectedTeamMember(); else if (currentEntity === 'Matches') showAppMessage('Deleting matches will be implemented in a later build.'); else deleteSelectedLane();
        } else if (action === 'Quit') {
          showAppMessage('To close Bowling, use your device’s app switcher or browser controls.');
        } else if (action === 'Import' || action === 'Export') {
          showAppMessage(action + ' will be implemented in a later version.');
        } else {
          showAppMessage(action + ' will be implemented in a later version.');
        }
      });
    });

    // SQLite is hosted in a dedicated worker and persisted in OPFS.
    const dbStatus = document.getElementById('dbStatus');
    const lanesListContent = document.getElementById('lanesListContent');
    const formMessage = document.getElementById('laneFormMessage');
    let dbReady = false;
    let worker = null;
    let requestId = 0;
    const pending = new Map();
    try {
      worker = new Worker('./sqlite-worker.js?v=b1v53', { type: 'module' });
      worker.onmessage = event => {
        const message = event.data || {};
        const resolve = pending.get(message.id);
        if (!resolve) return;
        pending.delete(message.id);
        if (message.ok) resolve.resolve(message.data);
        else resolve.reject(new Error(message.error || 'Database operation failed.'));
      };
      worker.onerror = event => {
        dbStatus.textContent = 'Database worker failed. Close other Bowling tabs, then reload this page.';
        const error = new Error(event.message || 'Database worker failed.');
        for (const [id, request] of pending) {
          pending.delete(id);
          request.reject(error);
        }
        console.error('SQLite worker error:', event.message);
      };
    } catch (error) {
      dbStatus.textContent = 'Unable to start SQLite database worker.';
    }
    function dbCall(type, data) {
      return new Promise((resolve, reject) => {
        if (!worker) return reject(new Error('The database worker is unavailable.'));
        const id = ++requestId;
        pending.set(id, { resolve, reject });
        worker.postMessage({ id, type, data });
      });
    }
    // Every screen shares one initialization promise. If a user taps a menu
    // immediately after launch, the screen waits for startup rather than racing
    // a second database-open request.
    let databaseReadyPromise = null;
    function ensureDatabaseReady() {
      if (dbReady) return Promise.resolve({ version: null });
      if (!databaseReadyPromise) {
        databaseReadyPromise = (async () => {
          let lastError;
          for (let attempt = 0; attempt < 5; attempt++) {
            try {
              const info = await dbCall('init');
              dbReady = true;
              dbStatus.textContent = `BowlingDB ready · SQLite ${info.version}`;
              return info;
            } catch (error) {
              lastError = error;
              const transient = /Access Handles cannot be created|another open Access Handle|Writable stream associated with the same file|createSyncAccessHandle|database is not initialized/i.test(String(error && error.message));
              if (!transient || attempt === 4) break;
              await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
            }
          }
          databaseReadyPromise = null;
          throw lastError || new Error('Unable to initialize BowlingDB.');
        })();
      }
      return databaseReadyPromise;
    }
    function escapeHtml(value) {
      return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    }
    async function refreshLanes() {
      const lanes = await dbCall('list');
      if (!lanes.length) {
        lanesListContent.innerHTML = '<div class="lanes-empty">No records to display.</div>';
        return;
      }
      const body = lanes.map(lane => `<tr>
        <td class="lane-radio"><input type="radio" name="selectedLane" value="${Number(lane.LaneId)}" aria-label="Select lane ${Number(lane.LaneId)}"></td>
        <td class="lane-order">${Number(lane.Order)}</td><td>${escapeHtml(lane.Name)}</td>
        <td>${escapeHtml(lane.Telephone ? '(' + lane.Telephone.slice(0,3) + ') ' + lane.Telephone.slice(3,6) + '-' + lane.Telephone.slice(6) : '')}</td>
        <td>${escapeHtml(lane.Address1)}</td><td>${escapeHtml(lane.City)}</td><td>${escapeHtml(lane.State)}</td><td>${escapeHtml(lane.Zip)}</td>
      </tr>`).join('');
      lanesListContent.innerHTML = `<div class="lanes-table-wrap"><table class="lane-list" aria-label="Lanes"><thead><tr><th aria-label="Select"></th><th>Order</th><th>Name</th><th>Telephone</th><th>Address1</th><th>City</th><th>ST</th><th>Zip</th></tr></thead><tbody>${body}</tbody></table></div><p class="list-note">Select a lane using its radio button.</p>`;
    }
    async function refreshBowlers() {
      const bowlers = await dbCall('listBowlers'); const content = document.getElementById('bowlersListContent');
      if (!bowlers.length) { content.innerHTML = '<div class="lanes-empty">No records to display.</div>'; return; }
      const body = bowlers.map(bowler => `<tr><td class="lane-radio"><input type="radio" name="selectedBowler" value="${Number(bowler.BowlerId)}" aria-label="Select bowler ${Number(bowler.BowlerId)}"></td><td>${Number(bowler.Active) === 1 ? 'Yes' : 'No'}</td><td>${escapeHtml(bowler.FirstName)}</td><td>${escapeHtml(bowler.LastName)}</td></tr>`).join('');
      content.innerHTML = `<div class="lanes-table-wrap"><table class="lane-list bowlers-list" aria-label="Bowlers"><thead><tr><th aria-label="Select"></th><th>Active</th><th>First Name</th><th>Last Name</th></tr></thead><tbody>${body}</tbody></table></div><p class="list-note">Select a bowler using its radio button. Active is shown as Yes or No.</p>`;
    }
    function showBowlerFormMessage(message) { const element = document.getElementById('bowlerFormMessage'); element.textContent = message; element.classList.add('show'); }
    function clearBowlerFormMessage() { const element = document.getElementById('bowlerFormMessage'); element.textContent = ''; element.classList.remove('show'); }
    document.getElementById('saveBowlerButton').addEventListener('click', async event => {
      event.preventDefault(); clearBowlerFormMessage();
      const firstName = document.getElementById('bowlerFirstName').value.trim(); const lastName = document.getElementById('bowlerLastName').value.trim();
      const active = document.getElementById('bowlerActive').checked ? 1 : 0;
      if (!firstName) return showBowlerFormMessage('First Name is required.');
      if (!lastName) return showBowlerFormMessage('Last Name is required.');
      if (!dbReady) return showBowlerFormMessage('BowlingDB is not ready yet. Please try again in a moment.');
      const saveButton = document.getElementById('saveBowlerButton'); saveButton.disabled = true; saveButton.textContent = 'Saving…';
      try {
        const payload = { FirstName: firstName, LastName: lastName, Active: active };
        const result = editingBowlerId === null ? await dbCall('insertBowler', payload) : await dbCall('updateBowler', { BowlerId: editingBowlerId, ...payload });
        await refreshBowlers();
        document.getElementById('bowlersDbStatus').textContent = editingBowlerId === null ? `BowlingDB ready · Bowler saved with BowlerId ${result.BowlerId}` : `BowlingDB ready · Bowler ${editingBowlerId} updated`;
        editingBowlerId = null; document.getElementById('bowlerForm').reset(); document.getElementById('bowlerActive').checked = true; clearBowlerFormMessage(); await showBowlersList();
      } catch (error) { showBowlerFormMessage('The bowler could not be saved: ' + error.message); }
      finally { saveButton.disabled = false; saveButton.textContent = 'Save'; }
    });
    document.getElementById('bowlerForm').addEventListener('submit', event => event.preventDefault());
    document.getElementById('cancelBowlerButton').addEventListener('click', () => { editingBowlerId = null; document.getElementById('bowlerForm').reset(); document.getElementById('bowlerActive').checked = true; clearBowlerFormMessage(); showBowlersList(); });

    function showFormMessage(message) {
      formMessage.textContent = message;
      formMessage.classList.add('show');
    }
    function clearFormMessage() {
      formMessage.textContent = '';
      formMessage.classList.remove('show');
    }
    function readPhoneDigits() {
      return telephone.value.replace(/\D/g, '').slice(0, 10);
    }
    document.getElementById('saveLaneButton').addEventListener('click', async event => {
      event.preventDefault();
      clearFormMessage();
      const name = document.getElementById('laneName').value.trim();
      const state = stateInput.value.trim().toUpperCase();
      const zip = document.getElementById('laneZip').value.trim();
      const phone = readPhoneDigits();
      const orderText = document.getElementById('laneOrder').value.trim();
      if (!name) return showFormMessage('Name is required.');
      if (!orderText || !/^\d+$/.test(orderText) || Number(orderText) < 1 || !Number.isSafeInteger(Number(orderText))) return showFormMessage('Order must be a positive whole number.');
      if (!/^[A-Z]{2}$/.test(state)) return showFormMessage('State must contain exactly two letters.');
      if (zip && !/^\d{5}$/.test(zip)) return showFormMessage('Zip must contain exactly five digits when supplied.');
      if (phone && phone.length !== 10) return showFormMessage('Telephone must contain exactly ten digits when supplied.');
      if (!dbReady) return showFormMessage('BowlingDB is not ready yet. Please try again in a moment.');
      const saveButton = document.getElementById('saveLaneButton');
      saveButton.disabled = true;
      saveButton.textContent = 'Saving…';
      try {
        const payload = {
          Name: name,
          Address1: document.getElementById('laneAddress1').value.trim(),
          Address2: document.getElementById('laneAddress2').value.trim(),
          City: document.getElementById('laneCity').value.trim(),
          State: state,
          Zip: zip,
          Telephone: phone,
          Order: Number(orderText)
        };
        const result = editingLaneId === null
          ? await dbCall('insert', payload)
          : await dbCall('update', { LaneId: editingLaneId, ...payload });
        await refreshLanes();
        dbStatus.textContent = editingLaneId === null
          ? `BowlingDB ready · Lane saved with LaneId ${result.LaneId}`
          : `BowlingDB ready · Lane ${editingLaneId} updated`;
        editingLaneId = null;
        document.getElementById('laneForm').reset();
        stateInput.value = 'FL';
        telephone.value = '';
        clearFormMessage();
        showLanesList();
      } catch (error) {
        if (/UNIQUE constraint failed: Lanes\.Order/i.test(error.message)) showFormMessage('That Order number is already assigned. Choose a unique Order number.');
        else if (/CHECK constraint failed: Lanes\.State/i.test(error.message)) showFormMessage('State must contain exactly two uppercase letters.');
        else if (/CHECK constraint failed: Lanes\.Zip/i.test(error.message)) showFormMessage('Zip must contain exactly five digits when supplied.');
        else if (/CHECK constraint failed: Lanes\.Telephone/i.test(error.message)) showFormMessage('Telephone must contain exactly ten digits when supplied.');
        else showFormMessage('The lane could not be saved: ' + error.message);
      } finally {
        saveButton.disabled = false;
        saveButton.textContent = 'Save';
      }
    });
    document.getElementById('laneForm').addEventListener('submit', event => event.preventDefault());

    // Telephone mask: punctuation is fixed and each underscore is an editable digit slot.
    // Intercept edits before the browser can replace or shift the mask characters.
    const telephone = document.getElementById('laneTelephone');
    const PHONE_MASK = '(___) ___-____';
    const PHONE_SLOTS = [1, 2, 3, 6, 7, 8, 10, 11, 12, 13];
    const phoneDigits = () => telephone.value.replace(/\D/g, '').slice(0, 10);
    function phoneMask(digits) {
      const chars = PHONE_MASK.split('');
      PHONE_SLOTS.forEach((position, i) => { chars[position] = digits[i] || '_'; });
      return chars.join('');
    }
    function nextPhoneSlot(position) {
      return PHONE_SLOTS.find(slot => slot >= position) ?? PHONE_MASK.length;
    }
    function applyPhoneEdit(kind, text = '') {
      let chars = (telephone.value || PHONE_MASK).split('');
      if (chars.length !== PHONE_MASK.length) chars = PHONE_MASK.split('');
      const start = telephone.selectionStart ?? 0;
      const end = telephone.selectionEnd ?? start;
      let selectedSlots = PHONE_SLOTS.filter(slot => slot >= start && slot < end);
      let caret;
      if (kind === 'insert') {
        const digits = text.replace(/\D/g, '');
        if (!digits) return;
        let slotIndex = selectedSlots.length ? PHONE_SLOTS.indexOf(selectedSlots[0]) : PHONE_SLOTS.findIndex(slot => slot >= start);
        if (slotIndex < 0) slotIndex = PHONE_SLOTS.length;
        // Typing over a selection starts at its first editable position.
        for (let i = 0; i < digits.length && slotIndex + i < PHONE_SLOTS.length; i++) {
          chars[PHONE_SLOTS[slotIndex + i]] = digits[i];
        }
        caret = PHONE_SLOTS[Math.min(slotIndex + digits.length, PHONE_SLOTS.length - 1)] ?? PHONE_MASK.length;
        if (slotIndex + digits.length >= PHONE_SLOTS.length) caret = PHONE_MASK.length;
      } else {
        let slotsToClear = selectedSlots;
        if (!slotsToClear.length) {
          // Backspace removes the editable digit immediately before the caret.
          // Use a strict less-than comparison so repeated Backspace continues
          // moving left after each deletion instead of stopping at the same slot.
          let slot;
          if (kind === 'backward') {
            const precedingSlots = PHONE_SLOTS.filter(position => position < start);
            slot = precedingSlots.length ? precedingSlots[precedingSlots.length - 1] : null;
          } else {
            slot = PHONE_SLOTS.find(position => position >= start) ?? null;
          }
          if (slot !== null) slotsToClear = [slot];
        }
        if (!slotsToClear.length) return;
        slotsToClear.forEach(slot => { chars[slot] = '_'; });
        caret = slotsToClear[0];
      }
      telephone.value = chars.join('');
      telephone.setSelectionRange(caret, caret);
    }
    telephone.addEventListener('focus', () => {
      if (!telephone.value) telephone.value = PHONE_MASK;
      const firstBlank = telephone.value.indexOf('_');
      const position = firstBlank < 0 ? PHONE_MASK.length : firstBlank;
      telephone.setSelectionRange(position, position);
    });
    telephone.addEventListener('keydown', event => {
      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        applyPhoneEdit('insert', event.key);
      } else if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        applyPhoneEdit(event.key === 'Backspace' ? 'backward' : 'forward');
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Tab' || event.key === 'Home' || event.key === 'End') {
        // Allow ordinary navigation; edits remain restricted to digit slots.
      } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
      }
    });
    telephone.addEventListener('beforeinput', event => {
      if (event.inputType === 'insertText' || event.inputType === 'insertCompositionText') {
        event.preventDefault();
        applyPhoneEdit('insert', event.data || '');
      } else if (event.inputType === 'deleteContentBackward' || event.inputType === 'deleteContentForward') {
        event.preventDefault();
        applyPhoneEdit(event.inputType === 'deleteContentBackward' ? 'backward' : 'forward');
      } else if (event.inputType === 'insertFromPaste') {
        event.preventDefault();
        applyPhoneEdit('insert', event.data || '');
      }
    });
    telephone.addEventListener('paste', event => {
      event.preventDefault();
      applyPhoneEdit('insert', event.clipboardData?.getData('text') || '');
    });
    telephone.addEventListener('blur', () => {
      if (phoneDigits().length === 0) telephone.value = '';
      else telephone.value = phoneMask(phoneDigits());
    });
    const stateInput = document.getElementById('laneState');
    stateInput.addEventListener('input', () => {
      stateInput.value = stateInput.value.replace(/[^a-z]/gi, '').toUpperCase().slice(0, 2);
    });
    document.getElementById('laneOrder').addEventListener('input', event => {
      event.target.value = event.target.value.replace(/\D/g, '');
    });
    document.getElementById('laneZip').addEventListener('input', event => {
      event.target.value = event.target.value.replace(/\D/g, '').slice(0, 5);
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.menu-wrap')) setMatchesActive(false); closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { if (messageBackdrop.classList.contains('show')) closeAppMessage(); else setMatchesActive(false); closeMenu(); }
    });
    (async () => {
      try {
        const info = await ensureDatabaseReady();
        dbReady = true;
        dbStatus.textContent = `BowlingDB ready${info.version ? ' · SQLite ' + info.version : ''}`;
        await refreshLanes();
      } catch (error) {
        dbStatus.textContent = 'BowlingDB could not be opened: ' + error.message;
        console.error('BowlingDB initialization failed:', error);
      }
    })();

    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
    }
  