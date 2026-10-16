// BowlingDB SQLite worker. Uses SQLite WASM and the OPFS SyncAccessHandle pool VFS.
import sqlite3InitModule from 'https://cdn.jsdelivr.net/npm/@sqlite.org/sqlite-wasm@3.53.4-build1/dist/index.mjs';
let db = null;
let poolUtil = null;
let initializationPromise = null;
let sqliteVersion = null;
function rows(sql, bind = []) {
  const out = [];
  db.exec({ sql, bind, rowMode: 'object', callback: row => out.push(row) });
  return out;
}
async function initializeOnce() {
  // Reuse the already-open database in this worker. OPFS SyncAccessHandles
  // cannot be opened twice for the same file by the same active context.
  if (db) return { version: sqliteVersion };
  const sqlite3 = await sqlite3InitModule();
  poolUtil = await sqlite3.installOpfsSAHPoolVfs({ name: 'bowling-opfs-sahpool' });
  db = new poolUtil.OpfsSAHPoolDb('/BowlingDB.sqlite3');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(`CREATE TABLE IF NOT EXISTS Lanes (
    LaneId INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL CHECK(length(trim(Name)) > 0),
    Address1 TEXT,
    Address2 TEXT,
    City TEXT,
    State TEXT NOT NULL DEFAULT 'FL' CHECK(length(State)=2 AND State=upper(State) AND State NOT GLOB '*[^A-Z]*'),
    Zip TEXT CHECK(Zip IS NULL OR (length(Zip)=5 AND Zip NOT GLOB '*[^0-9]*')),
    Telephone TEXT CHECK(Telephone IS NULL OR (length(Telephone)=10 AND Telephone NOT GLOB '*[^0-9]*')),
    "Order" INTEGER NOT NULL UNIQUE CHECK(typeof("Order")='integer' AND "Order">0)
  );
  CREATE TABLE IF NOT EXISTS Bowlers (
    BowlerId INTEGER PRIMARY KEY AUTOINCREMENT,
    FirstName TEXT NOT NULL CHECK(length(trim(FirstName)) > 0),
    LastName TEXT NOT NULL CHECK(length(trim(LastName)) > 0),
    Active INTEGER NOT NULL DEFAULT 1 CHECK(Active IN (0, 1))
  );
  CREATE TABLE IF NOT EXISTS Leagues (
    LeagueId INTEGER PRIMARY KEY AUTOINCREMENT,
    LeagueName TEXT NOT NULL CHECK(length(trim(LeagueName)) > 0),
    StartDate TEXT CHECK(StartDate IS NULL OR (length(StartDate)=10 AND StartDate GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')),
    EndDate TEXT CHECK(EndDate IS NULL OR (length(EndDate)=10 AND EndDate GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')),
    Active INTEGER NOT NULL DEFAULT 1 CHECK(Active IN (0, 1)),
    Location INTEGER NOT NULL,
    FOREIGN KEY (Location) REFERENCES Lanes(LaneId) ON DELETE RESTRICT
  );
  CREATE TABLE IF NOT EXISTS Teams (
    TeamId INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL CHECK(length(trim(Name)) > 0),
    Active INTEGER NOT NULL DEFAULT 1 CHECK(Active IN (0, 1)),
    LeagueId INTEGER NOT NULL,
    TeamType TEXT NOT NULL DEFAULT 'M' CHECK(TeamType IN ('P', 'M')),
    "Order" INTEGER CHECK("Order" IS NULL OR (typeof("Order")='integer' AND "Order">0)),
    FOREIGN KEY (LeagueId) REFERENCES Leagues(LeagueId) ON DELETE RESTRICT
  );
  CREATE TABLE IF NOT EXISTS TeamMembers (
    TeamId INTEGER NOT NULL,
    BowlerId INTEGER NOT NULL,
    "Order" INTEGER CHECK("Order" IS NULL OR (typeof("Order")='integer' AND "Order">0)),
    PRIMARY KEY (TeamId, BowlerId),
    FOREIGN KEY (TeamId) REFERENCES Teams(TeamId) ON DELETE CASCADE,
    FOREIGN KEY (BowlerId) REFERENCES Bowlers(BowlerId) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS Matches (
    MatchId INTEGER PRIMARY KEY AUTOINCREMENT,
    Location INTEGER NOT NULL,
    LeagueId INTEGER NOT NULL,
    Date TEXT NOT NULL CHECK (
      length(Date)=10 AND Date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
    ),
    OurTeamId INTEGER NOT NULL,
    OppoTeamId INTEGER NOT NULL,
    MatchType TEXT NOT NULL DEFAULT 'M' CHECK(MatchType IN ('P', 'M')),
    LanesUsed TEXT CHECK(LanesUsed IS NULL OR length(LanesUsed) <= 5),
    Temp INTEGER CHECK(Temp IS NULL OR (typeof(Temp)='integer' AND Temp > 0)),
    Humidity INTEGER CHECK(Humidity IS NULL OR (typeof(Humidity)='integer' AND Humidity > 0)),
    CONSTRAINT CK_Matches_DifferentTeams CHECK (OurTeamId <> OppoTeamId),
    FOREIGN KEY (Location) REFERENCES Lanes(LaneId) ON DELETE RESTRICT,
    FOREIGN KEY (LeagueId) REFERENCES Leagues(LeagueId) ON DELETE RESTRICT,
    FOREIGN KEY (OurTeamId) REFERENCES Teams(TeamId) ON DELETE RESTRICT,
    FOREIGN KEY (OppoTeamId) REFERENCES Teams(TeamId) ON DELETE RESTRICT
  );
  CREATE TABLE IF NOT EXISTS Scores (
    ScoreId INTEGER PRIMARY KEY AUTOINCREMENT,
    MatchId INTEGER NOT NULL,
    GameNbr INTEGER NOT NULL CHECK(GameNbr > 0),
    BowlerId INTEGER NOT NULL,
    Score INTEGER NOT NULL CHECK(Score >= 0 AND Score <= 300),
    UNIQUE(MatchId, GameNbr, BowlerId),
    FOREIGN KEY (MatchId) REFERENCES Matches(MatchId) ON DELETE CASCADE,
    FOREIGN KEY (BowlerId) REFERENCES Bowlers(BowlerId) ON DELETE RESTRICT
  );`);
  // Upgrade existing b1v20 databases without removing saved league records.
  const leagueColumns = rows('PRAGMA table_info(Leagues)').map(column => column.name);
  if (!leagueColumns.includes('EndDate')) {
    db.exec("ALTER TABLE Leagues ADD COLUMN EndDate TEXT CHECK(EndDate IS NULL OR (length(EndDate)=10 AND EndDate GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'))");
  }
  const matchColumns = rows('PRAGMA table_info(Matches)').map(column => column.name);
  if (!matchColumns.includes('MatchType')) db.exec("ALTER TABLE Matches ADD COLUMN MatchType TEXT NOT NULL DEFAULT 'M' CHECK(MatchType IN ('P', 'M'))");
  if (!matchColumns.includes('LanesUsed')) db.exec("ALTER TABLE Matches ADD COLUMN LanesUsed TEXT CHECK(LanesUsed IS NULL OR length(LanesUsed) <= 5)");
  if (!matchColumns.includes('Temp')) db.exec("ALTER TABLE Matches ADD COLUMN Temp INTEGER CHECK(Temp IS NULL OR (typeof(Temp)='integer' AND Temp > 0))");
  if (!matchColumns.includes('Humidity')) db.exec("ALTER TABLE Matches ADD COLUMN Humidity INTEGER CHECK(Humidity IS NULL OR (typeof(Humidity)='integer' AND Humidity > 0))");
  const teamColumns = rows('PRAGMA table_info(Teams)').map(column => column.name);
  if (!teamColumns.includes('Order')) db.exec(`ALTER TABLE Teams ADD COLUMN "Order" INTEGER CHECK("Order" IS NULL OR (typeof("Order")='integer' AND "Order">0))`);
  const teamMemberColumns = rows('PRAGMA table_info(TeamMembers)').map(column => column.name);
  if (!teamMemberColumns.includes('Order')) db.exec(`ALTER TABLE TeamMembers ADD COLUMN "Order" INTEGER CHECK("Order" IS NULL OR (typeof("Order")='integer' AND "Order">0))`);
  if (!teamColumns.includes('TeamType')) {
    db.exec("ALTER TABLE Teams ADD COLUMN TeamType TEXT NOT NULL DEFAULT 'M' CHECK(TeamType IN ('P', 'M'))");
    db.exec("UPDATE Teams SET TeamType='M'");
  }
  sqliteVersion = sqlite3.version.libVersion;
  return { version: sqliteVersion };
}
async function initialize() {
  if (db) return { version: sqliteVersion };
  if (initializationPromise) return initializationPromise;
  initializationPromise = (async () => {
    let lastError;
    // OPFS may briefly report an access-handle conflict while another page or
    // worker is finishing startup/shutdown. Clean up and retry transient cases.
    for (let attempt = 0; attempt < 7; attempt++) {
      try {
        return await initializeOnce();
      } catch (error) {
        lastError = error;
        try { if (db && typeof db.close === 'function') db.close(); } catch (_) {}
        db = null;
        try { if (poolUtil && typeof poolUtil.close === 'function') await poolUtil.close(); } catch (_) {}
        poolUtil = null;
        sqliteVersion = null;
        const transientHandleConflict = /Access Handles cannot be created|another open Access Handle|Writable stream associated with the same file|createSyncAccessHandle/i.test(String(error && error.message));
        if (!transientHandleConflict || attempt === 6) throw error;
        // OPFS can retain a temporary handle while a previous page/worker is
        // shutting down. Give the browser time to release it before reopening.
        await new Promise(resolve => setTimeout(resolve, Math.min(500 * (attempt + 1), 3000)));
      }
    }
    throw lastError;
  })().finally(() => { initializationPromise = null; });
  return initializationPromise;
}
self.onmessage = async event => {
  const { id, type, data: requestPayload } = event.data || {};
  try {
    if (type === 'init') {
      const info = await initialize();
      self.postMessage({ id, ok: true, data: info });
    } else if (!db) {
      throw new Error('The BowlingDB database is not initialized.');
    } else if (type === 'list') {
      const laneRows = rows('SELECT LaneId, Name, Telephone, Address1, City, State, Zip, "Order" FROM Lanes ORDER BY "Order", LaneId');
      self.postMessage({ id, ok: true, data: laneRows });
    } else if (type === 'get') {
      const laneRecord = rows('SELECT LaneId, Name, Address1, Address2, City, State, Zip, Telephone, "Order" FROM Lanes WHERE LaneId = ?', [requestPayload.LaneId])[0] || null;
      self.postMessage({ id, ok: true, data: laneRecord });
    } else if (type === 'update') {
      db.exec({
        sql: 'UPDATE Lanes SET Name=?, Address1=?, Address2=?, City=?, State=?, Zip=?, Telephone=?, "Order"=? WHERE LaneId=?',
        bind: [requestPayload.Name, requestPayload.Address1 || null, requestPayload.Address2 || null, requestPayload.City || null, requestPayload.State, requestPayload.Zip || null, requestPayload.Telephone || null, requestPayload.Order, requestPayload.LaneId]
      });
      self.postMessage({ id, ok: true, data: { LaneId: requestPayload.LaneId, changes: db.changes() } });
    } else if (type === 'insert') {
      db.exec({
        sql: 'INSERT INTO Lanes (Name, Address1, Address2, City, State, Zip, Telephone, "Order") VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        bind: [requestPayload.Name, requestPayload.Address1 || null, requestPayload.Address2 || null, requestPayload.City || null, requestPayload.State, requestPayload.Zip || null, requestPayload.Telephone || null, requestPayload.Order]
      });
      const laneId = db.selectValue('SELECT last_insert_rowid()');
      self.postMessage({ id, ok: true, data: { LaneId: laneId } });
    } else if (type === 'delete') {
      db.exec({ sql: 'DELETE FROM Lanes WHERE LaneId = ?', bind: [requestPayload.LaneId] });
      self.postMessage({ id, ok: true, data: { LaneId: requestPayload.LaneId, changes: db.changes() } });
    } else if (type === 'listBowlers') {
      const bowlerRows = rows('SELECT BowlerId, FirstName, LastName, Active FROM Bowlers ORDER BY LastName COLLATE NOCASE, FirstName COLLATE NOCASE, BowlerId');
      self.postMessage({ id, ok: true, data: bowlerRows });
    } else if (type === 'getBowler') {
      const bowlerRecord = rows('SELECT BowlerId, FirstName, LastName, Active FROM Bowlers WHERE BowlerId = ?', [requestPayload.BowlerId])[0] || null;
      self.postMessage({ id, ok: true, data: bowlerRecord });
    } else if (type === 'insertBowler') {
      db.exec({ sql: 'INSERT INTO Bowlers (FirstName, LastName, Active) VALUES (?, ?, ?)', bind: [requestPayload.FirstName, requestPayload.LastName, requestPayload.Active] });
      const bowlerId = db.selectValue('SELECT last_insert_rowid()');
      self.postMessage({ id, ok: true, data: { BowlerId: bowlerId } });
    } else if (type === 'updateBowler') {
      db.exec({ sql: 'UPDATE Bowlers SET FirstName=?, LastName=?, Active=? WHERE BowlerId=?', bind: [requestPayload.FirstName, requestPayload.LastName, requestPayload.Active, requestPayload.BowlerId] });
      self.postMessage({ id, ok: true, data: { BowlerId: requestPayload.BowlerId, changes: db.changes() } });
    } else if (type === 'deleteBowler') {
      db.exec({ sql: 'DELETE FROM Bowlers WHERE BowlerId = ?', bind: [requestPayload.BowlerId] });
      self.postMessage({ id, ok: true, data: { BowlerId: requestPayload.BowlerId, changes: db.changes() } });
    } else if (type === 'listLocations') {
      const locationRows = rows('SELECT LaneId, Name FROM Lanes ORDER BY Name COLLATE NOCASE, LaneId');
      self.postMessage({ id, ok: true, data: locationRows });
    } else if (type === 'listLeagues') {
      const leagueRows = rows('SELECT Leagues.LeagueId, Leagues.LeagueName, Leagues.StartDate, Leagues.EndDate, Leagues.Active, Leagues.Location, Lanes.Name AS LocationName FROM Leagues JOIN Lanes ON Lanes.LaneId = Leagues.Location ORDER BY Leagues.LeagueName COLLATE NOCASE, Leagues.LeagueId');
      self.postMessage({ id, ok: true, data: leagueRows });
    } else if (type === 'getLeague') {
      const leagueRecord = rows('SELECT LeagueId, LeagueName, StartDate, EndDate, Active, Location FROM Leagues WHERE LeagueId = ?', [requestPayload.LeagueId])[0] || null;
      self.postMessage({ id, ok: true, data: leagueRecord });
    } else if (type === 'insertLeague') {
      db.exec({ sql: 'INSERT INTO Leagues (LeagueName, StartDate, EndDate, Active, Location) VALUES (?, ?, ?, ?, ?)', bind: [requestPayload.LeagueName, requestPayload.StartDate, requestPayload.EndDate, requestPayload.Active, requestPayload.Location] });
      const leagueId = db.selectValue('SELECT last_insert_rowid()');
      self.postMessage({ id, ok: true, data: { LeagueId: leagueId } });
    } else if (type === 'updateLeague') {
      db.exec({ sql: 'UPDATE Leagues SET LeagueName=?, StartDate=?, EndDate=?, Active=?, Location=? WHERE LeagueId=?', bind: [requestPayload.LeagueName, requestPayload.StartDate, requestPayload.EndDate, requestPayload.Active, requestPayload.Location, requestPayload.LeagueId] });
      self.postMessage({ id, ok: true, data: { LeagueId: requestPayload.LeagueId, changes: db.changes() } });
    } else if (type === 'deleteLeague') {
      db.exec({ sql: 'DELETE FROM Leagues WHERE LeagueId = ?', bind: [requestPayload.LeagueId] });
      self.postMessage({ id, ok: true, data: { LeagueId: requestPayload.LeagueId, changes: db.changes() } });
    } else if (type === 'listTeamLeagues') {
      self.postMessage({ id, ok: true, data: rows('SELECT LeagueId, LeagueName FROM Leagues ORDER BY LeagueName COLLATE NOCASE, LeagueId') });
    } else if (type === 'listTeams') {
      self.postMessage({ id, ok: true, data: rows('SELECT Teams.TeamId, Teams.Name, Teams.Active, Teams.LeagueId, Teams.TeamType, Teams."Order", Leagues.LeagueName FROM Teams JOIN Leagues ON Leagues.LeagueId = Teams.LeagueId ORDER BY Teams.TeamType DESC, Teams.Name COLLATE NOCASE, Teams.TeamId') });
    } else if (type === 'getTeam') {
      self.postMessage({ id, ok: true, data: rows('SELECT TeamId, Name, Active, LeagueId, TeamType, "Order" FROM Teams WHERE TeamId = ?', [requestPayload.TeamId])[0] || null });
    } else if (type === 'insertTeam') {
      db.exec({ sql: 'INSERT INTO Teams (Name, Active, LeagueId, TeamType, "Order") VALUES (?, ?, ?, ?, ?)', bind: [requestPayload.Name, requestPayload.Active, requestPayload.LeagueId, requestPayload.TeamType, requestPayload.Order ?? null] });
      self.postMessage({ id, ok: true, data: { TeamId: db.selectValue('SELECT last_insert_rowid()') } });
    } else if (type === 'updateTeam') {
      db.exec({ sql: 'UPDATE Teams SET Name=?, Active=?, LeagueId=?, TeamType=?, "Order"=? WHERE TeamId=?', bind: [requestPayload.Name, requestPayload.Active, requestPayload.LeagueId, requestPayload.TeamType, requestPayload.Order ?? null, requestPayload.TeamId] });
      self.postMessage({ id, ok: true, data: { TeamId: requestPayload.TeamId, changes: db.changes() } });
    } else if (type === 'deleteTeam') {
      db.exec({ sql: 'DELETE FROM Teams WHERE TeamId = ?', bind: [requestPayload.TeamId] });
      self.postMessage({ id, ok: true, data: { TeamId: requestPayload.TeamId, changes: db.changes() } });
    } else if (type === 'listActiveTeams') {
      self.postMessage({ id, ok: true, data: rows('SELECT Teams.TeamId, Teams.Name, Leagues.LeagueName FROM Teams JOIN Leagues ON Leagues.LeagueId=Teams.LeagueId WHERE Teams.Active=1 ORDER BY Teams.TeamType DESC, Teams.Name COLLATE NOCASE, Teams.TeamId') });
    } else if (type === 'listActiveBowlers') {
      self.postMessage({ id, ok: true, data: rows('SELECT BowlerId, FirstName, LastName FROM Bowlers WHERE Active=1 ORDER BY LastName COLLATE NOCASE, FirstName COLLATE NOCASE, BowlerId') });
    } else if (type === 'listAvailableBowlersForTeam') {
      const teamId = Number(requestPayload.TeamId);
      const includeBowlerId = requestPayload.includeBowlerId == null ? null : Number(requestPayload.includeBowlerId);
      const availableBowlers = rows(
        'SELECT Bowlers.BowlerId, Bowlers.FirstName, Bowlers.LastName FROM Bowlers WHERE Bowlers.Active=1 AND (NOT EXISTS (SELECT 1 FROM TeamMembers WHERE TeamMembers.TeamId=? AND TeamMembers.BowlerId=Bowlers.BowlerId) OR Bowlers.BowlerId=?) ORDER BY Bowlers.LastName COLLATE NOCASE, Bowlers.FirstName COLLATE NOCASE, Bowlers.BowlerId',
        [teamId, includeBowlerId]
      );
      self.postMessage({ id, ok: true, data: availableBowlers });
    } else if (type === 'listMatches') {
      self.postMessage({ id, ok: true, data: rows(`SELECT Matches.MatchId, Matches.Date, Matches.Location, Matches.LeagueId, Matches.MatchType,
        Matches.LanesUsed, Matches.Temp, Matches.Humidity, Matches.OurTeamId, Matches.OppoTeamId, Lanes.Name AS LocationName, Leagues.LeagueName,
        OurTeam.Name AS OurTeamName, OppoTeam.Name AS OppoTeamName
        FROM Matches
        JOIN Lanes ON Lanes.LaneId=Matches.Location
        JOIN Leagues ON Leagues.LeagueId=Matches.LeagueId
        JOIN Teams AS OurTeam ON OurTeam.TeamId=Matches.OurTeamId
        JOIN Teams AS OppoTeam ON OppoTeam.TeamId=Matches.OppoTeamId
        ORDER BY Matches.Date DESC, Matches.MatchId DESC`) });
    } else if (type === 'insertMatch') {
      db.exec({ sql: 'INSERT INTO Matches (Location, LeagueId, Date, OurTeamId, OppoTeamId, MatchType, LanesUsed, Temp, Humidity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        bind: [requestPayload.Location, requestPayload.LeagueId, requestPayload.Date, requestPayload.OurTeamId, requestPayload.OppoTeamId, requestPayload.MatchType, requestPayload.LanesUsed || null, requestPayload.Temp ?? null, requestPayload.Humidity ?? null] });
      self.postMessage({ id, ok: true, data: { MatchId: db.selectValue('SELECT last_insert_rowid()') } });
    } else if (type === 'getMatchForChange') {
      self.postMessage({ id, ok: true, data: rows('SELECT MatchId, Location, LeagueId, Date, OurTeamId, OppoTeamId, MatchType, LanesUsed, Temp, Humidity FROM Matches WHERE MatchId=?', [requestPayload.MatchId])[0] || null });
    } else if (type === 'updateMatch') {
      db.exec({ sql: 'UPDATE Matches SET Location=?, LeagueId=?, Date=?, OurTeamId=?, OppoTeamId=?, MatchType=?, LanesUsed=?, Temp=?, Humidity=? WHERE MatchId=?',
        bind: [requestPayload.Location, requestPayload.LeagueId, requestPayload.Date, requestPayload.OurTeamId, requestPayload.OppoTeamId, requestPayload.MatchType, requestPayload.LanesUsed || null, requestPayload.Temp ?? null, requestPayload.Humidity ?? null, requestPayload.MatchId] });
      self.postMessage({ id, ok: true, data: { MatchId: requestPayload.MatchId, changes: db.changes() } });
    } else if (type === 'getMatchForScores') {
      self.postMessage({ id, ok: true, data: rows('SELECT MatchId, Date, OurTeamId, OppoTeamId, MatchType FROM Matches WHERE MatchId=?', [requestPayload.MatchId])[0] || null });
    } else if (type === 'listMatchBowlers') {
      self.postMessage({ id, ok: true, data: rows(`SELECT Bowlers.BowlerId, Bowlers.FirstName, Bowlers.LastName, trim(Bowlers.FirstName || ' ' || Bowlers.LastName) AS FullName, TeamMembers.TeamId
        FROM TeamMembers JOIN Bowlers ON Bowlers.BowlerId=TeamMembers.BowlerId
        WHERE TeamMembers.TeamId IN (?, ?) AND Bowlers.Active=1
        ORDER BY CASE WHEN TeamMembers.TeamId=? THEN 0 ELSE 1 END, TeamMembers."Order" IS NULL, TeamMembers."Order", Bowlers.LastName COLLATE NOCASE, Bowlers.FirstName COLLATE NOCASE, Bowlers.BowlerId`, [requestPayload.OurTeamId, requestPayload.OppoTeamId, requestPayload.OurTeamId]) });
    } else if (type === 'listScores') {
      self.postMessage({ id, ok: true, data: rows('SELECT ScoreId, MatchId, GameNbr, BowlerId, Score FROM Scores WHERE MatchId=? ORDER BY GameNbr, BowlerId', [requestPayload.MatchId]) });
    } else if (type === 'saveMatchScores') {
      const matchId = Number(requestPayload.MatchId);
      const scores = requestPayload.Scores;
      if (!Number.isInteger(matchId) || !Array.isArray(scores) || !scores.length) throw new Error('No score records were supplied.');
      const match = rows('SELECT MatchType FROM Matches WHERE MatchId=?', [matchId])[0];
      if (!match) throw new Error('The match no longer exists.');
      const gameNumbers = [...new Set(scores.map(s => Number(s.GameNbr)))].sort((a,b)=>a-b);
      if (gameNumbers.some((n,i)=>!Number.isInteger(n) || n !== i+1)) throw new Error('Game numbers must start at 1 and be consecutive.');
      if (match.MatchType === 'M' && (gameNumbers.length !== 3 || gameNumbers[2] !== 3)) throw new Error('A Match must have exactly three games.');
      const uniqueKeys = new Set();
      for (const s of scores) {
        if (!Number.isInteger(Number(s.GameNbr)) || Number(s.GameNbr)<1 || !Number.isInteger(Number(s.BowlerId)) || !Number.isInteger(Number(s.Score)) || Number(s.Score)<0 || Number(s.Score)>300) throw new Error('Scores must be whole numbers from 0 through 300, with valid game and bowler IDs.');
        const key = `${Number(s.GameNbr)}:${Number(s.BowlerId)}`;
        if (uniqueKeys.has(key)) throw new Error('A bowler has duplicate entries for the same game.');
        uniqueKeys.add(key);
      }
      const roster = rows(`SELECT DISTINCT TM.BowlerId FROM TeamMembers TM JOIN Bowlers B ON B.BowlerId=TM.BowlerId
        WHERE TM.TeamId IN (SELECT OurTeamId FROM Matches WHERE MatchId=? UNION SELECT OppoTeamId FROM Matches WHERE MatchId=?) AND B.Active=1`, [matchId, matchId]).map(r=>Number(r.BowlerId));
      const expected = [...new Set(roster)];
      const requiredCount = match.MatchType === 'M' ? 8 : expected.length;
      if (match.MatchType === 'M' && expected.length !== 8) throw new Error(`A Match requires eight distinct active rostered bowlers; this roster has ${expected.length}.`);
      if (expected.length === 0) throw new Error('At least one active bowler must be assigned to the teams before saving scores.');
      if (scores.length !== expected.length * gameNumbers.length) throw new Error(`Enter one score for each of the ${expected.length} participating bowlers in every game.`);
      const expectedSet = new Set(expected);
      if (scores.some(s => !expectedSet.has(Number(s.BowlerId)))) throw new Error('A score references a bowler who is not an active member of either team roster for this match.');
      for (const gameNbr of gameNumbers) {
        const gameBowlers = scores.filter(s => Number(s.GameNbr) === gameNbr).map(s => Number(s.BowlerId));
        if (gameBowlers.length !== requiredCount || new Set(gameBowlers).size !== requiredCount || gameBowlers.some(id => !expectedSet.has(id))) throw new Error(`Game ${gameNbr} must contain exactly one score for each participating bowler.`);
      }
      // A Practice game with zero for every bowler is an unused placeholder, not a played game.
      // Remove any previously persisted all-zero Practice games, then save only played games.
      const gamesToSave = match.MatchType === 'P'
        ? gameNumbers.filter(gameNbr => scores.some(s => Number(s.GameNbr) === gameNbr && Number(s.Score) !== 0))
        : gameNumbers;
      const normalizedScores = [];
      gamesToSave.forEach((oldGameNbr, index) => {
        scores.filter(s => Number(s.GameNbr) === oldGameNbr).forEach(s => normalizedScores.push({ GameNbr: index + 1, BowlerId: Number(s.BowlerId), Score: Number(s.Score) }));
      });
      db.exec('BEGIN IMMEDIATE');
      try {
        if (match.MatchType === 'P') {
          db.exec(`DELETE FROM Scores
            WHERE EXISTS (SELECT 1 FROM Matches M WHERE M.MatchId=Scores.MatchId AND M.MatchType='P')
              AND MatchId IN (
                SELECT S.MatchId FROM Scores S
                JOIN Matches M ON M.MatchId=S.MatchId
                WHERE M.MatchType='P'
                GROUP BY S.MatchId, S.GameNbr
                HAVING COUNT(*) > 0 AND SUM(CASE WHEN S.Score <> 0 THEN 1 ELSE 0 END)=0
              )
              AND GameNbr IN (
                SELECT S2.GameNbr FROM Scores S2
                JOIN Matches M2 ON M2.MatchId=S2.MatchId
                WHERE M2.MatchType='P' AND S2.MatchId=Scores.MatchId
                GROUP BY S2.MatchId, S2.GameNbr
                HAVING COUNT(*) > 0 AND SUM(CASE WHEN S2.Score <> 0 THEN 1 ELSE 0 END)=0
              )`);
        }
        db.exec({sql:'DELETE FROM Scores WHERE MatchId=?', bind:[matchId]});
        for (const s of normalizedScores) db.exec({sql:'INSERT INTO Scores (MatchId, GameNbr, BowlerId, Score) VALUES (?, ?, ?, ?)', bind:[matchId, s.GameNbr, s.BowlerId, s.Score]});
        db.exec('COMMIT');
      } catch (error) { try { db.exec('ROLLBACK'); } catch (_) {} throw error; }
      self.postMessage({ id, ok: true, data: { MatchId: matchId, count: normalizedScores.length } });
    } else if (type === 'listTeamsForMemberFilter') {
      self.postMessage({ id, ok: true, data: rows('SELECT TeamId, Name FROM Teams ORDER BY Name COLLATE NOCASE, TeamId') });
    } else if (type === 'listTeamMembers') {
      const teamId = Number(requestPayload?.TeamId ?? -1);
      const sql = 'SELECT TeamMembers.TeamId, TeamMembers.BowlerId, TeamMembers."Order", Teams.Name AS TeamName, Bowlers.FirstName, Bowlers.LastName FROM TeamMembers JOIN Teams ON Teams.TeamId=TeamMembers.TeamId JOIN Bowlers ON Bowlers.BowlerId=TeamMembers.BowlerId ' +
        (teamId === -1 ? '' : 'WHERE TeamMembers.TeamId=? ') +
        'ORDER BY Teams.Name COLLATE NOCASE, TeamMembers."Order" IS NULL, TeamMembers."Order", Bowlers.LastName COLLATE NOCASE, Bowlers.FirstName COLLATE NOCASE';
      self.postMessage({ id, ok: true, data: rows(sql, teamId === -1 ? [] : [teamId]) });
    } else if (type === 'getTeamMember') {
      self.postMessage({ id, ok: true, data: rows('SELECT TeamId, BowlerId, "Order" FROM TeamMembers WHERE TeamId=? AND BowlerId=?', [requestPayload.TeamId, requestPayload.BowlerId])[0] || null });
    } else if (type === 'listMissingOrders') {
      const missingTeams = rows('SELECT TeamId, Name FROM Teams WHERE "Order" IS NULL ORDER BY Name COLLATE NOCASE, TeamId');
      const missingMembers = rows('SELECT Teams.Name AS TeamName, Bowlers.FirstName, Bowlers.LastName FROM TeamMembers JOIN Teams ON Teams.TeamId=TeamMembers.TeamId JOIN Bowlers ON Bowlers.BowlerId=TeamMembers.BowlerId WHERE TeamMembers."Order" IS NULL ORDER BY Teams.Name COLLATE NOCASE, Bowlers.LastName COLLATE NOCASE, Bowlers.FirstName COLLATE NOCASE');
      const list = (items, format) => items.length ? '<ul>' + items.map(format).join('') + '</ul>' : '<p>None</p>';
      const message = '<strong>Teams missing Order:</strong>' + list(missingTeams, x => '<li>' + String(x.Name).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) + ' (TeamId ' + Number(x.TeamId) + ')</li>') + '<strong>Team Members missing Order:</strong>' + list(missingMembers, x => '<li>' + String(x.TeamName).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) + ' — ' + String(x.LastName).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) + ', ' + String(x.FirstName).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) + '</li>');
      self.postMessage({ id, ok: true, data: { message, missingTeams: missingTeams.length, missingMembers: missingMembers.length } });
    } else if (type === 'insertTeamMember') {
      if (!rows('SELECT TeamId FROM Teams WHERE TeamId=? AND Active=1', [requestPayload.TeamId]).length) throw new Error('Only active teams can have new memberships.');
      if (!rows('SELECT BowlerId FROM Bowlers WHERE BowlerId=? AND Active=1', [requestPayload.BowlerId]).length) throw new Error('Only active bowlers can be assigned to teams.');
      const order = requestPayload.Order == null ? null : Number(requestPayload.Order);
      if (order !== null && (!Number.isInteger(order) || order < 1)) throw new Error('Order must be a positive whole number or blank.');
      db.exec('BEGIN IMMEDIATE');
      try {
        if (order !== null) db.exec({ sql: 'UPDATE TeamMembers SET "Order"="Order"+1 WHERE TeamId=? AND "Order">=?', bind: [requestPayload.TeamId, order] });
        db.exec({ sql: 'INSERT INTO TeamMembers (TeamId, BowlerId, "Order") VALUES (?, ?, ?)', bind: [requestPayload.TeamId, requestPayload.BowlerId, order] });
        db.exec('COMMIT');
      } catch (error) { try { db.exec('ROLLBACK'); } catch (_) {} throw error; }
      self.postMessage({ id, ok: true, data: { TeamId: requestPayload.TeamId, BowlerId: requestPayload.BowlerId, Order: order } });
    } else if (type === 'updateTeamMember') {
      if (!rows('SELECT TeamId FROM Teams WHERE TeamId=? AND Active=1', [requestPayload.TeamId]).length) throw new Error('Only active teams can have memberships.');
      if (!rows('SELECT BowlerId FROM Bowlers WHERE BowlerId=? AND Active=1', [requestPayload.BowlerId]).length) throw new Error('Only active bowlers can be assigned to teams.');
      const order = requestPayload.Order == null ? null : Number(requestPayload.Order);
      if (order !== null && (!Number.isInteger(order) || order < 1)) throw new Error('Order must be a positive whole number or blank.');
      db.exec('BEGIN IMMEDIATE');
      try {
        db.exec({ sql: 'UPDATE TeamMembers SET "Order"=NULL WHERE TeamId=? AND BowlerId=?', bind: [requestPayload.oldTeamId, requestPayload.oldBowlerId] });
        if (order !== null) db.exec({ sql: 'UPDATE TeamMembers SET "Order"="Order"+1 WHERE TeamId=? AND "Order">=? AND NOT (TeamId=? AND BowlerId=?)', bind: [requestPayload.TeamId, order, requestPayload.oldTeamId, requestPayload.oldBowlerId] });
        db.exec({ sql: 'UPDATE TeamMembers SET TeamId=?, BowlerId=?, "Order"=? WHERE TeamId=? AND BowlerId=?', bind: [requestPayload.TeamId, requestPayload.BowlerId, order, requestPayload.oldTeamId, requestPayload.oldBowlerId] });
        db.exec('COMMIT');
      } catch (error) { try { db.exec('ROLLBACK'); } catch (_) {} throw error; }
      self.postMessage({ id, ok: true, data: { TeamId: requestPayload.TeamId, BowlerId: requestPayload.BowlerId, Order: order } });
    } else if (type === 'deleteTeamMember') {
      db.exec({ sql: 'DELETE FROM TeamMembers WHERE TeamId=? AND BowlerId=?', bind: [requestPayload.TeamId, requestPayload.BowlerId] });
      self.postMessage({ id, ok: true, data: { TeamId: requestPayload.TeamId, BowlerId: requestPayload.BowlerId, changes: db.changes() } });
    } else {
      throw new Error('Unknown database request.');
    }
  } catch (error) {
    self.postMessage({ id, ok: false, error: error?.message || String(error) });
  }
};
