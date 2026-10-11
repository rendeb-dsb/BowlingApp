Bowling PWA — Build 1 Version 14 (b1v16)

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


b1v16 correction:
- Change screen selected-lane retrieval uses requestPayload and laneRecord variables, avoiding the reported temporal-dead-zone error.
- The SQLite worker URL is versioned (?v=b1v16) and explicitly precached so an older cached worker script is not reused.


b1v16 changes
- Actions > Delete is active on the Lanes list.
- Without a selected lane, shows 'Please select a row to delete.' with OK.
- With a selected lane, asks 'Are you sure you want to delete this record?' with Yes and No.
- No returns to the list without rerendering it, preserving the selected row.
- Yes deletes the selected Lanes row from BowlingDB and refreshes the list.
- All popup dialogs retain the title 'The Bowling App says:'.
