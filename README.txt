Complete Chai & Cigarettes update

Replace the existing chai-module.js in the my-expenses GitHub repository with this file.
It adds:
- Separate monthly cigarette and tea spend for My and Group (four figures).
- Multiple cigarette brands, each with its own packet price and packet size.
- Brand selector to choose which cigarette brand the quick-add button records.
- Add brand button; adding an existing brand updates its packet price/size.
- Retains the compact two-column spending summary and existing five-tab navigation.

Compatibility:
- Existing Chai & Cigarettes settings are migrated automatically to a first brand.
- Existing transactions and localStorage keys are not cleared or renamed.
- Historical entries retain their saved amount and brand.
Do not replace index.html or sw.js.
