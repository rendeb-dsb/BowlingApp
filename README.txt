Bowling PWA — Build 1 Version 50 (b1v51)

Changes in this version
- Score entry boxes are approximately two-thirds of their previous width; Game columns are half their previous width.
- Settings includes two score-entry Next-button navigation choices: “Tab right-to-left, top-to-bottom” (default) and “Tab top-to-bottom, right-to-left”. The selection persists across sessions using localStorage.
- The numeric keypad Next/Enter action follows the selected navigation order and focuses Save after the final score. Existing scores are selected on focus where the browser supports selecting number-input contents.
- Adds optional positive-integer Order fields to Teams and TeamMembers; existing databases gain these columns in place without deleting records.
- Team Member Order inserts shift existing assigned members at or after that position down one position.
- Settings lists Teams and Team Members that have no Order value.
- Scores display each team’s bowlers in Order ascending, with unordered bowlers after ordered bowlers.
- Scores entry starts at the first Game 1 cell; Enter/keyboard Next moves downward through the current game, then to the next game column, and finally to Save.
- Adds optional positive-integer Order fields to Teams and TeamMembers; existing databases gain the columns in place.
- Team Member Order inserts shift existing assigned members at or after that position down by one.
- Settings reports Teams and Team Members whose Order is blank.
- Scores list bowlers within each team by Order ascending, with unordered members after ordered members.
- Scores entry starts at Game 1, first bowler; Enter/keyboard Next moves downward through the current game, then to the next game column, then to Save.
- Team Members now waits for SQLite initialization before loading the Show Team dropdown and membership list, preventing an early screen opening from leaving the list empty.
- Matches list removes the radio-button column, formats dates as mm/dd/yyyy, places Our Team and Opponent Team after Date, and displays Match/Practice without type codes.
- Add Match captures optional LanesUsed (up to 5 characters), Temp (positive whole number), and Humidity (positive whole number). Existing databases are upgraded in place without deleting match or score data.
- Scores screen date title uses mm/dd/yyyy.
- All popup messages use a custom dialog titled "The Bowling App says:" and an OK button.
- Actions > Change requires a selected lane record.
- If no lane is selected, the app displays "Select a record to change." with an OK button.
- Change opens the same two-column Lane form titled "Change - Lane Management" and loads the selected record.
- Save validates and updates the selected SQLite Lanes record; Cancel returns to the Lanes list without saving edits.
- Existing Add and SQLite/OPFS persistence remain in place.

Database
- Database file: BowlingDB.sqlite3 in the browser's Origin Private File System (OPFS).
- SQLite engine: official SQLite WASM package, loaded by sqlite-worker.js from jsDelivr.
- Tables: Lanes, Bowlers, Leagues, Teams, TeamMembers, Matches, and Scores.
- LaneId: INTEGER PRIMARY KEY AUTOINCREMENT.
Matches additions: LanesUsed TEXT (optional, maximum 5 characters); Temp INTEGER (optional positive whole number); Humidity INTEGER (optional positive whole number).
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


b1v22 correction:
- Change screen selected-lane retrieval uses requestPayload and laneRecord variables, avoiding the reported temporal-dead-zone error.
- The SQLite worker URL is versioned (?v=b1v22) and explicitly precached so an older cached worker script is not reused.


b1v22 changes
- Actions > Delete is active on the Lanes list.
- Without a selected lane, shows 'Please select a row to delete.' with OK.
- With a selected lane, asks 'Are you sure you want to delete this record?' with Yes and No.
- No returns to the list without rerendering it, preserving the selected row.
- Yes deletes the selected Lanes row from BowlingDB and refreshes the list.
- All popup dialogs retain the title 'The Bowling App says:'.


b1v22 Bowlers table
- Adds the Bowlers table to the existing BowlingDB without dropping or recreating Lanes.
- Fields: BowlerId INTEGER PRIMARY KEY AUTOINCREMENT; FirstName TEXT NOT NULL; LastName TEXT NOT NULL; Active INTEGER NOT NULL DEFAULT 1 CHECK(Active IN (0,1)).
- Adds Bowlers menu and list with First Name, Last Name, and Active (Yes/No); BowlerId remains hidden.
- Actions > Add, Change, Delete operate on the currently active Lanes or Bowlers list.
- Bowlers form requires First Name and Last Name; Active checkbox defaults checked.
- Change loads the selected bowler; Save inserts or updates; Cancel returns to Bowlers list.
- Delete uses the standard Bowling App confirmation dialog. No preserves selection; Yes deletes the selected bowler.
- Existing Lanes records and table are retained.


b1v22 Bowlers list layout update
- Column order is radio button, Active, First Name, Last Name.
- First Name and Last Name columns have fixed, narrower widths (120px each) to reduce the list width.


