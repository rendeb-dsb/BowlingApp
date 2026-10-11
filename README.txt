Bowling PWA — Build 1 Version 17 (b1v17)

Changes in this version
- All popup messages use a custom dialog titled "The Bowling App says:" and an OK button.
- Actions > Change requires a selected lane record.
- If no lane is selected, the app displays "Select a record to change." with an OK button.
- Change opens the same two-column Lane form titled "Change - Lane Management" and loads the selected record.
- Save validates and updates the selected SQLite Lanes record; Cancel returns to the Lanes list without saving edits.
- Existing Add and SQLite/OPFS persistence remain in place.

Database
- Database file: BowlingDB.sqlite3 in the browser's Origin Private File System (OPFS).
- SQLite engine: official SQLite WASM package, loaded by sqlite-worker.js from jsDelivr.
- Table: Lanes only.
- LaneId: INTEGER PRIMARY KEY AUTOINCREMENT.
- Name: required text.
- Address1, Address2, City: optional text.
- State: required, exactly two uppercase letters, default FL.
- Zip: optional, exactly five digits when supplied.
- Telephone: optional, ten digits when supplied; displayed with fixed telephone mask.
- Order: required positive integer, unique.

Deployment note
The SQLite WebAssembly module is loaded from jsDelivr when the worker starts, so an Internet connection is needed when that library is not already cached. Lane data stays in this browser origin's OPFS and is not uploaded to a server. Keep using the same GitHub Pages origin and do not clear site data if you want to retain your lanes.

Package layout
- index.html
- manifest.webmanifest
- service-worker.js
- sqlite-worker.js
- icons/bowling.svg
- images/bowling-home.png


b1v17 correction:
- Change screen selected-lane retrieval uses requestPayload and laneRecord variables, avoiding the reported temporal-dead-zone error.
- The SQLite worker URL is versioned (?v=b1v17) and explicitly precached so an older cached worker script is not reused.


b1v17 changes
- Actions > Delete is active on the Lanes list.
- Without a selected lane, shows 'Please select a row to delete.' with OK.
- With a selected lane, asks 'Are you sure you want to delete this record?' with Yes and No.
- No returns to the list without rerendering it, preserving the selected row.
- Yes deletes the selected Lanes row from BowlingDB and refreshes the list.
- All popup dialogs retain the title 'The Bowling App says:'.


b1v17 Bowlers table
- Adds the Bowlers table to the existing BowlingDB without dropping or recreating Lanes.
- Fields: BowlerId INTEGER PRIMARY KEY AUTOINCREMENT; FirstName TEXT NOT NULL; LastName TEXT NOT NULL; Active INTEGER NOT NULL DEFAULT 1 CHECK(Active IN (0,1)).
- Adds Bowlers menu and list with First Name, Last Name, and Active (Yes/No); BowlerId remains hidden.
- Actions > Add, Change, Delete operate on the currently active Lanes or Bowlers list.
- Bowlers form requires First Name and Last Name; Active checkbox defaults checked.
- Change loads the selected bowler; Save inserts or updates; Cancel returns to Bowlers list.
- Delete uses the standard Bowling App confirmation dialog. No preserves selection; Yes deletes the selected bowler.
- Existing Lanes records and table are retained.
