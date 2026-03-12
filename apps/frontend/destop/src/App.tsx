import { PhysicalSize } from '@tauri-apps/api/dpi'
import { listen } from '@tauri-apps/api/event'
import { appDataDir, executableDir, resourceDir } from '@tauri-apps/api/path'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useEffect, useMemo, useRef, useState } from 'react'

import { extractNpcWuDaoExtraValues, getNpcWuDaoExtraValues } from './components/npcwudao/npcwudao-domain'
import { CreateProjectModal } from './components/project/CreateProjectModal'
import { FolderContextMenu } from './components/project/FolderContextMenu'
import { RenameFolderModal } from './components/project/RenameFolderModal'
import { AddTalentModal } from './components/tianfu/AddTalentModal'
import { SeidEditorModal } from './components/tianfu/SeidEditorModal'
import { SeidMetaItem, SeidPickerModal } from './components/tianfu/SeidPickerModal'
import { AppTopBarMenu } from './components/topbar/AppTopBarMenu'
import { EditorPanel } from './components/workspace/EditorPanel'
import { InfoPanel } from './components/workspace/InfoPanel'
import { ModuleSidebar } from './components/workspace/ModuleSidebar'
import {
    cloneAffixEntry,
    cloneBackpackEntry,
    cloneBuffEntry,
    cloneItemEntry,
    cloneNpcImportantEntry,
    cloneNpcTypeEntry,
    cloneNpcWuDaoEntry,
    cloneSkillEntry,
    cloneStaticSkillEntry,
    cloneTalentEntry,
    dirname,
    isEditableElement,
    normalizePath,
    stripProjectPrefix,
} from './features/app-core/app-core-utils'
import { STATUS_MESSAGES, statusError } from './features/app-core/status-messages'
import { useModulePaths } from './features/app-core/useModulePaths'
import { useContextMenuBlocker } from './features/global-interactions/useContextMenuBlocker'
import { useGlobalShortcuts } from './features/global-interactions/useGlobalShortcuts'
import { useWindowActions } from './features/global-interactions/useWindowActions'
import { initAppLogger, logError, logInfo, logWarn } from './features/logging/app-logger'
import { buildInMemoryDrawerOptions, buildSnapshotDrawerOptions, mergeDrawerOptionMaps } from './features/meta-loader/drawer-option-loader'
import { useMetaLoader } from './features/meta-loader/useMetaLoader'
import { useModuleLoaders } from './features/module-loaders/useModuleLoaders'
import { useAffixHandlers } from './features/modules/affix/useAffixHandlers'
import { useBackpackHandlers } from './features/modules/backpack/useBackpackHandlers'
import { useBuffHandlers } from './features/modules/buff/useBuffHandlers'
import { useItemHandlers } from './features/modules/item/useItemHandlers'
import { useNpcHandlers } from './features/modules/npc/useNpcHandlers'
import { useNpcImportantHandlers } from './features/modules/npcimportant/useNpcImportantHandlers'
import { useNpcTypeHandlers } from './features/modules/npctype/useNpcTypeHandlers'
import { useNpcWuDaoHandlers } from './features/modules/npcwudao/useNpcWuDaoHandlers'
import { useSkillHandlers } from './features/modules/skill/useSkillHandlers'
import { mergeStaticSkillAttributeOptions } from './features/modules/staticskill/static-skill-attribute-options'
import { useStaticSkillHandlers } from './features/modules/staticskill/useStaticSkillHandlers'
import { useTalentHandlers } from './features/modules/talent/useTalentHandlers'
import { useInfoPanelPresenter } from './features/modules/useInfoPanelPresenter'
import { useModuleSelectionSync } from './features/modules/useModuleSelectionSync'
import { useModuleTableRows } from './features/modules/useModuleTableRows'
import { useWuDaoHandlers } from './features/modules/wudao/useWuDaoHandlers'
import { useWuDaoSkillHandlers } from './features/modules/wudaoskill/useWuDaoSkillHandlers'
import { buildDraftCachePath, loadDraftCache, saveDraftCache } from './features/project-cache/draft-cache'
import { useProjectSave } from './features/project-save/useProjectSave'
import { collectSiblingModFolders as collectSiblingModFoldersByAnchor } from './features/project-shell/project-shell-utils'
import { useProjectLifecycle } from './features/project-shell/useProjectLifecycle'
import { useProjectShellState } from './features/project-shell/useProjectShellState'
import { useSeidDerivedState } from './features/seid/useSeidDerivedState'
import { useSeidHandlers } from './features/seid/useSeidHandlers'
import { saveAppSettings } from './features/settings/app-settings-store'
import { SETTINGS_APPLIED_EVENT, type SettingsAppliedPayload } from './features/settings/settings-events'
import { closeSettingsWindowIfOpen, openOrFocusSettingsWindow } from './features/settings/settings-window'
import { useAppSettings } from './features/settings/useAppSettings'
import { useSeidActiveSync } from './hooks/useSeidActiveSync'
import { ModuleKey, MODULES, ViewMode } from './modules'
import {
    deleteFilePayload,
    deleteModFolder,
    getWorkspaceRoot,
    loadProjectEntries,
    readBundledMetaPayload,
    readFilePayload,
    renameModFolder,
    saveFilePayload,
} from './services/project-api'
import type {
    AffixEntry,
    BackpackEntry,
    BuffEntry,
    CreateAvatarEntry,
    ItemEntry,
    NpcEntry,
    NpcImportantEntry,
    NpcTypeEntry,
    NpcWuDaoEntry,
    SkillEntry,
    StaticSkillEntry,
    TalentTypeOption,
    WuDaoEntry,
    WuDaoSkillEntry,
} from './types'
import { inferModRootPath, pickLeafName } from './utils/path'

const appWindow = getCurrentWindow()

