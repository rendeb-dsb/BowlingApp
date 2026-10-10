Bowling PWA — b1v11

This version adds the Lanes menu and the visual-only Add Lanes Management screen.
- Lanes opens the empty list display with “No records to display.”
- Actions → Add opens the Add Lanes Management form.
- Cancel returns to the empty Lanes list.
- Save is intentionally non-operational until BowlingDB is implemented.
- Existing header, Settings, Actions menu, startup graphic, icons/ and images/ structure are retained.

Upload the contents of this ZIP to the root of the GitHub Pages repository, preserving the icons/ and images/ directories.

Startup graphic sizing update: the complete graphic now scales responsively to fit the available Display Area above the footer, preserving its aspect ratio and remaining centered.

Form layout update: City is on its own row. State (renamed from St) and Zip are on the next row, with State leftmost. The State input uses the same standard 34px control height and vertical alignment as the Telephone and Address inputs.

Form alignment update: the Name, City, and State input controls now share the same left edge as the Telephone input. Their labels are right-justified to that alignment.

Form layout update: the Add Lanes Management fields now use a borderless two-column table. Labels share a right-justified first column, and all main text boxes align in the second column with consistent cell padding. Order remains beside Telephone, and Zip remains beside State.

Telephone input update: the phone mask now treats underscores as editable digit positions and keeps parentheses, space, and hyphen fixed. Typing, deletion, and digit pasting are handled without allowing punctuation to be edited.

Database scope: this version remains a visual prototype; no database has been added yet. The next implementation step can introduce BowlingDB with only the Lanes table, then add further tables incrementally after each schema is tested.

Telephone deletion fix: repeated Backspace now clears successive digit positions from right to left. Fixed punctuation remains unchanged, and Backspace at the beginning of the mask does not remove punctuation.
