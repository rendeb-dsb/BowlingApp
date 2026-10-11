// BowlingDB SQLite worker. Uses SQLite WASM and the OPFS SyncAccessHandle pool VFS.
import sqlite3InitModule from 'https://cdn.jsdelivr.net/npm/@sqlite.org/sqlite-wasm@3.53.4-build1/dist/index.mjs';
let db = null;
let poolUtil = null;
function rows(sql, bind = []) {
  const out = [];
  db.exec({ sql, bind, rowMode: 'object', callback: row => out.push(row) });
  return out;
}
async function initialize() {
  const sqlite3 = await sqlite3InitModule();
  poolUtil = await sqlite3.installOpfsSAHPoolVfs({ name: 'bowling-opfs-sahpool' });
  db = new poolUtil.OpfsSAHPoolDb('/BowlingDB.sqlite3');
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
  );`);
  return { version: sqlite3.version.libVersion };
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
    } else {
      throw new Error('Unknown database request.');
    }
  } catch (error) {
    self.postMessage({ id, ok: false, error: error?.message || String(error) });
  }
};