export function App() {
    const [projectPath, setProjectPath] = useState('')
    const [modRootPath, setModRootPath] = useState('')
    const [activeModule, setActiveModule] = useState<ModuleKey | ''>('')
    const [viewMode, setViewMode] = useState<ViewMode>('todo')
    const [activePath, setActivePath] = useState('')
    const [workspaceRoot, setWorkspaceRoot] = useState('')

    const [configForm, setConfigForm] = useState({
        name: '',
        author: '',
        version: '0.0.1',
        description: '',
    })
    const [rawConfigObject, setRawConfigObject] = useState<Record<string, unknown>>({})
    const [preservedSettings, setPreservedSettings] = useState<unknown>([])
    const [configDirty, setConfigDirty] = useState(false)
    const [configCachePath, setConfigCachePath] = useState('')

    const [npcMap, setNpcMap] = useState<Record<string, NpcEntry>>({})
    const [npcCachePath, setNpcCachePath] = useState('')
    const [npcDirty, setNpcDirty] = useState(false)
    const [selectedNpcKey, setSelectedNpcKey] = useState('')
    const [selectedNpcKeys, setSelectedNpcKeys] = useState<string[]>([])
    const [npcSelectionAnchor, setNpcSelectionAnchor] = useState('')
    const [npcClipboard, setNpcClipboard] = useState<NpcEntry[]>([])
    const [npcImportantMap, setNpcImportantMap] = useState<Record<string, NpcImportantEntry>>({})
    const [npcImportantCachePath, setNpcImportantCachePath] = useState('')
    const [npcImportantDirty, setNpcImportantDirty] = useState(false)
    const [selectedNpcImportantKey, setSelectedNpcImportantKey] = useState('')
    const [selectedNpcImportantKeys, setSelectedNpcImportantKeys] = useState<string[]>([])
    const [npcImportantSelectionAnchor, setNpcImportantSelectionAnchor] = useState('')
    const [npcImportantClipboard, setNpcImportantClipboard] = useState<NpcImportantEntry[]>([])
    const [npcTypeMap, setNpcTypeMap] = useState<Record<string, NpcTypeEntry>>({})
    const [npcTypeCachePath, setNpcTypeCachePath] = useState('')
    const [npcTypeDirty, setNpcTypeDirty] = useState(false)
    const [selectedNpcTypeKey, setSelectedNpcTypeKey] = useState('')
    const [selectedNpcTypeKeys, setSelectedNpcTypeKeys] = useState<string[]>([])
    const [npcTypeSelectionAnchor, setNpcTypeSelectionAnchor] = useState('')
    const [npcTypeClipboard, setNpcTypeClipboard] = useState<NpcTypeEntry[]>([])
    const [npcWuDaoMap, setNpcWuDaoMap] = useState<Record<string, NpcWuDaoEntry>>({})
    const [npcWuDaoCachePath, setNpcWuDaoCachePath] = useState('')
    const [npcWuDaoDirty, setNpcWuDaoDirty] = useState(false)
    const [selectedNpcWuDaoKey, setSelectedNpcWuDaoKey] = useState('')
    const [selectedNpcWuDaoKeys, setSelectedNpcWuDaoKeys] = useState<string[]>([])
    const [npcWuDaoSelectionAnchor, setNpcWuDaoSelectionAnchor] = useState('')
    const [npcWuDaoClipboard, setNpcWuDaoClipboard] = useState<NpcWuDaoEntry[]>([])
    const [backpackMap, setBackpackMap] = useState<Record<string, BackpackEntry>>({})
    const [backpackCachePath, setBackpackCachePath] = useState('')
    const [backpackDirty, setBackpackDirty] = useState(false)
    const [selectedBackpackKey, setSelectedBackpackKey] = useState('')
    const [selectedBackpackKeys, setSelectedBackpackKeys] = useState<string[]>([])
    const [backpackSelectionAnchor, setBackpackSelectionAnchor] = useState('')
    const [backpackClipboard, setBackpackClipboard] = useState<BackpackEntry[]>([])

    const [wudaoMap, setWuDaoMap] = useState<Record<string, WuDaoEntry>>({})
    const [wudaoCachePath, setWuDaoCachePath] = useState('')
    const [wudaoDirty, setWuDaoDirty] = useState(false)
    const [selectedWuDaoKey, setSelectedWuDaoKey] = useState('')
    const [selectedWuDaoKeys, setSelectedWuDaoKeys] = useState<string[]>([])
    const [wudaoSelectionAnchor, setWuDaoSelectionAnchor] = useState('')
    const [wudaoClipboard, setWuDaoClipboard] = useState<WuDaoEntry[]>([])
    const [wudaoSkillMap, setWuDaoSkillMap] = useState<Record<string, WuDaoSkillEntry>>({})
    const [wudaoSkillCachePath, setWuDaoSkillCachePath] = useState('')
    const [wudaoSkillDirty, setWuDaoSkillDirty] = useState(false)
    const [selectedWuDaoSkillKey, setSelectedWuDaoSkillKey] = useState('')
    const [selectedWuDaoSkillKeys, setSelectedWuDaoSkillKeys] = useState<string[]>([])
    const [wudaoSkillSelectionAnchor, setWuDaoSkillSelectionAnchor] = useState('')
    const [wudaoSkillClipboard, setWuDaoSkillClipboard] = useState<WuDaoSkillEntry[]>([])

    const [affixMap, setAffixMap] = useState<Record<string, AffixEntry>>({})
    const [affixCachePath, setAffixCachePath] = useState('')
    const [affixDirty, setAffixDirty] = useState(false)
    const [selectedAffixKey, setSelectedAffixKey] = useState('')
    const [selectedAffixKeys, setSelectedAffixKeys] = useState<string[]>([])
    const [affixSelectionAnchor, setAffixSelectionAnchor] = useState('')
    const [affixClipboard, setAffixClipboard] = useState<AffixEntry[]>([])

    const [talentMap, setTalentMap] = useState<Record<string, CreateAvatarEntry>>({})
    const [talentPath, setTalentPath] = useState('')
    const [talentCachePath, setTalentCachePath] = useState('')
    const [talentDirty, setTalentDirty] = useState(false)
    const [selectedTalentKey, setSelectedTalentKey] = useState('')
    const [selectedTalentKeys, setSelectedTalentKeys] = useState<string[]>([])
    const [talentSelectionAnchor, setTalentSelectionAnchor] = useState('')
    const [talentClipboard, setTalentClipboard] = useState<CreateAvatarEntry[]>([])
    const [buffMap, setBuffMap] = useState<Record<string, BuffEntry>>({})
    const [buffCachePath, setBuffCachePath] = useState('')
    const [buffDirty, setBuffDirty] = useState(false)
    const [selectedBuffKey, setSelectedBuffKey] = useState('')
    const [selectedBuffKeys, setSelectedBuffKeys] = useState<string[]>([])
    const [buffSelectionAnchor, setBuffSelectionAnchor] = useState('')
    const [buffClipboard, setBuffClipboard] = useState<BuffEntry[]>([])
    const [itemMap, setItemMap] = useState<Record<string, ItemEntry>>({})
    const [itemCachePath, setItemCachePath] = useState('')
    const [itemDirty, setItemDirty] = useState(false)
    const [selectedItemKey, setSelectedItemKey] = useState('')
    const [selectedItemKeys, setSelectedItemKeys] = useState<string[]>([])
    const [itemSelectionAnchor, setItemSelectionAnchor] = useState('')
    const [itemClipboard, setItemClipboard] = useState<ItemEntry[]>([])
    const [skillMap, setSkillMap] = useState<Record<string, SkillEntry>>({})
    const [skillCachePath, setSkillCachePath] = useState('')
    const [skillDirty, setSkillDirty] = useState(false)
    const [selectedSkillKey, setSelectedSkillKey] = useState('')
    const [selectedSkillKeys, setSelectedSkillKeys] = useState<string[]>([])
    const [skillSelectionAnchor, setSkillSelectionAnchor] = useState('')
    const [skillClipboard, setSkillClipboard] = useState<SkillEntry[]>([])
    const [staticSkillMap, setStaticSkillMap] = useState<Record<string, StaticSkillEntry>>({})
    const [staticSkillCachePath, setStaticSkillCachePath] = useState('')
    const [staticSkillDirty, setStaticSkillDirty] = useState(false)
    const [selectedStaticSkillKey, setSelectedStaticSkillKey] = useState('')
    const [selectedStaticSkillKeys, setSelectedStaticSkillKeys] = useState<string[]>([])
    const [staticSkillSelectionAnchor, setStaticSkillSelectionAnchor] = useState('')
    const [staticSkillClipboard, setStaticSkillClipboard] = useState<StaticSkillEntry[]>([])
    const [talentTypeOptions, setTalentTypeOptions] = useState<TalentTypeOption[]>([])
    const [seidMetaMap, setSeidMetaMap] = useState<Record<number, SeidMetaItem>>({})
    const [buffSeidMetaMap, setBuffSeidMetaMap] = useState<Record<number, SeidMetaItem>>({})
    const [buffTypeOptions, setBuffTypeOptions] = useState<TalentTypeOption[]>([])
    const [buffTriggerOptions, setBuffTriggerOptions] = useState<TalentTypeOption[]>([])
    const [buffRemoveTriggerOptions, setBuffRemoveTriggerOptions] = useState<TalentTypeOption[]>([])
    const [buffOverlayTypeOptions, setBuffOverlayTypeOptions] = useState<TalentTypeOption[]>([])
    const [itemGuideTypeOptions, setItemGuideTypeOptions] = useState<TalentTypeOption[]>([])
    const [itemShopTypeOptions, setItemShopTypeOptions] = useState<TalentTypeOption[]>([])
    const [itemUseTypeOptions, setItemUseTypeOptions] = useState<TalentTypeOption[]>([])
    const [itemTypeOptions, setItemTypeOptions] = useState<TalentTypeOption[]>([])
    const [itemQualityOptions, setItemQualityOptions] = useState<TalentTypeOption[]>([])
    const [itemPhaseOptions, setItemPhaseOptions] = useState<TalentTypeOption[]>([])
    const [itemEquipSeidMetaMap, setItemEquipSeidMetaMap] = useState<Record<number, SeidMetaItem>>({})
    const [itemUseSeidMetaMap, setItemUseSeidMetaMap] = useState<Record<number, SeidMetaItem>>({})
    const [affixTypeOptions, setAffixTypeOptions] = useState<TalentTypeOption[]>([])
    const [affixProjectTypeOptions, setAffixProjectTypeOptions] = useState<TalentTypeOption[]>([])
    const [skillAttackTypeOptions, setSkillAttackTypeOptions] = useState<TalentTypeOption[]>([])
    const [skillConsultTypeOptions, setSkillConsultTypeOptions] = useState<TalentTypeOption[]>([])
    const [skillPhaseOptions, setSkillPhaseOptions] = useState<TalentTypeOption[]>([])
    const [skillQualityOptions, setSkillQualityOptions] = useState<TalentTypeOption[]>([])
    const [skillSeidMetaMap, setSkillSeidMetaMap] = useState<Record<number, SeidMetaItem>>({})
    const [staticSkillSeidMetaMap, setStaticSkillSeidMetaMap] = useState<Record<number, SeidMetaItem>>({})
    const [drawerOptionsMap, setDrawerOptionsMap] = useState<Record<string, TalentTypeOption[]>>({})
    const [, setBuffDrawerFallbackOptions] = useState<TalentTypeOption[]>([])
    const [seidEditorOpen, setSeidEditorOpen] = useState(false)
    const [seidPickerOpen, setSeidPickerOpen] = useState(false)
    const [activeSeidId, setActiveSeidId] = useState<number | null>(null)
    const [addTalentOpen, setAddTalentOpen] = useState(false)
    const [addNpcOpen, setAddNpcOpen] = useState(false)
    const [addNpcImportantOpen, setAddNpcImportantOpen] = useState(false)
    const [addNpcTypeOpen, setAddNpcTypeOpen] = useState(false)
    const [addNpcWuDaoOpen, setAddNpcWuDaoOpen] = useState(false)
    const [addBackpackOpen, setAddBackpackOpen] = useState(false)
    const [addWuDaoOpen, setAddWuDaoOpen] = useState(false)
    const [addWuDaoSkillOpen, setAddWuDaoSkillOpen] = useState(false)
    const [addAffixOpen, setAddAffixOpen] = useState(false)
    const [addBuffOpen, setAddBuffOpen] = useState(false)
    const [addItemOpen, setAddItemOpen] = useState(false)
    const [addSkillOpen, setAddSkillOpen] = useState(false)
    const [addStaticSkillOpen, setAddStaticSkillOpen] = useState(false)
    const [tableSearchText, setTableSearchText] = useState('')

    const [createOpen, setCreateOpen] = useState(false)
    const [createMode, setCreateMode] = useState<'full' | 'quick'>('full')
    const [renameOpen, setRenameOpen] = useState(false)
    const [contextMenu, setContextMenu] = useState<{ open: boolean; x: number; y: number; kind: 'root' | 'blank'; targetPath: string }>({
        open: false,
        x: 0,
        y: 0,
        kind: 'root',
        targetPath: '',
    })
    const [renameTargetPath, setRenameTargetPath] = useState('')
    const [modRootFolders, setModRootFolders] = useState<Array<{ path: string; name: string }>>([])
    const [newProjectName, setNewProjectName] = useState('')
    const [newModName, setNewModName] = useState('')
    const [metaExtraRoots, setMetaExtraRoots] = useState<string[]>([])
    const [status, setStatus] = useState(STATUS_MESSAGES.openProjectHint)
    const [projectLoading, setProjectLoading] = useState({ open: false, progress: 0, message: '' })
    const [projectSaving, setProjectSaving] = useState({ open: false, progress: 0, message: '' })
    const autoSaveRunningRef = useRef(false)
    const cacheSaveRunningRef = useRef(false)
    const cacheRestoredRootRef = useRef('')
    const lastCacheUnsavedRef = useRef<boolean | null>(null)
    const { settingsDraft, settingsHydrated, patchSettings } = useAppSettings()
    const staticSkillAttributeOptions = useMemo(
        () => mergeStaticSkillAttributeOptions(settingsDraft.staticSkillAttributeOptions).map(item => ({ id: item.id, name: item.name })),
        [settingsDraft.staticSkillAttributeOptions]
    )
    const startupResolutionAppliedRef = useRef(false)

    function withMetaRoots(roots: string[]) {
        return Array.from(new Set([...roots.filter(Boolean), ...metaExtraRoots.filter(Boolean)]))
    }

    async function applyMainWindowResolution(widthValue: number, heightValue: number) {
        const width = Math.max(800, Number(widthValue || 0))
        const height = Math.max(600, Number(heightValue || 0))
        if (!Number.isFinite(width) || !Number.isFinite(height)) return
        try {
            const maximized = await appWindow.isMaximized()
            if (maximized) await appWindow.unmaximize()
            await appWindow.setSize(new PhysicalSize(width, height))
        } catch {
            // ignore window resize failures
        }
    }

    const {
        moduleConfigPath,
        npcPath,
        npcImportantPath,
        npcTypePath,
        npcWuDaoPath,
        backpackPath,
        wudaoPath,
        wudaoSkillPath,
        affixPath,
        createAvatarPath,
        buffDirPath,
        buffIconDirPath,
        itemDirPath,
        itemIconDirPath,
        skillDirPath,
        skillIconDirPath,
        staticSkillPath,
        modFolderName,
    } = useModulePaths({
        modRootPath,
        renameTargetPath,
    })
    const { expandedRootPaths, setExpandedRootPaths, rootSnapshotCache, setRootSnapshotCache, rootFoldersForSidebar, toggleExpandedRoot } =
        useProjectShellState({
            modRootPath,
            modRootFolders,
            normalizePath,
            pickLeafName,
            npcMap,
            npcImportantMap,
            npcTypeMap,
            npcTypeCachePath,
            npcWuDaoMap,
            backpackMap,
            wudaoMap,
            wudaoSkillMap,
            affixMap,
            talentMap,
            buffMap,
            itemMap,
            skillMap,
            staticSkillMap,
            npcDirty,
            npcImportantDirty,
            npcTypeDirty,
            npcWuDaoDirty,
            backpackDirty,
            wudaoDirty,
            wudaoSkillDirty,
            affixDirty,
            talentDirty,
            buffDirty,
            itemDirty,
            skillDirty,
            staticSkillDirty,
        })
    const {
        npcRows,
        npcImportantRows,
        npcTypeRows,
        npcWuDaoRows,
        backpackRows,
        wudaoRows,
        wudaoSkillRows,
        affixRows,
        avatarRows,
        buffRows,
        itemRows,
        skillRows,
        staticSkillRows,
        filteredNpcRows,
        filteredNpcImportantRows,
        filteredNpcTypeRows,
        filteredNpcWuDaoRows,
        filteredBackpackRows,
        filteredWuDaoRows,
        filteredWuDaoSkillRows,
        filteredAvatarRows,
        filteredAffixRows,
        filteredBuffRows,
        filteredItemRows,
        filteredSkillRows,
        filteredStaticSkillRows,
    } = useModuleTableRows({
        npcMap,
        npcImportantMap,
        npcTypeMap,
        npcWuDaoMap,
        backpackMap,
        wudaoMap,
        wudaoSkillMap,
        affixMap,
        talentMap,
        buffMap,
        itemMap,
        skillMap,
        staticSkillMap,
        staticSkillAttributeOptions,
        tableSearchText,
    })
    const selectedNpc = useMemo(() => (selectedNpcKey ? (npcMap[selectedNpcKey] ?? null) : null), [npcMap, selectedNpcKey])
    const selectedNpcImportant = useMemo(
        () => (selectedNpcImportantKey ? (npcImportantMap[selectedNpcImportantKey] ?? null) : null),
        [npcImportantMap, selectedNpcImportantKey]
    )
    const selectedNpcType = useMemo(
        () => (selectedNpcTypeKey ? (npcTypeMap[selectedNpcTypeKey] ?? null) : null),
        [npcTypeMap, selectedNpcTypeKey]
    )
    const selectedNpcWuDao = useMemo(
        () => (selectedNpcWuDaoKey ? (npcWuDaoMap[selectedNpcWuDaoKey] ?? null) : null),
        [npcWuDaoMap, selectedNpcWuDaoKey]
    )
    const selectedNpcWuDaoExtraValues = useMemo(() => getNpcWuDaoExtraValues(selectedNpcWuDao), [selectedNpcWuDao])
    const selectedBackpack = useMemo(
        () => (selectedBackpackKey ? (backpackMap[selectedBackpackKey] ?? null) : null),
        [backpackMap, selectedBackpackKey]
    )
    const selectedWuDao = useMemo(() => (selectedWuDaoKey ? (wudaoMap[selectedWuDaoKey] ?? null) : null), [wudaoMap, selectedWuDaoKey])
    const selectedWuDaoSkill = useMemo(
        () => (selectedWuDaoSkillKey ? (wudaoSkillMap[selectedWuDaoSkillKey] ?? null) : null),
        [wudaoSkillMap, selectedWuDaoSkillKey]
    )
    const selectedAffix = useMemo(() => (selectedAffixKey ? (affixMap[selectedAffixKey] ?? null) : null), [affixMap, selectedAffixKey])
    const affixDrawerOptions = useMemo(() => drawerOptionsMap.AffixDrawer ?? [], [drawerOptionsMap])
    const npcSkillDrawerOptions = useMemo(() => {
        const optionMap = new Map<number, TalentTypeOption>()
        const appendSkillOptions = (source: Record<string, SkillEntry>) => {
            for (const row of Object.values(source)) {
                const uniqueId = Number(row.Skill_ID ?? 0)
                if (!Number.isFinite(uniqueId) || uniqueId <= 0) continue
                const current = optionMap.get(uniqueId)
                const name = row.name || ''
                if (!current || (!current.name && name)) {
                    optionMap.set(uniqueId, { id: uniqueId, name })
                }
            }
        }

        for (const snapshot of Object.values(rootSnapshotCache)) {
            appendSkillOptions(snapshot.skillMap)
        }
        appendSkillOptions(skillMap)

        return [...optionMap.values()].sort((a, b) => a.id - b.id)
    }, [rootSnapshotCache, skillMap])
    const npcStaticSkillDrawerOptions = useMemo(() => {
        const cached = buildSnapshotDrawerOptions(
            Object.values(rootSnapshotCache).map(snapshot => ({
                affixMap: snapshot.affixMap,
                buffMap: snapshot.buffMap,
                itemMap: snapshot.itemMap,
                skillMap: snapshot.skillMap,
                staticSkillMap: snapshot.staticSkillMap,
            }))
        )
        const current = buildInMemoryDrawerOptions({
            affixMap,
            buffMap,
            itemMap,
            skillMap,
            staticSkillMap,
        })
        return mergeDrawerOptionMaps(mergeDrawerOptionMaps(cached, drawerOptionsMap), current).StaticSkillDrawer ?? []
    }, [rootSnapshotCache, drawerOptionsMap, affixMap, buffMap, itemMap, skillMap, staticSkillMap])
    const npcWuDaoSkillOptions = useMemo(() => {
        const optionMap = new Map<number, TalentTypeOption>()
        const appendOptions = (source: Record<string, WuDaoSkillEntry>) => {
            for (const row of Object.values(source)) {
                const id = Number(row.id ?? 0)
                if (!Number.isFinite(id) || id <= 0) continue
                const current = optionMap.get(id)
                const name = row.name || ''
                if (!current || (!current.name && name)) {
                    optionMap.set(id, { id, name })
                }
            }
        }
        for (const snapshot of Object.values(rootSnapshotCache)) appendOptions(snapshot.wudaoSkillMap)
        appendOptions(wudaoSkillMap)
        return [...optionMap.values()].sort((a, b) => a.id - b.id)
    }, [rootSnapshotCache, wudaoSkillMap])
    const backpackNpcOptions = useMemo(() => {
        const optionMap = new Map<number, TalentTypeOption>()
        const appendNpcOptions = (source: Record<string, NpcEntry>) => {
            for (const row of Object.values(source)) {
                if (!Number.isFinite(row.id) || row.id <= 0) continue
                const current = optionMap.get(row.id)
                const name = row.Name || ''
                if (!current || (!current.name && name)) {
                    optionMap.set(row.id, { id: row.id, name })
                }
            }
        }
        for (const snapshot of Object.values(rootSnapshotCache)) appendNpcOptions(snapshot.npcMap)
        appendNpcOptions(npcMap)
        return [...optionMap.values()].sort((a, b) => a.id - b.id)
    }, [rootSnapshotCache, npcMap])
    const wudaoTypeFormOptions = useMemo(() => {
        const optionMap = new Map<number, TalentTypeOption>()
        for (const row of Object.values(wudaoMap)) {
            const id = Number(row.id ?? 0)
            if (!Number.isFinite(id) || id <= 0) continue
            optionMap.set(id, { id, name: row.name || row.name1 || '' })
        }
        for (const id of selectedWuDaoSkill?.Type ?? []) {
            if (!Number.isFinite(id) || id <= 0 || optionMap.has(id)) continue
            optionMap.set(id, { id, name: '未定义类型' })
        }
        return [...optionMap.values()].sort((a, b) => a.id - b.id)
    }, [wudaoMap, selectedWuDaoSkill])
    const backpackItemOptions = useMemo(() => {
        const cached = buildSnapshotDrawerOptions(
            Object.values(rootSnapshotCache).map(snapshot => ({
                affixMap: snapshot.affixMap,
                buffMap: snapshot.buffMap,
                itemMap: snapshot.itemMap,
                skillMap: snapshot.skillMap,
                staticSkillMap: snapshot.staticSkillMap,
            }))
        )
        const current = buildInMemoryDrawerOptions({ affixMap, buffMap, itemMap, skillMap, staticSkillMap })
        return mergeDrawerOptionMaps(mergeDrawerOptionMaps(cached, drawerOptionsMap), current).ItemDrawer ?? []
    }, [rootSnapshotCache, drawerOptionsMap, affixMap, buffMap, itemMap, skillMap, staticSkillMap])
    const activeModuleLabel = useMemo(() => MODULES.find(item => item.key === activeModule)?.label ?? '-', [activeModule])
    const {
        selectedTalent,
        selectedBuff,
        selectedItem,
        selectedSkill,
        selectedStaticSkill,
        activeSeidMetaMap,
        seidPickerItems,
        selectedSeidDisplayRows,
        selectedSeidOwner,
        selectedSeidIds,
        selectedSeidData,
    } = useSeidDerivedState({
        activeModule,
        talentMap,
        buffMap,
        itemMap,
        skillMap,
        staticSkillMap,
        wudaoSkillMap,
        selectedTalentKey,
        selectedBuffKey,
        selectedItemKey,
        selectedSkillKey,
        selectedStaticSkillKey,
        selectedWuDaoSkillKey,
        seidMetaMap,
        buffSeidMetaMap,
        itemEquipSeidMetaMap,
        itemUseSeidMetaMap,
        skillSeidMetaMap,
        staticSkillSeidMetaMap,
    })

    async function collectSiblingModFolders(anchorModRoot: string) {
        return collectSiblingModFoldersByAnchor({ anchorModRoot, loadProjectEntries })
    }

    useSeidActiveSync({ activeSeidId, seidEditorOpen, selectedTalent: selectedSeidOwner, setActiveSeidId })
    useModuleSelectionSync({
        npc: {
            rows: npcRows,
            selectedKey: selectedNpcKey,
            setSelectedKey: setSelectedNpcKey,
            setSelectedKeys: setSelectedNpcKeys,
            setSelectionAnchor: setNpcSelectionAnchor,
        },
        npcimportant: {
            rows: npcImportantRows,
            selectedKey: selectedNpcImportantKey,
            setSelectedKey: setSelectedNpcImportantKey,
            setSelectedKeys: setSelectedNpcImportantKeys,
            setSelectionAnchor: setNpcImportantSelectionAnchor,
        },
        npctype: {
            rows: npcTypeRows,
            selectedKey: selectedNpcTypeKey,
            setSelectedKey: setSelectedNpcTypeKey,
            setSelectedKeys: setSelectedNpcTypeKeys,
            setSelectionAnchor: setNpcTypeSelectionAnchor,
        },
        npcwudao: {
            rows: npcWuDaoRows,
            selectedKey: selectedNpcWuDaoKey,
            setSelectedKey: setSelectedNpcWuDaoKey,
            setSelectedKeys: setSelectedNpcWuDaoKeys,
            setSelectionAnchor: setNpcWuDaoSelectionAnchor,
        },
        backpack: {
            rows: backpackRows,
            selectedKey: selectedBackpackKey,
            setSelectedKey: setSelectedBackpackKey,
            setSelectedKeys: setSelectedBackpackKeys,
            setSelectionAnchor: setBackpackSelectionAnchor,
        },
        wudao: {
            rows: wudaoRows,
            selectedKey: selectedWuDaoKey,
            setSelectedKey: setSelectedWuDaoKey,
            setSelectedKeys: setSelectedWuDaoKeys,
            setSelectionAnchor: setWuDaoSelectionAnchor,
        },
        wudaoskill: {
            rows: wudaoSkillRows,
            selectedKey: selectedWuDaoSkillKey,
            setSelectedKey: setSelectedWuDaoSkillKey,
            setSelectedKeys: setSelectedWuDaoSkillKeys,
            setSelectionAnchor: setWuDaoSkillSelectionAnchor,
        },
        talent: {
            rows: avatarRows,
            selectedKey: selectedTalentKey,
            setSelectedKey: setSelectedTalentKey,
            setSelectedKeys: setSelectedTalentKeys,
            setSelectionAnchor: setTalentSelectionAnchor,
        },
        buff: {
            rows: buffRows,
            selectedKey: selectedBuffKey,
            setSelectedKey: setSelectedBuffKey,
            setSelectedKeys: setSelectedBuffKeys,
            setSelectionAnchor: setBuffSelectionAnchor,
        },
        item: {
            rows: itemRows,
            selectedKey: selectedItemKey,
            setSelectedKey: setSelectedItemKey,
            setSelectedKeys: setSelectedItemKeys,
            setSelectionAnchor: setItemSelectionAnchor,
        },
        skill: {
            rows: skillRows,
            selectedKey: selectedSkillKey,
            setSelectedKey: setSelectedSkillKey,
            setSelectedKeys: setSelectedSkillKeys,
            setSelectionAnchor: setSkillSelectionAnchor,
        },
        staticSkill: {
            rows: staticSkillRows,
            selectedKey: selectedStaticSkillKey,
            setSelectedKey: setSelectedStaticSkillKey,
            setSelectedKeys: setSelectedStaticSkillKeys,
            setSelectionAnchor: setStaticSkillSelectionAnchor,
        },
        affix: {
            rows: affixRows,
            selectedKey: selectedAffixKey,
            setSelectedKey: setSelectedAffixKey,
            setSelectedKeys: setSelectedAffixKeys,
            setSelectionAnchor: setAffixSelectionAnchor,
        },
    })

    useEffect(() => {
        void initAppLogger()
        void logInfo('desktop app started')
    }, [])

    useEffect(() => {
        let unlisten: (() => void) | null = null
        void (async () => {
            unlisten = await appWindow.onCloseRequested(() => {
                void closeSettingsWindowIfOpen()
            })
        })()
        return () => {
            if (unlisten) unlisten()
        }
    }, [])

    useEffect(() => {
        if (!settingsHydrated) return
        if (startupResolutionAppliedRef.current) return
        startupResolutionAppliedRef.current = true
        void applyMainWindowResolution(settingsDraft.mainWindowWidth, settingsDraft.mainWindowHeight)
    }, [settingsHydrated, settingsDraft.mainWindowWidth, settingsDraft.mainWindowHeight])

    useEffect(() => {
        let unlisten: (() => void) | null = null
        void (async () => {
            unlisten = await listen<SettingsAppliedPayload>(SETTINGS_APPLIED_EVENT, event => {
                const synced = saveAppSettings(event.payload.settings)
                patchSettings(synced)
                void applyMainWindowResolution(synced.mainWindowWidth, synced.mainWindowHeight)
            })
        })()
        return () => {
            if (unlisten) unlisten()
        }
    }, [patchSettings])

    useEffect(() => {
        let active = true
        ;(async () => {
            try {
                const roots: string[] = []
                const exePath = await executableDir()
                if (exePath) roots.push(exePath)
                try {
                    const resPath = await resourceDir()
                    if (resPath) roots.push(resPath)
                } catch {
                    // resourceDir may be unavailable in dev mode
                }
                if (!active) return
                setMetaExtraRoots(Array.from(new Set(roots.filter(Boolean))))
            } catch {
                // running in pure web mode or path API unavailable
            }
        })()
        return () => {
            active = false
        }
    }, [])

    useEffect(() => {
        if (!workspaceRoot || metaExtraRoots.length === 0 || !modRootPath) return
        ;(async () => {
            await preloadMeta([workspaceRoot], true)
            await loadBuffSeidMeta([workspaceRoot], true)
            await loadItemSeidMeta([workspaceRoot], true)
            await loadSkillSeidMeta([workspaceRoot], true)
            await loadStaticSkillSeidMeta([workspaceRoot], true)
            await loadBuffEnumMeta([workspaceRoot], true)
            await loadAffixEnumMeta([workspaceRoot], true)
            await loadItemEnumMeta([workspaceRoot], true)
            await loadSkillEnumMeta([workspaceRoot], true)
            await loadSpecialDrawerOptions([workspaceRoot], modRootPath, true)
        })()
    }, [workspaceRoot, metaExtraRoots, modRootPath])

    useEffect(() => {
        let active = true
        ;(async () => {
            try {
                const root = await getWorkspaceRoot()
                if (!active) return
                setWorkspaceRoot(root)
                await preloadMeta([root], true)
                await loadBuffSeidMeta([root], true)
                await loadItemSeidMeta([root], true)
                await loadSkillSeidMeta([root], true)
                await loadStaticSkillSeidMeta([root], true)
                await loadBuffEnumMeta([root], true)
                await loadAffixEnumMeta([root], true)
                await loadItemEnumMeta([root], true)
                await loadSkillEnumMeta([root], true)
            } catch {
                // ignore startup preload failures
            }
        })()
        return () => {
            active = false
        }
    }, [])

    const {
        preloadMeta,
        loadBuffSeidMeta,
        loadItemSeidMeta,
        loadSkillSeidMeta,
        loadStaticSkillSeidMeta,
        loadBuffEnumMeta,
        loadAffixEnumMeta,
        loadItemEnumMeta,
        loadSkillEnumMeta,
        loadSpecialDrawerOptions,
    } = useMetaLoader({
        withMetaRoots,
        setTalentTypeOptions,
        setSeidMetaMap,
        setBuffSeidMetaMap,
        setItemEquipSeidMetaMap,
        setItemUseSeidMetaMap,
        setSkillSeidMetaMap,
        setStaticSkillSeidMetaMap,
        setBuffTypeOptions,
        setBuffTriggerOptions,
        setBuffRemoveTriggerOptions,
        setBuffOverlayTypeOptions,
        setAffixTypeOptions,
        setAffixProjectTypeOptions,
        setItemGuideTypeOptions,
        setItemShopTypeOptions,
        setItemUseTypeOptions,
        setItemTypeOptions,
        setItemQualityOptions,
        setItemPhaseOptions,
        setSkillAttackTypeOptions,
        setSkillConsultTypeOptions,
        setSkillPhaseOptions,
        setSkillQualityOptions,
        setDrawerOptionsMap,
        setBuffDrawerFallbackOptions,
        setStatus,
        readFilePayload,
        readBundledMetaPayload,
        loadProjectEntries,
    })
    const { handleCreateProject, handleOpenProject, handleSelectModRoot } = useProjectLifecycle({
        projectPath,
        modRootPath,
        workspaceRoot,
        rootSnapshotCache,
        newProjectName,
        newModName,
        createMode,
        stripProjectPrefix,
        dirname,
        normalizePath,
        collectSiblingModFolders,
        preloadMeta,
        loadBuffSeidMeta,
        loadItemSeidMeta,
        loadSkillSeidMeta,
        loadStaticSkillSeidMeta,
        loadBuffEnumMeta,
        loadAffixEnumMeta,
        loadItemEnumMeta,
        loadSkillEnumMeta,
        loadSpecialDrawerOptions,
        onProjectLoadingChange: setProjectLoading,
        setters: {
            setProjectPath,
            setModRootPath,
            setModRootFolders,
            setRenameTargetPath,
            setActiveModule,
            setViewMode,
            setActivePath,
            setTableSearchText,
            setConfigForm,
            setRawConfigObject,
            setPreservedSettings,
            setConfigDirty,
            setConfigCachePath,
            setNpcMap,
            setNpcImportantMap,
            setNpcTypeMap,
            setNpcWuDaoMap,
            setNpcCachePath,
            setNpcImportantCachePath,
            setNpcTypeCachePath,
            setNpcWuDaoCachePath,
            setNpcDirty,
            setNpcImportantDirty,
            setNpcTypeDirty,
            setNpcWuDaoDirty,
            setAddNpcOpen,
            setAddNpcWuDaoOpen,
            setBackpackMap,
            setBackpackCachePath,
            setBackpackDirty,
            setAddBackpackOpen,
            setWuDaoMap,
            setWuDaoCachePath,
            setWuDaoDirty,
            setWuDaoSkillMap,
            setWuDaoSkillCachePath,
            setWuDaoSkillDirty,
            setSelectedWuDaoKey,
            setSelectedWuDaoKeys,
            setWuDaoSelectionAnchor,
            setWuDaoClipboard,
            setSelectedNpcKey,
            setSelectedNpcImportantKey,
            setSelectedNpcTypeKey,
            setSelectedNpcWuDaoKey,
            setSelectedNpcKeys,
            setSelectedNpcImportantKeys,
            setSelectedNpcTypeKeys,
            setSelectedNpcWuDaoKeys,
            setNpcSelectionAnchor,
            setNpcImportantSelectionAnchor,
            setNpcTypeSelectionAnchor,
            setNpcWuDaoSelectionAnchor,
            setNpcClipboard,
            setNpcImportantClipboard,
            setNpcTypeClipboard,
            setNpcWuDaoClipboard,
            setSelectedBackpackKey,
            setSelectedBackpackKeys,
            setBackpackSelectionAnchor,
            setBackpackClipboard,
            setSelectedWuDaoSkillKey,
            setSelectedWuDaoSkillKeys,
            setWuDaoSkillSelectionAnchor,
            setWuDaoSkillClipboard,
            setAffixMap,
            setAffixCachePath,
            setAffixDirty,
            setSelectedAffixKey,
            setSelectedAffixKeys,
            setAffixSelectionAnchor,
            setAffixClipboard,
            setTalentMap,
            setTalentPath,
            setTalentCachePath,
            setTalentDirty,
            setBuffMap,
            setBuffCachePath,
            setBuffDirty,
            setItemMap,
            setItemCachePath,
            setItemDirty,
            setSelectedItemKey,
            setSelectedItemKeys,
            setItemSelectionAnchor,
            setItemClipboard,
            setSelectedBuffKey,
            setSelectedBuffKeys,
            setBuffSelectionAnchor,
            setBuffClipboard,
            setSkillMap,
            setSkillCachePath,
            setSkillDirty,
            setSelectedSkillKey,
            setSelectedSkillKeys,
            setSkillSelectionAnchor,
            setSkillClipboard,
            setStaticSkillMap,
            setStaticSkillCachePath,
            setStaticSkillDirty,
            setSelectedStaticSkillKey,
            setSelectedStaticSkillKeys,
            setStaticSkillSelectionAnchor,
            setStaticSkillClipboard,
            setBuffTypeOptions,
            setBuffTriggerOptions,
            setBuffRemoveTriggerOptions,
            setBuffOverlayTypeOptions,
            setAffixTypeOptions,
            setAffixProjectTypeOptions,
            setItemGuideTypeOptions,
            setItemShopTypeOptions,
            setItemUseTypeOptions,
            setItemTypeOptions,
            setItemQualityOptions,
            setItemPhaseOptions,
            setItemEquipSeidMetaMap,
            setItemUseSeidMetaMap,
            setSkillAttackTypeOptions,
            setSkillConsultTypeOptions,
            setSkillPhaseOptions,
            setSkillQualityOptions,
            setSkillSeidMetaMap,
            setStaticSkillSeidMetaMap,
            setDrawerOptionsMap,
            setBuffDrawerFallbackOptions,
            setSelectedTalentKey,
            setSelectedTalentKeys,
            setTalentSelectionAnchor,
            setTalentClipboard,
            setBuffSeidMetaMap,
            setSeidEditorOpen,
            setSeidPickerOpen,
            setActiveSeidId,
            setExpandedRootPaths,
            setAddNpcImportantOpen,
            setAddBuffOpen,
            setAddWuDaoOpen,
            setAddWuDaoSkillOpen,
            setAddAffixOpen,
            setAddItemOpen,
            setAddSkillOpen,
            setAddStaticSkillOpen,
            setRootSnapshotCache,
            setStatus,
            setCreateOpen,
            setCreateMode,
            setNewProjectName,
            setNewModName,
        },
    })

    const { handleSelectModule } = useModuleLoaders({
        moduleConfigPath,
        modRootPath,
        projectPath,
        workspaceRoot,
        configCachePath,
        npcTypeMap,
        npcPath,
        npcImportantPath,
        npcTypePath,
        npcWuDaoPath,
        npcCachePath,
        npcImportantCachePath,
        npcTypeCachePath,
        npcWuDaoCachePath,
        npcDirty,
        npcImportantDirty,
        npcTypeDirty,
        npcWuDaoDirty,
        backpackPath,
        backpackCachePath,
        backpackDirty,
        wudaoPath,
        wudaoCachePath,
        wudaoDirty,
        wudaoSkillPath,
        wudaoSkillCachePath,
        wudaoSkillDirty,
        createAvatarPath,
        talentCachePath,
        talentDirty,
        affixPath,
        affixCachePath,
        affixDirty,
        buffDirPath,
        buffCachePath,
        buffDirty,
        itemDirPath,
        itemCachePath,
        itemDirty,
        skillDirPath,
        skillCachePath,
        skillDirty,
        staticSkillPath,
        staticSkillCachePath,
        staticSkillDirty,
        setViewMode,
        setActivePath,
        setStatus,
        setRawConfigObject,
        setPreservedSettings,
        setConfigForm,
        setConfigCachePath,
        setConfigDirty,
        setNpcMap,
        setNpcImportantMap,
        setNpcTypeMap,
        setNpcWuDaoMap,
        setNpcCachePath,
        setNpcImportantCachePath,
        setNpcTypeCachePath,
        setNpcWuDaoCachePath,
        setNpcDirty,
        setNpcImportantDirty,
        setNpcTypeDirty,
        setNpcWuDaoDirty,
        setBackpackMap,
        setBackpackCachePath,
        setBackpackDirty,
        setSelectedNpcKey,
        setSelectedNpcImportantKey,
        setSelectedNpcTypeKey,
        setSelectedNpcWuDaoKey,
        setSelectedNpcKeys,
        setSelectedNpcImportantKeys,
        setSelectedNpcTypeKeys,
        setSelectedNpcWuDaoKeys,
        setNpcSelectionAnchor,
        setNpcImportantSelectionAnchor,
        setNpcTypeSelectionAnchor,
        setNpcWuDaoSelectionAnchor,
        setSelectedBackpackKey,
        setSelectedBackpackKeys,
        setBackpackSelectionAnchor,
        setWuDaoMap,
        setWuDaoCachePath,
        setWuDaoDirty,
        setSelectedWuDaoKey,
        setSelectedWuDaoKeys,
        setWuDaoSelectionAnchor,
        setWuDaoSkillMap,
        setWuDaoSkillCachePath,
        setWuDaoSkillDirty,
        setSelectedWuDaoSkillKey,
        setSelectedWuDaoSkillKeys,
        setWuDaoSkillSelectionAnchor,
        setTalentMap,
        setTalentPath,
        setTalentCachePath,
        setTalentDirty,
        setSelectedTalentKey,
        setSelectedTalentKeys,
        setTalentSelectionAnchor,
        setAffixMap,
        setAffixCachePath,
        setAffixDirty,
        setSelectedAffixKey,
        setSelectedAffixKeys,
        setAffixSelectionAnchor,
        setBuffMap,
        setBuffCachePath,
        setBuffDirty,
        setSelectedBuffKey,
        setSelectedBuffKeys,
        setBuffSelectionAnchor,
        setItemMap,
        setItemCachePath,
        setItemDirty,
        setSelectedItemKey,
        setSelectedItemKeys,
        setItemSelectionAnchor,
        setSkillMap,
        setSkillCachePath,
        setSkillDirty,
        setSelectedSkillKey,
        setSelectedSkillKeys,
        setSkillSelectionAnchor,
        setStaticSkillMap,
        setStaticSkillCachePath,
        setStaticSkillDirty,
        setSelectedStaticSkillKey,
        setSelectedStaticSkillKeys,
        setStaticSkillSelectionAnchor,
        setActiveModule,
        setTableSearchText,
        readFilePayload,
        saveFilePayload,
        loadProjectEntries,
        preloadMeta,
        loadBuffSeidMeta,
        loadItemSeidMeta,
        loadSkillSeidMeta,
        loadStaticSkillSeidMeta,
        loadBuffEnumMeta,
        loadAffixEnumMeta,
        loadItemEnumMeta,
        loadSkillEnumMeta,
        loadSpecialDrawerOptions,
    })

    async function handleSelectModuleFromSidebar(key: ModuleKey) {
        if (key !== 'settings') {
            await handleSelectModule(key)
            return
        }
        try {
            await openOrFocusSettingsWindow()
        } catch (error) {
            setStatus(statusError('鎵撳紑璁剧疆绐楀彛', error))
        }
    }

    async function handleRefreshSeidDrawerOptions() {
        if (!modRootPath) return
        await loadSpecialDrawerOptions([modRootPath, projectPath, workspaceRoot], modRootPath, true)
        setDrawerOptionsMap(prev =>
            mergeDrawerOptionMaps(
                mergeDrawerOptionMaps(prev, buildSnapshotDrawerOptions(Object.values(rootSnapshotCache))),
                buildInMemoryDrawerOptions({
                    affixMap,
                    buffMap,
                    itemMap,
                    skillMap,
                    staticSkillMap,
                })
            )
        )
    }

    useEffect(() => {
        if (!modRootPath) return
        setDrawerOptionsMap(prev =>
            mergeDrawerOptionMaps(
                mergeDrawerOptionMaps(prev, buildSnapshotDrawerOptions(Object.values(rootSnapshotCache))),
                buildInMemoryDrawerOptions({
                    affixMap,
                    buffMap,
                    itemMap,
                    skillMap,
                    staticSkillMap,
                })
            )
        )
    }, [modRootPath, rootSnapshotCache, affixMap, buffMap, itemMap, skillMap, staticSkillMap])

    const { handleSelectNpc, handleDeleteNpcs, handleBatchPrefixNpcIds, handleAddNpc, handleCopyNpc, handlePasteNpc, handleChangeNpcForm } =
        useNpcHandlers({
            filteredNpcRows,
            npcRows,
            npcMap,
            selectedNpcKey,
            selectedNpcKeys,
            npcSelectionAnchor,
            npcClipboard,
            cloneNpcEntry: entry => ({
                ...entry,
                LingGen: [...entry.LingGen],
                skills: [...entry.skills],
                staticSkills: [...entry.staticSkills],
                paimaifenzu: [...entry.paimaifenzu],
            }),
            setSelectedNpcKey,
            setSelectedNpcKeys,
            setNpcSelectionAnchor,
            setNpcMap,
            setNpcDirty,
            setStatus,
            setAddNpcOpen,
            setNpcClipboard,
        })

    const {
        handleSelectNpcImportant,
        handleDeleteNpcImportants,
        handleBatchPrefixNpcImportantIds,
        handleAddNpcImportant,
        handleCopyNpcImportant,
        handlePasteNpcImportant,
        handleChangeNpcImportantForm,
    } = useNpcImportantHandlers({
        filteredNpcImportantRows,
        npcImportantRows,
        npcImportantMap,
        selectedNpcImportantKey,
        selectedNpcImportantKeys,
        npcImportantSelectionAnchor,
        npcImportantClipboard,
        cloneNpcImportantEntry,
        setSelectedNpcImportantKey,
        setSelectedNpcImportantKeys,
        setNpcImportantSelectionAnchor,
        setNpcImportantMap,
        setNpcImportantDirty,
        setStatus,
        setAddNpcImportantOpen,
        setNpcImportantClipboard,
    })

    const {
        handleSelectNpcType,
        handleDeleteNpcTypes,
        handleBatchPrefixNpcTypeIds,
        handleAddNpcType,
        handleCopyNpcType,
        handlePasteNpcType,
        handleChangeNpcTypeForm,
        handleGenerateNpcTypeGroup,
    } = useNpcTypeHandlers({
        filteredNpcTypeRows,
        npcTypeRows,
        npcTypeMap,
        selectedNpcTypeKey,
        selectedNpcTypeKeys,
        npcTypeSelectionAnchor,
        npcTypeClipboard,
        cloneNpcTypeEntry,
        setSelectedNpcTypeKey,
        setSelectedNpcTypeKeys,
        setNpcTypeSelectionAnchor,
        setNpcTypeMap,
        setNpcTypeDirty,
        setStatus,
        setAddNpcTypeOpen,
        setNpcTypeClipboard,
    })

    const {
        handleSelectNpcWuDao,
        handleDeleteNpcWuDaos,
        handleBatchPrefixNpcWuDaoIds,
        handleAddNpcWuDao,
        handleCopyNpcWuDao,
        handlePasteNpcWuDao,
        handleChangeNpcWuDaoForm,
        handleGenerateNpcWuDaoGroup,
    } = useNpcWuDaoHandlers({
        filteredNpcWuDaoRows,
        npcWuDaoRows,
        npcWuDaoMap,
        selectedNpcWuDaoKey,
        selectedNpcWuDaoKeys,
        npcWuDaoSelectionAnchor,
        npcWuDaoClipboard,
        cloneNpcWuDaoEntry,
        setSelectedNpcWuDaoKey,
        setSelectedNpcWuDaoKeys,
        setNpcWuDaoSelectionAnchor,
        setNpcWuDaoMap,
        setNpcWuDaoDirty,
        setStatus,
        setAddNpcWuDaoOpen,
        setNpcWuDaoClipboard,
    })

    function handleChangeNpcWuDaoExtraValue(valueIndex: number, value: number) {
        if (!selectedNpcWuDaoKey || !npcWuDaoMap[selectedNpcWuDaoKey]) return
        setNpcWuDaoMap((prev: Record<string, NpcWuDaoEntry>) => {
            const current = prev[selectedNpcWuDaoKey]
            if (!current) return prev
            const runtimeCurrent = current as NpcWuDaoEntry & { __extraValues?: Record<string, number> }
            const nextExtraValues = { ...(runtimeCurrent.__extraValues ?? {}), [String(valueIndex)]: value }
            return {
                ...prev,
                [selectedNpcWuDaoKey]: {
                    ...runtimeCurrent,
                    __extraValues: nextExtraValues,
                } as NpcWuDaoEntry,
            }
        })
        setNpcWuDaoDirty(true)
    }

    const {
        handleSelectBackpack,
        handleDeleteBackpacks,
        handleBatchPrefixBackpackIds,
        handleAddBackpack,
        handleCopyBackpack,
        handlePasteBackpack,
        handleChangeBackpackForm,
    } = useBackpackHandlers({
        filteredBackpackRows,
        backpackRows,
        backpackMap,
        selectedBackpackKey,
        selectedBackpackKeys,
        backpackSelectionAnchor,
        backpackClipboard,
        cloneBackpackEntry,
        setSelectedBackpackKey,
        setSelectedBackpackKeys,
        setBackpackSelectionAnchor,
        setBackpackMap,
        setBackpackDirty,
        setStatus,
        setAddBackpackOpen,
        setBackpackClipboard,
    })

    const {
        handleSelectWuDao,
        handleDeleteWuDaos,
        handleBatchPrefixWuDaoIds,
        handleAddWuDao,
        handleCopyWuDao,
        handlePasteWuDao,
        handleChangeWuDaoForm,
    } = useWuDaoHandlers({
        filteredWuDaoRows,
        wudaoRows,
        wudaoMap,
        selectedWuDaoKey,
        selectedWuDaoKeys,
        wudaoSelectionAnchor,
        wudaoClipboard,
        cloneWuDaoEntry: entry => ({ ...entry }),
        setSelectedWuDaoKey,
        setSelectedWuDaoKeys,
        setWuDaoSelectionAnchor,
        setWuDaoMap,
        setWuDaoDirty,
        setStatus,
        setAddWuDaoOpen,
        setWuDaoClipboard,
    })

    const {
        handleSelectWuDaoSkill,
        handleDeleteWuDaoSkills,
        handleBatchPrefixWuDaoSkillIds,
        handleAddWuDaoSkill,
        handleCopyWuDaoSkill,
        handlePasteWuDaoSkill,
        handleChangeWuDaoSkillForm,
    } = useWuDaoSkillHandlers({
        filteredWuDaoSkillRows,
        wudaoSkillRows,
        wudaoSkillMap,
        selectedWuDaoSkillKey,
        selectedWuDaoSkillKeys,
        wudaoSkillSelectionAnchor,
        wudaoSkillClipboard,
        cloneWuDaoSkillEntry: entry => ({
            ...entry,
            Type: [...entry.Type],
            seid: [...entry.seid],
            seidData: JSON.parse(JSON.stringify(entry.seidData ?? {})) as Record<string, Record<string, string | number | number[]>>,
        }),
        setSelectedWuDaoSkillKey,
        setSelectedWuDaoSkillKeys,
        setWuDaoSkillSelectionAnchor,
        setWuDaoSkillMap,
        setWuDaoSkillDirty,
        setStatus,
        setAddWuDaoSkillOpen,
        setWuDaoSkillClipboard,
    })

    const {
        handleSelectAffix,
        handleDeleteAffixes,
        handleBatchPrefixAffixIds,
        handleAddAffix,
        handleCopyAffix,
        handlePasteAffix,
        handleChangeAffixForm,
    } = useAffixHandlers({
        filteredAffixRows,
        affixRows,
        affixMap,
        selectedAffixKey,
        selectedAffixKeys,
        affixSelectionAnchor,
        affixClipboard,
        cloneAffixEntry: entry => ({ ...entry }),
        setSelectedAffixKey,
        setSelectedAffixKeys,
        setAffixSelectionAnchor,
        setAffixMap,
        setAffixDirty,
        setStatus,
        setAddAffixOpen,
        setAffixClipboard,
    })

    const {
        handleSelectTalent,
        handleDeleteTalents,
        handleBatchPrefixIds,
        handleAddTalent,
        handleCopyTalent,
        handlePasteTalent,
        handleChangeTalentForm,
    } = useTalentHandlers({
        filteredAvatarRows,
        avatarRows,
        talentMap,
        selectedTalentKey,
        selectedTalentKeys,
        talentSelectionAnchor,
        talentClipboard,
        talentTypeOptions,
        cloneTalentEntry,
        setSelectedTalentKey,
        setSelectedTalentKeys,
        setTalentSelectionAnchor,
        setTalentMap,
        setTalentDirty,
        setStatus,
        setAddTalentOpen,
        setTalentClipboard,
    })

    const {
        handleSelectBuff,
        handleDeleteBuffs,
        handleBatchPrefixBuffIds,
        handleAddBuff,
        handleCopyBuff,
        handlePasteBuff,
        handleChangeBuffForm,
    } = useBuffHandlers({
        filteredBuffRows,
        buffRows,
        buffMap,
        selectedBuffKey,
        selectedBuffKeys,
        buffSelectionAnchor,
        buffClipboard,
        cloneBuffEntry,
        setSelectedBuffKey,
        setSelectedBuffKeys,
        setBuffSelectionAnchor,
        setBuffMap,
        setBuffDirty,
        setStatus,
        setAddBuffOpen,
        setBuffClipboard,
    })

    const {
        handleSelectItem,
        handleDeleteItems,
        handleBatchPrefixItemIds,
        handleAddItem,
        handleCopyItem,
        handlePasteItem,
        handleChangeItemForm,
    } = useItemHandlers({
        filteredItemRows,
        itemRows,
        itemMap,
        selectedItemKey,
        selectedItemKeys,
        itemSelectionAnchor,
        itemClipboard,
        cloneItemEntry,
        setSelectedItemKey,
        setSelectedItemKeys,
        setItemSelectionAnchor,
        setItemMap,
        setItemDirty,
        setStatus,
        setAddItemOpen,
        setItemClipboard,
    })

    const {
        handleSelectSkill,
        handleDeleteSkills,
        handleBatchPrefixSkillIds,
        handleAddSkill,
        handleCopySkill,
        handlePasteSkill,
        handleChangeSkillForm,
        handleGenerateSkillGroup,
        handleGenerateSkillBooksFromSkill,
    } = useSkillHandlers({
        filteredSkillRows,
        skillRows,
        skillMap,
        selectedSkillKey,
        selectedSkillKeys,
        skillSelectionAnchor,
        skillClipboard,
        itemMap,
        cloneSkillEntry,
        setSelectedSkillKey,
        setSelectedSkillKeys,
        setSkillSelectionAnchor,
        setSkillMap,
        setSkillDirty,
        setStatus,
        setAddSkillOpen,
        setSkillClipboard,
        setItemMap,
        setItemDirty,
        uniqueIdSyncEnabled: settingsDraft.uniqueIdSyncEnabled,
        uniqueIdSyncTriggerLevels: settingsDraft.uniqueIdSyncTriggerLevels,
        batchIdChangeKeepOriginal: settingsDraft.batchIdChangeKeepOriginal,
        autoSyncSkillDescrWithAtlas: settingsDraft.autoSyncSkillDescrWithAtlas,
        replaceSkillDescrWithSpecialFormat: settingsDraft.replaceSkillDescrWithSpecialFormat,
    })

    const {
        handleSelectStaticSkill,
        handleDeleteStaticSkills,
        handleBatchPrefixStaticSkillIds,
        handleAddStaticSkill,
        handleCopyStaticSkill,
        handlePasteStaticSkill,
        handleChangeStaticSkillForm,
        handleGenerateStaticSkillGroup,
        handleGenerateSkillBooksFromStaticSkill,
    } = useStaticSkillHandlers({
        filteredStaticSkillRows,
        staticSkillRows,
        staticSkillMap,
        selectedStaticSkillKey,
        selectedStaticSkillKeys,
        staticSkillSelectionAnchor,
        staticSkillClipboard,
        itemMap,
        cloneStaticSkillEntry,
        setSelectedStaticSkillKey,
        setSelectedStaticSkillKeys,
        setStaticSkillSelectionAnchor,
        setStaticSkillMap,
        setStaticSkillDirty,
        setStatus,
        setAddStaticSkillOpen,
        setStaticSkillClipboard,
        setItemMap,
        setItemDirty,
        uniqueIdSyncEnabled: settingsDraft.uniqueIdSyncEnabled,
        uniqueIdSyncTriggerLevels: settingsDraft.uniqueIdSyncTriggerLevels,
        batchIdChangeKeepOriginal: settingsDraft.batchIdChangeKeepOriginal,
        autoSyncSkillDescrWithAtlas: settingsDraft.autoSyncSkillDescrWithAtlas,
        replaceSkillDescrWithSpecialFormat: settingsDraft.replaceSkillDescrWithSpecialFormat,
    })

    useContextMenuBlocker()
    useGlobalShortcuts({
        activeModule,
        isEditableElement,
        onDeleteNpc: handleDeleteNpcs,
        onDeleteNpcImportant: handleDeleteNpcImportants,
        onDeleteNpcType: handleDeleteNpcTypes,
        onDeleteNpcWuDao: handleDeleteNpcWuDaos,
        onDeleteBackpack: handleDeleteBackpacks,
        onDeleteWuDao: handleDeleteWuDaos,
        onDeleteWuDaoSkill: handleDeleteWuDaoSkills,
        onDeleteAffix: handleDeleteAffixes,
        onDeleteTalent: handleDeleteTalents,
        onDeleteBuff: handleDeleteBuffs,
        onDeleteItem: handleDeleteItems,
        onDeleteSkill: handleDeleteSkills,
        onDeleteStaticSkill: handleDeleteStaticSkills,
        onCopyNpc: handleCopyNpc,
        onCopyNpcImportant: handleCopyNpcImportant,
        onCopyNpcType: handleCopyNpcType,
        onCopyNpcWuDao: handleCopyNpcWuDao,
        onCopyBackpack: handleCopyBackpack,
        onCopyWuDao: handleCopyWuDao,
        onCopyWuDaoSkill: handleCopyWuDaoSkill,
        onCopyAffix: handleCopyAffix,
        onCopyTalent: handleCopyTalent,
        onCopyBuff: handleCopyBuff,
        onCopyItem: handleCopyItem,
        onCopySkill: handleCopySkill,
        onCopyStaticSkill: handleCopyStaticSkill,
        onPasteNpc: handlePasteNpc,
        onPasteNpcImportant: handlePasteNpcImportant,
        onPasteNpcType: handlePasteNpcType,
        onPasteNpcWuDao: handlePasteNpcWuDao,
        onPasteBackpack: handlePasteBackpack,
        onPasteWuDao: handlePasteWuDao,
        onPasteWuDaoSkill: handlePasteWuDaoSkill,
        onPasteAffix: handlePasteAffix,
        onPasteTalent: handlePasteTalent,
        onPasteBuff: handlePasteBuff,
        onPasteItem: handlePasteItem,
        onPasteSkill: handlePasteSkill,
        onPasteStaticSkill: handlePasteStaticSkill,
    })

    const { handleClose, handleMinimize, handleStartDragging, handleToggleMaximize } = useWindowActions(appWindow)

    const {
        handleOpenSeidEditor,
        handleOpenSeidPicker,
        handleAddSeidFromPicker,
        handleDeleteSelectedSeid,
        handleMoveSelectedSeid,
        handleChangeSeidProperty,
    } = useSeidHandlers({
        activeModule,
        selectedTalent,
        selectedBuff,
        selectedItem,
        selectedSkill,
        selectedStaticSkill,
        selectedWuDaoSkill,
        selectedTalentKey,
        selectedBuffKey,
        selectedItemKey,
        selectedSkillKey,
        selectedStaticSkillKey,
        selectedWuDaoSkillKey,
        talentMap,
        buffMap,
        itemMap,
        skillMap,
        staticSkillMap,
        wudaoSkillMap,
        activeSeidId,
        seidMetaMap,
        buffSeidMetaMap,
        itemEquipSeidMetaMap,
        itemUseSeidMetaMap,
        skillSeidMetaMap,
        staticSkillSeidMetaMap,
        workspaceRoot,
        projectPath,
        modRootPath,
        preloadMeta,
        loadBuffSeidMeta,
        loadItemSeidMeta,
        loadSkillSeidMeta,
        loadStaticSkillSeidMeta,
        setTalentMap,
        setBuffMap,
        setItemMap,
        setSkillMap,
        setStaticSkillMap,
        setWuDaoSkillMap,
        setTalentDirty,
        setBuffDirty,
        setItemDirty,
        setSkillDirty,
        setStaticSkillDirty,
        setWuDaoSkillDirty,
        setActiveSeidId,
        setSeidEditorOpen,
        setSeidPickerOpen,
        setStatus,
    })

    function parseImportJsonText(jsonText: string) {
        try {
            return JSON.parse(jsonText) as unknown
        } catch (error) {
            setStatus(`导入 JSON 失败: ${String(error)}`)
            return null
        }
    }

    function collectImportRows(raw: unknown, idKeys: string[]) {
        if (!raw || typeof raw !== 'object') return [] as Array<Record<string, unknown>>
        if (Array.isArray(raw)) {
            return raw.filter(item => item && typeof item === 'object') as Array<Record<string, unknown>>
        }
        const one = raw as Record<string, unknown>
        const hasId = idKeys.some(key => Number.isFinite(Number(one[key])))
        if (hasId) return [one]
        return Object.values(one).filter(item => item && typeof item === 'object') as Array<Record<string, unknown>>
    }

    function handleImportAffixJson(jsonText: string) {
        const raw = parseImportJsonText(jsonText)
        if (!raw) return
        const rows = collectImportRows(raw, ['id'])
            .map(item => item as AffixEntry)
            .filter(item => Number.isFinite(Number(item.id)) && Number(item.id) > 0)
            .map(item => cloneAffixEntry(item))
        if (rows.length === 0) return setStatus('未识别到有效词缀数据。')
        setAffixClipboard(rows)
        handlePasteAffix()
        setStatus(`已导入词缀 JSON：${rows.length} 条。`)
    }

    function handleImportNpcJson(jsonText: string) {
        const raw = parseImportJsonText(jsonText)
        if (!raw) return
        const rows = collectImportRows(raw, ['id'])
            .map(item => item as NpcEntry)
            .filter(item => Number.isFinite(Number(item.id)) && Number(item.id) > 0)
            .map(item => ({
                ...item,
                LingGen: Array.isArray(item.LingGen)
                    ? item.LingGen.map(value => Number(value)).filter(value => Number.isFinite(value))
                    : [],
                skills: Array.isArray(item.skills) ? item.skills.map(value => Number(value)).filter(value => Number.isFinite(value)) : [],
                staticSkills: Array.isArray(item.staticSkills)
                    ? item.staticSkills.map(value => Number(value)).filter(value => Number.isFinite(value))
                    : [],
                paimaifenzu: Array.isArray(item.paimaifenzu)
                    ? item.paimaifenzu.map(value => Number(value)).filter(value => Number.isFinite(value))
                    : [],
            }))
        if (rows.length === 0) return setStatus('未识别到有效非实例NPC数据。')
        setNpcClipboard(rows)
        handlePasteNpc()
        setStatus(`已导入非实例NPC JSON：${rows.length} 条。`)
    }

    function handleImportNpcImportantJson(jsonText: string) {
        const raw = parseImportJsonText(jsonText)
        if (!raw) return
        const rows = collectImportRows(raw, ['id'])
            .map(item => item as NpcImportantEntry)
            .filter(item => Number.isFinite(Number(item.id)) && Number(item.id) > 0)
            .map(item => cloneNpcImportantEntry(item))
        if (rows.length === 0) return setStatus('未识别到有效重要NPC数据。')
        setNpcImportantClipboard(rows)
        handlePasteNpcImportant()
        setStatus(`已导入重要NPC JSON：${rows.length} 条。`)
    }

    function handleImportNpcTypeJson(jsonText: string) {
        const raw = parseImportJsonText(jsonText)
        if (!raw) return
        const rows = collectImportRows(raw, ['id'])
            .map(item => item as NpcTypeEntry)
            .filter(item => Number.isFinite(Number(item.id)) && Number(item.id) > 0)
            .map(item =>
                cloneNpcTypeEntry({
                    ...item,
                    id: Number(item.id),
                    Type: Number(item.Type ?? 0),
                    LiuPai: Number(item.LiuPai ?? 0),
                    MengPai: Number(item.MengPai ?? 0),
                    Level: Number(item.Level ?? 0),
                    skills: Array.isArray(item.skills)
                        ? item.skills.map(value => Number(value)).filter(value => Number.isFinite(value))
                        : [],
                    staticSkills: Array.isArray(item.staticSkills)
                        ? item.staticSkills.map(value => Number(value)).filter(value => Number.isFinite(value))
                        : [],
                    yuanying: Number(item.yuanying ?? 0),
                    HuaShenLingYu: Number(item.HuaShenLingYu ?? 0),
                    LingGen: Array.isArray(item.LingGen)
                        ? item.LingGen.map(value => Number(value)).filter(value => Number.isFinite(value))
                        : [],
                    wudaoType: Number(item.wudaoType ?? 0),
                    NPCTag: Array.isArray(item.NPCTag)
                        ? item.NPCTag.map(value => Number(value)).filter(value => Number.isFinite(value))
                        : [],
                    canjiaPaiMai: Number(item.canjiaPaiMai ?? 0),
                    paimaifenzu: Array.isArray(item.paimaifenzu)
                        ? item.paimaifenzu.map(value => Number(value)).filter(value => Number.isFinite(value))
                        : [],
                    AvatarType: Number(item.AvatarType ?? 0),
                    XinQuType: Number(item.XinQuType ?? 0),
                    equipWeapon: Array.isArray(item.equipWeapon)
                        ? item.equipWeapon.map(value => Number(value)).filter(value => Number.isFinite(value))
                        : [],
                    equipClothing: Array.isArray(item.equipClothing)
                        ? item.equipClothing.map(value => Number(value)).filter(value => Number.isFinite(value))
                        : [],
                    equipRing: Array.isArray(item.equipRing)
                        ? item.equipRing.map(value => Number(value)).filter(value => Number.isFinite(value))
                        : [],
                    JinDanType: Array.isArray(item.JinDanType)
                        ? item.JinDanType.map(value => Number(value)).filter(value => Number.isFinite(value))
                        : [],
                    FirstName: String(item.FirstName ?? ''),
                    ShiLi: Array.isArray(item.ShiLi) ? item.ShiLi.map(value => Number(value)).filter(value => Number.isFinite(value)) : [],
                    AttackType: Number(item.AttackType ?? 0),
                    DefenseType: Number(item.DefenseType ?? 0),
                })
            )
        if (rows.length === 0) return setStatus('未识别到有效 NPC类型 数据。')
        setNpcTypeClipboard(rows)
        handlePasteNpcType()
        setStatus(`已导入 NPC类型 JSON：${rows.length} 条。`)
    }

    function handleImportBackpackJson(jsonText: string) {
        const raw = parseImportJsonText(jsonText)
        if (!raw) return
        const rows = collectImportRows(raw, ['id'])
            .map(item => item as BackpackEntry)
            .filter(item => Number.isFinite(Number(item.id)) && Number(item.id) > 0)
            .map(item =>
                cloneBackpackEntry({
                    ...item,
                    ItemID: Array.isArray(item.ItemID)
                        ? item.ItemID.map(value => Number(value)).filter(value => Number.isFinite(value))
                        : [],
                    randomNum: Array.isArray(item.randomNum)
                        ? item.randomNum.map(value => Number(value)).filter(value => Number.isFinite(value))
                        : [],
                })
            )
        if (rows.length === 0) return setStatus('未识别到有效背包数据。')
        setBackpackClipboard(rows)
        handlePasteBackpack()
        setStatus(`已导入背包 JSON：${rows.length} 条。`)
    }

    function handleImportBuffJson(jsonText: string) {
        const raw = parseImportJsonText(jsonText)
        if (!raw) return
        const rows = collectImportRows(raw, ['buffid'])
            .map(item => item as BuffEntry)
            .filter(item => Number.isFinite(Number(item.buffid)) && Number(item.buffid) > 0)
            .map(item => cloneBuffEntry(item))
        if (rows.length === 0) return setStatus('未识别到有效 Buff 数据。')
        setBuffClipboard(rows)
        handlePasteBuff()
        setStatus(`已导入 Buff JSON：${rows.length} 条。`)
    }

    function handleImportWuDaoJson(jsonText: string) {
        const raw = parseImportJsonText(jsonText)
        if (!raw) return
        const rows = collectImportRows(raw, ['id'])
            .map(item => item as WuDaoEntry)
            .filter(item => Number.isFinite(Number(item.id)) && Number(item.id) > 0)
            .map(item => ({ ...item }))
        if (rows.length === 0) return setStatus('未识别到有效悟道数据。')
        setWuDaoClipboard(rows)
        handlePasteWuDao()
        setStatus(`已导入悟道 JSON：${rows.length} 条。`)
    }

    function handleImportNpcWuDaoJson(jsonText: string) {
        const raw = parseImportJsonText(jsonText)
        if (!raw) return
        const rows = collectImportRows(raw, ['id'])
            .map(item => item as NpcWuDaoEntry)
            .filter(item => Number.isFinite(Number(item.id)) && Number(item.id) > 0)
            .map(item => {
                const runtimeItem = {
                    id: Number(item.id),
                    Type: Number(item.Type ?? 0),
                    lv: Number(item.lv ?? 0),
                    wudaoID: Array.isArray(item.wudaoID)
                        ? item.wudaoID.map(value => Number(value)).filter(value => Number.isFinite(value) && value > 0)
                        : [],
                    value1: Number(item.value1 ?? 0),
                    value2: Number(item.value2 ?? 0),
                    value3: Number(item.value3 ?? 0),
                    value4: Number(item.value4 ?? 0),
                    value5: Number(item.value5 ?? 0),
                    value6: Number(item.value6 ?? 0),
                    value7: Number(item.value7 ?? 0),
                    value8: Number(item.value8 ?? 0),
                    value9: Number(item.value9 ?? 0),
                    value10: Number(item.value10 ?? 0),
                    value11: Number(item.value11 ?? 0),
                    value12: Number(item.value12 ?? 0),
                    __extraValues: extractNpcWuDaoExtraValues(item as unknown as Record<string, unknown>),
                } as NpcWuDaoEntry & { __extraValues?: Record<string, number> }
                return cloneNpcWuDaoEntry(runtimeItem)
            })
        if (rows.length === 0) return setStatus('未识别到有效 NPC 悟道数据。')
        setNpcWuDaoClipboard(rows)
        handlePasteNpcWuDao()
        setStatus(`已导入 NPC 悟道 JSON：${rows.length} 条。`)
    }

    function handleImportWuDaoSkillJson(jsonText: string) {
        const raw = parseImportJsonText(jsonText)
        if (!raw) return
        const rows = collectImportRows(raw, ['id'])
            .map(item => item as WuDaoSkillEntry)
            .filter(item => Number.isFinite(Number(item.id)) && Number(item.id) > 0)
            .map(item => ({
                ...item,
                Type: Array.isArray(item.Type) ? item.Type.map(value => Number(value)).filter(value => Number.isFinite(value)) : [],
                seid: Array.isArray(item.seid) ? item.seid.map(value => Number(value)).filter(value => Number.isFinite(value)) : [],
                seidData: item.seidData && typeof item.seidData === 'object' ? item.seidData : {},
            }))
        if (rows.length === 0) return setStatus('未识别到有效悟道技能数据。')
        setWuDaoSkillClipboard(rows)
        handlePasteWuDaoSkill()
        setStatus(`已导入悟道技能 JSON：${rows.length} 条。`)
    }

    function handleImportItemJson(jsonText: string) {
        const raw = parseImportJsonText(jsonText)
        if (!raw) return
        const rows = collectImportRows(raw, ['id'])
            .map(item => item as ItemEntry)
            .filter(item => Number.isFinite(Number(item.id)) && Number(item.id) > 0)
            .map(item => cloneItemEntry(item))
        if (rows.length === 0) return setStatus('未识别到有效物品数据。')
        setItemClipboard(rows)
        handlePasteItem()
        setStatus(`已导入物品 JSON：${rows.length} 条。`)
    }

    function handleImportSkillJson(jsonText: string) {
        const raw = parseImportJsonText(jsonText)
        if (!raw) return
        const rows = collectImportRows(raw, ['id'])
            .map(item => item as SkillEntry)
            .filter(item => Number.isFinite(Number(item.id)) && Number(item.id) > 0)
            .map(item => cloneSkillEntry(item))
        if (rows.length === 0) return setStatus('未识别到有效神通数据。')
        setSkillClipboard(rows)
        handlePasteSkill()
        setStatus(`已导入神通 JSON：${rows.length} 条。`)
    }

    function handleImportStaticSkillJson(jsonText: string) {
        const raw = parseImportJsonText(jsonText)
        if (!raw) return
        const rows = collectImportRows(raw, ['id'])
            .map(item => item as StaticSkillEntry)
            .filter(item => Number.isFinite(Number(item.id)) && Number(item.id) > 0)
            .map(item => cloneStaticSkillEntry(item))
        if (rows.length === 0) return setStatus('未识别到有效功法数据。')
        setStaticSkillClipboard(rows)
        handlePasteStaticSkill()
        setStatus(`已导入功法 JSON：${rows.length} 条。`)
    }

    const infoPanelPresenter = useInfoPanelPresenter({
        activeModule,
        setAddNpcOpen,
        setAddNpcImportantOpen,
        setAddNpcTypeOpen,
        setAddNpcWuDaoOpen,
        setAddBackpackOpen,
        setAddWuDaoOpen,
        setAddWuDaoSkillOpen,
        setAddTalentOpen,
        setAddAffixOpen,
        setAddBuffOpen,
        setAddItemOpen,
        setAddSkillOpen,
        setAddStaticSkillOpen,
        handleBatchPrefixNpcIds,
        handleBatchPrefixNpcImportantIds,
        handleBatchPrefixNpcTypeIds,
        handleBatchPrefixNpcWuDaoIds,
        handleBatchPrefixBackpackIds,
        handleBatchPrefixWuDaoIds,
        handleBatchPrefixWuDaoSkillIds,
        handleBatchPrefixAffixIds,
        handleBatchPrefixIds,
        handleBatchPrefixBuffIds,
        handleBatchPrefixItemIds,
        handleBatchPrefixSkillIds,
        handleBatchPrefixStaticSkillIds,
        handleDeleteNpcs,
        handleDeleteNpcImportants,
        handleDeleteNpcTypes,
        handleDeleteNpcWuDaos,
        handleDeleteBackpacks,
        handleDeleteWuDaos,
        handleDeleteWuDaoSkills,
        handleDeleteAffixes,
        handleDeleteTalents,
        handleDeleteBuffs,
        handleDeleteItems,
        handleDeleteSkills,
        handleDeleteStaticSkills,
        handleCopyNpc,
        handleCopyNpcImportant,
        handleCopyNpcType,
        handleCopyNpcWuDao,
        handleCopyBackpack,
        handleCopyWuDao,
        handleCopyWuDaoSkill,
        handleCopyAffix,
        handleCopyTalent,
        handleCopyBuff,
        handleCopyItem,
        handleCopySkill,
        handleCopyStaticSkill,
        handlePasteNpc,
        handlePasteNpcImportant,
        handlePasteNpcType,
        handlePasteNpcWuDao,
        handlePasteBackpack,
        handlePasteWuDao,
        handlePasteWuDaoSkill,
        handlePasteAffix,
        handlePasteTalent,
        handlePasteBuff,
        handlePasteItem,
        handlePasteSkill,
        handlePasteStaticSkill,
        handleImportNpc: handleImportNpcJson,
        handleImportNpcImportant: handleImportNpcImportantJson,
        handleImportNpcType: handleImportNpcTypeJson,
        handleImportNpcWuDao: handleImportNpcWuDaoJson,
        handleImportBackpack: handleImportBackpackJson,
        handleImportWuDao: handleImportWuDaoJson,
        handleImportWuDaoSkill: handleImportWuDaoSkillJson,
        handleImportAffix: handleImportAffixJson,
        handleImportTalent: () => setStatus('天赋模块暂不支持该入口导入，请使用对应 JSON 文件。'),
        handleImportBuff: handleImportBuffJson,
        handleImportItem: handleImportItemJson,
        handleImportSkill: handleImportSkillJson,
        handleImportStaticSkill: handleImportStaticSkillJson,
        handleGenerateNpcTypeGroup,
        handleGenerateNpcWuDaoGroup,
        handleGenerateSkillGroup,
        handleGenerateStaticSkillGroup,
        handleGenerateSkillBooksFromSkill,
        handleGenerateSkillBooksFromStaticSkill,
        handleSelectNpc,
        handleSelectNpcImportant,
        handleSelectNpcType,
        handleSelectNpcWuDao,
        handleSelectBackpack,
        handleSelectWuDao,
        handleSelectWuDaoSkill,
        handleSelectAffix,
        handleSelectTalent,
        handleSelectBuff,
        handleSelectItem,
        handleSelectSkill,
        handleSelectStaticSkill,
        filteredNpcRows,
        filteredNpcImportantRows,
        filteredNpcTypeRows,
        filteredNpcWuDaoRows,
        filteredBackpackRows,
        filteredWuDaoRows,
        filteredWuDaoSkillRows,
        filteredAffixRows,
        filteredAvatarRows,
        filteredBuffRows,
        filteredItemRows,
        filteredSkillRows,
        filteredStaticSkillRows,
        selectedNpcKey,
        selectedNpcImportantKey,
        selectedNpcTypeKey,
        selectedNpcWuDaoKey,
        selectedBackpackKey,
        selectedWuDaoKey,
        selectedWuDaoSkillKey,
        selectedAffixKey,
        selectedTalentKey,
        selectedBuffKey,
        selectedItemKey,
        selectedSkillKey,
        selectedStaticSkillKey,
        selectedNpcKeys,
        selectedNpcImportantKeys,
        selectedNpcTypeKeys,
        selectedNpcWuDaoKeys,
        selectedBackpackKeys,
        selectedWuDaoKeys,
        selectedWuDaoSkillKeys,
        selectedAffixKeys,
        selectedTalentKeys,
        selectedBuffKeys,
        selectedItemKeys,
        selectedSkillKeys,
        selectedStaticSkillKeys,
        npcTypeMap,
        npcWuDaoMap,
        skillMap,
        staticSkillMap,
    })

    async function handleRenameModRoot(newName: string) {
        const targetPath = renameTargetPath || modRootPath
        if (!newName || !targetPath) return
        try {
            const nextPath = await renameModFolder(targetPath, newName)
            if (targetPath === modRootPath) {
                setModRootPath(nextPath)
            }
            const siblingFolders = await collectSiblingModFolders(nextPath)
            setModRootFolders(siblingFolders)
            setRenameTargetPath('')
            setRenameOpen(false)
            setStatus(STATUS_MESSAGES.renamedModRoot(pickLeafName(nextPath)))
        } catch (error) {
            setStatus(statusError('重命名', error))
        }
    }

    async function handleDeleteModRoot(targetPath?: string) {
        setContextMenu({ open: false, x: 0, y: 0, kind: 'root', targetPath: '' })
        const pathToDelete = targetPath || modRootPath
        if (!pathToDelete) return
        try {
            await deleteModFolder(pathToDelete)
            const siblings = await collectSiblingModFolders(modRootPath)
            const stillExists = siblings.some(item => item.path === modRootPath)
            const fallback = siblings[0]?.path || inferModRootPath(projectPath)
            setModRootFolders(siblings)
            if (pathToDelete === modRootPath || !stillExists) {
                await handleSelectModRoot(fallback)
            }
            setStatus(STATUS_MESSAGES.deletedFolder(pickLeafName(pathToDelete)))
        } catch (error) {
            setStatus(statusError('删除', error))
        }
    }

    const { handleSaveProject } = useProjectSave({
        projectPath,
        modRootPath,
        moduleConfigPath,
        rawConfigObject,
        configForm,
        preservedSettings,
        npcMap,
        npcPath,
        npcImportantMap,
        npcImportantPath,
        npcTypeMap,
        npcTypePath,
        npcTypeCachePath,
        npcWuDaoMap,
        npcWuDaoPath,
        backpackMap,
        backpackPath,
        wudaoMap,
        wudaoPath,
        wudaoSkillMap,
        wudaoSkillPath,
        talentPath,
        createAvatarPath,
        talentMap,
        affixMap,
        affixPath,
        buffMap,
        buffSeidSkipJsonIds: settingsDraft.buffSeidSkipJsonIds,
        itemMap,
        skillMap,
        skillSeidSkipJsonIds: settingsDraft.skillSeidSkipJsonIds,
        staticSkillMap,
        staticSkillPath,
        buffDirPath,
        itemDirPath,
        skillDirPath,
        loadProjectEntries,
        saveFilePayload,
        deleteFilePayload,
        setConfigDirty,
        setNpcDirty,
        setNpcImportantDirty,
        setNpcTypeDirty,
        setNpcWuDaoDirty,
        setBackpackDirty,
        setWuDaoDirty,
        setWuDaoSkillDirty,
        setAffixDirty,
        setTalentDirty,
        setBuffDirty,
        setItemDirty,
        setSkillDirty,
        setStaticSkillDirty,
        setNpcCachePath,
        setNpcImportantCachePath,
        setNpcTypeCachePath,
        setNpcWuDaoCachePath,
        setBackpackCachePath,
        setAffixCachePath,
        setWuDaoSkillCachePath,
        setTalentCachePath,
        setBuffCachePath,
        setItemCachePath,
        setSkillCachePath,
        setStaticSkillCachePath,
        setStatus,
        onProjectSavingChange: setProjectSaving,
    })

    const hasUnsavedChanges =
        configDirty ||
        npcDirty ||
        npcImportantDirty ||
        npcTypeDirty ||
        npcWuDaoDirty ||
        backpackDirty ||
        wudaoDirty ||
        wudaoSkillDirty ||
        affixDirty ||
        talentDirty ||
        buffDirty ||
        itemDirty ||
        skillDirty ||
        staticSkillDirty

    useEffect(() => {
        if (!projectPath || !modRootPath) return
        if (cacheRestoredRootRef.current === modRootPath) return
        cacheRestoredRootRef.current = modRootPath
        let active = true
        ;(async () => {
            try {
                const baseDir = await appDataDir()
                const cachePath = buildDraftCachePath(baseDir, modRootPath)
                const cached = await loadDraftCache({ readFilePayload, saveFilePayload }, cachePath)
                if (!active || !cached || !cached.unsaved) return
                if (cached.projectPath !== projectPath || cached.modRootPath !== modRootPath || !cached.data) return
                const shouldRestoreObjectMap = (value: unknown, currentSize: number) => {
                    if (!value || typeof value !== 'object' || Array.isArray(value)) return currentSize === 0
                    return Object.keys(value as Record<string, unknown>).length > 0 || currentSize === 0
                }
                setRawConfigObject(cached.data.rawConfigObject)
                setConfigForm(cached.data.configForm)
                setPreservedSettings(cached.data.preservedSettings)
                if ('npcMap' in cached.data) setNpcMap((cached.data.npcMap as Record<string, NpcEntry> | undefined) ?? {})
                if ('npcImportantMap' in cached.data) {
                    setNpcImportantMap((cached.data.npcImportantMap as Record<string, NpcImportantEntry> | undefined) ?? {})
                }
                const shouldRestoreNpcTypeMap =
                    'npcTypeMap' in cached.data && shouldRestoreObjectMap(cached.data.npcTypeMap, Object.keys(npcTypeMap).length)
                if (shouldRestoreNpcTypeMap) {
                    setNpcTypeMap((cached.data.npcTypeMap as Record<string, NpcTypeEntry> | undefined) ?? {})
                }
                if ('npcWuDaoMap' in cached.data)
                    setNpcWuDaoMap((cached.data.npcWuDaoMap as Record<string, NpcWuDaoEntry> | undefined) ?? {})
                if ('backpackMap' in cached.data)
                    setBackpackMap((cached.data.backpackMap as Record<string, BackpackEntry> | undefined) ?? {})
                if ('wudaoMap' in cached.data) setWuDaoMap((cached.data.wudaoMap as Record<string, WuDaoEntry> | undefined) ?? {})
                if ('wudaoSkillMap' in cached.data) {
                    setWuDaoSkillMap((cached.data.wudaoSkillMap as Record<string, WuDaoSkillEntry> | undefined) ?? {})
                }
                if ('affixMap' in cached.data) setAffixMap((cached.data.affixMap as Record<string, AffixEntry> | undefined) ?? {})
                if ('talentMap' in cached.data) {
                    setTalentMap((cached.data.talentMap as Record<string, CreateAvatarEntry> | undefined) ?? {})
                }
                if ('buffMap' in cached.data) setBuffMap((cached.data.buffMap as Record<string, BuffEntry> | undefined) ?? {})
                if ('itemMap' in cached.data) setItemMap((cached.data.itemMap as Record<string, ItemEntry> | undefined) ?? {})
                if ('skillMap' in cached.data) setSkillMap((cached.data.skillMap as Record<string, SkillEntry> | undefined) ?? {})
                if ('staticSkillMap' in cached.data) {
                    setStaticSkillMap((cached.data.staticSkillMap as Record<string, StaticSkillEntry> | undefined) ?? {})
                }
                setConfigDirty('rawConfigObject' in cached.data || 'configForm' in cached.data || 'preservedSettings' in cached.data)
                setNpcDirty('npcMap' in cached.data)
                setNpcImportantDirty('npcImportantMap' in cached.data)
                setNpcTypeDirty(shouldRestoreNpcTypeMap)
                setNpcWuDaoDirty('npcWuDaoMap' in cached.data)
                setBackpackDirty('backpackMap' in cached.data)
                setWuDaoDirty('wudaoMap' in cached.data)
                setWuDaoSkillDirty('wudaoSkillMap' in cached.data)
                setAffixDirty('affixMap' in cached.data)
                setTalentDirty('talentMap' in cached.data)
                setBuffDirty('buffMap' in cached.data)
                setItemDirty('itemMap' in cached.data)
                setSkillDirty('skillMap' in cached.data)
                setStaticSkillDirty('staticSkillMap' in cached.data)
                setStatus('已恢复未保存缓存数据，请尽快保存项目。')
                void logWarn('restored unsaved draft cache for current project')
            } catch {
                // ignore cache restore failures
            }
        })()
        return () => {
            active = false
        }
    }, [projectPath, modRootPath, npcTypeMap, readFilePayload, saveFilePayload])

    useEffect(() => {
        if (!settingsDraft.autoSaveEnabled) return
        if (!projectPath || !modRootPath) return
        const intervalMs = Math.max(5, Number(settingsDraft.autoSaveIntervalSeconds || 0)) * 1000
        const timer = window.setInterval(() => {
            if (autoSaveRunningRef.current) return
            if (!hasUnsavedChanges) return
            autoSaveRunningRef.current = true
            void handleSaveProject()
                .catch(error => {
                    setStatus(statusError('自动保存', error))
                    void logError(`auto save failed: ${String(error)}`)
                })
                .finally(() => {
                    autoSaveRunningRef.current = false
                })
        }, intervalMs)
        return () => {
            window.clearInterval(timer)
        }
    }, [
        settingsDraft.autoSaveEnabled,
        settingsDraft.autoSaveIntervalSeconds,
        projectPath,
        modRootPath,
        hasUnsavedChanges,
        handleSaveProject,
    ])

    useEffect(() => {
        if (!projectPath || !modRootPath) return
        const intervalMs = 15 * 1000
        const tick = async () => {
            if (cacheSaveRunningRef.current) return
            if (!hasUnsavedChanges && lastCacheUnsavedRef.current === false) return
            cacheSaveRunningRef.current = true
            try {
                const baseDir = await appDataDir()
                const cachePath = buildDraftCachePath(baseDir, modRootPath)
                const payload = hasUnsavedChanges
                    ? {
                          version: 1 as const,
                          writtenAt: new Date().toISOString(),
                          unsaved: true,
                          projectPath,
                          modRootPath,
                          data: {
                              rawConfigObject,
                              configForm,
                              preservedSettings,
                              npcMap,
                              npcImportantMap,
                              npcTypeMap,
                              npcWuDaoMap,
                              backpackMap,
                              wudaoMap,
                              wudaoSkillMap,
                              affixMap,
                              talentMap,
                              buffMap,
                              itemMap,
                              skillMap,
                              staticSkillMap,
                          },
                      }
                    : {
                          version: 1 as const,
                          writtenAt: new Date().toISOString(),
                          unsaved: false,
                          projectPath,
                          modRootPath,
                      }
                await saveDraftCache({ readFilePayload, saveFilePayload }, cachePath, payload)
                lastCacheUnsavedRef.current = hasUnsavedChanges
            } catch {
                // ignore cache write failures
            } finally {
                cacheSaveRunningRef.current = false
            }
        }
        void tick()
        const timer = window.setInterval(() => {
            void tick()
        }, intervalMs)
        return () => {
            window.clearInterval(timer)
        }
    }, [
        projectPath,
        modRootPath,
        hasUnsavedChanges,
        rawConfigObject,
        configForm,
        preservedSettings,
        npcMap,
        npcImportantMap,
        npcTypeMap,
        npcWuDaoMap,
        backpackMap,
        wudaoMap,
        wudaoSkillMap,
        affixMap,
        talentMap,
        buffMap,
        itemMap,
        skillMap,
        staticSkillMap,
        readFilePayload,
        saveFilePayload,
    ])

    return (
        <div className="app-shell" data-active-path={activePath} data-status={status}>
            <AppTopBarMenu
                configDirty={hasUnsavedChanges}
                onClose={handleClose}
                onCreateProject={() => {
                    setCreateMode('full')
                    setNewProjectName('')
                    setNewModName('')
                    setCreateOpen(true)
                }}
                onMinimize={handleMinimize}
                onOpenProject={handleOpenProject}
                onOpenSettings={() => {
                    void handleSelectModuleFromSidebar('settings')
                }}
                onSaveProject={handleSaveProject}
                onStartDragging={handleStartDragging}
                onToggleMaximize={handleToggleMaximize}
            />

            <CreateProjectModal
                modName={newModName}
                onChangeModName={setNewModName}
                onChangeProjectName={setNewProjectName}
                onClose={() => {
                    setCreateOpen(false)
                    setCreateMode('full')
                    setNewProjectName('')
                    setNewModName('')
                }}
                onSubmit={handleCreateProject}
                open={createOpen}
                projectName={newProjectName}
                title={createMode === 'quick' ? '新增mod目录' : '新建项目'}
                showProjectName={createMode === 'full'}
            />
            <RenameFolderModal
                initialName={modFolderName}
                onClose={() => {
                    setRenameOpen(false)
                    setRenameTargetPath('')
                }}
                onSubmit={handleRenameModRoot}
                open={renameOpen}
            />
            <AddTalentModal open={addTalentOpen} onClose={() => setAddTalentOpen(false)} onSubmit={handleAddTalent} />
            <AddTalentModal
                open={addNpcOpen}
                onClose={() => setAddNpcOpen(false)}
                onSubmit={handleAddNpc}
                title="新增非实例NPC"
                confirmText="确认新增"
                placeholder="例如: 10302"
            />
            <AddTalentModal
                open={addNpcImportantOpen}
                onClose={() => setAddNpcImportantOpen(false)}
                onSubmit={handleAddNpcImportant}
                title="新增重要NPC"
                confirmText="确认新增"
                placeholder="例如: 117"
            />
            <AddTalentModal
                open={addNpcTypeOpen}
                onClose={() => setAddNpcTypeOpen(false)}
                onSubmit={handleAddNpcType}
                title="新增NPC类型"
                confirmText="确认新增"
                placeholder="例如: 1"
            />
            <AddTalentModal
                open={addNpcWuDaoOpen}
                onClose={() => setAddNpcWuDaoOpen(false)}
                onSubmit={handleAddNpcWuDao}
                title="新增NPC悟道"
                confirmText="确认新增"
                placeholder="例如: 1"
            />
            <AddTalentModal
                open={addBackpackOpen}
                onClose={() => setAddBackpackOpen(false)}
                onSubmit={handleAddBackpack}
                title="新增背包"
                confirmText="确认新增"
                placeholder="例如: 1600"
            />
            <AddTalentModal
                open={addWuDaoOpen}
                onClose={() => setAddWuDaoOpen(false)}
                onSubmit={handleAddWuDao}
                title="新增悟道"
                confirmText="确认新增"
                placeholder="例如: 28"
            />
            <AddTalentModal
                open={addWuDaoSkillOpen}
                onClose={() => setAddWuDaoSkillOpen(false)}
                onSubmit={handleAddWuDaoSkill}
                title="新增悟道技能"
                confirmText="确认新增"
                placeholder="例如: 2801"
            />
            <AddTalentModal
                open={addAffixOpen}
                onClose={() => setAddAffixOpen(false)}
                onSubmit={handleAddAffix}
                title="新增词缀"
                confirmText="确认新增"
                placeholder="例如: 70001"
            />
            <AddTalentModal
                open={addBuffOpen}
                onClose={() => setAddBuffOpen(false)}
                onSubmit={handleAddBuff}
                title="新增 Buff"
                confirmText="确认新增"
                placeholder="例如: 52000"
            />
            <AddTalentModal
                open={addItemOpen}
                onClose={() => setAddItemOpen(false)}
                onSubmit={handleAddItem}
                title="新增物品"
                confirmText="确认新增"
                placeholder="例如: 52500"
            />
            <AddTalentModal
                open={addSkillOpen}
                onClose={() => setAddSkillOpen(false)}
                onSubmit={handleAddSkill}
                title="新增神通"
                confirmText="确认新增"
                placeholder="例如: 250000"
            />
            <AddTalentModal
                open={addStaticSkillOpen}
                onClose={() => setAddStaticSkillOpen(false)}
                onSubmit={handleAddStaticSkill}
                title="新增功法"
                confirmText="确认新增"
                placeholder="例如: 253000"
            />
            <SeidEditorModal
                activeSeidId={activeSeidId}
                drawerOptionsMap={drawerOptionsMap}
                metaMap={activeSeidMetaMap}
                onChangeProperty={handleChangeSeidProperty}
                onClose={() => setSeidEditorOpen(false)}
                onDeleteSelected={handleDeleteSelectedSeid}
                onMoveDown={() => handleMoveSelectedSeid('down')}
                onMoveUp={() => handleMoveSelectedSeid('up')}
                onRefreshDrawerOptions={handleRefreshSeidDrawerOptions}
                onRequestAdd={handleOpenSeidPicker}
                onSelectSeid={setActiveSeidId}
                open={seidEditorOpen}
                seidData={selectedSeidData}
                seidIds={selectedSeidIds}
            />
            <SeidPickerModal
                items={seidPickerItems}
                onClose={() => setSeidPickerOpen(false)}
                onPick={handleAddSeidFromPicker}
                open={seidPickerOpen}
                selectedIds={selectedSeidIds}
            />
            <FolderContextMenu
                onClose={() => setContextMenu({ open: false, x: 0, y: 0, kind: 'root', targetPath: '' })}
                onCreateProject={
                    contextMenu.kind === 'blank'
                        ? () => {
                              setCreateMode('quick')
                              setNewProjectName('')
                              setNewModName('')
                              setCreateOpen(true)
                          }
                        : undefined
                }
                onDelete={contextMenu.kind === 'root' ? () => handleDeleteModRoot(contextMenu.targetPath) : undefined}
                onRename={
                    contextMenu.kind === 'root'
                        ? () => {
                              setRenameTargetPath(contextMenu.targetPath || modRootPath)
                              setRenameOpen(true)
                          }
                        : undefined
                }
                open={contextMenu.open}
                x={contextMenu.x}
                y={contextMenu.y}
            />

            <main className={`workspace ${activeModule === 'project-config' ? 'workspace-config' : ''}`}>
                <ModuleSidebar
                    activeModule={activeModule}
                    activeRootPath={modRootPath}
                    expandedRootPaths={expandedRootPaths}
                    onBlankContextMenu={(x, y) => setContextMenu({ open: true, x, y, kind: 'blank', targetPath: '' })}
                    onRootContextMenu={(x, y, path) => setContextMenu({ open: true, x, y, kind: 'root', targetPath: path })}
                    onSelect={handleSelectModuleFromSidebar}
                    onSelectRoot={handleSelectModRoot}
                    onToggleExpanded={toggleExpandedRoot}
                    rootFolders={rootFoldersForSidebar}
                />

                {activeModule && activeModule !== 'project-config' && activeModule !== 'settings' ? (
                    <InfoPanel
                        activeModule={activeModule}
                        searchText={tableSearchText}
                        onSearchTextChange={setTableSearchText}
                        {...infoPanelPresenter}
                    />
                ) : null}

                {activeModule ? (
                    <EditorPanel
                        activeModule={activeModule}
                        activeModuleLabel={activeModuleLabel}
                        configForm={configForm}
                        onChangeConfigForm={patch => {
                            setConfigForm(prev => ({ ...prev, ...patch }))
                            setConfigDirty(true)
                        }}
                        npcForm={selectedNpc}
                        onChangeNpcForm={handleChangeNpcForm}
                        npcImportantForm={selectedNpcImportant}
                        onChangeNpcImportantForm={handleChangeNpcImportantForm}
                        npcSkillOptions={npcSkillDrawerOptions}
                        npcStaticSkillOptions={npcStaticSkillDrawerOptions}
                        npcItemTypeOptions={itemTypeOptions}
                        npcTypeForm={selectedNpcType}
                        onChangeNpcTypeForm={handleChangeNpcTypeForm}
                        npcWuDaoForm={selectedNpcWuDao}
                        onChangeNpcWuDaoForm={handleChangeNpcWuDaoForm}
                        npcWuDaoSkillOptions={npcWuDaoSkillOptions}
                        npcWuDaoExtraValueMappings={settingsDraft.npcWuDaoExtraValues}
                        npcWuDaoExtraValues={selectedNpcWuDaoExtraValues}
                        onChangeNpcWuDaoExtraValue={handleChangeNpcWuDaoExtraValue}
                        backpackForm={selectedBackpack}
                        onChangeBackpackForm={handleChangeBackpackForm}
                        backpackNpcOptions={backpackNpcOptions}
                        backpackItemOptions={backpackItemOptions}
                        backpackItemTypeOptions={itemTypeOptions}
                        backpackItemQualityOptions={itemQualityOptions}
                        wudaoForm={selectedWuDao}
                        onChangeWuDaoForm={handleChangeWuDaoForm}
                        wudaoSkillForm={selectedWuDaoSkill}
                        onChangeWuDaoSkillForm={handleChangeWuDaoSkillForm}
                        affixForm={selectedAffix}
                        onChangeAffixForm={handleChangeAffixForm}
                        onChangeTalentForm={handleChangeTalentForm}
                        buffForm={selectedBuff}
                        onChangeBuffForm={handleChangeBuffForm}
                        itemForm={selectedItem}
                        onChangeItemForm={handleChangeItemForm}
                        skillForm={selectedSkill}
                        onChangeSkillForm={handleChangeSkillForm}
                        staticSkillForm={selectedStaticSkill}
                        onChangeStaticSkillForm={handleChangeStaticSkillForm}
                        buffIconDir={buffIconDirPath}
                        itemIconDir={itemIconDirPath}
                        skillIconDir={skillIconDirPath}
                        buffTypeOptions={buffTypeOptions}
                        buffTriggerOptions={buffTriggerOptions}
                        buffRemoveTriggerOptions={buffRemoveTriggerOptions}
                        buffOverlayTypeOptions={buffOverlayTypeOptions}
                        skillAttackTypeOptions={skillAttackTypeOptions}
                        staticSkillAttributeOptions={staticSkillAttributeOptions}
                        skillConsultTypeOptions={skillConsultTypeOptions}
                        skillPhaseOptions={skillPhaseOptions}
                        skillQualityOptions={skillQualityOptions}
                        wudaoTypeOptions={wudaoTypeFormOptions}
                        itemGuideTypeOptions={itemGuideTypeOptions}
                        itemShopTypeOptions={itemShopTypeOptions}
                        itemUseTypeOptions={itemUseTypeOptions}
                        itemTypeOptions={itemTypeOptions}
                        itemQualityOptions={itemQualityOptions}
                        itemPhaseOptions={itemPhaseOptions}
                        affixTypeOptions={affixTypeOptions}
                        affixProjectTypeOptions={affixProjectTypeOptions}
                        affixDrawerOptions={affixDrawerOptions}
                        onOpenSeidEditor={handleOpenSeidEditor}
                        seidDisplayRows={selectedSeidDisplayRows}
                        talentForm={selectedTalent}
                        talentTypeOptions={talentTypeOptions}
                        viewMode={viewMode}
                        settingsForm={settingsDraft}
                        onChangeSettingsForm={patchSettings}
                    />
                ) : null}
            </main>
            {projectLoading.open ? (
                <div className="modal-mask project-loading-mask">
                    <div className="create-modal project-loading-modal">
                        <div className="create-modal-head">
                            <h3>项目加载中</h3>
                        </div>
                        <div className="project-loading-text">{projectLoading.message || '正在加载，请稍候...'}</div>
                        <div aria-valuemax={100} aria-valuemin={0} aria-valuenow={projectLoading.progress} className="project-loading-bar">
                            <div
                                className="project-loading-bar-fill"
                                style={{ width: `${Math.max(0, Math.min(100, projectLoading.progress))}%` }}
                            />
                        </div>
                        <div className="project-loading-percent">{Math.max(0, Math.min(100, projectLoading.progress))}%</div>
                    </div>
                </div>
            ) : null}
            {projectSaving.open ? (
                <div className="modal-mask project-loading-mask">
                    <div className="create-modal project-loading-modal">
                        <div className="create-modal-head">
                            <h3>项目保存中</h3>
                        </div>
                        <div className="project-loading-text">{projectSaving.message || '正在保存，请稍候...'}</div>
                        <div aria-valuemax={100} aria-valuemin={0} aria-valuenow={projectSaving.progress} className="project-loading-bar">
                            <div
                                className="project-loading-bar-fill"
                                style={{ width: `${Math.max(0, Math.min(100, projectSaving.progress))}%` }}
                            />
                        </div>
                        <div className="project-loading-percent">{Math.max(0, Math.min(100, projectSaving.progress))}%</div>
                    </div>
                </div>
            ) : null}
            <div className="status-bar">{status}</div>
        </div>
    )
}
