# Step 8 Execution Log

## Scope

Further reduce `App.tsx` by extracting Seid flow and save pipeline.

## Changes Made

-   Added Seid feature hook:
-   `src/features/seid/useSeidHandlers.ts`

-   Added save feature hook:
-   `src/features/project-save/useProjectSave.ts`

-   Moved from `App.tsx`:
-   Seid chain:
-   `updateSelectedSeidOwner`
-   `ensureSeidMetaLoaded`
-   `handleOpenSeidEditor`
-   `handleOpenSeidPicker`
-   `handleAddSeidFromPicker`
-   `handleDeleteSelectedSeid`
-   `handleMoveSelectedSeid`
-   `handleChangeSeidProperty`
-   Save chain:
-   `handleSaveProject`

-   Updated `src/App.tsx`:
-   wired `useSeidHandlers(...)`
-   wired `useProjectSave(...)`
-   removed in-file implementations listed above
-   cleaned now-unused save-related imports

## Size Delta

-   Before Step 8: `1853` lines
-   After Step 8: `1664` lines
-   Step 8 reduction: `-189` lines

## Verification

-   `pnpm run typecheck`: passed
-   `pnpm run build`: passed (outside sandbox due to esbuild spawn restrictions)

## Step 8 Status

-   Completed.