Build 1 Version 19 (b1v22) - Leagues
- Adds Leagues table to existing BowlingDB without dropping Lanes or Bowlers.
- LeagueId INTEGER PRIMARY KEY AUTOINCREMENT.
- LeagueName TEXT NOT NULL.
- StartDate optional TEXT stored as yyyy-mm-dd when supplied.
- Active INTEGER NOT NULL DEFAULT 1 CHECK (Active IN (0,1)).
- Location INTEGER NOT NULL REFERENCES Lanes(LaneId) ON DELETE RESTRICT.
- SQLite foreign-key enforcement is enabled.
- Adds Leagues list and Add/Change/Delete screens. Actions operate on the active list.
- Location dropdown shows Lanes.Name and stores Lanes.LaneId.
- Lanes referenced by a league cannot be deleted until that league is removed or reassigned.
- Popup title convention remains “The Bowling App says:”.


Build 1 Version 20 (b1v22) - Leagues updates
- Adds optional EndDate to the Leagues table, stored in yyyy-mm-dd format like StartDate.
- End Date appears immediately after Start Date on the Add/Change form and in the Leagues list.
- Existing BowlingDB databases are upgraded by adding EndDate only when it is missing; existing Lanes, Bowlers, and Leagues records are retained.
- The Location dropdown is populated from the Lanes table. If no bowling centers exist, it displays a clear message and the form explains that a bowling center must first be added under Lanes.
- If the dropdown is empty, open Lanes and use Actions > Add to create a bowling center; it will then appear as a Location option.


Build 1 Version 22 (b1v22) adds Teams management. Teams has TeamId (autogenerated primary key), Name (required and nonblank), Active (0/1, default 1), and LeagueId (required foreign key to Leagues). Teams supports list, Add, Change, and Delete through Actions. The League dropdown lists existing leagues; deleting a league referenced by a team is prevented.


Build 1 Version 23 (b1v33)
- Teams list order is now selection, Name, Active, League.
- The Active column is constrained to 30px; its compact heading is A, explained in the list note as Active.
- Service-worker cache and SQLite worker URL are versioned for b1v33.


b1v33 additions:
- Teams Active column width increased to 60px.
- Added TeamMembers association table with composite primary key (TeamId, BowlerId), foreign keys with ON DELETE CASCADE, and management list/Add/Change/Delete screens.
- Team membership selection requires an active team and active bowler; duplicate team/bowler pairs are prevented by the database.


b1v33 database reliability update:
- Failed SQLite/OPFS initialization now attempts to close any partially opened database and OPFS SAH pool before allowing a retry.
- Worker failures reject pending database requests and display guidance to close other Bowling tabs and reload.
- TeamMembers management and the 60px Teams Active column are retained.


b1v33 UI updates:
- Teams list Active heading now reads 'Active' at the 60px column width.
- Team column in Team Members list is 200px wide.
- Team Members menu active styling is cleared when another menu item or screen is selected.


b1v33 UI updates:
- Team Members list Team column width changed to 150px.
- Management navigation explicitly clears the Team Members active highlight when navigating to other screens, including Leagues.


b1v33 update reliability:
- Service worker registration uses the versioned service-worker.js URL and updateViaCache='none'.
- The app checks for a service-worker update on page load.
- Navigations and HTML/SQLite worker requests use network-first behavior with no-store fetches, with cached fallbacks for offline use.
- Obsolete Bowling caches are removed on activation. SQLite database storage is not cleared or migrated by this update.


b1v33 Teams table update:
- Added required TeamType field, constrained to P (Practice) or M (Match).
- Existing Teams rows are migrated to TeamType='M'.
- Team Add/Change forms include Team Type; Teams list displays it.
- New records default to M.


b1v33 Teams form refinement:
- Team Type dropdown now displays user-friendly labels Match and Practice.
- The corresponding stored values remain M and P.
- New Teams default to Match (M), and Change displays the current value.
- Field label is Team Type:.


b1v33 list updates:
- Teams list shows Team Type as Practice or Match without the P/M code.
- Teams list sorted by TeamType descending, then Name ascending.
- Team Members list has a Show Team filter with All (-1) as default and each team name keyed by TeamId.
- Choosing All shows all memberships; choosing a team filters to that TeamId.


b1v33 Team Members filter fix:
- Corrected the Team Members Show Team dropdown behavior.
- The dropdown is populated with All (-1) and every team name using TeamId as the option value.
- Changing the selection now reloads the list; All shows all memberships and a specific TeamId shows only that team's memberships.


