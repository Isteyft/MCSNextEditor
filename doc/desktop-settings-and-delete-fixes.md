# Desktop 设置、加载与模块接入说明

更新时间：2026-03-10  
范围：`apps/frontend/destop`

## 1. 主窗口分辨率设置

### 目标

-   提供固定分辨率下拉选项。
-   保存后立即应用到主窗口。
-   下次启动继续使用已保存的分辨率。

### 当前分辨率选项

-   `800x600`
-   `1280x968`
-   `1440x1080`
-   `1920x1080`

### 实现

-   设置模型新增：
    -   `mainWindowWidth`
    -   `mainWindowHeight`
-   设置窗口保存后通过事件把最新设置广播给主窗口。
-   主窗口收到事件后立即更新尺寸。
-   启动时也会自动应用一次保存的分辨率。

### 关键文件

-   `src/components/settings/SettingsForm.tsx`
-   `src/features/settings/app-settings-store.ts`
-   `src/features/settings/useAppSettings.ts`
-   `src/features/settings/settings-events.ts`
-   `src/SettingsWindowApp.tsx`
-   `src/App.tsx`

## 2. 主窗口关闭时联动关闭设置窗口

### 目标

-   主窗口关闭后，设置窗口也同时关闭，避免孤立子窗口。

### 实现

-   主窗口注册 `onCloseRequested`。
-   在关闭回调里主动关闭 `settings-window`。

### 关键文件

-   `src/features/settings/settings-window.ts`
-   `src/App.tsx`

## 3. 删除后“看起来删了但又回来”的修复

### 问题根因

-   旧逻辑保存时只写当前内存数据，不清理磁盘上的旧文件和旧 Seid 文件。
-   重新加载时又把这些旧文件读回来，表现成“删除后复活”。

### 修复策略

-   新增后端删除文件命令：`delete_file_payload`
-   保存时增加“清理多余文件”逻辑：
    -   `BuffJsonData`
    -   `ItemJsonData`
    -   `skillJsonData`
    -   各模块 Seid 目录
-   Seid 文件改为按当前状态全量覆盖写入，不再沿用旧残留内容。

### 影响模块

-   Talent Seid
-   Buff
-   Item
-   Skill
-   StaticSkill

### 关键文件

-   `src-tauri/src/lib.rs`
-   `src/services/project-api.ts`
-   `src/features/project-save/useProjectSave.ts`
-   `src/components/buff/buff-domain.ts`
-   `src/components/item/item-domain.ts`
-   `src/components/skill/skill-domain.ts`
-   `src/components/tianfu/talent-domain.ts`
-   `src/components/staticskill/staticskill-domain.ts`

## 4. Tauri 权限与生效要求

### 已补充权限

-   `core:window:allow-set-size`
-   `core:window:allow-destroy`

### 注意

-   修改 `src-tauri/capabilities/default.json` 后，必须完整重启一次：
    -   停止 `pnpm tauri dev`
    -   重新执行 `pnpm tauri dev`

## 5. 项目打开时的加载进度弹窗

### 目标

-   打开项目时显示阻塞式加载弹窗。
-   全部数据加载完成前，主界面不可操作。

### 实现

-   `App.tsx` 增加 `projectLoading` 状态：
    -   `open`
    -   `progress`
    -   `message`
-   `useProjectLifecycle.ts` 增加 `onProjectLoadingChange`
-   `reloadProject` 中按步骤上报进度：
    -   项目初始化
    -   元数据
    -   各类 Seid Meta
    -   枚举
    -   Drawer 选项
    -   同级 mod 快照预加载

### 关键文件

-   `src/features/project-shell/useProjectLifecycle.ts`
-   `src/App.tsx`
-   `src/styles.css`

## 6. 加载弹窗样式调整

### 调整内容

-   标题居中。
-   缩小标题上下留白。
-   保持百分比和进度条在可视中心区域。

### 关键文件

-   `src/styles.css`

## 7. JSON 导入弹窗尺寸调整

### 调整内容

-   弹窗宽度改为约 `500px`
-   文本区固定高度并启用滚动：
    -   `height: 220px`
    -   `resize: none`
    -   `overflow: auto`

### 关键文件

-   `src/components/workspace/InfoPanel.tsx`
-   `src/styles.css`

## 8. 草稿缓存与自动保存

### 当前行为

-   草稿缓存会定时写入应用数据目录。
-   自动保存默认间隔为 `300` 秒。
-   恢复缓存时，会恢复当前 mod 的未保存编辑状态。

### 关键文件

