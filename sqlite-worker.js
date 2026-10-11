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
    FOREIGN KEY (LeagueId) REFERENCES Leagues(LeagueId) ON DELETE RESTRICT
  );`);
  // Upgrade existing b1v20 databases without removing saved league records.
  const leagueColumns = rows('PRAGMA table_info(Leagues)').map(column => column.name);
  if (!leagueColumns.includes('EndDate')) {
    db.exec("ALTER TABLE Leagues ADD COLUMN EndDate TEXT CHECK(EndDate IS NULL OR (length(EndDate)=10 AND EndDate GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'))");
  }
  sqliteVersion = sqlite3.version.libVersion;
  return { version: sqliteVersion };
}
function initialize() {
  if (db) return Promise.resolve({ version: sqliteVersion });
  if (!initializationPromise) {
    initializationPromise = initializeOnce().catch(error => {
      // Permit a safe retry after a failed initialization attempt.
      initializationPromise = null;
      throw error;
    });
  }
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
      self.postMessage({ id, ok: true, data: rows('SELECT Teams.TeamId, Teams.Name, Teams.Active, Teams.LeagueId, Leagues.LeagueName FROM Teams JOIN Leagues ON Leagues.LeagueId = Teams.LeagueId ORDER BY Teams.Name COLLATE NOCASE, Teams.TeamId') });
    } else if (type === 'getTeam') {
      self.postMessage({ id, ok: true, data: rows('SELECT TeamId, Name, Active, LeagueId FROM Teams WHERE TeamId = ?', [requestPayload.TeamId])[0] || null });
    } else if (type === 'insertTeam') {
      db.exec({ sql: 'INSERT INTO Teams (Name, Active, LeagueId) VALUES (?, ?, ?)', bind: [requestPayload.Name, requestPayload.Active, requestPayload.LeagueId] });
      self.postMessage({ id, ok: true, data: { TeamId: db.selectValue('SELECT last_insert_rowid()') } });
    } else if (type === 'updateTeam') {
      db.exec({ sql: 'UPDATE Teams SET Name=?, Active=?, LeagueId=? WHERE TeamId=?', bind: [requestPayload.Name, requestPayload.Active, requestPayload.LeagueId, requestPayload.TeamId] });
      self.postMessage({ id, ok: true, data: { TeamId: requestPayload.TeamId, changes: db.changes() } });
    } else if (type === 'deleteTeam') {
      db.exec({ sql: 'DELETE FROM Teams WHERE TeamId = ?', bind: [requestPayload.TeamId] });
      self.postMessage({ id, ok: true, data: { TeamId: requestPayload.TeamId, changes: db.changes() } });
    } else {
      throw new Error('Unknown database request.');
    }
  } catch (error) {
    self.postMessage({ id, ok: false, error: error?.message || String(error) });
  }
};