b1v33 Matches implementation:
- Added Matches table with required foreign keys to Lanes, Leagues, and Teams.
- Enforces distinct OurTeamId and OppoTeamId and yyyy-mm-dd date format at database level.
- Added Matches menu, list with radio selection, and Actions/Add form.
- Add form includes Date (defaults to today), Location, League, Our Team, and Opponent Team dropdowns.
- Match records are listed newest date first.
- Actions/Change and Actions/Delete for Matches are not implemented yet; those actions display a clear notice.


b1v34 additions:
- Matches now include MatchType: M (Match, exactly three games) or P (Practice, variable game count). Existing matches are migrated to M.
- Each match row has a Scores button. Score entry retrieves the eight distinct active bowlers assigned to the two team rosters.
- Scores table stores MatchId, GameNbr, BowlerId, and Score, enforcing 0 through 300 and unique (MatchId, GameNbr, BowlerId).
- Match score entry supports three fixed columns for Matches and dynamically added columns for Practice.
- Scores can be reopened and corrected. Save validates every game has one score for each of eight rostered bowlers and replaces the match's score set in a single SQLite transaction; a failed save rolls back.
- Unsaved score drafts are stored locally on the device and offered for recovery when the score screen is reopened.
- Existing database file and records are preserved; MatchType is added to existing Matches with default M.


b1v36 roster validation correction:
- Practice sessions may have fewer than four bowlers per team. Score entry displays every distinct active bowler assigned to either selected team.
- Match sessions still require eight distinct active bowlers (four per team, as configured through Team Members).
- A Practice session with no active assigned bowlers displays a helpful message rather than opening an empty score grid.
- Versioned app, worker URL, and service-worker cache updated to b1v36.


Changes in b1v40
- Add Team Member: team choices are sorted by descending TeamId (newest first).
- Bowler choices are filtered to active bowlers not already assigned to the selected team. The current bowler remains available when changing an existing membership.
- Changing the selected team refreshes the available bowler list.


Changes in b1v40
- Matches list includes a headerless radio-button column for selecting a match. Clicking a row also selects it.
- Actions > Change opens the selected match in a form titled Change Match.
- Existing match values, including lanes, temperature, humidity, type, location, league, and teams, are loaded for editing.
- Save validates required values, date, distinct teams, lane length, and positive integer temperature/humidity before updating the existing row.
- SQLite worker supports reading and updating match records without replacing their MatchId or deleting related scores.


Version 43 correction
- Fixed Change Team Member so it reloads the available-bowler list after restoring the selected team. The current bowler is included and selected, and the Bowler dropdown remains enabled for changes.


Changes in b1v46
- Screen navigation waits for one shared database initialization promise, avoiding early menu taps racing database startup.
- SQLite worker retries transient OPFS SyncAccessHandle conflicts after cleanup.
- Score entry requests the mobile keyboard Next action and explicitly handles its Enter key to follow the selected tab order.


Changes in b1v46
- Screen navigation waits for one shared database initialization promise, avoiding early menu taps racing database startup.
- SQLite worker retries transient OPFS SyncAccessHandle conflicts after cleanup.
- Score entry requests the mobile keyboard Next action and explicitly handles its Enter key to follow the selected navigation order.


Additional b1v46 corrections
- Score entry uses a text field with a numeric mobile keyboard so the keyboard Next action can be intercepted consistently. Explicit tabindex order is recalculated for the selected navigation setting.
- Database initialization now retries transient OPFS access-handle conflicts with longer backoff in both the worker and the app startup path. Settings waits for database initialization before querying missing Order values.


Changes in b1v51
- Opening Scores focuses and selects the contents of Game 1 for the first bowler.
- Draft recovery now compares a saved local draft against scores currently stored in the database. A draft that matches saved scores is treated as stale and removed without prompting.
- Drafts are retained only when their values differ from the database, including clearing a previously saved score.


Changes in b1v51
- Widened the Matches list Date column by 15 pixels.
- Added a Show match type filter (Match by default, Practice, or All).
- When saving Practice scores, all-zero games are treated as unused and not saved; previously saved all-zero Practice game records are removed. Remaining Practice games are renumbered consecutively.


Changes in b1v51
- Team Member form team and bowler dropdowns reduced to 180px wide.
- Order field reduced to 28px wide.
- Team choices show team name only, without league name.
- Available bowler choices exclude bowlers already assigned to any team of the selected team type (Match or Practice); existing bowler remains available in Change mode.


Changes in b1v51
- Reduced the Matches list Date column width by one-third.
- Moved Opponent Team before Our Team in the Matches list.
- Match form team dropdowns display team names only, without league names.
- Team choices are filtered to Match or Practice according to the selected Match Type; if the type is blank, all teams are available.
