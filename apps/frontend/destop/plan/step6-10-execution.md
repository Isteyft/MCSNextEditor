# App.tsx 拆分执行（Step6-10）

1. `已执行` 抽离模块路径派生到 `useModulePaths`，减少 `App.tsx` 顶部路径 `useMemo` 样板。
2. `已执行` 抽离 SEID 派生态到 `useSeidDerivedState`，收敛模块分支选择和 Seid 行数据组装。
3. `已执行` 抽离根目录同级扫描逻辑到 `project-shell-utils`，避免 `App.tsx` 内部保留 IO 扫描实现。
4. `已执行` 清理 Seid 相关重复三元表达式，改为统一 `selectedSeidIds/selectedSeidData` 输入。
5. `已执行` 全量回归验证：`pnpm run typecheck`、`pnpm run build`。
