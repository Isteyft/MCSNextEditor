# Step 9 Execution Log (Loader Extraction)

## Scope

Extract module loading flow from `App.tsx`.

## Changes Made

-   Added:
-   `src/features/module-loaders/useModuleLoaders.ts`

-   Moved from `App.tsx`:
-   `loadConfigForm`
-   `loadTalentTable`
-   `loadAffixTable`
-   `loadBuffTable`
-   `loadItemTable`
-   `loadSkillTable`
-   `loadStaticSkillTable`
-   `handleSelectModule`

-   Updated `src/App.tsx`:
-   wired `useModuleLoaders({...})`
-   removed in-file implementations above
-   cleaned loader-related imports moved out with the extraction

## Size Delta

-   Before extraction: `1664` lines
-   After extraction: `1430` lines
-   Reduction: `-234` lines

## Verification

-   `pnpm run typecheck`: passed
-   `pnpm run build`: passed (outside sandbox due to esbuild spawn restrictions)
