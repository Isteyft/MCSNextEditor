import { executableDir } from '@tauri-apps/api/path'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { open } from '@tauri-apps/plugin-dialog'
import { FormEvent, useEffect, useMemo, useState } from 'react'

import { createEmptyAffix, normalizeAffixMap, saveAffixFile, toAffixRows } from './components/affix/affix-domain'
import {
    createEmptyBuff,
    loadBuffFiles,
    mergeBuffSeidFiles,
    saveBuffFiles,
    saveBuffSeidFiles,
    toBuffRows,
} from './components/buff/buff-domain'
import {
    createEmptyItem,
    loadItemFiles,
    mergeItemSeidFiles,
    saveItemFiles,
    saveItemSeidFiles,
    toItemRows,
} from './components/item/item-domain'
import { CreateProjectModal } from './components/project/CreateProjectModal'
import { FolderContextMenu } from './components/project/FolderContextMenu'
import { RenameFolderModal } from './components/project/RenameFolderModal'
import {
    createEmptySkill,
    loadSkillFiles,
    mergeSkillSeidFiles,
    saveSkillFiles,
    saveSkillSeidFiles,
    toSkillRows,
} from './components/skill/skill-domain'
import {
    createEmptyStaticSkill,
    mergeStaticSkillSeidFiles,
    normalizeStaticSkillMap,
    saveStaticSkillFile,
    saveStaticSkillSeidFiles,
    toStaticSkillRows,
} from './components/staticskill/staticskill-domain'
import { AddTalentModal } from './components/tianfu/AddTalentModal'
import { SeidEditorModal } from './components/tianfu/SeidEditorModal'
import { SeidMetaItem, SeidPickerModal } from './components/tianfu/SeidPickerModal'
import {
    createEmptyTalent,
    mergeTalentSeidFiles,
    normalizeTalentMap,
    saveTalentSeidFiles,
    toTalentRows,
} from './components/tianfu/talent-domain'
import { preloadEditorMeta, readEnumOptionsByFileName, readSeidMetaByFileName } from './components/tianfu/talent-meta'
import { AppTopBarMenu } from './components/topbar/AppTopBarMenu'
import { EditorPanel } from './components/workspace/EditorPanel'
import { InfoPanel } from './components/workspace/InfoPanel'
import { ModuleSidebar } from './components/workspace/ModuleSidebar'
import { useSeidActiveSync } from './hooks/useSeidActiveSync'
import { ModuleKey, MODULES, ViewMode } from './modules'
import {
    createModFolder,
    createProject,
    deleteModFolder,
    ensureModStructure,
    getWorkspaceRoot,
    loadProjectEntries,
    readFilePayload,
    renameModFolder,
    saveFilePayload,
} from './services/project-api'
import type { AffixEntry, BuffEntry, CreateAvatarEntry, ItemEntry, SkillEntry, StaticSkillEntry, TalentTypeOption } from './types'
import { findModRoot, inferModRootPath, isModRootPath, joinWinPath, pickLeafName, pickProjectTail } from './utils/path'

const appWindow = getCurrentWindow()