-   `src/features/project-cache/draft-cache.ts`
-   `src/features/project-save/useProjectSave.ts`
-   `src/App.tsx`

## 9. Seid Drawer 数据刷新

### 当前行为

-   Drawer 候选数据支持跨同级 mod 聚合。
-   刷新时会合并：
    -   磁盘里的同级 mod 数据
    -   当前活动 mod 的内存数据
    -   `rootSnapshotCache` 中其他 mod 的缓存快照

### 目标效果

-   刚打开项目时能读到同级 mod 数据。
-   未保存但已进入缓存的数据，刷新后不会丢失。

### 关键文件

-   `src/features/meta-loader/drawer-option-loader.ts`
-   `src/features/meta-loader/useMetaLoader.ts`
-   `src/components/tianfu/SeidEditorModal.tsx`
-   `src/App.tsx`

## 10. 悟道与悟道技能模块接入

### 10.1 悟道类型

#### 数据文件

-   `Data/WuDaoAllTypeJson.json`

#### 当前支持

-   列表展示
-   搜索
-   新增
-   删除
-   复制/粘贴
-   批量改 ID
-   表单编辑
-   保存
-   草稿缓存恢复
-   mod 切换时跟随快照切换

#### 关键文件

-   `src/types/wudao.ts`
-   `src/components/wudao/wudao-domain.ts`
-   `src/components/wudao/WuDaoForm.tsx`
-   `src/features/modules/wudao/useWuDaoHandlers.ts`

### 10.2 悟道技能

#### 数据文件

-   主文件：`Data/WuDaoJson.json`
-   Seid 目录：`Data/WuDaoSeidJsonData`

#### 主要字段

-   `id`
-   `icon`
-   `name`
-   `Cast`
-   `Type`
-   `Lv`
-   `seid`
-   `seidData`
-   `desc`
-   `xiaoguo`
-   `CanForget`

#### 当前支持

-   列表展示
-   搜索
-   新增
-   删除
-   复制/粘贴
-   批量改 ID
-   表单编辑
-   JSON 导入
-   保存主文件
-   保存 Seid 目录
-   草稿缓存恢复
-   mod 切换时跟随快照切换
-   Seid 编辑器联动

#### Seid 处理规则

-   编辑时，`wudaoskill` 复用 `StaticSkillSeidMeta`
-   保存时：
    -   `WuDaoJson.json` 保存技能主体
    -   `WuDaoSeidJsonData/{seidId}.json` 保存 Seid 额外属性
-   Seid 文件中使用 `skillid` 作为归属字段

#### 关键文件

-   `src/types/wudaoskill.ts`
-   `src/components/wudaoskill/wudaoskill-domain.ts`
-   `src/components/wudaoskill/WuDaoSkillForm.tsx`
-   `src/features/modules/wudaoskill/useWuDaoSkillHandlers.ts`
-   `src/features/module-loaders/useModuleLoaders.ts`
-   `src/features/project-save/useProjectSave.ts`
-   `src/features/project-shell/useProjectLifecycle.ts`
-   `src/features/seid/useSeidDerivedState.ts`
-   `src/features/seid/useSeidHandlers.ts`
-   `src/App.tsx`

## 11. 建议验证清单

1. 设置主窗口分辨率并保存，确认主窗口立即变化。
2. 重启应用，确认窗口尺寸保持上次保存值。
3. 删除 Buff/Item/Skill/StaticSkill 后保存并重开，确认不会复活。
4. 打开项目时确认加载弹窗阻塞交互，直到进度完成。
5. 在同级 mod 中新增数据，确认 Drawer 刷新后仍能看到。
6. 新增一条悟道技能，编辑 Seid，保存后重开项目，确认 `WuDaoJson.json` 与 `WuDaoSeidJsonData` 都正确恢复。

## 12. NPC悟道模块接入

### 数据文件

-   `Data/NPCWuDaoJson.json`

### 数据结构

-   `id`: 主键 ID
-   `Type`: 类型
-   `lv`: 境界
-   `wudaoID`: 悟道技能 ID 列表
-   `value1-value12`: 12 项熟练度字段

### 字段说明

-   `lv` 使用境界枚举：
    -   `0` 凡人
    -   `1-3` 炼气前/中/后期
    -   `4-6` 筑基前/中/后期
    -   `7-9` 金丹前/中/后期
    -   `10-12` 元婴前/中/后期
    -   `13-15` 化神前/中/后期
