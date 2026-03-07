import { PhysicalSize } from '@tauri-apps/api/dpi'
import { listen } from '@tauri-apps/api/event'
import { appDataDir, executableDir, resourceDir } from '@tauri-apps/api/path'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useEffect, useMemo, useRef, useState } from 'react'

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
    cloneBuffEntry,
    cloneItemEntry,
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
import { useMetaLoader } from './features/meta-loader/useMetaLoader'
import { useModuleLoaders } from './features/module-loaders/useModuleLoaders'
import { useAffixHandlers } from './features/modules/affix/useAffixHandlers'
import { useBuffHandlers } from './features/modules/buff/useBuffHandlers'
import { useItemHandlers } from './features/modules/item/useItemHandlers'
import { useSkillHandlers } from './features/modules/skill/useSkillHandlers'
import { useStaticSkillHandlers } from './features/modules/staticskill/useStaticSkillHandlers'
import { useTalentHandlers } from './features/modules/talent/useTalentHandlers'
import { useInfoPanelPresenter } from './features/modules/useInfoPanelPresenter'
import { useModuleSelectionSync } from './features/modules/useModuleSelectionSync'
import { useModuleTableRows } from './features/modules/useModuleTableRows'
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
import type { AffixEntry, BuffEntry, CreateAvatarEntry, ItemEntry, SkillEntry, StaticSkillEntry, TalentTypeOption } from './types'
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
    const [buffDrawerFallbackOptions, setBuffDrawerFallbackOptions] = useState<TalentTypeOption[]>([])
    const [seidEditorOpen, setSeidEditorOpen] = useState(false)
    const [seidPickerOpen, setSeidPickerOpen] = useState(false)
    const [activeSeidId, setActiveSeidId] = useState<number | null>(null)
    const [addTalentOpen, setAddTalentOpen] = useState(false)
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
    const autoSaveRunningRef = useRef(false)
    const cacheSaveRunningRef = useRef(false)
    const cacheRestoredRootRef = useRef('')
    const lastCacheUnsavedRef = useRef<boolean | null>(null)
    const { settingsDraft, settingsHydrated, patchSettings } = useAppSettings()
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
            affixMap,
            talentMap,
            buffMap,
            itemMap,
            skillMap,
            staticSkillMap,
            affixDirty,
            talentDirty,
            buffDirty,
            itemDirty,
            skillDirty,
            staticSkillDirty,
        })
    const {
        affixRows,
        avatarRows,
        buffRows,
        itemRows,
        skillRows,
        staticSkillRows,
        filteredAvatarRows,
        filteredAffixRows,
        filteredBuffRows,
        filteredItemRows,
        filteredSkillRows,
        filteredStaticSkillRows,
    } = useModuleTableRows({
        affixMap,
        talentMap,
        buffMap,
        itemMap,
        skillMap,
        staticSkillMap,
        tableSearchText,
    })
    const selectedAffix = useMemo(() => (selectedAffixKey ? (affixMap[selectedAffixKey] ?? null) : null), [affixMap, selectedAffixKey])
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
        selectedTalentKey,
        selectedBuffKey,
        selectedItemKey,
        selectedSkillKey,
        selectedStaticSkillKey,
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
        affix: {
            rows: affixRows,
            selectedKey: selectedAffixKey,
            setSelectedKey: setSelectedAffixKey,
            setSelectedKeys: setSelectedAffixKeys,
            setSelectionAnchor: setAffixSelectionAnchor,
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
        if (!workspaceRoot || metaExtraRoots.length === 0) return
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
                await loadSpecialDrawerOptions([root], '', true)
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
            setAddBuffOpen,
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
            setStatus(statusError('打开设置窗口', error))
        }
    }

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
        onDeleteAffix: handleDeleteAffixes,
        onDeleteTalent: handleDeleteTalents,
        onDeleteBuff: handleDeleteBuffs,
        onDeleteItem: handleDeleteItems,
        onDeleteSkill: handleDeleteSkills,
        onDeleteStaticSkill: handleDeleteStaticSkills,
        onCopyAffix: handleCopyAffix,
        onCopyTalent: handleCopyTalent,
        onCopyBuff: handleCopyBuff,
        onCopyItem: handleCopyItem,
        onCopySkill: handleCopySkill,
        onCopyStaticSkill: handleCopyStaticSkill,
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
        selectedTalentKey,
        selectedBuffKey,
        selectedItemKey,
        selectedSkillKey,
        selectedStaticSkillKey,
        talentMap,
        buffMap,
        itemMap,
        skillMap,
        staticSkillMap,
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
        setTalentDirty,
        setBuffDirty,
        setItemDirty,
        setSkillDirty,
        setStaticSkillDirty,
        setActiveSeidId,
        setSeidEditorOpen,
        setSeidPickerOpen,
        setStatus,
    })

    const infoPanelPresenter = useInfoPanelPresenter({
        activeModule,
        setAddTalentOpen,
        setAddAffixOpen,
        setAddBuffOpen,
        setAddItemOpen,
        setAddSkillOpen,
        setAddStaticSkillOpen,
        handleBatchPrefixAffixIds,
        handleBatchPrefixIds,
        handleBatchPrefixBuffIds,
        handleBatchPrefixItemIds,
        handleBatchPrefixSkillIds,
        handleBatchPrefixStaticSkillIds,
        handleDeleteAffixes,
        handleDeleteTalents,
        handleDeleteBuffs,
        handleDeleteItems,
        handleDeleteSkills,
        handleDeleteStaticSkills,
        handleCopyAffix,
        handleCopyTalent,
        handleCopyBuff,
        handleCopyItem,
        handleCopySkill,
        handleCopyStaticSkill,
        handlePasteAffix,
        handlePasteTalent,
        handlePasteBuff,
        handlePasteItem,
        handlePasteSkill,
        handlePasteStaticSkill,
        handleGenerateSkillGroup,
        handleGenerateStaticSkillGroup,
        handleGenerateSkillBooksFromSkill,
        handleGenerateSkillBooksFromStaticSkill,
        handleSelectAffix,
        handleSelectTalent,
        handleSelectBuff,
        handleSelectItem,
        handleSelectSkill,
        handleSelectStaticSkill,
        filteredAffixRows,
        filteredAvatarRows,
        filteredBuffRows,
        filteredItemRows,
        filteredSkillRows,
        filteredStaticSkillRows,
        selectedAffixKey,
        selectedTalentKey,
        selectedBuffKey,
        selectedItemKey,
        selectedSkillKey,
        selectedStaticSkillKey,
        selectedAffixKeys,
        selectedTalentKeys,
        selectedBuffKeys,
        selectedItemKeys,
        selectedSkillKeys,
        selectedStaticSkillKeys,
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
        talentPath,
        createAvatarPath,
        talentMap,
        affixMap,
        affixPath,
        buffMap,
        itemMap,
        skillMap,
        staticSkillMap,
        staticSkillPath,
        buffDirPath,
        itemDirPath,
        skillDirPath,
        loadProjectEntries,
        saveFilePayload,
        deleteFilePayload,
        setConfigDirty,
        setAffixDirty,
        setTalentDirty,
        setBuffDirty,
        setItemDirty,
        setSkillDirty,
        setStaticSkillDirty,
        setAffixCachePath,
        setTalentCachePath,
        setBuffCachePath,
        setItemCachePath,
        setSkillCachePath,
        setStaticSkillCachePath,
        setStatus,
    })

    const hasUnsavedChanges = configDirty || affixDirty || talentDirty || buffDirty || itemDirty || skillDirty || staticSkillDirty

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
                setRawConfigObject(cached.data.rawConfigObject)
                setConfigForm(cached.data.configForm)
                setPreservedSettings(cached.data.preservedSettings)
                setAffixMap(cached.data.affixMap as Record<string, AffixEntry>)
                setTalentMap(cached.data.talentMap as Record<string, CreateAvatarEntry>)
                setBuffMap(cached.data.buffMap as Record<string, BuffEntry>)
                setItemMap(cached.data.itemMap as Record<string, ItemEntry>)
                setSkillMap(cached.data.skillMap as Record<string, SkillEntry>)
                setStaticSkillMap(cached.data.staticSkillMap as Record<string, StaticSkillEntry>)
                setConfigDirty(true)
                setAffixDirty(true)
                setTalentDirty(true)
                setBuffDirty(true)
                setItemDirty(true)
                setSkillDirty(true)
                setStaticSkillDirty(true)
                setStatus('已恢复未保存缓存数据，请尽快保存项目。')
                void logWarn('restored unsaved draft cache for current project')
            } catch {
                // ignore cache restore failures
            }
        })()
        return () => {
            active = false
        }
    }, [projectPath, modRootPath, readFilePayload, saveFilePayload])

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
                drawerOptionsMap={{
                    ...drawerOptionsMap,
                    BuffDrawer:
                        Object.values(buffMap).length > 0
                            ? Object.values(buffMap)
                                  .map(row => ({ id: row.buffid, name: row.name || '' }))
                                  .sort((a, b) => a.id - b.id)
                            : buffDrawerFallbackOptions,
                    BuffArrayDrawer:
                        Object.values(buffMap).length > 0
                            ? Object.values(buffMap)
                                  .map(row => ({ id: row.buffid, name: row.name || '' }))
                                  .sort((a, b) => a.id - b.id)
                            : buffDrawerFallbackOptions,
                }}
                metaMap={activeSeidMetaMap}
                onChangeProperty={handleChangeSeidProperty}
                onClose={() => setSeidEditorOpen(false)}
                onDeleteSelected={handleDeleteSelectedSeid}
                onMoveDown={() => handleMoveSelectedSeid('down')}
                onMoveUp={() => handleMoveSelectedSeid('up')}
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
                        skillConsultTypeOptions={skillConsultTypeOptions}
                        skillPhaseOptions={skillPhaseOptions}
                        skillQualityOptions={skillQualityOptions}
                        itemGuideTypeOptions={itemGuideTypeOptions}
                        itemShopTypeOptions={itemShopTypeOptions}
                        itemUseTypeOptions={itemUseTypeOptions}
                        itemTypeOptions={itemTypeOptions}
                        itemQualityOptions={itemQualityOptions}
                        itemPhaseOptions={itemPhaseOptions}
                        affixTypeOptions={affixTypeOptions}
                        affixProjectTypeOptions={affixProjectTypeOptions}
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
            <div className="status-bar">{status}</div>
        </div>
    )
}
