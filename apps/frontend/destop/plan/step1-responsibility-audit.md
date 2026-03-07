# Step 1 Result: App.tsx Responsibility Audit

## File Snapshot

-   Target file: `src/App.tsx`
-   Total lines: `3820`
-   `useState` count: `100`
-   `useMemo` count: `35`
-   `useEffect` count: `13`
-   `function` (including async) count: `96`

Conclusion: `App.tsx` currently acts as state container, data loader, business orchestrator, global event hub, and UI composer. It is a high-coupling monolith and should be split.

## Responsibility Zones (by approximate line ranges)

### 1) Entry State Layer

-   Range: `91-207`
-   Content: project path, active module, config form, module maps, dirty flags, selection state, clipboards, meta options, modal flags, status text.
-   Note: very high state density and cross-module coupling.

### 2) Derived Data Layer (`useMemo`)

-   Range: `212-346`
-   Content: derived paths, row conversion, filtering, selected entities, seid display rows, active module label.
-   Note: good candidate for selectors or `useModuleDerivedState`.

### 3) Core Utility Functions

-   Range: `347-443`
-   Content: `clone*Entry`, path helpers, `collectSiblingModFolders`, editable target check.
-   Note: mostly independent from React lifecycle, low-risk extraction.

### 4) Side Effects (`useEffect`)

-   Range: `444-733`
-   Selection sync effects: `444-508` (repeated pattern across 6 modules)
-   Root expand sync: `510-515`
-   Global context menu suppression: `517-525`
-   Root snapshot cache sync: `527-561`
-   Startup extra roots probing: `563-585`
-   Workspace meta loading: `587-627`
-   Global keyboard binding: `629-733`
-   Note: duplicated templates and very wide dependency arrays.

### 5) Metadata Loading and Enum Assembly

-   Range: `734-1093`
-   Content: `preloadMeta`, `load*SeidMeta`, `load*EnumMeta`, `loadSpecialDrawerOptions`.
-   Note: can become a dedicated `useMetaLoader` feature.

### 6) Project Lifecycle and Root Snapshot

-   Range: `1094-1553`
-   Content: `reloadProject`, `handleSelectModRoot`, `handleOpenProject`, `handleCreateProject`, `read/applyRootModuleSnapshot`.
-   Note: core orchestration logic, should be isolated in project-shell feature.

### 7) Module Table Loaders

-   Range: `1554-1830`
-   Content: `loadConfigForm` and `load*Table` for talent/affix/buff/item/skill/staticSkill.
-   Note: interfaces are similar, suitable for a shared loader pattern.

### 8) Module Behavior Handlers (Largest Area)

-   Range: `1831-3298`
-   Content: module `select/delete/batch-prefix/add/copy/paste/change` and group/book generation.
-   Note: repeated structure across modules, split by feature and abstract common parts.

### 9) Seid Editing Flow

-   Range: `3299-3477`
-   Content: `updateSelectedSeidOwner`, `ensureSeidMetaLoaded`, open editor/picker, add/delete/move/change seid.
-   Note: cohesive sub-feature, suitable for isolated feature package.

### 10) Project Commands and Save Exit

-   Range: `3478-3624`
-   Content: rename/delete mod root and `handleSaveProject`.
-   Note: side-effect heavy, should be centralized as project commands.

### 11) UI Composition Layer (Final JSX)

-   Range: `3625-3820`
-   Content: top bar, sidebar, info panel, editor panel, modals, status bar.
-   Note: heavy conditional dispatch by active module; adapter layer can simplify.

## Step 1 Output and Step 2 Input

-   Output: 11 responsibility zones and key coupling hotspots have been identified.
-   Step 2 starting point: extract low-risk pure helpers first:
-   `clone*Entry`, `normalizePath/dirname/stripProjectPrefix`, `withMetaRoots`, and related pure utilities.
-   Keep behavior unchanged before moving to lifecycle and metadata split.