-   `wudaoID` 使用弹窗选择，交互方式与 Seid 中的 drawer 类似
-   `wudaoID` 的候选源来自 `悟道技能` 模块
-   `value1-value12` 分别表示：
    -   `value1` 金
    -   `value2` 木
    -   `value3` 水
    -   `value4` 火
    -   `value5` 土
    -   `value6` 神
    -   `value7` 体
    -   `value8` 剑
    -   `value9` 气
    -   `value10` 阵
    -   `value11` 丹
    -   `value12` 器
-   每项熟练度都使用 0-5 枚举：
    -   `0` 一窍不通
    -   `1` 初窥门径
    -   `2` 略有小成
    -   `3` 融会贯通
    -   `4` 大道已成
    -   `5` 道之真境

### 当前支持

-   列表展示
-   搜索
-   新增
-   删除
-   复制/粘贴
-   批量修改 ID
-   JSON 导入
-   右侧表单编辑
-   项目保存
-   草稿缓存恢复
-   切换 mod 时跟随快照切换

### 关键文件

-   `src/types/npcwudao.ts`
-   `src/components/npcwudao/npcwudao-domain.ts`
-   `src/components/npcwudao/NpcWuDaoForm.tsx`
-   `src/features/modules/npcwudao/useNpcWuDaoHandlers.ts`
-   `src/features/module-loaders/useModuleLoaders.ts`
-   `src/features/project-save/useProjectSave.ts`
-   `src/features/project-shell/useProjectLifecycle.ts`
-   `src/App.tsx`

## 13. 重要NPC模块接入

### 数据文件

-   `Data/NPCImportantDate.json`

### 数据结构

-   `id`: 主键 ID
-   `LiuPai`: 流派 ID
-   `level`: 初始境界
-   `sex`: 性别
-   `zizhi`: 资质
-   `wuxing`: 悟性
-   `nianling`: 年龄
-   `XingGe`: 性格
-   `ChengHao`: 称号
-   `NPCTag`: NPC 标签
-   `ZhuJiTime / JinDanTime / YuanYingTime / HuaShengTime`: 关键时间
-   `DaShiXiong / ZhangMeng / ZhangLao`: 关联 NPC
-   `EventValue`: 事件值数组
-   `fuhao`: 字符串标记

### 当前编辑规则

-   `LiuPai / level / zizhi / wuxing / nianling / XingGe / ChengHao / NPCTag` 使用普通输入框
-   `sex` 复用非实例 NPC 的性别下拉
-   `ZhuJiTime / JinDanTime / YuanYingTime / HuaShengTime` 拆成 `年 / 月 / 日` 三个输入框
-   `DaShiXiong / ZhangMeng / ZhangLao / EventValue / fuhao` 当前保留在数据结构中，但默认不在界面显示

### 当前支持

-   打开项目时读取 `NPCImportantDate.json`
-   切换 mod 时跟随快照切换
-   中间表格展示与搜索
-   右侧表单编辑
-   新增
-   删除
-   复制 / 粘贴
-   批量改 ID
-   JSON 导入
-   项目保存
-   草稿缓存恢复

### 关键文件

-   `src/types/npcimportant.ts`
-   `src/components/npcimportant/npcimportant-domain.ts`
-   `src/components/npcimportant/NpcImportantForm.tsx`
-   `src/features/modules/npcimportant/useNpcImportantHandlers.ts`
-   `src/features/module-loaders/useModuleLoaders.ts`
-   `src/features/project-save/useProjectSave.ts`
-   `src/features/project-shell/useProjectLifecycle.ts`
-   `src/App.tsx`

## 14. 功法属性配置

### 属性来源规则

-   功法的 `AttackType` 不再按通用攻击属性理解。
-   当前作为“功法属性”使用。
-   内置固定属性：
    -   `0 金`
    -   `1 木`
    -   `2 水`
    -   `3 火`
    -   `4 土`
    -   `5 气`
    -   `6 遁术`
    -   `7 神`
    -   `8 剑`
    -   `9 体`
-   另外支持在设置中增加自定义功法属性，建议从 `10` 开始编号。

### 当前行为

-   设置界面可维护“功法属性”配置。
-   功法编辑区的“功法属性”下拉会合并：
    -   内置 0-9
    -   设置中的自定义属性
-   中间表格会显示功法属性中文名，而不是裸数字。
-   功法搜索已支持按功法属性中文名检索。

### 关键文件

-   `src/features/modules/staticskill/static-skill-attribute-options.ts`
-   `src/components/staticskill/StaticSkillForm.tsx`
-   `src/components/staticskill/staticskill-domain.ts`
-   `src/features/modules/useModuleTableRows.ts`
-   `src/features/settings/app-settings-store.ts`
-   `src/components/settings/SettingsForm.tsx`
