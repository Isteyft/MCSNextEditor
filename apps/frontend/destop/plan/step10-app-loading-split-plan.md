# App.tsx 加载拆分收尾计划（Step10）

## 目标

-   继续把 `App.tsx` 中“加载、搜索、映射、状态编排”拆到 feature 层，降低 import 数量和主文件职责密度。

## 步骤（6 步）

1. `已执行` 抽离表格行映射和搜索过滤到 `useModuleTableRows`，让 `App.tsx` 不再承载具体搜索实现。
2. `已执行` 抽离“选中项有效性同步”（6 组 `useEffect`）到统一 hook，减少重复样板。
3. `已执行` 抽离“模块 UI 组装参数”到 presenter hook，收敛 `App.tsx` 超长 props 组装段。
4. `已执行` 抽离项目根目录树行为（展开/切换/快照缓存）到 `project-shell` 子 hook。
5. `已执行` 抽离 `status` 文案和错误提示策略到 `app-core` 常量/方法，统一提示规范。
6. `已执行` 清理无效 import/状态并执行 `pnpm run typecheck` + `pnpm run build` 验证。

## 验收标准

-   `App.tsx` 不包含具体搜索过滤实现。
-   每一步拆分后都保持类型检查通过。
-   现有功能行为无回归（模块切换、表格筛选、加载与保存链路保持一致）。
