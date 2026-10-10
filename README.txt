Bowling PWA — b1v8

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
