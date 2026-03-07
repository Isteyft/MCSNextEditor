# App.tsx Split Plan (Desktop / destop)

## Goal

Split `src/App.tsx` from a monolithic entry into a maintainable shell + feature structure, reducing coupling and enabling future optimization.

## Step 1 - Responsibility Audit (Done)

-   Audit `src/App.tsx` by responsibilities: state, derived data, effects, data loading, business handlers, and UI composition.
-   Save audit output to `plan/step1-responsibility-audit.md`.

## Step 2 - Extract Core Utilities First

-   Move pure helpers (path/meta related helpers and utility clones) into `src/features/app-core/`.
-   Prioritize code that does not depend on React state to keep risk low.

## Step 3 - Extract Project Bootstrap and Lifecycle

-   Move `project open/create/select root/reload` flow into `src/features/project-shell/`.
-   Wrap orchestration into `useProjectBootstrap` + `useProjectLifecycle`.

## Step 4 - Extract Metadata Loading Pipeline

-   Consolidate `preloadMeta`, `load*SeidMeta`, `load*EnumMeta`, and `loadSpecialDrawerOptions` into `useMetaLoader`.
-   Standardize roots handling, silent mode, error fallback, and state updates.

## Step 5 - Split CRUD Handlers by Module

-   Split module handlers for `talent/affix/buff/item/skill/staticSkill` into `src/features/modules/*`.
-   Each module should provide `state adapter`, `actions`, and `handlers`.

## Step 6 - Extract Global Interaction Layer

-   Move keyboard shortcuts, context menu behavior, and window actions into `useGlobalShortcuts` and `useWindowActions`.
-   Keep `App.tsx` as composition only, not event-listener heavy logic.

## Step 7 - Reduce App to Shell and Validate

-   Keep only top-level layout/composition and minimal state bridges in `App.tsx`.
-   Target final size: <= 300 lines for `App.tsx`.
-   Run type-check/build after each step to avoid regressions.

## Execution Status

-   Step 1: completed
-   Step 2: completed
-   Step 3: completed
-   Step 4: completed
-   Step 5: completed
-   Step 6: completed
-   Step 7: completed