type RootModuleSnapshot = {
    affixMap: Record<string, AffixEntry>
    talentMap: Record<string, CreateAvatarEntry>
    buffMap: Record<string, BuffEntry>
    itemMap: Record<string, ItemEntry>
    skillMap: Record<string, SkillEntry>
    staticSkillMap: Record<string, StaticSkillEntry>
    affixDirty: boolean
    talentDirty: boolean
    buffDirty: boolean
    itemDirty: boolean
    skillDirty: boolean
    staticSkillDirty: boolean
}

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
    const [itemSeidMetaMap, setItemSeidMetaMap] = useState<Record<number, SeidMetaItem>>({})
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

    const [expandedRootPaths, setExpandedRootPaths] = useState<string[]>([])
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
    const [rootSnapshotCache, setRootSnapshotCache] = useState<Record<string, RootModuleSnapshot>>({})
    const [newProjectName, setNewProjectName] = useState('')
    const [newModName, setNewModName] = useState('')
    const [exeMetaRoot, setExeMetaRoot] = useState('')
    const [status, setStatus] = useState('请先从“文件”菜单打开项目。')

    function withMetaRoots(roots: string[]) {
        return Array.from(new Set([...roots.filter(Boolean), ...(exeMetaRoot ? [exeMetaRoot] : [])]))
    }

    const moduleConfigPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Config', 'modConfig.json') : ''), [modRootPath])
    const affixPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Data', 'TuJianChunWenBen.json') : ''), [modRootPath])
    const createAvatarPath = useMemo(
        () => (modRootPath ? joinWinPath(modRootPath, 'Data', 'CreateAvatarJsonData.json') : ''),
        [modRootPath]
    )
    const buffDirPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Data', 'BuffJsonData') : ''), [modRootPath])
    const buffIconDirPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Assets', 'Buff Icon') : ''), [modRootPath])
    const itemDirPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Data', 'ItemJsonData') : ''), [modRootPath])
    const itemIconDirPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Assets', 'Item Icon') : ''), [modRootPath])
    const skillDirPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Data', 'skillJsonData') : ''), [modRootPath])
    const skillIconDirPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Assets', 'skill Icon') : ''), [modRootPath])
    const staticSkillPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Data', 'StaticSkillJsonData.json') : ''), [modRootPath])
    const modFolderName = useMemo(() => pickLeafName(renameTargetPath || modRootPath) || 'mod默认', [renameTargetPath, modRootPath])
    const rootFoldersForSidebar = useMemo(
        () =>
            modRootFolders.length > 0
                ? modRootFolders
                : modRootPath
                  ? [{ path: modRootPath, name: pickLeafName(modRootPath) || 'mod默认' }]
                  : [],
        [modRootFolders, modRootPath]
    )
    const affixRows = useMemo(() => toAffixRows(affixMap), [affixMap])
    const avatarRows = useMemo(() => toTalentRows(talentMap), [talentMap])
    const buffRows = useMemo(() => toBuffRows(buffMap), [buffMap])
    const itemRows = useMemo(() => toItemRows(itemMap), [itemMap])
    const skillRows = useMemo(() => toSkillRows(skillMap), [skillMap])
    const staticSkillRows = useMemo(() => toStaticSkillRows(staticSkillMap), [staticSkillMap])
    const filteredAvatarRows = useMemo(() => {
        const keyword = tableSearchText.trim().toLowerCase()
        if (!keyword) return avatarRows
        return avatarRows.filter(row => {
            const source = talentMap[row.key]
            const haystack = `${row.id} ${row.title} ${row.desc} ${source?.Info ?? ''}`.toLowerCase()
            return haystack.includes(keyword)
        })
    }, [avatarRows, talentMap, tableSearchText])
    const filteredAffixRows = useMemo(() => {
        const keyword = tableSearchText.trim().toLowerCase()
        if (!keyword) return affixRows
        return affixRows.filter(row => {
            const source = affixMap[row.key]
            const haystack = `${row.id} ${source?.name1 ?? ''} ${row.title} ${row.fenLei} ${row.desc}`.toLowerCase()
            return haystack.includes(keyword)
        })
    }, [affixRows, affixMap, tableSearchText])
    const filteredBuffRows = useMemo(() => {
        const keyword = tableSearchText.trim().toLowerCase()
        if (!keyword) return buffRows
        return buffRows.filter(row => {
            const source = buffMap[row.key]
            const haystack = `${row.id} ${row.title} ${row.desc} ${source?.skillEffect ?? ''}`.toLowerCase()
            return haystack.includes(keyword)
        })
    }, [buffRows, buffMap, tableSearchText])
    const filteredItemRows = useMemo(() => {
        const keyword = tableSearchText.trim().toLowerCase()
        if (!keyword) return itemRows
        return itemRows.filter(row => {
            const source = itemMap[row.key]
            const haystack = `${row.id} ${row.title} ${row.desc} ${source?.desc2 ?? ''}`.toLowerCase()
            return haystack.includes(keyword)
        })
    }, [itemRows, itemMap, tableSearchText])
    const filteredSkillRows = useMemo(() => {
        const keyword = tableSearchText.trim().toLowerCase()
        if (!keyword) return skillRows
        return skillRows.filter(row => {
            const source = skillMap[row.key]
            const haystack =
                `${row.id} ${source?.Skill_ID ?? ''} ${row.title} ${row.desc} ${source?.TuJiandescr ?? ''} ${source?.skillEffect ?? ''}`.toLowerCase()
            return haystack.includes(keyword)
        })
    }, [skillRows, skillMap, tableSearchText])
    const filteredStaticSkillRows = useMemo(() => {
        const keyword = tableSearchText.trim().toLowerCase()
        if (!keyword) return staticSkillRows
        return staticSkillRows.filter(row => {
            const source = staticSkillMap[row.key]
            const haystack = `${row.id} ${source?.Skill_ID ?? ''} ${row.title} ${row.desc} ${source?.TuJiandescr ?? ''}`.toLowerCase()
            return haystack.includes(keyword)
        })
    }, [staticSkillRows, staticSkillMap, tableSearchText])
    const selectedTalent = useMemo(
        () => (selectedTalentKey ? (talentMap[selectedTalentKey] ?? null) : null),
        [talentMap, selectedTalentKey]
    )
    const selectedAffix = useMemo(() => (selectedAffixKey ? (affixMap[selectedAffixKey] ?? null) : null), [affixMap, selectedAffixKey])
    const selectedBuff = useMemo(() => (selectedBuffKey ? (buffMap[selectedBuffKey] ?? null) : null), [buffMap, selectedBuffKey])
    const selectedItem = useMemo(() => (selectedItemKey ? (itemMap[selectedItemKey] ?? null) : null), [itemMap, selectedItemKey])
    const selectedSkill = useMemo(() => (selectedSkillKey ? (skillMap[selectedSkillKey] ?? null) : null), [skillMap, selectedSkillKey])
    const selectedStaticSkill = useMemo(
        () => (selectedStaticSkillKey ? (staticSkillMap[selectedStaticSkillKey] ?? null) : null),
        [staticSkillMap, selectedStaticSkillKey]
    )
    const activeModuleLabel = useMemo(() => MODULES.find(item => item.key === activeModule)?.label ?? '-', [activeModule])
    const activeSeidMetaMap = useMemo(() => {
        if (activeModule === 'buff') return buffSeidMetaMap
        if (activeModule === 'item') return itemSeidMetaMap
        if (activeModule === 'skill') return skillSeidMetaMap
        if (activeModule === 'staticskill') return staticSkillSeidMetaMap
        return seidMetaMap
    }, [activeModule, buffSeidMetaMap, itemSeidMetaMap, skillSeidMetaMap, staticSkillSeidMetaMap, seidMetaMap])
    const seidPickerItems = useMemo(() => Object.values(activeSeidMetaMap).sort((a, b) => a.id - b.id), [activeSeidMetaMap])
    const selectedSeidDisplayRows = useMemo(() => {
        const currentSeid =
            activeModule === 'buff'
                ? (selectedBuff?.seid ?? [])
                : activeModule === 'item'
                  ? (selectedItem?.seid ?? [])
                  : activeModule === 'skill'
                    ? (selectedSkill?.seid ?? [])
                    : activeModule === 'staticskill'
                      ? (selectedStaticSkill?.seid ?? [])
                      : (selectedTalent?.seid ?? [])
        return currentSeid.map(id => ({
            id,
            name: activeSeidMetaMap[id]?.name ?? '',
        }))
    }, [activeModule, selectedTalent, selectedBuff, selectedItem, selectedSkill, selectedStaticSkill, activeSeidMetaMap])
    const currentSeidOwner = useMemo(
        () =>
            activeModule === 'buff'
                ? selectedBuff
                : activeModule === 'item'
                  ? selectedItem
                  : activeModule === 'skill'
                    ? selectedSkill
                    : activeModule === 'staticskill'
                      ? selectedStaticSkill
                      : selectedTalent,
        [activeModule, selectedBuff, selectedItem, selectedSkill, selectedStaticSkill, selectedTalent]
    )

    function cloneTalentEntry(entry: CreateAvatarEntry): CreateAvatarEntry {
        return {
            ...entry,
            seid: [...entry.seid],
            seidData: JSON.parse(JSON.stringify(entry.seidData ?? {})) as Record<string, Record<string, string | number | number[]>>,
        }
    }

    function cloneAffixEntry(entry: AffixEntry): AffixEntry {
        return {
            ...entry,
        }
    }

    function cloneBuffEntry(entry: BuffEntry): BuffEntry {
        return {
            ...entry,
            Affix: [...entry.Affix],
            seid: [...entry.seid],
            seidData: JSON.parse(JSON.stringify(entry.seidData ?? {})) as Record<string, Record<string, string | number | number[]>>,
        }
    }

    function cloneItemEntry(entry: ItemEntry): ItemEntry {
        return {
            ...entry,
            Affix: [...entry.Affix],
            ItemFlag: [...entry.ItemFlag],
            wuDao: [...entry.wuDao],
            seid: [...entry.seid],
            seidData: JSON.parse(JSON.stringify(entry.seidData ?? {})) as Record<string, Record<string, string | number | number[]>>,
        }
    }

    function cloneSkillEntry(entry: SkillEntry): SkillEntry {
        return {
            ...entry,
            seid: [...entry.seid],
            Affix: [...entry.Affix],
            Affix2: [...entry.Affix2],
            AttackType: [...entry.AttackType],
            skill_SameCastNum: [...entry.skill_SameCastNum],
            skill_CastType: [...entry.skill_CastType],
            skill_Cast: [...entry.skill_Cast],
            seidData: JSON.parse(JSON.stringify(entry.seidData ?? {})) as Record<string, Record<string, string | number | number[]>>,
        }
    }

    function cloneStaticSkillEntry(entry: StaticSkillEntry): StaticSkillEntry {
        return {
            ...entry,
            Affix: [...entry.Affix],
            seid: [...entry.seid],
            seidData: JSON.parse(JSON.stringify(entry.seidData ?? {})) as Record<string, Record<string, string | number | number[]>>,
        }
    }

    function isEditableElement(target: EventTarget | null): boolean {
        if (!(target instanceof HTMLElement)) return false
        const tag = target.tagName.toLowerCase()
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
        return Boolean(target.closest('[contenteditable="true"]'))
    }

    function dirname(path: string) {
        const normalized = path.replace(/[\\/]+$/, '')
        const index = Math.max(normalized.lastIndexOf('\\'), normalized.lastIndexOf('/'))
        return index >= 0 ? normalized.slice(0, index) : ''
    }

    function normalizePath(path: string) {
        return path.replace(/\//g, '\\').toLowerCase()
    }

    function stripProjectPrefix(value: string) {
        return value.replace(/^mod[\\/]+/i, '').trim()
    }

    async function collectSiblingModFolders(anchorModRoot: string) {
        if (!anchorModRoot) return [] as Array<{ path: string; name: string }>
        const parent = dirname(anchorModRoot)
        if (!parent) return [{ path: anchorModRoot, name: pickLeafName(anchorModRoot) || 'mod默认' }]
        try {
            const entries = await loadProjectEntries(parent)
            const folders = entries
                .filter(entry => entry.is_dir && /^mod/i.test(entry.name))
                .map(entry => ({ path: entry.path, name: entry.name }))
                .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))
            if (folders.length > 0) return folders
        } catch {
            // fallback to single root
        }
        return [{ path: anchorModRoot, name: pickLeafName(anchorModRoot) || 'mod默认' }]
    }

    useSeidActiveSync({ activeSeidId, seidEditorOpen, selectedTalent: currentSeidOwner, setActiveSeidId })

    useEffect(() => {
        const validKeys = new Set(affixRows.map(row => row.key))
        setSelectedAffixKeys(prev => prev.filter(key => validKeys.has(key)))
        if (selectedAffixKey && !validKeys.has(selectedAffixKey)) {
            const fallback = affixRows[0]?.key ?? ''
            setSelectedAffixKey(fallback)
            setSelectedAffixKeys(fallback ? [fallback] : [])
            setAffixSelectionAnchor(fallback)
        }
    }, [affixRows, selectedAffixKey])

    useEffect(() => {
        const validKeys = new Set(avatarRows.map(row => row.key))
        setSelectedTalentKeys(prev => prev.filter(key => validKeys.has(key)))
        if (selectedTalentKey && !validKeys.has(selectedTalentKey)) {
            const fallback = avatarRows[0]?.key ?? ''
            setSelectedTalentKey(fallback)
            setSelectedTalentKeys(fallback ? [fallback] : [])
            setTalentSelectionAnchor(fallback)
        }
    }, [avatarRows, selectedTalentKey])

    useEffect(() => {
        const validKeys = new Set(buffRows.map(row => row.key))
        setSelectedBuffKeys(prev => prev.filter(key => validKeys.has(key)))
        if (selectedBuffKey && !validKeys.has(selectedBuffKey)) {
            const fallback = buffRows[0]?.key ?? ''
            setSelectedBuffKey(fallback)
            setSelectedBuffKeys(fallback ? [fallback] : [])
            setBuffSelectionAnchor(fallback)
        }
    }, [buffRows, selectedBuffKey])

    useEffect(() => {
        const validKeys = new Set(itemRows.map(row => row.key))
        setSelectedItemKeys(prev => prev.filter(key => validKeys.has(key)))
        if (selectedItemKey && !validKeys.has(selectedItemKey)) {
            const fallback = itemRows[0]?.key ?? ''
            setSelectedItemKey(fallback)
            setSelectedItemKeys(fallback ? [fallback] : [])
            setItemSelectionAnchor(fallback)
        }
    }, [itemRows, selectedItemKey])

    useEffect(() => {
        const validKeys = new Set(skillRows.map(row => row.key))
        setSelectedSkillKeys(prev => prev.filter(key => validKeys.has(key)))
        if (selectedSkillKey && !validKeys.has(selectedSkillKey)) {
            const fallback = skillRows[0]?.key ?? ''
            setSelectedSkillKey(fallback)
            setSelectedSkillKeys(fallback ? [fallback] : [])
            setSkillSelectionAnchor(fallback)
        }
    }, [skillRows, selectedSkillKey])

    useEffect(() => {
        const validKeys = new Set(staticSkillRows.map(row => row.key))
        setSelectedStaticSkillKeys(prev => prev.filter(key => validKeys.has(key)))
        if (selectedStaticSkillKey && !validKeys.has(selectedStaticSkillKey)) {
            const fallback = staticSkillRows[0]?.key ?? ''
            setSelectedStaticSkillKey(fallback)
            setSelectedStaticSkillKeys(fallback ? [fallback] : [])
            setStaticSkillSelectionAnchor(fallback)
        }
    }, [staticSkillRows, selectedStaticSkillKey])

    useEffect(() => {
        if (!modRootPath) return
        setExpandedRootPaths(prev =>
            prev.some(path => normalizePath(path) === normalizePath(modRootPath)) ? prev : [...prev, modRootPath]
        )
    }, [modRootPath])

    useEffect(() => {
        const handleContextMenu = (event: MouseEvent) => {
            event.preventDefault()
        }
        window.addEventListener('contextmenu', handleContextMenu)
        return () => {
            window.removeEventListener('contextmenu', handleContextMenu)
        }
    }, [])

    useEffect(() => {
        if (!modRootPath) return
        const cacheKey = normalizePath(modRootPath)
        setRootSnapshotCache(prev => ({
            ...prev,
            [cacheKey]: {
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
            },
        }))
    }, [
        modRootPath,
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
    ])

    useEffect(() => {
        let active = true
        ;(async () => {
            try {
                const dir = await executableDir()
                if (!active) return
                setExeMetaRoot(dir)
            } catch {
                // running in pure web mode or path API unavailable
            }
        })()
        return () => {
            active = false
        }
    }, [])

    useEffect(() => {
        if (!workspaceRoot || !exeMetaRoot) return
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
    }, [workspaceRoot, exeMetaRoot, modRootPath])

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

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (
                activeModule !== 'affix' &&
                activeModule !== 'talent' &&
                activeModule !== 'buff' &&
                activeModule !== 'item' &&
                activeModule !== 'skill' &&
                activeModule !== 'staticskill'
            )
                return
            if (isEditableElement(event.target)) return
            if (event.key === 'Delete') {
                event.preventDefault()
                if (activeModule === 'affix') {
                    handleDeleteAffixes()
                } else if (activeModule === 'buff') {
                    handleDeleteBuffs()
                } else if (activeModule === 'item') {
                    handleDeleteItems()
                } else if (activeModule === 'skill') {
                    handleDeleteSkills()
                } else if (activeModule === 'staticskill') {
                    handleDeleteStaticSkills()
                } else {
                    handleDeleteTalents()
                }
                return
            }
            if (!(event.ctrlKey || event.metaKey)) return
            const key = event.key.toLowerCase()
            if (key === 'c') {
                event.preventDefault()
                if (activeModule === 'affix') {
                    handleCopyAffix()
                } else if (activeModule === 'buff') {
                    handleCopyBuff()
                } else if (activeModule === 'item') {
                    handleCopyItem()
                } else if (activeModule === 'skill') {
                    handleCopySkill()
                } else if (activeModule === 'staticskill') {
                    handleCopyStaticSkill()
                } else {
                    handleCopyTalent()
                }
            } else if (key === 'v') {
                event.preventDefault()
                if (activeModule === 'affix') {
                    handlePasteAffix()
                } else if (activeModule === 'buff') {
                    handlePasteBuff()
                } else if (activeModule === 'item') {
                    handlePasteItem()
                } else if (activeModule === 'skill') {
                    handlePasteSkill()
                } else if (activeModule === 'staticskill') {
                    handlePasteStaticSkill()
                } else {
                    handlePasteTalent()
                }
            }
        }

        window.addEventListener('keydown', onKeyDown)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
        }
    }, [
        activeModule,
        affixRows,
        avatarRows,
        buffRows,
        itemRows,
        skillRows,
        staticSkillRows,
        selectedAffixKey,
        selectedAffixKeys,
        selectedTalent,
        selectedTalentKey,
        selectedTalentKeys,
        selectedBuffKey,
        selectedBuffKeys,
        selectedItemKey,
        selectedItemKeys,
        selectedSkill,
        selectedSkillKey,
        selectedSkillKeys,
        selectedStaticSkill,
        selectedStaticSkillKey,
        selectedStaticSkillKeys,
        affixClipboard,
        talentClipboard,
        buffClipboard,
        itemClipboard,
        skillClipboard,
        staticSkillClipboard,
        affixMap,
        talentMap,
        buffMap,
        itemMap,
        skillMap,
        staticSkillMap,
    ])

    async function preloadMeta(roots: string[], silent = false) {
        const result = await preloadEditorMeta({ roots: withMetaRoots(roots), readFilePayload, loadProjectEntries })
        const talentLoaded = Boolean(result.talentOptions?.length)
        const seidLoaded = Boolean(result.seidMetaMap && Object.keys(result.seidMetaMap).length > 0)

        if (talentLoaded && result.talentOptions) {
            setTalentTypeOptions(result.talentOptions)
        } else if (!silent) {
            setTalentTypeOptions([])
        }

        if (seidLoaded && result.seidMetaMap) {
            setSeidMetaMap(result.seidMetaMap)
        } else if (!silent) {
            setSeidMetaMap({})
        }

        if (!silent) {
            const talentPart = talentLoaded ? `分类已加载(${result.talentLoadedPath})` : '分类未加载'
            const seidPart = seidLoaded ? `Seid已加载(${result.seidLoadedPath})` : 'Seid未加载'
            const customPart = result.customLoadedPaths.length > 0 ? `，自定义配置${result.customLoadedPaths.length}个` : ''
            setStatus(`元数据预加载：${talentPart}，${seidPart}${customPart}`)
        }
        return { talentLoaded, seidLoaded }
    }

    async function loadBuffSeidMeta(roots: string[], silent = false) {
        const candidates = withMetaRoots(roots)
        for (const root of candidates) {
            const result = await readSeidMetaByFileName({
                rootPath: root,
                fileName: 'BuffSeidMeta.json',
                readFilePayload,
            })
            if (Object.keys(result.metaMap).length > 0) {
                setBuffSeidMetaMap(result.metaMap)
                if (!silent) {
                    setStatus(`已加载 Buff Seid 元数据: ${result.loadedPath} (${Object.keys(result.metaMap).length} 条)`)
                }
                return true
            }
        }
        if (!silent) {
            setBuffSeidMetaMap({})
        }
        return false
    }

    async function loadItemSeidMeta(roots: string[], silent = false) {
        const candidates = withMetaRoots(roots)
        const fileNames = ['ItemUseSeidMeta.json', 'ItemsSeidMeta.json', 'ItemSeidMeta.json']
        for (const root of candidates) {
            for (const fileName of fileNames) {
                const result = await readSeidMetaByFileName({
                    rootPath: root,
                    fileName,
                    readFilePayload,
                })
                if (Object.keys(result.metaMap).length > 0) {
                    setItemSeidMetaMap(result.metaMap)
                    if (!silent) {
                        setStatus(`已加载 Item Seid 元数据: ${result.loadedPath} (${Object.keys(result.metaMap).length} 条)`)
                    }
                    return true
                }
            }
        }
        if (!silent) setItemSeidMetaMap({})
        return false
    }

    async function loadSkillSeidMeta(roots: string[], silent = false) {
        const candidates = withMetaRoots(roots)
        for (const root of candidates) {
            const result = await readSeidMetaByFileName({
                rootPath: root,
                fileName: 'SkillSeidMeta.json',
                readFilePayload,
            })
            if (Object.keys(result.metaMap).length > 0) {
                setSkillSeidMetaMap(result.metaMap)
                if (!silent) {
                    setStatus(`已加载 Skill Seid 元数据: ${result.loadedPath} (${Object.keys(result.metaMap).length} 条)`)
                }
                return true
            }
        }
        if (!silent) {
            setSkillSeidMetaMap({})
        }
        return false
    }

    async function loadStaticSkillSeidMeta(roots: string[], silent = false) {
        const candidates = withMetaRoots(roots)
        for (const root of candidates) {
            const result = await readSeidMetaByFileName({
                rootPath: root,
                fileName: 'StaticSkillSeidMeta.json',
                readFilePayload,
            })
            if (Object.keys(result.metaMap).length > 0) {
                setStaticSkillSeidMetaMap(result.metaMap)
                if (!silent) {
                    setStatus(`已加载 StaticSkill Seid 元数据: ${result.loadedPath} (${Object.keys(result.metaMap).length} 条)`)
                }
                return true
            }
        }
        if (!silent) {
            setStaticSkillSeidMetaMap({})
        }
        return false
    }

    async function loadBuffEnumMeta(roots: string[], silent = false) {
        const candidates = withMetaRoots(roots)
        const fileMap: Array<{ file: string; setter: (value: TalentTypeOption[]) => void; preferDesc?: boolean }> = [
            { file: 'BuffType.json', setter: setBuffTypeOptions },
            { file: 'BuffTriggerType.json', setter: setBuffTriggerOptions, preferDesc: true },
            { file: 'BuffRemoveTriggerType.json', setter: setBuffRemoveTriggerOptions },
            { file: 'BuffOverlayType.json', setter: setBuffOverlayTypeOptions, preferDesc: true },
        ]

        const loaded: string[] = []
        for (const item of fileMap) {
            let assigned = false
            for (const root of candidates) {
                const result = await readEnumOptionsByFileName({
                    rootPath: root,
                    fileName: item.file,
                    preferDesc: item.preferDesc,
                    readFilePayload,
                })
                if (result.options.length > 0) {
                    item.setter(result.options)
                    loaded.push(result.loadedPath || item.file)
                    assigned = true
                    break
                }
            }
            if (!assigned && !silent) {
                item.setter([])
            }
        }

        if (!silent && loaded.length > 0) {
            setStatus(`已加载 Buff 枚举元数据 ${loaded.length}/4 个`)
        }
        return loaded.length > 0
    }

    async function loadAffixEnumMeta(roots: string[], silent = false) {
        const candidates = withMetaRoots(roots)
        const loaders: Array<{
            fileName: string
            setter: (rows: TalentTypeOption[]) => void
            transform?: (rows: TalentTypeOption[]) => TalentTypeOption[]
        }> = [
            { fileName: 'AffixType.json', setter: setAffixTypeOptions },
            {
                fileName: 'AffixProjectType.json',
                setter: setAffixProjectTypeOptions,
                transform: rows => rows,
            },
        ]

        let loadedAny = false
        for (const loader of loaders) {
            let loaded = false
            for (const root of candidates) {
                const result = await readEnumOptionsByFileName({
                    rootPath: root,
                    fileName: loader.fileName,
                    readFilePayload,
                })
                if (result.options.length > 0) {
                    loader.setter(loader.transform ? loader.transform(result.options) : result.options)
                    loaded = true
                    loadedAny = true
                    break
                }
            }
            if (!loaded && !silent) loader.setter([])
        }
        return loadedAny
    }

    async function loadItemEnumMeta(roots: string[], silent = false) {
        const candidates = withMetaRoots(roots)
        const fileMap: Array<{ file: string; setter: (value: TalentTypeOption[]) => void; preferDesc?: boolean }> = [
            { file: 'GuideType.json', setter: setItemGuideTypeOptions, preferDesc: true },
            { file: 'ItemShopType.json', setter: setItemShopTypeOptions, preferDesc: true },
            { file: 'ItemUseType.json', setter: setItemUseTypeOptions, preferDesc: true },
            { file: 'ItemType.json', setter: setItemTypeOptions, preferDesc: true },
            { file: 'ItemQualityType.json', setter: setItemQualityOptions, preferDesc: true },
            { file: 'ItemPhaseType.json', setter: setItemPhaseOptions, preferDesc: true },
        ]

        let loadedAny = false
        for (const item of fileMap) {
            let assigned = false
            for (const root of candidates) {
                const result = await readEnumOptionsByFileName({
                    rootPath: root,
                    fileName: item.file,
                    preferDesc: item.preferDesc,
                    readFilePayload,
                })
                if (result.options.length > 0) {
                    item.setter(result.options)
                    loadedAny = true
                    assigned = true
                    break
                }
            }
            if (!assigned && !silent) item.setter([])
        }
        return loadedAny
    }

    async function loadSkillEnumMeta(roots: string[], silent = false) {
        const candidates = withMetaRoots(roots)
        const loaders: Array<{
            fileName: string
            setter: (rows: TalentTypeOption[]) => void
            preferDesc?: boolean
        }> = [
            { fileName: 'AttackType.json', setter: setSkillAttackTypeOptions, preferDesc: true },
            { fileName: 'SkillConsultType.json', setter: setSkillConsultTypeOptions, preferDesc: true },
            { fileName: 'SkillPhase.json', setter: setSkillPhaseOptions, preferDesc: true },
            { fileName: 'SkillQuality.json', setter: setSkillQualityOptions, preferDesc: true },
        ]

        let loadedAny = false
        for (const loader of loaders) {
            let loaded = false
            for (const root of candidates) {
                const result = await readEnumOptionsByFileName({
                    rootPath: root,
                    fileName: loader.fileName,
                    preferDesc: loader.preferDesc,
                    readFilePayload,
                })
                if (result.options.length > 0) {
                    loader.setter(result.options)
                    loaded = true
                    loadedAny = true
                    break
                }
            }
            if (!loaded && !silent) loader.setter([])
        }
        return loadedAny
    }

    async function readIdNameOptionsFromDir(dirPath: string) {
        const options: TalentTypeOption[] = []
        let entries: Array<{ path: string; name: string; is_dir: boolean }> = []
        try {
            entries = await loadProjectEntries(dirPath)
        } catch {
            return options
        }
        for (const entry of entries) {
            if (entry.is_dir || !/\.json$/i.test(entry.name)) continue
            try {
                const payload = await readFilePayload(entry.path)
                const parsed = JSON.parse(payload.content) as Record<string, unknown>
                const id = Number(
                    parsed.id ??
                        parsed.ID ??
                        parsed.Id ??
                        parsed.buffid ??
                        parsed.skillid ??
                        parsed.Skill_ID ??
                        entry.name.replace(/\.json$/i, '')
                )
                if (!Number.isFinite(id)) continue
                const name = String(parsed.name ?? parsed.Name ?? parsed.Title ?? parsed.title ?? '')
                options.push({ id, name })
            } catch {
                // skip invalid row
            }
        }
        return options.sort((a, b) => a.id - b.id)
    }

    async function loadSpecialDrawerOptions(roots: string[], modRoot: string, silent = false) {
        const nextMap: Record<string, TalentTypeOption[]> = {}

        const enumMappings: Array<{ drawer: string; file: string; preferDesc?: boolean }> = [
            { drawer: 'AttackTypeDrawer', file: 'AttackType.json', preferDesc: true },
            { drawer: 'AttackTypeArrayDrawer', file: 'AttackType.json', preferDesc: true },
            { drawer: 'ElementTypeDrawer', file: 'ElementType.json', preferDesc: true },
            { drawer: 'ElementTypeArrayDrawer', file: 'ElementType.json', preferDesc: true },
            { drawer: 'TargetTypeDrawer', file: 'TargetType.json', preferDesc: true },
            { drawer: 'TargetTypeArrayDrawer', file: 'TargetType.json', preferDesc: true },
            { drawer: 'ComparisonOperatorTypeDrawer', file: 'ComparisonOperatorType.json', preferDesc: true },
            { drawer: 'ArithmeticOperatorTypeDrawer', file: 'ArithmeticOperatorType.json', preferDesc: true },
            { drawer: 'BuffTriggerTypeDrawer', file: 'BuffTriggerType.json', preferDesc: true },
            { drawer: 'BuffTypeDrawer', file: 'BuffType.json', preferDesc: false },
            { drawer: 'BuffRemoveTriggerTypeDrawer', file: 'BuffRemoveTriggerType.json', preferDesc: true },
        ]
        const candidates = withMetaRoots(roots)
        for (const mapping of enumMappings) {
            for (const root of candidates) {
                const result = await readEnumOptionsByFileName({
                    rootPath: root,
                    fileName: mapping.file,
                    preferDesc: mapping.preferDesc,
                    readFilePayload,
                })
                if (result.options.length > 0) {
                    nextMap[mapping.drawer] = result.options
                    break
                }
            }
        }

        if (modRoot) {
            const buffRows = await loadBuffFiles({
                modRootPath: modRoot,
                joinWinPath,
                loadProjectEntries,
                readFilePayload,
            })
            const buffOptions = Object.values(buffRows)
                .map(row => ({ id: row.buffid, name: row.name || '' }))
                .sort((a, b) => a.id - b.id)
            nextMap.BuffDrawer = buffOptions
            nextMap.BuffArrayDrawer = buffOptions
            setBuffDrawerFallbackOptions(buffOptions)

            const skillPkFromSkillPk = await readIdNameOptionsFromDir(joinWinPath(modRoot, 'Data', 'SkillPkJsonData'))
            const skillPkFromSkill = await readIdNameOptionsFromDir(joinWinPath(modRoot, 'Data', 'SkillJsonData'))
            const skillOptions = (skillPkFromSkillPk.length > 0 ? skillPkFromSkillPk : skillPkFromSkill).sort((a, b) => a.id - b.id)
            nextMap.SkillPkDrawer = skillOptions
            nextMap.SkillPkArrayDrawer = skillOptions
        }

        setDrawerOptionsMap(nextMap)
        if (!silent) {
            setStatus(`已加载 SpecialDrawer 数据源 ${Object.keys(nextMap).length} 个`)
        }
    }
    async function reloadProject(rootPath: string) {
        const loaded = await loadProjectEntries(rootPath)
        const modRoot = findModRoot(loaded)
        const nextModRoot = isModRootPath(rootPath) ? rootPath : (modRoot?.path ?? inferModRootPath(rootPath))
        const siblingFolders = await collectSiblingModFolders(nextModRoot)

        setProjectPath(rootPath)
        setModRootPath(nextModRoot)
        setModRootFolders(siblingFolders)
        setRenameTargetPath('')
        setActiveModule('')
        setViewMode('todo')
        setActivePath('')
        setTableSearchText('')
        setConfigForm({ name: '', author: '', version: '0.0.1', description: '' })
        setRawConfigObject({})
        setPreservedSettings([])
        setConfigDirty(false)
        setConfigCachePath('')
        setAffixMap({})
        setAffixCachePath('')
        setAffixDirty(false)
        setSelectedAffixKey('')
        setSelectedAffixKeys([])
        setAffixSelectionAnchor('')
        setAffixClipboard([])
        setTalentMap({})
        setTalentPath('')
        setTalentCachePath('')
        setTalentDirty(false)
        setBuffMap({})
        setBuffCachePath('')
        setBuffDirty(false)
        setItemMap({})
        setItemCachePath('')
        setItemDirty(false)
        setSelectedItemKey('')
        setSelectedItemKeys([])
        setItemSelectionAnchor('')
        setItemClipboard([])
        setSelectedBuffKey('')
        setSelectedBuffKeys([])
        setBuffSelectionAnchor('')
        setBuffClipboard([])
        setSkillMap({})
        setSkillCachePath('')
        setSkillDirty(false)
        setSelectedSkillKey('')
        setSelectedSkillKeys([])
        setSkillSelectionAnchor('')
        setSkillClipboard([])
        setStaticSkillMap({})
        setStaticSkillCachePath('')
        setStaticSkillDirty(false)
        setSelectedStaticSkillKey('')
        setSelectedStaticSkillKeys([])
        setStaticSkillSelectionAnchor('')
        setStaticSkillClipboard([])
        setBuffTypeOptions([])
        setBuffTriggerOptions([])
        setBuffRemoveTriggerOptions([])
        setBuffOverlayTypeOptions([])
        setAffixTypeOptions([])
        setAffixProjectTypeOptions([])
        setItemGuideTypeOptions([])
        setItemShopTypeOptions([])
        setItemUseTypeOptions([])
        setItemTypeOptions([])
        setItemQualityOptions([])
        setItemPhaseOptions([])
        setItemSeidMetaMap({})
        setSkillAttackTypeOptions([])
        setSkillConsultTypeOptions([])
        setSkillPhaseOptions([])
        setSkillQualityOptions([])
        setSkillSeidMetaMap({})
        setStaticSkillSeidMetaMap({})
        setDrawerOptionsMap({})
        setBuffDrawerFallbackOptions([])
        setSelectedTalentKey('')
        setSelectedTalentKeys([])
        setTalentSelectionAnchor('')
        setTalentClipboard([])
        setBuffSeidMetaMap({})
        setSeidEditorOpen(false)
        setSeidPickerOpen(false)
        setActiveSeidId(null)
        setExpandedRootPaths(siblingFolders.map(item => item.path))
        setAddBuffOpen(false)
        setAddAffixOpen(false)
        setAddItemOpen(false)
        setAddSkillOpen(false)
        setAddStaticSkillOpen(false)
        setRootSnapshotCache({})
        await preloadMeta([rootPath, nextModRoot, workspaceRoot], true)
        await loadBuffSeidMeta([rootPath, nextModRoot, workspaceRoot], true)
        await loadItemSeidMeta([rootPath, nextModRoot, workspaceRoot], true)
        await loadSkillSeidMeta([rootPath, nextModRoot, workspaceRoot], true)
        await loadStaticSkillSeidMeta([rootPath, nextModRoot, workspaceRoot], true)
        await loadBuffEnumMeta([rootPath, nextModRoot, workspaceRoot], true)
        await loadAffixEnumMeta([rootPath, nextModRoot, workspaceRoot], true)
        await loadItemEnumMeta([rootPath, nextModRoot, workspaceRoot], true)
        await loadSkillEnumMeta([rootPath, nextModRoot, workspaceRoot], true)
        await loadSpecialDrawerOptions([rootPath, nextModRoot, workspaceRoot], nextModRoot, true)
        const preloadPairs = await Promise.all(
            siblingFolders.map(async item => [normalizePath(item.path), await readRootModuleSnapshot(item.path)] as const)
        )
        const nextCache = Object.fromEntries(preloadPairs)
        setRootSnapshotCache(nextCache)
        const activeSnapshot = nextCache[normalizePath(nextModRoot)]
        if (activeSnapshot) {
            applyRootModuleSnapshot(nextModRoot, activeSnapshot)
        }
        setStatus(
            modRoot ? `项目已打开并已预加载全部目录数据: ${rootPath}` : `项目已打开并已预加载全部目录数据，按预设路径加载: ${nextModRoot}`
        )
    }

    async function handleSelectModRoot(nextModRoot: string) {
        if (!nextModRoot || nextModRoot === modRootPath) return
        const cachedSnapshot = rootSnapshotCache[normalizePath(nextModRoot)]
        if (cachedSnapshot) {
            setModRootPath(nextModRoot)
            setRenameTargetPath('')
            setActiveModule('')
            setViewMode('todo')
            setActivePath('')
            setTableSearchText('')
            setSeidEditorOpen(false)
            setSeidPickerOpen(false)
            setActiveSeidId(null)
            applyRootModuleSnapshot(nextModRoot, cachedSnapshot)
            setStatus(`已切换项目（缓存命中）: ${pickLeafName(nextModRoot)}`)
            return
        }

        setModRootPath(nextModRoot)
        setRenameTargetPath('')
        setActiveModule('')
        setViewMode('todo')
        setActivePath('')
        setTableSearchText('')
        setConfigCachePath('')
        setConfigDirty(false)
        setAffixMap({})
        setAffixCachePath('')
        setAffixDirty(false)
        setSelectedAffixKey('')
        setSelectedAffixKeys([])
        setAffixSelectionAnchor('')
        setAffixClipboard([])
        setTalentMap({})
        setTalentPath('')
        setTalentCachePath('')
        setTalentDirty(false)
        setBuffMap({})
        setBuffCachePath('')
        setBuffDirty(false)
        setItemMap({})
        setItemCachePath('')
        setItemDirty(false)
        setSelectedItemKey('')
        setSelectedItemKeys([])
        setItemSelectionAnchor('')
        setItemClipboard([])
        setSelectedBuffKey('')
        setSelectedBuffKeys([])
        setBuffSelectionAnchor('')
        setBuffClipboard([])
        setSkillMap({})
        setSkillCachePath('')
        setSkillDirty(false)
        setSelectedSkillKey('')
        setSelectedSkillKeys([])
        setSkillSelectionAnchor('')
        setSkillClipboard([])
        setStaticSkillMap({})
        setStaticSkillCachePath('')
        setStaticSkillDirty(false)
        setSelectedStaticSkillKey('')
        setSelectedStaticSkillKeys([])
        setStaticSkillSelectionAnchor('')
        setStaticSkillClipboard([])
        setSeidEditorOpen(false)
        setSeidPickerOpen(false)
        setActiveSeidId(null)
        setAddBuffOpen(false)
        setAddAffixOpen(false)
        setAddItemOpen(false)
        setAddSkillOpen(false)
        setAddStaticSkillOpen(false)

        const siblingFolders = await collectSiblingModFolders(nextModRoot)
        setModRootFolders(siblingFolders)
        await preloadMeta([projectPath, nextModRoot, workspaceRoot], true)
        await loadBuffSeidMeta([projectPath, nextModRoot, workspaceRoot], true)
        await loadItemSeidMeta([projectPath, nextModRoot, workspaceRoot], true)
        await loadSkillSeidMeta([projectPath, nextModRoot, workspaceRoot], true)
        await loadStaticSkillSeidMeta([projectPath, nextModRoot, workspaceRoot], true)
        await loadBuffEnumMeta([projectPath, nextModRoot, workspaceRoot], true)
        await loadAffixEnumMeta([projectPath, nextModRoot, workspaceRoot], true)
        await loadItemEnumMeta([projectPath, nextModRoot, workspaceRoot], true)
        await loadSkillEnumMeta([projectPath, nextModRoot, workspaceRoot], true)
        await loadSpecialDrawerOptions([projectPath, nextModRoot, workspaceRoot], nextModRoot, true)
        const snapshot = await readRootModuleSnapshot(nextModRoot)
        setRootSnapshotCache(prev => ({ ...prev, [normalizePath(nextModRoot)]: snapshot }))
        applyRootModuleSnapshot(nextModRoot, snapshot)
        setStatus(`已切换项目并预加载全部数据: ${pickLeafName(nextModRoot)}`)
    }

    async function handleOpenProject() {
        const selected = await open({ directory: true, multiple: false, title: '选择项目目录' })
        if (!selected || Array.isArray(selected)) return
        try {
            await reloadProject(selected)
        } catch (error) {
            setStatus(`打开失败: ${String(error)}`)
        }
    }

    async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const projectNameInput = stripProjectPrefix(newProjectName)
        const modName = (newModName.trim() || projectNameInput).trim()
        const projectName = (createMode === 'quick' ? modName : projectNameInput).trim()
        if (!modName || (!projectName && createMode !== 'quick')) {
            setStatus(createMode === 'quick' ? '请输入 mod 名称。' : '请输入项目名字和 mod 名称。')
            return
        }
        try {
            let createdMessage = ''
            if (createMode === 'quick') {
                if (!modRootPath) {
                    setStatus('请先打开一个项目，再新增 mod 目录。')
                    return
                }
                const nextBasePath = dirname(modRootPath)
                if (!nextBasePath) {
                    setStatus('无法定位 plugins\\Next 目录。')
                    return
                }
                const createdModPath = await createModFolder(nextBasePath, modName)
                const siblingFolders = await collectSiblingModFolders(createdModPath)
                setModRootFolders(siblingFolders)
                await handleSelectModRoot(createdModPath)
                createdMessage = `mod目录已新建: ${createdModPath}`
            } else {
                const createdPath = await createProject(projectName, modName)
                await reloadProject(createdPath)
                createdMessage = `项目已新建: ${createdPath}`
            }
            setCreateOpen(false)
            setCreateMode('full')
            setNewProjectName('')
            setNewModName('')
            setStatus(createdMessage)
        } catch (error) {
            setStatus(`新建失败: ${String(error)}`)
        }
    }

    async function readRootModuleSnapshot(targetModRoot: string): Promise<RootModuleSnapshot> {
        const emptySnapshot: RootModuleSnapshot = {
            affixMap: {},
            talentMap: {},
            buffMap: {},
            itemMap: {},
            skillMap: {},
            staticSkillMap: {},
            affixDirty: false,
            talentDirty: false,
            buffDirty: false,
            itemDirty: false,
            skillDirty: false,
            staticSkillDirty: false,
        }
        if (!targetModRoot) return emptySnapshot

        const targetAffixPath = joinWinPath(targetModRoot, 'Data', 'TuJianChunWenBen.json')
        const targetTalentPath = joinWinPath(targetModRoot, 'Data', 'CreateAvatarJsonData.json')
        const targetStaticSkillPath = joinWinPath(targetModRoot, 'Data', 'StaticSkillJsonData.json')
        const snapshot = { ...emptySnapshot }

        try {
            let payload
            try {
                payload = await readFilePayload(targetAffixPath)
            } catch {
                await saveFilePayload(targetAffixPath, '{}\n')
                payload = await readFilePayload(targetAffixPath)
            }
            const parsed = JSON.parse(payload.content) as unknown
            const normalized = normalizeAffixMap(parsed)
            snapshot.affixMap = normalized
        } catch {
            // ignore and continue
        }

        try {
            let payload
            try {
                payload = await readFilePayload(targetTalentPath)
            } catch {
                await saveFilePayload(targetTalentPath, '{}\n')
                payload = await readFilePayload(targetTalentPath)
            }
            const parsed = JSON.parse(payload.content) as unknown
            const normalized = normalizeTalentMap(parsed)
            const merged = await mergeTalentSeidFiles({
                source: normalized,
                modRootPath: targetModRoot,
                joinWinPath,
                loadProjectEntries,
                readFilePayload,
            })
            snapshot.talentMap = merged
        } catch {
            // ignore and continue
        }

        try {
            const loaded = await loadBuffFiles({
                modRootPath: targetModRoot,
                joinWinPath,
                loadProjectEntries,
                readFilePayload,
            })
            const merged = await mergeBuffSeidFiles({
                source: loaded,
                modRootPath: targetModRoot,
                joinWinPath,
                loadProjectEntries,
                readFilePayload,
            })
            snapshot.buffMap = merged
        } catch {
            // ignore and continue
        }

        try {
            const loaded = await loadItemFiles({
                modRootPath: targetModRoot,
                joinWinPath,
                loadProjectEntries,
                readFilePayload,
            })
            const merged = await mergeItemSeidFiles({
                source: loaded,
                modRootPath: targetModRoot,
                joinWinPath,
                loadProjectEntries,
                readFilePayload,
            })
            snapshot.itemMap = merged
        } catch {
            // ignore and continue
        }

        try {
            const loaded = await loadSkillFiles({
                modRootPath: targetModRoot,
                joinWinPath,
                loadProjectEntries,
                readFilePayload,
            })
            const merged = await mergeSkillSeidFiles({
                source: loaded,
                modRootPath: targetModRoot,
                joinWinPath,
                loadProjectEntries,
                readFilePayload,
            })
            snapshot.skillMap = merged
        } catch {
            // ignore and continue
        }

        try {
            let payload
            try {
                payload = await readFilePayload(targetStaticSkillPath)
            } catch {
                await saveFilePayload(targetStaticSkillPath, '{}\n')
                payload = await readFilePayload(targetStaticSkillPath)
            }
            const parsed = JSON.parse(payload.content) as unknown
            const normalized = normalizeStaticSkillMap(parsed)
            const merged = await mergeStaticSkillSeidFiles({
                source: normalized,
                modRootPath: targetModRoot,
                joinWinPath,
                loadProjectEntries,
                readFilePayload,
            })
            snapshot.staticSkillMap = merged
        } catch {
            // ignore and continue
        }

        return snapshot
    }

    function applyRootModuleSnapshot(targetModRoot: string, snapshot: RootModuleSnapshot) {
        const targetAffixPath = joinWinPath(targetModRoot, 'Data', 'TuJianChunWenBen.json')
        const targetTalentPath = joinWinPath(targetModRoot, 'Data', 'CreateAvatarJsonData.json')
        const targetBuffDirPath = joinWinPath(targetModRoot, 'Data', 'BuffJsonData')
        const targetItemDirPath = joinWinPath(targetModRoot, 'Data', 'ItemJsonData')
        const targetSkillDirPath = joinWinPath(targetModRoot, 'Data', 'skillJsonData')
        const targetStaticSkillPath = joinWinPath(targetModRoot, 'Data', 'StaticSkillJsonData.json')

        setAffixMap(snapshot.affixMap)
        setAffixCachePath(targetAffixPath)
        setAffixDirty(snapshot.affixDirty)
        const firstAffix = Object.keys(snapshot.affixMap).sort((a, b) => Number(a) - Number(b))[0] ?? ''
        setSelectedAffixKey(firstAffix)
        setSelectedAffixKeys(firstAffix ? [firstAffix] : [])
        setAffixSelectionAnchor(firstAffix)

        setTalentMap(snapshot.talentMap)
        setTalentPath(targetTalentPath)
        setTalentCachePath(targetTalentPath)
        setTalentDirty(snapshot.talentDirty)
        const firstTalent = Object.keys(snapshot.talentMap).sort((a, b) => Number(a) - Number(b))[0] ?? ''
        setSelectedTalentKey(firstTalent)
        setSelectedTalentKeys(firstTalent ? [firstTalent] : [])
        setTalentSelectionAnchor(firstTalent)

        setBuffMap(snapshot.buffMap)
        setBuffCachePath(targetBuffDirPath)
        setBuffDirty(snapshot.buffDirty)
        const firstBuff = Object.keys(snapshot.buffMap).sort((a, b) => Number(a) - Number(b))[0] ?? ''
        setSelectedBuffKey(firstBuff)
        setSelectedBuffKeys(firstBuff ? [firstBuff] : [])
        setBuffSelectionAnchor(firstBuff)

        setItemMap(snapshot.itemMap)
        setItemCachePath(targetItemDirPath)
        setItemDirty(snapshot.itemDirty)
        const firstItem = Object.keys(snapshot.itemMap).sort((a, b) => Number(a) - Number(b))[0] ?? ''
        setSelectedItemKey(firstItem)
        setSelectedItemKeys(firstItem ? [firstItem] : [])
        setItemSelectionAnchor(firstItem)

        setSkillMap(snapshot.skillMap)
        setSkillCachePath(targetSkillDirPath)
        setSkillDirty(snapshot.skillDirty)
        const firstSkill = Object.keys(snapshot.skillMap).sort((a, b) => Number(a) - Number(b))[0] ?? ''
        setSelectedSkillKey(firstSkill)
        setSelectedSkillKeys(firstSkill ? [firstSkill] : [])
        setSkillSelectionAnchor(firstSkill)

        setStaticSkillMap(snapshot.staticSkillMap)
        setStaticSkillCachePath(targetStaticSkillPath)
        setStaticSkillDirty(snapshot.staticSkillDirty)
        const firstStaticSkill = Object.keys(snapshot.staticSkillMap).sort((a, b) => Number(a) - Number(b))[0] ?? ''
        setSelectedStaticSkillKey(firstStaticSkill)
        setSelectedStaticSkillKeys(firstStaticSkill ? [firstStaticSkill] : [])
        setStaticSkillSelectionAnchor(firstStaticSkill)
    }

    async function loadConfigForm() {
        setViewMode('config-form')
        setActivePath(moduleConfigPath)
        if (!modRootPath || !moduleConfigPath) return
        if (configCachePath === moduleConfigPath) return
        try {
            let payload
            try {
                payload = await readFilePayload(moduleConfigPath)
            } catch {
                const name = pickProjectTail(projectPath) || '未命名项目'
                await saveFilePayload(
                    moduleConfigPath,
                    `{\n  "Name": "${name}",\n  "Author": "",\n  "Version": "0.0.1",\n  "Description": "",\n  "Settings": []\n}\n`
                )
                payload = await readFilePayload(moduleConfigPath)
            }
            const parsed = JSON.parse(payload.content) as Record<string, unknown>
            setRawConfigObject(parsed)
            setPreservedSettings(Object.prototype.hasOwnProperty.call(parsed, 'Settings') ? parsed.Settings : [])
            setConfigForm({
                name: String(parsed.Name ?? ''),
                author: String(parsed.Author ?? ''),
                version: String(parsed.Version ?? '0.0.1'),
                description: String(parsed.Description ?? ''),
            })
            setConfigCachePath(moduleConfigPath)
            setConfigDirty(false)
        } catch (error) {
            setStatus(`读取配置失败: ${String(error)}`)
        }
    }

    async function loadTalentTable() {
        setViewMode('table')
        setActivePath(createAvatarPath)
        if (!modRootPath || !createAvatarPath) return
        if (talentCachePath === createAvatarPath) {
            setStatus(talentDirty ? '已加载天赋数据（缓存，未保存）。' : '已加载天赋数据（缓存）。')
            return
        }
        await preloadMeta([modRootPath, projectPath, workspaceRoot], true)
        try {
            let payload
            try {
                payload = await readFilePayload(createAvatarPath)
            } catch {
                await saveFilePayload(createAvatarPath, '{}\n')
                payload = await readFilePayload(createAvatarPath)
            }
            let parsed: unknown = {}
            try {
                parsed = JSON.parse(payload.content)
            } catch {
                parsed = {}
            }
            const normalized = normalizeTalentMap(parsed)
            const baseData = normalized
            const finalData = await mergeTalentSeidFiles({
                source: baseData,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                readFilePayload,
            })
            const firstKey = Object.keys(finalData).sort((a, b) => Number(a) - Number(b))[0] ?? ''
            setTalentMap(finalData)
            setTalentPath(createAvatarPath)
            setTalentCachePath(createAvatarPath)
            setTalentDirty(false)
            setSelectedTalentKey(firstKey)
            setSelectedTalentKeys(firstKey ? [firstKey] : [])
            setTalentSelectionAnchor(firstKey)
            setStatus('已加载天赋数据（CreateAvatarJsonData）。')
        } catch (error) {
            setStatus(`读取天赋数据失败: ${String(error)}`)
        }
    }

    async function loadAffixTable() {
        setViewMode('table')
        setActivePath(affixPath)
        if (!modRootPath || !affixPath) return
        if (affixCachePath === affixPath) {
            setStatus(affixDirty ? '已加载词缀数据（缓存，未保存）。' : '已加载词缀数据（缓存）。')
            return
        }
        await loadAffixEnumMeta([modRootPath, projectPath, workspaceRoot], true)
        try {
            let payload
            try {
                payload = await readFilePayload(affixPath)
            } catch {
                await saveFilePayload(affixPath, '{}\n')
                payload = await readFilePayload(affixPath)
            }
            let parsed: unknown = {}
            try {
                parsed = JSON.parse(payload.content)
            } catch {
                parsed = {}
            }
            const normalized = normalizeAffixMap(parsed)
            const firstKey = Object.keys(normalized).sort((a, b) => Number(a) - Number(b))[0] ?? ''
            setAffixMap(normalized)
            setAffixCachePath(affixPath)
            setAffixDirty(false)
            setSelectedAffixKey(firstKey)
            setSelectedAffixKeys(firstKey ? [firstKey] : [])
            setAffixSelectionAnchor(firstKey)
            setStatus('已加载词缀数据（TuJianChunWenBen）。')
        } catch (error) {
            setStatus(`读取词缀数据失败: ${String(error)}`)
        }
    }

    async function loadBuffTable() {
        setViewMode('table')
        setActivePath(buffDirPath)
        if (!modRootPath || !buffDirPath) return
        if (buffCachePath === buffDirPath) {
            setStatus(buffDirty ? '已加载 Buff 数据（缓存，未保存）。' : '已加载 Buff 数据（缓存）。')
            return
        }
        await preloadMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadBuffSeidMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadBuffEnumMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadSpecialDrawerOptions([modRootPath, projectPath, workspaceRoot], modRootPath, true)
        try {
            const loaded = await loadBuffFiles({
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                readFilePayload,
            })
            const finalData = await mergeBuffSeidFiles({
                source: loaded,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                readFilePayload,
            })
            const firstKey = Object.keys(finalData).sort((a, b) => Number(a) - Number(b))[0] ?? ''
            setBuffMap(finalData)
            setBuffCachePath(buffDirPath)
            setBuffDirty(false)
            setSelectedBuffKey(firstKey)
            setSelectedBuffKeys(firstKey ? [firstKey] : [])
            setBuffSelectionAnchor(firstKey)
            setStatus('已加载 Buff 数据（BuffJsonData）。')
        } catch (error) {
            setStatus(`读取 Buff 数据失败: ${String(error)}`)
        }
    }

    async function loadItemTable() {
        setViewMode('table')
        setActivePath(itemDirPath)
        if (!modRootPath || !itemDirPath) return
        if (itemCachePath === itemDirPath) {
            setStatus(itemDirty ? '已加载 Item 数据（缓存，未保存）。' : '已加载 Item 数据（缓存）。')
            return
        }
        await preloadMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadItemSeidMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadItemEnumMeta([modRootPath, projectPath, workspaceRoot], true)
        try {
            const loaded = await loadItemFiles({
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                readFilePayload,
            })
            const finalData = await mergeItemSeidFiles({
                source: loaded,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                readFilePayload,
            })
            const firstKey = Object.keys(finalData).sort((a, b) => Number(a) - Number(b))[0] ?? ''
            setItemMap(finalData)
            setItemCachePath(itemDirPath)
            setItemDirty(false)
            setSelectedItemKey(firstKey)
            setSelectedItemKeys(firstKey ? [firstKey] : [])
            setItemSelectionAnchor(firstKey)
            setStatus('已加载 Item 数据（ItemJsonData）。')
        } catch (error) {
            setStatus(`读取 Item 数据失败: ${String(error)}`)
        }
    }

    async function loadSkillTable() {
        setViewMode('table')
        setActivePath(skillDirPath)
        if (!modRootPath || !skillDirPath) return
        if (skillCachePath === skillDirPath) {
            setStatus(skillDirty ? '已加载 Skill 数据（缓存，未保存）。' : '已加载 Skill 数据（缓存）。')
            return
        }
        await preloadMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadSkillSeidMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadSkillEnumMeta([modRootPath, projectPath, workspaceRoot], true)
        try {
            const loaded = await loadSkillFiles({
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                readFilePayload,
            })
            const finalData = await mergeSkillSeidFiles({
                source: loaded,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                readFilePayload,
            })
            const firstKey = Object.keys(finalData).sort((a, b) => Number(a) - Number(b))[0] ?? ''
            setSkillMap(finalData)
            setSkillCachePath(skillDirPath)
            setSkillDirty(false)
            setSelectedSkillKey(firstKey)
            setSelectedSkillKeys(firstKey ? [firstKey] : [])
            setSkillSelectionAnchor(firstKey)
            setStatus('已加载 Skill 数据（skillJsonData）。')
        } catch (error) {
            setStatus(`读取 Skill 数据失败: ${String(error)}`)
        }
    }

    async function loadStaticSkillTable() {
        setViewMode('table')
        setActivePath(staticSkillPath)
        if (!modRootPath || !staticSkillPath) return
        if (staticSkillCachePath === staticSkillPath) {
            setStatus(staticSkillDirty ? '已加载功法数据（缓存，未保存）。' : '已加载功法数据（缓存）。')
            return
        }
        await preloadMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadStaticSkillSeidMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadSkillEnumMeta([modRootPath, projectPath, workspaceRoot], true)
        try {
            let payload
            try {
                payload = await readFilePayload(staticSkillPath)
            } catch {
                await saveFilePayload(staticSkillPath, '{}\n')
                payload = await readFilePayload(staticSkillPath)
            }
            let parsed: unknown = {}
            try {
                parsed = JSON.parse(payload.content)
            } catch {
                parsed = {}
            }
            const normalized = normalizeStaticSkillMap(parsed)
            const finalData = await mergeStaticSkillSeidFiles({
                source: normalized,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                readFilePayload,
            })
            const firstKey = Object.keys(finalData).sort((a, b) => Number(a) - Number(b))[0] ?? ''
            setStaticSkillMap(finalData)
            setStaticSkillCachePath(staticSkillPath)
            setStaticSkillDirty(false)
            setSelectedStaticSkillKey(firstKey)
            setSelectedStaticSkillKeys(firstKey ? [firstKey] : [])
            setStaticSkillSelectionAnchor(firstKey)
            setStatus('已加载功法数据（StaticSkillJsonData）。')
        } catch (error) {
            setStatus(`读取功法数据失败: ${String(error)}`)
        }
    }

    async function handleSelectModule(key: ModuleKey) {
        setActiveModule(key)
        setTableSearchText('')
        if (key === 'project-config') {
            await loadConfigForm()
            return
        }
        if (key === 'talent') {
            await loadTalentTable()
            return
        }
        if (key === 'affix') {
            await loadAffixTable()
            return
        }
        if (key === 'buff') {
            await loadBuffTable()
            return
        }
        if (key === 'item') {
            await loadItemTable()
            return
        }
        if (key === 'skill') {
            await loadSkillTable()
            return
        }
        if (key === 'staticskill') {
            await loadStaticSkillTable()
            return
        }
        setViewMode('todo')
        setActivePath('')
    }

    function handleSelectAffix(key: string, index: number, options: { shift: boolean; ctrl: boolean }) {
        const sourceRows = filteredAffixRows
        if (options.shift && affixSelectionAnchor) {
            const anchorIndex = sourceRows.findIndex(row => row.key === affixSelectionAnchor)
            if (anchorIndex >= 0) {
                const [start, end] = anchorIndex <= index ? [anchorIndex, index] : [index, anchorIndex]
                const nextKeys = sourceRows.slice(start, end + 1).map(row => row.key)
                setSelectedAffixKeys(nextKeys)
                setSelectedAffixKey(key)
                return
            }
        }

        if (options.ctrl) {
            setSelectedAffixKeys(prev => {
                if (prev.includes(key)) {
                    const next = prev.filter(item => item !== key)
                    const active = next[next.length - 1] ?? ''
                    setSelectedAffixKey(active)
                    return next
                }
                return [...prev, key]
            })
            setSelectedAffixKey(key)
            setAffixSelectionAnchor(key)
            return
        }

        setSelectedAffixKeys([key])
        setSelectedAffixKey(key)
        setAffixSelectionAnchor(key)
    }

    function handleDeleteAffixes() {
        const targets = selectedAffixKeys.length > 0 ? selectedAffixKeys : selectedAffixKey ? [selectedAffixKey] : []
        if (targets.length === 0) return
        const targetSet = new Set(targets)
        const remainingRows = affixRows.filter(row => !targetSet.has(row.key))
        const nextActive = remainingRows[0]?.key ?? ''

        setAffixMap(prev => {
            const draft = { ...prev }
            targets.forEach(key => {
                delete draft[key]
            })
            return draft
        })
        setSelectedAffixKey(nextActive)
        setSelectedAffixKeys(nextActive ? [nextActive] : [])
        setAffixSelectionAnchor(nextActive)
        setAffixDirty(true)
        setStatus(`已删除 ${targets.length} 条词缀数据。`)
    }

    function handleBatchPrefixAffixIds(prefix: string) {
        if (!/^\d+$/.test(prefix)) {
            setStatus('批量修改ID失败：请输入数字开头。')
            return
        }
        const targets = selectedAffixKeys.length > 0 ? selectedAffixKeys : selectedAffixKey ? [selectedAffixKey] : []
        if (targets.length === 0) {
            setStatus('请先选中要修改的词缀。')
            return
        }
        const orderedTargets = [...targets].sort((a, b) => (affixMap[a]?.id ?? 0) - (affixMap[b]?.id ?? 0))
        const nextKeys = orderedTargets.map((_, index) => String(Number(prefix) + index))
        const nextKeySet = new Set(nextKeys)
        if (nextKeySet.size !== nextKeys.length) {
            setStatus('批量修改ID失败：新ID出现重复。')
            return
        }
        const occupied = new Set(Object.keys(affixMap).filter(key => !orderedTargets.includes(key)))
        const conflict = nextKeys.find(key => occupied.has(key))
        if (conflict) {
            setStatus(`批量修改ID失败：目标ID ${conflict} 已存在。`)
            return
        }

        setAffixMap(prev => {
            const draft = { ...prev }
            orderedTargets.forEach(oldKey => delete draft[oldKey])
            orderedTargets.forEach((oldKey, index) => {
                const nextKey = nextKeys[index]
                const row = prev[oldKey]
                if (!row) return
                draft[nextKey] = { ...row, id: Number(nextKey) }
            })
            return draft
        })
        const nextActive = nextKeys[0] ?? ''
        setSelectedAffixKey(nextActive)
        setSelectedAffixKeys(nextKeys)
        setAffixSelectionAnchor(nextActive)
        setAffixDirty(true)
        setStatus(`已批量修改 ${targets.length} 条ID，开头为 ${prefix}。`)
    }

    function handleAddAffix(id: number) {
        const key = String(id)
        setAddAffixOpen(false)
        if (affixMap[key]) {
            setSelectedAffixKey(key)
            setSelectedAffixKeys([key])
            setAffixSelectionAnchor(key)
            setStatus(`ID ${id} 已存在，已定位到该条目。`)
            return
        }
        setAffixMap(prev => ({ ...prev, [key]: createEmptyAffix(id) }))
        setSelectedAffixKey(key)
        setSelectedAffixKeys([key])
        setAffixSelectionAnchor(key)
        setAffixDirty(true)
    }

    function handleCopyAffix() {
        const targets = selectedAffixKeys.length > 0 ? selectedAffixKeys : selectedAffixKey ? [selectedAffixKey] : []
        if (targets.length === 0) return
        const copied = targets
            .map(key => affixMap[key])
            .filter((item): item is AffixEntry => Boolean(item))
            .sort((a, b) => a.id - b.id)
            .map(item => cloneAffixEntry(item))
        if (copied.length === 0) return
        setAffixClipboard(copied)
        setStatus(copied.length === 1 ? `已复制词缀 ${copied[0].id}` : `已复制 ${copied.length} 条词缀数据`)
    }

    function handlePasteAffix() {
        if (affixClipboard.length === 0) return
        const existingKeys = new Set(Object.keys(affixMap))
        const inserts: Array<{ key: string; row: AffixEntry }> = []
        const conflicts: AffixEntry[] = []

        affixClipboard.forEach(item => {
            const id = Number(item.id)
            if (!Number.isFinite(id) || id <= 0) return
            const key = String(id)
            if (existingKeys.has(key)) {
                conflicts.push(item)
                return
            }
            inserts.push({ key, row: { ...cloneAffixEntry(item), id } })
            existingKeys.add(key)
        })

        if (conflicts.length > 0) {
            const prefixText = window.prompt(`检测到 ${conflicts.length} 条ID重复，请输入新的ID前缀（例如 70）`)
            if (prefixText === null) return
            const prefix = prefixText.trim()
            if (!/^\d+$/.test(prefix)) {
                setStatus('粘贴失败：请输入数字前缀。')
                return
            }
            for (let index = 0; index < conflicts.length; index += 1) {
                const nextKey = String(Number(`${prefix}${index + 1}`))
                if (existingKeys.has(nextKey)) {
                    setStatus(`粘贴失败：批量重命名ID冲突（${nextKey}）。`)
                    return
                }
                inserts.push({ key: nextKey, row: { ...cloneAffixEntry(conflicts[index]), id: Number(nextKey) } })
                existingKeys.add(nextKey)
            }
        }
        if (inserts.length === 0) return
        setAffixMap(prev => {
            const draft = { ...prev }
            inserts.forEach(({ key, row }) => {
                draft[key] = row
            })
            return draft
        })
        const nextKeys = inserts.map(item => item.key)
        setSelectedAffixKey(nextKeys[0] ?? '')
        setSelectedAffixKeys(nextKeys)
        setAffixSelectionAnchor(nextKeys[0] ?? '')
        setAffixDirty(true)
        setStatus(`已粘贴 ${inserts.length} 条词缀数据。`)
    }

    function handleChangeAffixForm(patch: Partial<AffixEntry>) {
        if (!selectedAffixKey || !affixMap[selectedAffixKey]) return
        const current = affixMap[selectedAffixKey]
        const next = { ...current, ...patch }
        const nextId = Number(next.id || 0)
        if (!Number.isFinite(nextId) || nextId <= 0) return
        const nextKey = String(nextId)

        setAffixMap(prev => {
            if (nextKey !== selectedAffixKey && prev[nextKey]) {
                setStatus(`ID ${nextId} 已存在，不能重复。`)
                return prev
            }
            const draft = { ...prev }
            delete draft[selectedAffixKey]
            draft[nextKey] = { ...next, id: nextId }
            return draft
        })
        setSelectedAffixKey(nextKey)
        setSelectedAffixKeys(prev =>
            prev.map(key => (key === selectedAffixKey ? nextKey : key)).filter((key, idx, arr) => arr.indexOf(key) === idx)
        )
        setAffixSelectionAnchor(nextKey)
        setAffixDirty(true)
    }

    function handleSelectTalent(key: string, index: number, options: { shift: boolean; ctrl: boolean }) {
        const sourceRows = filteredAvatarRows
        if (options.shift && talentSelectionAnchor) {
            const anchorIndex = sourceRows.findIndex(row => row.key === talentSelectionAnchor)
            if (anchorIndex >= 0) {
                const [start, end] = anchorIndex <= index ? [anchorIndex, index] : [index, anchorIndex]
                const nextKeys = sourceRows.slice(start, end + 1).map(row => row.key)
                setSelectedTalentKeys(nextKeys)
                setSelectedTalentKey(key)
                return
            }
        }

        if (options.ctrl) {
            setSelectedTalentKeys(prev => {
                if (prev.includes(key)) {
                    const next = prev.filter(item => item !== key)
                    const active = next[next.length - 1] ?? ''
                    setSelectedTalentKey(active)
                    return next
                }
                return [...prev, key]
            })
            setSelectedTalentKey(key)
            setTalentSelectionAnchor(key)
            return
        }

        setSelectedTalentKeys([key])
        setSelectedTalentKey(key)
        setTalentSelectionAnchor(key)
    }

    function handleDeleteTalents() {
        const targets = selectedTalentKeys.length > 0 ? selectedTalentKeys : selectedTalentKey ? [selectedTalentKey] : []
        if (targets.length === 0) return
        const targetSet = new Set(targets)
        const remainingRows = avatarRows.filter(row => !targetSet.has(row.key))
        const nextActive = remainingRows[0]?.key ?? ''

        setTalentMap(prev => {
            const draft = { ...prev }
            targets.forEach(key => {
                delete draft[key]
            })
            return draft
        })
        setSelectedTalentKey(nextActive)
        setSelectedTalentKeys(nextActive ? [nextActive] : [])
        setTalentSelectionAnchor(nextActive)
        setTalentDirty(true)
        setStatus(`已删除 ${targets.length} 条天赋数据。`)
    }

    function handleBatchPrefixIds(prefix: string) {
        if (!/^\d+$/.test(prefix)) {
            setStatus('批量修改ID失败：请输入数字开头。')
            return
        }
        const targets = selectedTalentKeys.length > 0 ? selectedTalentKeys : selectedTalentKey ? [selectedTalentKey] : []
        if (targets.length === 0) {
            setStatus('请先选中要修改的天赋。')
            return
        }

        const orderedTargets = [...targets].sort((a, b) => (talentMap[a]?.id ?? 0) - (talentMap[b]?.id ?? 0))
        const nextKeys = orderedTargets.map((_, index) => String(Number(prefix) + index))
        const nextKeySet = new Set(nextKeys)
        if (nextKeySet.size !== nextKeys.length) {
            setStatus('批量修改ID失败：新ID出现重复。')
            return
        }

        const occupied = new Set(Object.keys(talentMap).filter(key => !orderedTargets.includes(key)))
        const conflict = nextKeys.find(key => occupied.has(key))
        if (conflict) {
            setStatus(`批量修改ID失败：目标ID ${conflict} 已存在。`)
            return
        }

        setTalentMap(prev => {
            const draft = { ...prev }
            orderedTargets.forEach(oldKey => delete draft[oldKey])
            orderedTargets.forEach((oldKey, index) => {
                const nextKey = nextKeys[index]
                const row = prev[oldKey]
                if (!row) return
                draft[nextKey] = { ...row, id: Number(nextKey) }
            })
            return draft
        })

        const nextActive = nextKeys[0] ?? ''
        setSelectedTalentKey(nextActive)
        setSelectedTalentKeys(nextKeys)
        setTalentSelectionAnchor(nextActive)
        setTalentDirty(true)
        setStatus(`已批量修改 ${targets.length} 条ID，开头为 ${prefix}。`)
    }

    function handleAddTalent(id: number) {
        const key = String(id)
        setAddTalentOpen(false)
        if (talentMap[key]) {
            setSelectedTalentKey(key)
            setSelectedTalentKeys([key])
            setTalentSelectionAnchor(key)
            setStatus(`ID ${id} 已存在，已定位到该条目。`)
            return
        }
        setTalentMap(prev => ({ ...prev, [key]: createEmptyTalent(id) }))
        setSelectedTalentKey(key)
        setSelectedTalentKeys([key])
        setTalentSelectionAnchor(key)
        setTalentDirty(true)
    }

    function handleCopyTalent() {
        const targets = selectedTalentKeys.length > 0 ? selectedTalentKeys : selectedTalentKey ? [selectedTalentKey] : []
        if (targets.length === 0) return
        const copied = targets
            .map(key => talentMap[key])
            .filter((item): item is CreateAvatarEntry => Boolean(item))
            .sort((a, b) => a.id - b.id)
            .map(item => cloneTalentEntry(item))
        if (copied.length === 0) return
        setTalentClipboard(copied)
        setStatus(copied.length === 1 ? `已复制天赋 ${copied[0].id}` : `已复制 ${copied.length} 条天赋数据`)
    }

    function handlePasteTalent() {
        if (talentClipboard.length === 0) return
        const existingKeys = new Set(Object.keys(talentMap))
        const inserts: Array<{ key: string; row: CreateAvatarEntry }> = []
        const conflicts: CreateAvatarEntry[] = []

        talentClipboard.forEach(item => {
            const id = Number(item.id)
            if (!Number.isFinite(id) || id <= 0) return
            const key = String(id)
            if (existingKeys.has(key)) {
                conflicts.push(item)
                return
            }
            const row = { ...cloneTalentEntry(item), id }
            inserts.push({ key, row })
            existingKeys.add(key)
        })

        if (conflicts.length > 0) {
            const prefixText = window.prompt(`检测到 ${conflicts.length} 条ID重复，请输入新的ID前缀（例如 50）`)
            if (prefixText === null) return
            const prefix = prefixText.trim()
            if (!/^\d+$/.test(prefix)) {
                setStatus('粘贴失败：请输入数字前缀。')
                return
            }
            for (let index = 0; index < conflicts.length; index += 1) {
                const nextKey = String(Number(`${prefix}${index + 1}`))
                if (existingKeys.has(nextKey)) {
                    setStatus(`粘贴失败：批量重命名ID冲突（${nextKey}）。`)
                    return
                }
                const row = { ...cloneTalentEntry(conflicts[index]), id: Number(nextKey) }
                inserts.push({ key: nextKey, row })
                existingKeys.add(nextKey)
            }
        }

        if (inserts.length === 0) return
        setTalentMap(prev => {
            const draft = { ...prev }
            inserts.forEach(({ key, row }) => {
                draft[key] = row
            })
            return draft
        })
        const nextKeys = inserts.map(item => item.key)
        setSelectedTalentKey(nextKeys[0] ?? '')
        setSelectedTalentKeys(nextKeys)
        setTalentSelectionAnchor(nextKeys[0] ?? '')
        setTalentDirty(true)
        setStatus(`已粘贴 ${inserts.length} 条天赋数据。`)
    }

    function handleChangeTalentForm(patch: Partial<CreateAvatarEntry>) {
        if (!selectedTalentKey || !talentMap[selectedTalentKey]) return
        const current = talentMap[selectedTalentKey]
        const option =
            typeof patch.fenLeiGuanLian === 'number' ? talentTypeOptions.find(item => item.id === patch.fenLeiGuanLian) : undefined
        const normalizedPatch = typeof patch.fenLeiGuanLian === 'number' ? { ...patch, fenLei: option?.name ?? '' } : patch
        const next = { ...current, ...normalizedPatch }
        const nextId = Number(next.id || 0)
        if (!Number.isFinite(nextId) || nextId <= 0) return
        const nextKey = String(nextId)

        setTalentMap(prev => {
            if (nextKey !== selectedTalentKey && prev[nextKey]) {
                setStatus(`ID ${nextId} 已存在，不能重复。`)
                return prev
            }
            const draft = { ...prev }
            delete draft[selectedTalentKey]
            draft[nextKey] = { ...next, id: nextId }
            return draft
        })
        setSelectedTalentKey(nextKey)
        setSelectedTalentKeys(prev =>
            prev.map(key => (key === selectedTalentKey ? nextKey : key)).filter((key, idx, arr) => arr.indexOf(key) === idx)
        )
        setTalentSelectionAnchor(nextKey)
        setTalentDirty(true)
    }

    function handleSelectBuff(key: string, index: number, options: { shift: boolean; ctrl: boolean }) {
        const sourceRows = filteredBuffRows
        if (options.shift && buffSelectionAnchor) {
            const anchorIndex = sourceRows.findIndex(row => row.key === buffSelectionAnchor)
            if (anchorIndex >= 0) {
                const [start, end] = anchorIndex <= index ? [anchorIndex, index] : [index, anchorIndex]
                const nextKeys = sourceRows.slice(start, end + 1).map(row => row.key)
                setSelectedBuffKeys(nextKeys)
                setSelectedBuffKey(key)
                return
            }
        }

        if (options.ctrl) {
            setSelectedBuffKeys(prev => {
                if (prev.includes(key)) {
                    const next = prev.filter(item => item !== key)
                    const active = next[next.length - 1] ?? ''
                    setSelectedBuffKey(active)
                    return next
                }
                return [...prev, key]
            })
            setSelectedBuffKey(key)
            setBuffSelectionAnchor(key)
            return
        }

        setSelectedBuffKeys([key])
        setSelectedBuffKey(key)
        setBuffSelectionAnchor(key)
    }

    function handleDeleteBuffs() {
        const targets = selectedBuffKeys.length > 0 ? selectedBuffKeys : selectedBuffKey ? [selectedBuffKey] : []
        if (targets.length === 0) return
        const targetSet = new Set(targets)
        const remainingRows = buffRows.filter(row => !targetSet.has(row.key))
        const nextActive = remainingRows[0]?.key ?? ''

        setBuffMap(prev => {
            const draft = { ...prev }
            targets.forEach(key => {
                delete draft[key]
            })
            return draft
        })
        setSelectedBuffKey(nextActive)
        setSelectedBuffKeys(nextActive ? [nextActive] : [])
        setBuffSelectionAnchor(nextActive)
        setBuffDirty(true)
        setStatus(`已删除 ${targets.length} 条 Buff 数据。`)
    }

    function handleBatchPrefixBuffIds(prefix: string) {
        if (!/^\d+$/.test(prefix)) {
            setStatus('批量修改ID失败：请输入数字开头。')
            return
        }
        const targets = selectedBuffKeys.length > 0 ? selectedBuffKeys : selectedBuffKey ? [selectedBuffKey] : []
        if (targets.length === 0) {
            setStatus('请先选中要修改的 Buff。')
            return
        }

        const orderedTargets = [...targets].sort((a, b) => (buffMap[a]?.buffid ?? 0) - (buffMap[b]?.buffid ?? 0))
        const nextKeys = orderedTargets.map((_, index) => String(Number(prefix) + index))
        const nextKeySet = new Set(nextKeys)
        if (nextKeySet.size !== nextKeys.length) {
            setStatus('批量修改ID失败：新ID出现重复。')
            return
        }
        const occupied = new Set(Object.keys(buffMap).filter(key => !orderedTargets.includes(key)))
        const conflict = nextKeys.find(key => occupied.has(key))
        if (conflict) {
            setStatus(`批量修改ID失败：目标ID ${conflict} 已存在。`)
            return
        }

        setBuffMap(prev => {
            const draft = { ...prev }
            orderedTargets.forEach(oldKey => delete draft[oldKey])
            orderedTargets.forEach((oldKey, index) => {
                const nextKey = nextKeys[index]
                const row = prev[oldKey]
                if (!row) return
                draft[nextKey] = { ...row, buffid: Number(nextKey) }
            })
            return draft
        })
        const nextActive = nextKeys[0] ?? ''
        setSelectedBuffKey(nextActive)
        setSelectedBuffKeys(nextKeys)
        setBuffSelectionAnchor(nextActive)
        setBuffDirty(true)
        setStatus(`已批量修改 ${targets.length} 条 Buff ID，开头为 ${prefix}。`)
    }

    function handleAddBuff(id: number) {
        const key = String(id)
        setAddBuffOpen(false)
        if (buffMap[key]) {
            setSelectedBuffKey(key)
            setSelectedBuffKeys([key])
            setBuffSelectionAnchor(key)
            setStatus(`Buff ID ${id} 已存在，已定位到该条目。`)
            return
        }
        setBuffMap(prev => ({ ...prev, [key]: createEmptyBuff(id) }))
        setSelectedBuffKey(key)
        setSelectedBuffKeys([key])
        setBuffSelectionAnchor(key)
        setBuffDirty(true)
    }

    function handleCopyBuff() {
        const targets = selectedBuffKeys.length > 0 ? selectedBuffKeys : selectedBuffKey ? [selectedBuffKey] : []
        if (targets.length === 0) return
        const copied = targets
            .map(key => buffMap[key])
            .filter((item): item is BuffEntry => Boolean(item))
            .sort((a, b) => a.buffid - b.buffid)
            .map(item => cloneBuffEntry(item))
        if (copied.length === 0) return
        setBuffClipboard(copied)
        setStatus(copied.length === 1 ? `已复制 Buff ${copied[0].buffid}` : `已复制 ${copied.length} 条 Buff 数据`)
    }

    function handlePasteBuff() {
        if (buffClipboard.length === 0) return
        const existingKeys = new Set(Object.keys(buffMap))
        const inserts: Array<{ key: string; row: BuffEntry }> = []
        const conflicts: BuffEntry[] = []

        buffClipboard.forEach(item => {
            const id = Number(item.buffid)
            if (!Number.isFinite(id) || id <= 0) return
            const key = String(id)
            if (existingKeys.has(key)) {
                conflicts.push(item)
                return
            }
            const row = { ...cloneBuffEntry(item), buffid: id }
            inserts.push({ key, row })
            existingKeys.add(key)
        })

        if (conflicts.length > 0) {
            const prefixText = window.prompt(`检测到 ${conflicts.length} 条Buff ID重复，请输入新的ID前缀（例如 52）`)
            if (prefixText === null) return
            const prefix = prefixText.trim()
            if (!/^\d+$/.test(prefix)) {
                setStatus('粘贴失败：请输入数字前缀。')
                return
            }
            for (let index = 0; index < conflicts.length; index += 1) {
                const nextKey = String(Number(`${prefix}${index + 1}`))
                if (existingKeys.has(nextKey)) {
                    setStatus(`粘贴失败：批量重命名ID冲突（${nextKey}）。`)
                    return
                }
                const row = { ...cloneBuffEntry(conflicts[index]), buffid: Number(nextKey) }
                inserts.push({ key: nextKey, row })
                existingKeys.add(nextKey)
            }
        }

        if (inserts.length === 0) return
        setBuffMap(prev => {
            const draft = { ...prev }
            inserts.forEach(({ key, row }) => {
                draft[key] = row
            })
            return draft
        })
        const nextKeys = inserts.map(item => item.key)
        setSelectedBuffKey(nextKeys[0] ?? '')
        setSelectedBuffKeys(nextKeys)
        setBuffSelectionAnchor(nextKeys[0] ?? '')
        setBuffDirty(true)
        setStatus(`已粘贴 ${inserts.length} 条 Buff 数据。`)
    }

    function handleChangeBuffForm(patch: Partial<BuffEntry>) {
        if (!selectedBuffKey || !buffMap[selectedBuffKey]) return
        const current = buffMap[selectedBuffKey]
        const next = { ...current, ...patch }
        const nextId = Number(next.buffid || 0)
        if (!Number.isFinite(nextId) || nextId <= 0) return
        const nextKey = String(nextId)

        setBuffMap(prev => {
            if (nextKey !== selectedBuffKey && prev[nextKey]) {
                setStatus(`Buff ID ${nextId} 已存在，不能重复。`)
                return prev
            }
            const draft = { ...prev }
            delete draft[selectedBuffKey]
            draft[nextKey] = { ...next, buffid: nextId }
            return draft
        })
        setSelectedBuffKey(nextKey)
        setSelectedBuffKeys(prev =>
            prev.map(key => (key === selectedBuffKey ? nextKey : key)).filter((key, idx, arr) => arr.indexOf(key) === idx)
        )
        setBuffSelectionAnchor(nextKey)
        setBuffDirty(true)
    }

    function handleSelectItem(key: string, index: number, options: { shift: boolean; ctrl: boolean }) {
        const sourceRows = filteredItemRows
        if (options.shift && itemSelectionAnchor) {
            const anchorIndex = sourceRows.findIndex(row => row.key === itemSelectionAnchor)
            if (anchorIndex >= 0) {
                const [start, end] = anchorIndex <= index ? [anchorIndex, index] : [index, anchorIndex]
                const nextKeys = sourceRows.slice(start, end + 1).map(row => row.key)
                setSelectedItemKeys(nextKeys)
                setSelectedItemKey(key)
                return
            }
        }
        if (options.ctrl) {
            setSelectedItemKeys(prev => {
                if (prev.includes(key)) {
                    const next = prev.filter(item => item !== key)
                    const active = next[next.length - 1] ?? ''
                    setSelectedItemKey(active)
                    return next
                }
                return [...prev, key]
            })
            setSelectedItemKey(key)
            setItemSelectionAnchor(key)
            return
        }
        setSelectedItemKeys([key])
        setSelectedItemKey(key)
        setItemSelectionAnchor(key)
    }

    function handleDeleteItems() {
        const targets = selectedItemKeys.length > 0 ? selectedItemKeys : selectedItemKey ? [selectedItemKey] : []
        if (targets.length === 0) return
        const targetSet = new Set(targets)
        const remainingRows = itemRows.filter(row => !targetSet.has(row.key))
        const nextActive = remainingRows[0]?.key ?? ''
        setItemMap(prev => {
            const draft = { ...prev }
            targets.forEach(key => delete draft[key])
            return draft
        })
        setSelectedItemKey(nextActive)
        setSelectedItemKeys(nextActive ? [nextActive] : [])
        setItemSelectionAnchor(nextActive)
        setItemDirty(true)
        setStatus(`已删除 ${targets.length} 条 Item 数据。`)
    }

    function handleBatchPrefixItemIds(prefix: string) {
        if (!/^\d+$/.test(prefix)) {
            setStatus('批量修改ID失败：请输入数字开头。')
            return
        }
        const targets = selectedItemKeys.length > 0 ? selectedItemKeys : selectedItemKey ? [selectedItemKey] : []
        if (targets.length === 0) {
            setStatus('请先选中要修改的 Item。')
            return
        }
        const orderedTargets = [...targets].sort((a, b) => (itemMap[a]?.id ?? 0) - (itemMap[b]?.id ?? 0))
        const nextKeys = orderedTargets.map((_, index) => String(Number(prefix) + index))
        const nextKeySet = new Set(nextKeys)
        if (nextKeySet.size !== nextKeys.length) {
            setStatus('批量修改ID失败：新ID出现重复。')
            return
        }
        const occupied = new Set(Object.keys(itemMap).filter(key => !orderedTargets.includes(key)))
        const conflict = nextKeys.find(key => occupied.has(key))
        if (conflict) {
            setStatus(`批量修改ID失败：目标ID ${conflict} 已存在。`)
            return
        }
        setItemMap(prev => {
            const draft = { ...prev }
            orderedTargets.forEach(oldKey => delete draft[oldKey])
            orderedTargets.forEach((oldKey, index) => {
                const nextKey = nextKeys[index]
                const row = prev[oldKey]
                if (!row) return
                draft[nextKey] = { ...row, id: Number(nextKey) }
            })
            return draft
        })
        const nextActive = nextKeys[0] ?? ''
        setSelectedItemKey(nextActive)
        setSelectedItemKeys(nextKeys)
        setItemSelectionAnchor(nextActive)
        setItemDirty(true)
    }

    function handleAddItem(id: number) {
        const key = String(id)
        setAddItemOpen(false)
        if (itemMap[key]) {
            setSelectedItemKey(key)
            setSelectedItemKeys([key])
            setItemSelectionAnchor(key)
            setStatus(`Item ID ${id} 已存在，已定位到该条目。`)
            return
        }
        setItemMap(prev => ({ ...prev, [key]: createEmptyItem(id) }))
        setSelectedItemKey(key)
        setSelectedItemKeys([key])
        setItemSelectionAnchor(key)
        setItemDirty(true)
    }

    function handleCopyItem() {
        const targets = selectedItemKeys.length > 0 ? selectedItemKeys : selectedItemKey ? [selectedItemKey] : []
        if (targets.length === 0) return
        const copied = targets
            .map(key => itemMap[key])
            .filter((item): item is ItemEntry => Boolean(item))
            .sort((a, b) => a.id - b.id)
            .map(item => cloneItemEntry(item))
        if (copied.length === 0) return
        setItemClipboard(copied)
        setStatus(copied.length === 1 ? `已复制 Item ${copied[0].id}` : `已复制 ${copied.length} 条 Item 数据`)
    }

    function handlePasteItem() {
        if (itemClipboard.length === 0) return
        const existingKeys = new Set(Object.keys(itemMap))
        const inserts: Array<{ key: string; row: ItemEntry }> = []
        const conflicts: ItemEntry[] = []
        itemClipboard.forEach(item => {
            const id = Number(item.id)
            if (!Number.isFinite(id) || id <= 0) return
            const key = String(id)
            if (existingKeys.has(key)) {
                conflicts.push(item)
                return
            }
            inserts.push({ key, row: { ...cloneItemEntry(item), id } })
            existingKeys.add(key)
        })
        if (conflicts.length > 0) {
            const prefixText = window.prompt(`检测到 ${conflicts.length} 条Item ID重复，请输入新的ID前缀（例如 52）`)
            if (prefixText === null) return
            const prefix = prefixText.trim()
            if (!/^\d+$/.test(prefix)) {
                setStatus('粘贴失败：请输入数字前缀。')
                return
            }
            for (let index = 0; index < conflicts.length; index += 1) {
                const nextKey = String(Number(`${prefix}${index + 1}`))
                if (existingKeys.has(nextKey)) {
                    setStatus(`粘贴失败：批量重命名ID冲突（${nextKey}）。`)
                    return
                }
                inserts.push({ key: nextKey, row: { ...cloneItemEntry(conflicts[index]), id: Number(nextKey) } })
                existingKeys.add(nextKey)
            }
        }
        if (inserts.length === 0) return
        setItemMap(prev => {
            const draft = { ...prev }
            inserts.forEach(({ key, row }) => {
                draft[key] = row
            })
            return draft
        })
        const nextKeys = inserts.map(item => item.key)
        setSelectedItemKey(nextKeys[0] ?? '')
        setSelectedItemKeys(nextKeys)
        setItemSelectionAnchor(nextKeys[0] ?? '')
        setItemDirty(true)
    }

    function handleChangeItemForm(patch: Partial<ItemEntry>) {
        if (!selectedItemKey || !itemMap[selectedItemKey]) return
        const current = itemMap[selectedItemKey]
        const next = { ...current, ...patch }
        const nextId = Number(next.id || 0)
        if (!Number.isFinite(nextId) || nextId <= 0) return
        const nextKey = String(nextId)
        setItemMap(prev => {
            if (nextKey !== selectedItemKey && prev[nextKey]) {
                setStatus(`Item ID ${nextId} 已存在，不能重复。`)
                return prev
            }
            const draft = { ...prev }
            delete draft[selectedItemKey]
            draft[nextKey] = { ...next, id: nextId }
            return draft
        })
        setSelectedItemKey(nextKey)
        setSelectedItemKeys(prev =>
            prev.map(key => (key === selectedItemKey ? nextKey : key)).filter((key, idx, arr) => arr.indexOf(key) === idx)
        )
        setItemSelectionAnchor(nextKey)
        setItemDirty(true)
    }

    function handleSelectSkill(key: string, index: number, options: { shift: boolean; ctrl: boolean }) {
        const sourceRows = filteredSkillRows
        if (options.shift && skillSelectionAnchor) {
            const anchorIndex = sourceRows.findIndex(row => row.key === skillSelectionAnchor)
            if (anchorIndex >= 0) {
                const [start, end] = anchorIndex <= index ? [anchorIndex, index] : [index, anchorIndex]
                const nextKeys = sourceRows.slice(start, end + 1).map(row => row.key)
                setSelectedSkillKeys(nextKeys)
                setSelectedSkillKey(key)
                return
            }
        }
        if (options.ctrl) {
            setSelectedSkillKeys(prev => {
                if (prev.includes(key)) {
                    const next = prev.filter(item => item !== key)
                    const active = next[next.length - 1] ?? ''
                    setSelectedSkillKey(active)
                    return next
                }
                return [...prev, key]
            })
            setSelectedSkillKey(key)
            setSkillSelectionAnchor(key)
            return
        }
        setSelectedSkillKeys([key])
        setSelectedSkillKey(key)
        setSkillSelectionAnchor(key)
    }

    function handleDeleteSkills() {
        const targets = selectedSkillKeys.length > 0 ? selectedSkillKeys : selectedSkillKey ? [selectedSkillKey] : []
        if (targets.length === 0) return
        const targetSet = new Set(targets)
        const remainingRows = skillRows.filter(row => !targetSet.has(row.key))
        const nextActive = remainingRows[0]?.key ?? ''

        setSkillMap(prev => {
            const draft = { ...prev }
            targets.forEach(key => delete draft[key])
            return draft
        })
        setSelectedSkillKey(nextActive)
        setSelectedSkillKeys(nextActive ? [nextActive] : [])
        setSkillSelectionAnchor(nextActive)
        setSkillDirty(true)
        setStatus(`已删除 ${targets.length} 条 Skill 数据。`)
    }

    function handleBatchPrefixSkillIds(prefix: string) {
        if (!/^\d+$/.test(prefix)) {
            setStatus('批量修改ID失败：请输入数字开头。')
            return
        }
        const targets = selectedSkillKeys.length > 0 ? selectedSkillKeys : selectedSkillKey ? [selectedSkillKey] : []
        if (targets.length === 0) {
            setStatus('请先选中要修改的 Skill。')
            return
        }
        const orderedTargets = [...targets].sort((a, b) => (skillMap[a]?.id ?? 0) - (skillMap[b]?.id ?? 0))
        const nextKeys = orderedTargets.map((_, index) => String(Number(prefix) + index))
        const nextKeySet = new Set(nextKeys)
        if (nextKeySet.size !== nextKeys.length) {
            setStatus('批量修改ID失败：新ID出现重复。')
            return
        }
        const occupied = new Set(Object.keys(skillMap).filter(key => !orderedTargets.includes(key)))
        const conflict = nextKeys.find(key => occupied.has(key))
        if (conflict) {
            setStatus(`批量修改ID失败：目标ID ${conflict} 已存在。`)
            return
        }

        setSkillMap(prev => {
            const draft = { ...prev }
            orderedTargets.forEach(oldKey => delete draft[oldKey])
            orderedTargets.forEach((oldKey, index) => {
                const nextKey = nextKeys[index]
                const row = prev[oldKey]
                if (!row) return
                draft[nextKey] = { ...row, id: Number(nextKey) }
            })
            return draft
        })
        const nextActive = nextKeys[0] ?? ''
        setSelectedSkillKey(nextActive)
        setSelectedSkillKeys(nextKeys)
        setSkillSelectionAnchor(nextActive)
        setSkillDirty(true)
        setStatus(`已批量修改 ${targets.length} 条 Skill 主ID，开头为 ${prefix}。`)
    }

    function handleAddSkill(id: number) {
        const key = String(id)
        setAddSkillOpen(false)
        if (skillMap[key]) {
            setSelectedSkillKey(key)
            setSelectedSkillKeys([key])
            setSkillSelectionAnchor(key)
            setStatus(`Skill ID ${id} 已存在，已定位到该条目。`)
            return
        }
        setSkillMap(prev => ({ ...prev, [key]: createEmptySkill(id) }))
        setSelectedSkillKey(key)
        setSelectedSkillKeys([key])
        setSkillSelectionAnchor(key)
        setSkillDirty(true)
    }

    function handleCopySkill() {
        const targets = selectedSkillKeys.length > 0 ? selectedSkillKeys : selectedSkillKey ? [selectedSkillKey] : []
        if (targets.length === 0) return
        const copied = targets
            .map(key => skillMap[key])
            .filter((item): item is SkillEntry => Boolean(item))
            .sort((a, b) => a.id - b.id)
            .map(item => cloneSkillEntry(item))
        if (copied.length === 0) return
        setSkillClipboard(copied)
        setStatus(copied.length === 1 ? `已复制 Skill ${copied[0].id}` : `已复制 ${copied.length} 条 Skill 数据`)
    }

    function handlePasteSkill() {
        if (skillClipboard.length === 0) return
        const existingKeys = new Set(Object.keys(skillMap))
        const inserts: Array<{ key: string; row: SkillEntry }> = []
        const conflicts: SkillEntry[] = []
        skillClipboard.forEach(item => {
            const id = Number(item.id)
            if (!Number.isFinite(id) || id <= 0) return
            const key = String(id)
            if (existingKeys.has(key)) {
                conflicts.push(item)
                return
            }
            inserts.push({ key, row: { ...cloneSkillEntry(item), id } })
            existingKeys.add(key)
        })
        if (conflicts.length > 0) {
            const prefixText = window.prompt(`检测到 ${conflicts.length} 条Skill 主ID重复，请输入新的ID前缀（例如 25）`)
            if (prefixText === null) return
            const prefix = prefixText.trim()
            if (!/^\d+$/.test(prefix)) {
                setStatus('粘贴失败：请输入数字前缀。')
                return
            }
            for (let index = 0; index < conflicts.length; index += 1) {
                const nextKey = String(Number(`${prefix}${index + 1}`))
                if (existingKeys.has(nextKey)) {
                    setStatus(`粘贴失败：批量重命名ID冲突（${nextKey}）。`)
                    return
                }
                inserts.push({ key: nextKey, row: { ...cloneSkillEntry(conflicts[index]), id: Number(nextKey) } })
                existingKeys.add(nextKey)
            }
        }
        if (inserts.length === 0) return
        setSkillMap(prev => {
            const draft = { ...prev }
            inserts.forEach(({ key, row }) => {
                draft[key] = row
            })
            return draft
        })
        const nextKeys = inserts.map(item => item.key)
        setSelectedSkillKey(nextKeys[0] ?? '')
        setSelectedSkillKeys(nextKeys)
        setSkillSelectionAnchor(nextKeys[0] ?? '')
        setSkillDirty(true)
        setStatus(`已粘贴 ${inserts.length} 条 Skill 数据。`)
    }

    function handleChangeSkillForm(patch: Partial<SkillEntry>) {
        if (!selectedSkillKey || !skillMap[selectedSkillKey]) return
        const current = skillMap[selectedSkillKey]
        const next = { ...current, ...patch }
        const nextId = Number(next.id || 0)
        if (!Number.isFinite(nextId) || nextId <= 0) return
        const nextKey = String(nextId)
        next.id = nextId

        setSkillMap(prev => {
            if (nextKey !== selectedSkillKey && prev[nextKey]) {
                setStatus(`Skill 主ID ${nextId} 已存在，不能重复。`)
                return prev
            }
            const draft = { ...prev }
            delete draft[selectedSkillKey]
            draft[nextKey] = next
            return draft
        })
        setSelectedSkillKey(nextKey)
        setSelectedSkillKeys(prev =>
            prev.map(key => (key === selectedSkillKey ? nextKey : key)).filter((key, idx, arr) => arr.indexOf(key) === idx)
        )
        setSkillSelectionAnchor(nextKey)
        setSkillDirty(true)
    }

    function handleGenerateSkillGroup() {
        if (!selectedSkillKey || !skillMap[selectedSkillKey]) return
        const base = skillMap[selectedSkillKey]
        if (selectedSkillKeys.length > 1) {
            setStatus('生成技能组失败：请只选中一条神通。')
            return
        }
        if (Number(base.Skill_Lv) !== 0) {
            setStatus('生成技能组仅支持 0 级神通。')
            return
        }

        const baseId = Number(base.id)
        const targetIds = [baseId, baseId + 1, baseId + 2, baseId + 3, baseId + 4]
        const conflict = targetIds
            .slice(1)
            .find(id => String(id) !== selectedSkillKey && Object.prototype.hasOwnProperty.call(skillMap, String(id)))
        if (conflict) {
            setStatus(`生成技能组失败：ID ${conflict} 已存在。`)
            return
        }

        setSkillMap(prev => {
            const draft = { ...prev }
            draft[String(baseId)] = { ...cloneSkillEntry(base), id: baseId, Skill_Lv: 1 }
            for (let level = 2; level <= 5; level += 1) {
                const id = baseId + (level - 1)
                draft[String(id)] = { ...cloneSkillEntry(base), id, Skill_Lv: level }
            }
            return draft
        })
        const nextKeys = targetIds.map(id => String(id))
        setSelectedSkillKey(nextKeys[0])
        setSelectedSkillKeys(nextKeys)
        setSkillSelectionAnchor(nextKeys[0])
        setSkillDirty(true)
        setStatus(`已生成神通技能组（${baseId} -> ${baseId + 4}，1-5级）。`)
    }

    function handleGenerateSkillBooksFromSkill() {
        const targets = selectedSkillKeys.length > 0 ? selectedSkillKeys : selectedSkillKey ? [selectedSkillKey] : []
        if (targets.length === 0) return
        const inserts: Array<{ key: string; row: ItemEntry }> = []
        const existed: number[] = []
        const dedupe = new Set<string>()

        targets.forEach(key => {
            const source = skillMap[key]
            if (!source) return
            const uniqueId = Number(source.Skill_ID)
            if (!Number.isFinite(uniqueId) || uniqueId <= 0) return
            const itemKey = String(uniqueId)
            if (dedupe.has(itemKey)) return
            dedupe.add(itemKey)
            if (Object.prototype.hasOwnProperty.call(itemMap, itemKey)) {
                existed.push(uniqueId)
                return
            }
            const next = createEmptyItem(uniqueId)
            next.name = source.name
            next.type = 3
            next.desc = String(uniqueId)
            next.desc2 = source.descr
            next.seid = [1]
            next.seidData = { '1': { value1: uniqueId } }
            inserts.push({ key: itemKey, row: next })
        })

        if (inserts.length === 0) {
            if (existed.length > 0) {
                setStatus(`生成技能书失败：ID 已存在（${existed.join(', ')}）。`)
            }
            return
        }
        setItemMap(prev => {
            const draft = { ...prev }
            inserts.forEach(item => {
                draft[item.key] = item.row
            })
            return draft
        })
        setItemDirty(true)
        setStatus(
            existed.length > 0
                ? `已生成 ${inserts.length} 个技能书，以下ID已存在被跳过：${existed.join(', ')}`
                : `已生成 ${inserts.length} 个技能书。`
        )
    }

    function handleSelectStaticSkill(key: string, index: number, options: { shift: boolean; ctrl: boolean }) {
        const sourceRows = filteredStaticSkillRows
        if (options.shift && staticSkillSelectionAnchor) {
            const anchorIndex = sourceRows.findIndex(row => row.key === staticSkillSelectionAnchor)
            if (anchorIndex >= 0) {
                const [start, end] = anchorIndex <= index ? [anchorIndex, index] : [index, anchorIndex]
                const nextKeys = sourceRows.slice(start, end + 1).map(row => row.key)
                setSelectedStaticSkillKeys(nextKeys)
                setSelectedStaticSkillKey(key)
                return
            }
        }
        if (options.ctrl) {
            setSelectedStaticSkillKeys(prev => {
                if (prev.includes(key)) {
                    const next = prev.filter(item => item !== key)
                    const active = next[next.length - 1] ?? ''
                    setSelectedStaticSkillKey(active)
                    return next
                }
                return [...prev, key]
            })
            setSelectedStaticSkillKey(key)
            setStaticSkillSelectionAnchor(key)
            return
        }
        setSelectedStaticSkillKeys([key])
        setSelectedStaticSkillKey(key)
        setStaticSkillSelectionAnchor(key)
    }

    function handleDeleteStaticSkills() {
        const targets =
            selectedStaticSkillKeys.length > 0 ? selectedStaticSkillKeys : selectedStaticSkillKey ? [selectedStaticSkillKey] : []
        if (targets.length === 0) return
        const targetSet = new Set(targets)
        const remainingRows = staticSkillRows.filter(row => !targetSet.has(row.key))
        const nextActive = remainingRows[0]?.key ?? ''
        setStaticSkillMap(prev => {
            const draft = { ...prev }
            targets.forEach(key => delete draft[key])
            return draft
        })
        setSelectedStaticSkillKey(nextActive)
        setSelectedStaticSkillKeys(nextActive ? [nextActive] : [])
        setStaticSkillSelectionAnchor(nextActive)
        setStaticSkillDirty(true)
        setStatus(`已删除 ${targets.length} 条功法数据。`)
    }

    function handleBatchPrefixStaticSkillIds(prefix: string) {
        if (!/^\d+$/.test(prefix)) {
            setStatus('批量修改ID失败：请输入数字开头。')
            return
        }
        const targets =
            selectedStaticSkillKeys.length > 0 ? selectedStaticSkillKeys : selectedStaticSkillKey ? [selectedStaticSkillKey] : []
        if (targets.length === 0) {
            setStatus('请先选中要修改的功法。')
            return
        }
        const orderedTargets = [...targets].sort((a, b) => (staticSkillMap[a]?.id ?? 0) - (staticSkillMap[b]?.id ?? 0))
        const nextKeys = orderedTargets.map((_, index) => String(Number(prefix) + index))
        const nextKeySet = new Set(nextKeys)
        if (nextKeySet.size !== nextKeys.length) {
            setStatus('批量修改ID失败：新ID出现重复。')
            return
        }
        const occupied = new Set(Object.keys(staticSkillMap).filter(key => !orderedTargets.includes(key)))
        const conflict = nextKeys.find(key => occupied.has(key))
        if (conflict) {
            setStatus(`批量修改ID失败：目标ID ${conflict} 已存在。`)
            return
        }
        setStaticSkillMap(prev => {
            const draft = { ...prev }
            orderedTargets.forEach(oldKey => delete draft[oldKey])
            orderedTargets.forEach((oldKey, index) => {
                const nextKey = nextKeys[index]
                const row = prev[oldKey]
                if (!row) return
                draft[nextKey] = { ...row, id: Number(nextKey) }
            })
            return draft
        })
        const nextActive = nextKeys[0] ?? ''
        setSelectedStaticSkillKey(nextActive)
        setSelectedStaticSkillKeys(nextKeys)
        setStaticSkillSelectionAnchor(nextActive)
        setStaticSkillDirty(true)
    }

    function handleAddStaticSkill(id: number) {
        const key = String(id)
        setAddStaticSkillOpen(false)
        if (staticSkillMap[key]) {
            setSelectedStaticSkillKey(key)
            setSelectedStaticSkillKeys([key])
            setStaticSkillSelectionAnchor(key)
            setStatus(`功法 ID ${id} 已存在，已定位到该条目。`)
            return
        }
        setStaticSkillMap(prev => ({ ...prev, [key]: createEmptyStaticSkill(id) }))
        setSelectedStaticSkillKey(key)
        setSelectedStaticSkillKeys([key])
        setStaticSkillSelectionAnchor(key)
        setStaticSkillDirty(true)
    }

    function handleCopyStaticSkill() {
        const targets =
            selectedStaticSkillKeys.length > 0 ? selectedStaticSkillKeys : selectedStaticSkillKey ? [selectedStaticSkillKey] : []
        if (targets.length === 0) return
        const copied = targets
            .map(key => staticSkillMap[key])
            .filter((item): item is StaticSkillEntry => Boolean(item))
            .sort((a, b) => a.id - b.id)
            .map(item => cloneStaticSkillEntry(item))
        if (copied.length === 0) return
        setStaticSkillClipboard(copied)
        setStatus(copied.length === 1 ? `已复制功法 ${copied[0].id}` : `已复制 ${copied.length} 条功法数据`)
    }

    function handlePasteStaticSkill() {
        if (staticSkillClipboard.length === 0) return
        const existingKeys = new Set(Object.keys(staticSkillMap))
        const inserts: Array<{ key: string; row: StaticSkillEntry }> = []
        const conflicts: StaticSkillEntry[] = []
        staticSkillClipboard.forEach(item => {
            const id = Number(item.id)
            if (!Number.isFinite(id) || id <= 0) return
            const key = String(id)
            if (existingKeys.has(key)) {
                conflicts.push(item)
                return
            }
            inserts.push({ key, row: { ...cloneStaticSkillEntry(item), id } })
            existingKeys.add(key)
        })
        if (conflicts.length > 0) {
            const prefixText = window.prompt(`检测到 ${conflicts.length} 条功法ID重复，请输入新的ID前缀（例如 26）`)
            if (prefixText === null) return
            const prefix = prefixText.trim()
            if (!/^\d+$/.test(prefix)) {
                setStatus('粘贴失败：请输入数字前缀。')
                return
            }
            for (let index = 0; index < conflicts.length; index += 1) {
                const nextKey = String(Number(`${prefix}${index + 1}`))
                if (existingKeys.has(nextKey)) {
                    setStatus(`粘贴失败：批量重命名ID冲突（${nextKey}）。`)
                    return
                }
                inserts.push({ key: nextKey, row: { ...cloneStaticSkillEntry(conflicts[index]), id: Number(nextKey) } })
                existingKeys.add(nextKey)
            }
        }
        if (inserts.length === 0) return
        setStaticSkillMap(prev => {
            const draft = { ...prev }
            inserts.forEach(({ key, row }) => {
                draft[key] = row
            })
            return draft
        })
        const nextKeys = inserts.map(item => item.key)
        setSelectedStaticSkillKey(nextKeys[0] ?? '')
        setSelectedStaticSkillKeys(nextKeys)
        setStaticSkillSelectionAnchor(nextKeys[0] ?? '')
        setStaticSkillDirty(true)
    }

    function handleChangeStaticSkillForm(patch: Partial<StaticSkillEntry>) {
        if (!selectedStaticSkillKey || !staticSkillMap[selectedStaticSkillKey]) return
        const current = staticSkillMap[selectedStaticSkillKey]
        const next = { ...current, ...patch }
        const nextId = Number(next.id || 0)
        if (!Number.isFinite(nextId) || nextId <= 0) return
        const nextKey = String(nextId)
        setStaticSkillMap(prev => {
            if (nextKey !== selectedStaticSkillKey && prev[nextKey]) {
                setStatus(`功法 ID ${nextId} 已存在，不能重复。`)
                return prev
            }
            const draft = { ...prev }
            delete draft[selectedStaticSkillKey]
            draft[nextKey] = { ...next, id: nextId }
            return draft
        })
        setSelectedStaticSkillKey(nextKey)
        setSelectedStaticSkillKeys(prev =>
            prev.map(key => (key === selectedStaticSkillKey ? nextKey : key)).filter((key, idx, arr) => arr.indexOf(key) === idx)
        )
        setStaticSkillSelectionAnchor(nextKey)
        setStaticSkillDirty(true)
    }

    function handleGenerateStaticSkillGroup() {
        if (!selectedStaticSkillKey || !staticSkillMap[selectedStaticSkillKey]) return
        const base = staticSkillMap[selectedStaticSkillKey]
        if (selectedStaticSkillKeys.length > 1) {
            setStatus('生成功法组失败：请只选中一条功法。')
            return
        }
        if (Number(base.Skill_Lv) !== 0) {
            setStatus('生成功法组仅支持 0 级功法。')
            return
        }

        const baseId = Number(base.id)
        const baseSpeed = Number(base.Skill_Speed ?? 0)
        const targetIds = [baseId, baseId + 1, baseId + 2, baseId + 3, baseId + 4]
        const conflict = targetIds
            .slice(1)
            .find(id => String(id) !== selectedStaticSkillKey && Object.prototype.hasOwnProperty.call(staticSkillMap, String(id)))
        if (conflict) {
            setStatus(`生成功法组失败：ID ${conflict} 已存在。`)
            return
        }

        setStaticSkillMap(prev => {
            const draft = { ...prev }
            draft[String(baseId)] = { ...cloneStaticSkillEntry(base), id: baseId, Skill_Lv: 1, Skill_Speed: baseSpeed * 1 }
            for (let level = 2; level <= 5; level += 1) {
                const id = baseId + (level - 1)
                draft[String(id)] = { ...cloneStaticSkillEntry(base), id, Skill_Lv: level, Skill_Speed: baseSpeed * level }
            }
            return draft
        })
        const nextKeys = targetIds.map(id => String(id))
        setSelectedStaticSkillKey(nextKeys[0])
        setSelectedStaticSkillKeys(nextKeys)
        setStaticSkillSelectionAnchor(nextKeys[0])
        setStaticSkillDirty(true)
        setStatus(`已生成功法技能组（${baseId} -> ${baseId + 4}，1-5级）。`)
    }

    function handleGenerateSkillBooksFromStaticSkill() {
        const targets =
            selectedStaticSkillKeys.length > 0 ? selectedStaticSkillKeys : selectedStaticSkillKey ? [selectedStaticSkillKey] : []
        if (targets.length === 0) return
        const inserts: Array<{ key: string; row: ItemEntry }> = []
        const existed: number[] = []
        const dedupe = new Set<string>()

        targets.forEach(key => {
            const source = staticSkillMap[key]
            if (!source) return
            const uniqueId = Number(source.Skill_ID)
            if (!Number.isFinite(uniqueId) || uniqueId <= 0) return
            const itemKey = String(uniqueId)
            if (dedupe.has(itemKey)) return
            dedupe.add(itemKey)
            if (Object.prototype.hasOwnProperty.call(itemMap, itemKey)) {
                existed.push(uniqueId)
                return
            }
            const next = createEmptyItem(uniqueId)
            next.name = source.name
            next.type = 4
            next.desc = String(uniqueId)
            next.desc2 = source.descr
            next.seid = [2]
            next.seidData = { '2': { value1: uniqueId } }
            inserts.push({ key: itemKey, row: next })
        })

        if (inserts.length === 0) {
            if (existed.length > 0) {
                setStatus(`生成技能书失败：ID 已存在（${existed.join(', ')}）。`)
            }
            return
        }
        setItemMap(prev => {
            const draft = { ...prev }
            inserts.forEach(item => {
                draft[item.key] = item.row
            })
            return draft
        })
        setItemDirty(true)
        setStatus(
            existed.length > 0
                ? `已生成 ${inserts.length} 个技能书，以下ID已存在被跳过：${existed.join(', ')}`
                : `已生成 ${inserts.length} 个技能书。`
        )
    }

    function updateSelectedSeidOwner(
        updater: (current: { seid: number[]; seidData: Record<string, Record<string, string | number | number[]>> }) => {
            seid: number[]
            seidData: Record<string, Record<string, string | number | number[]>>
        }
    ) {
        if (activeModule === 'buff') {
            if (!selectedBuffKey || !buffMap[selectedBuffKey]) return
            setBuffMap(prev => {
                const current = prev[selectedBuffKey]
                if (!current) return prev
                return { ...prev, [selectedBuffKey]: { ...current, ...updater(current) } }
            })
            setBuffDirty(true)
            return
        }

        if (activeModule === 'item') {
            if (!selectedItemKey || !itemMap[selectedItemKey]) return
            setItemMap(prev => {
                const current = prev[selectedItemKey]
                if (!current) return prev
                return { ...prev, [selectedItemKey]: { ...current, ...updater(current) } }
            })
            setItemDirty(true)
            return
        }

        if (activeModule === 'skill') {
            if (!selectedSkillKey || !skillMap[selectedSkillKey]) return
            setSkillMap(prev => {
                const current = prev[selectedSkillKey]
                if (!current) return prev
                return { ...prev, [selectedSkillKey]: { ...current, ...updater(current) } }
            })
            setSkillDirty(true)
            return
        }

        if (activeModule === 'staticskill') {
            if (!selectedStaticSkillKey || !staticSkillMap[selectedStaticSkillKey]) return
            setStaticSkillMap(prev => {
                const current = prev[selectedStaticSkillKey]
                if (!current) return prev
                return { ...prev, [selectedStaticSkillKey]: { ...current, ...updater(current) } }
            })
            setStaticSkillDirty(true)
            return
        }

        if (!selectedTalentKey || !talentMap[selectedTalentKey]) return
        setTalentMap(prev => {
            const current = prev[selectedTalentKey]
            if (!current) return prev
            return { ...prev, [selectedTalentKey]: { ...current, ...updater(current) } }
        })
        setTalentDirty(true)
    }

    async function ensureSeidMetaLoaded() {
        if (activeModule === 'buff') {
            if (Object.keys(buffSeidMetaMap).length > 0) return true
            return loadBuffSeidMeta([workspaceRoot, projectPath, modRootPath], true)
        }
        if (activeModule === 'item') {
            if (Object.keys(itemSeidMetaMap).length > 0) return true
            return loadItemSeidMeta([workspaceRoot, projectPath, modRootPath], true)
        }
        if (activeModule === 'skill') {
            if (Object.keys(skillSeidMetaMap).length > 0) return true
            return loadSkillSeidMeta([workspaceRoot, projectPath, modRootPath], true)
        }
        if (activeModule === 'staticskill') {
            if (Object.keys(staticSkillSeidMetaMap).length > 0) return true
            return loadStaticSkillSeidMeta([workspaceRoot, projectPath, modRootPath], true)
        }
        if (Object.keys(seidMetaMap).length > 0) return true
        const result = await preloadMeta([workspaceRoot, projectPath, modRootPath], true)
        return result.seidLoaded
    }

    async function handleOpenSeidEditor() {
        const selected =
            activeModule === 'buff'
                ? selectedBuff
                : activeModule === 'item'
                  ? selectedItem
                  : activeModule === 'skill'
                    ? selectedSkill
                    : activeModule === 'staticskill'
                      ? selectedStaticSkill
                      : selectedTalent
        if (!selected) return
        const ok = await ensureSeidMetaLoaded()
        if (!ok) {
            setStatus(
                activeModule === 'buff'
                    ? '未加载到 Buff Seid 元数据，请确认 editorMeta/BuffSeidMeta.json 路径和 JSON 格式。'
                    : activeModule === 'item'
                      ? '未加载到 Item Seid 元数据，请确认 editorMeta/ItemUseSeidMeta.json 路径和 JSON 格式。'
                      : activeModule === 'skill'
                        ? '未加载到 Skill Seid 元数据，请确认 editorMeta/SkillSeidMeta.json 路径和 JSON 格式。'
                        : activeModule === 'staticskill'
                          ? '未加载到 StaticSkill Seid 元数据，请确认 editorMeta/StaticSkillSeidMeta.json 路径和 JSON 格式。'
                          : '未加载到 Seid 元数据，请确认 editorMeta/CreateAvatarSeidMeta.json 路径和 JSON 格式。'
            )
        }
        const first = selected.seid[0] ?? null
        setActiveSeidId(first)
        setSeidEditorOpen(true)
    }

    async function handleOpenSeidPicker() {
        const ok = await ensureSeidMetaLoaded()
        setSeidPickerOpen(true)
        if (!ok) {
            setStatus('未加载到 Seid 元数据，无法新增 Seid。')
        }
    }

    function handleAddSeidFromPicker(id: number) {
        updateSelectedSeidOwner(current => {
            if (current.seid.includes(id)) return current
            const nextSeid = [...current.seid, id]
            const nextData = { ...current.seidData }
            if (!nextData[String(id)]) nextData[String(id)] = {}
            return { ...current, seid: nextSeid, seidData: nextData }
        })
        setActiveSeidId(id)
        setSeidPickerOpen(false)
    }

    function handleDeleteSelectedSeid() {
        if (!activeSeidId) return
        updateSelectedSeidOwner(current => {
            const nextSeid = current.seid.filter(id => id !== activeSeidId)
            const nextData = { ...current.seidData }
            delete nextData[String(activeSeidId)]
            return { ...current, seid: nextSeid, seidData: nextData }
        })
        const currentList =
            activeModule === 'buff'
                ? (selectedBuff?.seid ?? [])
                : activeModule === 'item'
                  ? (selectedItem?.seid ?? [])
                  : activeModule === 'skill'
                    ? (selectedSkill?.seid ?? [])
                    : activeModule === 'staticskill'
                      ? (selectedStaticSkill?.seid ?? [])
                      : (selectedTalent?.seid ?? [])
        const nextId = currentList.find(id => id !== activeSeidId) ?? null
        setActiveSeidId(nextId)
    }

    function handleMoveSelectedSeid(direction: 'up' | 'down') {
        if (!activeSeidId) return
        updateSelectedSeidOwner(current => {
            const index = current.seid.findIndex(id => id === activeSeidId)
            if (index < 0) return current
            const targetIndex = direction === 'up' ? index - 1 : index + 1
            if (targetIndex < 0 || targetIndex >= current.seid.length) return current
            const nextSeid = [...current.seid]
            const temp = nextSeid[index]
            nextSeid[index] = nextSeid[targetIndex]
            nextSeid[targetIndex] = temp
            return { ...current, seid: nextSeid }
        })
    }

    function handleChangeSeidProperty(seidId: number, key: string, value: string | number | number[]) {
        updateSelectedSeidOwner(current => {
            const nextData = { ...current.seidData }
            const row = { ...(nextData[String(seidId)] ?? {}) }
            row[key] = value
            nextData[String(seidId)] = row
            return { ...current, seidData: nextData }
        })
    }

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
            setStatus(`mod 目录已重命名: ${pickLeafName(nextPath)}`)
        } catch (error) {
            setStatus(`重命名失败: ${String(error)}`)
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
            setStatus(`已删除文件夹: ${pickLeafName(pathToDelete)}`)
        } catch (error) {
            setStatus(`删除失败: ${String(error)}`)
        }
    }

    async function handleSaveProject() {
        if (!projectPath || !modRootPath || !moduleConfigPath) {
            setStatus('请先打开项目后再保存。')
            return
        }
        try {
            await ensureModStructure(modRootPath)
            const configPayload = {
                ...rawConfigObject,
                Name: configForm.name,
                Author: configForm.author,
                Version: configForm.version,
                Description: configForm.description,
                Settings: preservedSettings,
            }
            await saveFilePayload(moduleConfigPath, `${JSON.stringify(configPayload, null, 2)}\n`)

            const talentTarget = talentPath || createAvatarPath
            const normalizedTalentPayload = Object.fromEntries(
                Object.values(talentMap).map(row => [String(row.id), { ...row, id: row.id }])
            )
            const payload = normalizedTalentPayload
            await saveFilePayload(talentTarget, `${JSON.stringify(payload, null, 2)}\n`)

            const seidFileCount = await saveTalentSeidFiles({
                talentMap,
                modRootPath,
                joinWinPath,
                readFilePayload,
                saveFilePayload,
            })
            const affixFileCount = await saveAffixFile({
                affixMap,
                affixPath,
                saveFilePayload,
            })

            const buffFileCount = await saveBuffFiles({
                buffMap,
                modRootPath,
                joinWinPath,
                saveFilePayload,
            })
            const buffSeidFileCount = await saveBuffSeidFiles({
                buffMap,
                modRootPath,
                joinWinPath,
                readFilePayload,
                saveFilePayload,
            })
            const itemFileCount = await saveItemFiles({
                itemMap,
                modRootPath,
                joinWinPath,
                saveFilePayload,
            })
            const itemSeidFileCount = await saveItemSeidFiles({
                itemMap,
                modRootPath,
                joinWinPath,
                readFilePayload,
                saveFilePayload,
            })
            const skillFileCount = await saveSkillFiles({
                skillMap,
                modRootPath,
                joinWinPath,
                saveFilePayload,
            })
            const skillSeidFileCount = await saveSkillSeidFiles({
                skillMap,
                modRootPath,
                joinWinPath,
                readFilePayload,
                saveFilePayload,
            })
            const staticSkillFileCount = await saveStaticSkillFile({
                staticSkillMap,
                staticSkillPath,
                saveFilePayload,
            })
            const staticSkillSeidFileCount = await saveStaticSkillSeidFiles({
                staticSkillMap,
                modRootPath,
                joinWinPath,
                readFilePayload,
                saveFilePayload,
            })

            setConfigDirty(false)
            setAffixDirty(false)
            setTalentDirty(false)
            setBuffDirty(false)
            setItemDirty(false)
            setSkillDirty(false)
            setStaticSkillDirty(false)
            setAffixCachePath(affixPath)
            setTalentCachePath(talentTarget)
            setBuffCachePath(buffDirPath)
            setItemCachePath(itemDirPath)
            setSkillCachePath(skillDirPath)
            setStaticSkillCachePath(staticSkillPath)
            setStatus(
                `项目已保存：${moduleConfigPath}；词缀 ${affixFileCount} 条；天赋Seid ${seidFileCount} 个；Buff ${buffFileCount} 个，BuffSeid ${buffSeidFileCount} 个；Item ${itemFileCount} 个，ItemSeid ${itemSeidFileCount} 个；Skill ${skillFileCount} 个，SkillSeid ${skillSeidFileCount} 个；StaticSkill ${staticSkillFileCount} 条，StaticSkillSeid ${staticSkillSeidFileCount} 个`
            )
        } catch (error) {
            setStatus(`保存项目失败: ${String(error)}`)
        }
    }

    async function handleToggleMaximize() {
        const maximized = await appWindow.isMaximized()
        if (maximized) {
            await appWindow.unmaximize()
            return
        }
        await appWindow.maximize()
    }

    return (
        <div className="app-shell" data-active-path={activePath} data-status={status}>
            <AppTopBarMenu
                configDirty={configDirty || affixDirty || talentDirty || buffDirty || itemDirty || skillDirty || staticSkillDirty}
                onClose={() => appWindow.close()}
                onCreateProject={() => {
                    setCreateMode('full')
                    setNewProjectName('')
                    setNewModName('')
                    setCreateOpen(true)
                }}
                onMinimize={() => appWindow.minimize()}
                onOpenProject={handleOpenProject}
                onSaveProject={handleSaveProject}
                onStartDragging={() => appWindow.startDragging()}
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
                seidData={
                    activeModule === 'buff'
                        ? (selectedBuff?.seidData ?? {})
                        : activeModule === 'item'
                          ? (selectedItem?.seidData ?? {})
                          : activeModule === 'skill'
                            ? (selectedSkill?.seidData ?? {})
                            : activeModule === 'staticskill'
                              ? (selectedStaticSkill?.seidData ?? {})
                              : (selectedTalent?.seidData ?? {})
                }
                seidIds={
                    activeModule === 'buff'
                        ? (selectedBuff?.seid ?? [])
                        : activeModule === 'item'
                          ? (selectedItem?.seid ?? [])
                          : activeModule === 'skill'
                            ? (selectedSkill?.seid ?? [])
                            : activeModule === 'staticskill'
                              ? (selectedStaticSkill?.seid ?? [])
                              : (selectedTalent?.seid ?? [])
                }
            />
            <SeidPickerModal
                items={seidPickerItems}
                onClose={() => setSeidPickerOpen(false)}
                onPick={handleAddSeidFromPicker}
                open={seidPickerOpen}
                selectedIds={
                    activeModule === 'buff'
                        ? (selectedBuff?.seid ?? [])
                        : activeModule === 'item'
                          ? (selectedItem?.seid ?? [])
                          : activeModule === 'skill'
                            ? (selectedSkill?.seid ?? [])
                            : activeModule === 'staticskill'
                              ? (selectedStaticSkill?.seid ?? [])
                              : (selectedTalent?.seid ?? [])
                }
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
                    onSelect={handleSelectModule}
                    onSelectRoot={handleSelectModRoot}
                    onToggleExpanded={path =>
                        setExpandedRootPaths(prev =>
                            prev.some(item => normalizePath(item) === normalizePath(path))
                                ? prev.filter(item => normalizePath(item) !== normalizePath(path))
                                : [...prev, path]
                        )
                    }
                    rootFolders={rootFoldersForSidebar}
                />

                {activeModule && activeModule !== 'project-config' ? (
                    <InfoPanel
                        activeModule={activeModule}
                        searchText={tableSearchText}
                        onSearchTextChange={setTableSearchText}
                        onAddTalent={() =>
                            activeModule === 'affix'
                                ? setAddAffixOpen(true)
                                : activeModule === 'buff'
                                  ? setAddBuffOpen(true)
                                  : activeModule === 'item'
                                    ? setAddItemOpen(true)
                                    : activeModule === 'skill'
                                      ? setAddSkillOpen(true)
                                      : activeModule === 'staticskill'
                                        ? setAddStaticSkillOpen(true)
                                        : setAddTalentOpen(true)
                        }
                        onBatchPrefixIds={prefix => {
                            if (activeModule === 'affix') return handleBatchPrefixAffixIds(prefix)
                            if (activeModule === 'buff') return handleBatchPrefixBuffIds(prefix)
                            if (activeModule === 'item') return handleBatchPrefixItemIds(prefix)
                            if (activeModule === 'skill') return handleBatchPrefixSkillIds(prefix)
                            if (activeModule === 'staticskill') return handleBatchPrefixStaticSkillIds(prefix)
                            return handleBatchPrefixIds(prefix)
                        }}
                        onDeleteTalents={() => {
                            if (activeModule === 'affix') return handleDeleteAffixes()
                            if (activeModule === 'buff') return handleDeleteBuffs()
                            if (activeModule === 'item') return handleDeleteItems()
                            if (activeModule === 'skill') return handleDeleteSkills()
                            if (activeModule === 'staticskill') return handleDeleteStaticSkills()
                            return handleDeleteTalents()
                        }}
                        onCopyTalent={() => {
                            if (activeModule === 'affix') return handleCopyAffix()
                            if (activeModule === 'buff') return handleCopyBuff()
                            if (activeModule === 'item') return handleCopyItem()
                            if (activeModule === 'skill') return handleCopySkill()
                            if (activeModule === 'staticskill') return handleCopyStaticSkill()
                            return handleCopyTalent()
                        }}
                        onPasteTalent={() => {
                            if (activeModule === 'affix') return handlePasteAffix()
                            if (activeModule === 'buff') return handlePasteBuff()
                            if (activeModule === 'item') return handlePasteItem()
                            if (activeModule === 'skill') return handlePasteSkill()
                            if (activeModule === 'staticskill') return handlePasteStaticSkill()
                            return handlePasteTalent()
                        }}
                        onGenerateGroup={
                            activeModule === 'skill'
                                ? handleGenerateSkillGroup
                                : activeModule === 'staticskill'
                                  ? handleGenerateStaticSkillGroup
                                  : undefined
                        }
                        canGenerateGroup={
                            activeModule === 'skill'
                                ? selectedSkillKeys.length === 1 &&
                                  Boolean(selectedSkillKey) &&
                                  Number(skillMap[selectedSkillKey]?.Skill_Lv ?? -1) === 0
                                : activeModule === 'staticskill'
                                  ? selectedStaticSkillKeys.length === 1 &&
                                    Boolean(selectedStaticSkillKey) &&
                                    Number(staticSkillMap[selectedStaticSkillKey]?.Skill_Lv ?? -1) === 0
                                  : false
                        }
                        generateGroupLabel={activeModule === 'staticskill' ? '生成功法组' : '生成技能组'}
                        onGenerateBook={
                            activeModule === 'skill'
                                ? handleGenerateSkillBooksFromSkill
                                : activeModule === 'staticskill'
                                  ? handleGenerateSkillBooksFromStaticSkill
                                  : undefined
                        }
                        canGenerateBook={
                            activeModule === 'skill'
                                ? selectedSkillKeys.length > 0 || Boolean(selectedSkillKey)
                                : activeModule === 'staticskill'
                                  ? selectedStaticSkillKeys.length > 0 || Boolean(selectedStaticSkillKey)
                                  : false
                        }
                        generateBookLabel="生成技能书"
                        onSelectTalent={(key, index, options) =>
                            activeModule === 'affix'
                                ? handleSelectAffix(key, index, options)
                                : activeModule === 'buff'
                                  ? handleSelectBuff(key, index, options)
                                  : activeModule === 'item'
                                    ? handleSelectItem(key, index, options)
                                    : activeModule === 'skill'
                                      ? handleSelectSkill(key, index, options)
                                      : activeModule === 'staticskill'
                                        ? handleSelectStaticSkill(key, index, options)
                                        : handleSelectTalent(key, index, options)
                        }
                        rows={
                            activeModule === 'affix'
                                ? filteredAffixRows
                                : activeModule === 'buff'
                                  ? filteredBuffRows
                                  : activeModule === 'item'
                                    ? filteredItemRows
                                    : activeModule === 'skill'
                                      ? filteredSkillRows
                                      : activeModule === 'staticskill'
                                        ? filteredStaticSkillRows
                                        : filteredAvatarRows
                        }
                        selectedTalentKey={
                            activeModule === 'affix'
                                ? selectedAffixKey
                                : activeModule === 'buff'
                                  ? selectedBuffKey
                                  : activeModule === 'item'
                                    ? selectedItemKey
                                    : activeModule === 'skill'
                                      ? selectedSkillKey
                                      : activeModule === 'staticskill'
                                        ? selectedStaticSkillKey
                                        : selectedTalentKey
                        }
                        selectedTalentKeys={
                            activeModule === 'affix'
                                ? selectedAffixKeys
                                : activeModule === 'buff'
                                  ? selectedBuffKeys
                                  : activeModule === 'item'
                                    ? selectedItemKeys
                                    : activeModule === 'skill'
                                      ? selectedSkillKeys
                                      : activeModule === 'staticskill'
                                        ? selectedStaticSkillKeys
                                        : selectedTalentKeys
                        }
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
                    />
                ) : null}
            </main>
            <div className="status-bar">{status}</div>
        </div>
    )
}
