import { getCurrentWindow } from '@tauri-apps/api/window'
import { open } from '@tauri-apps/plugin-dialog'
import { FormEvent, useEffect, useMemo, useState } from 'react'

import {
    createEmptyBuff,
    loadBuffFiles,
    mergeBuffSeidFiles,
    saveBuffFiles,
    saveBuffSeidFiles,
    toBuffRows,
} from './components/buff/buff-domain'
import { CreateProjectModal } from './components/project/CreateProjectModal'
import { FolderContextMenu } from './components/project/FolderContextMenu'
import { RenameFolderModal } from './components/project/RenameFolderModal'
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
    createProject,
    deleteModFolder,
    ensureModStructure,
    getWorkspaceRoot,
    loadProjectEntries,
    readFilePayload,
    renameModFolder,
    saveFilePayload,
} from './services/project-api'
import type { BuffEntry, CreateAvatarEntry, TalentTypeOption } from './types'
import { findModRoot, inferModRootPath, isModRootPath, joinWinPath, pickLeafName, pickProjectTail } from './utils/path'

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
    const [talentTypeOptions, setTalentTypeOptions] = useState<TalentTypeOption[]>([])
    const [seidMetaMap, setSeidMetaMap] = useState<Record<number, SeidMetaItem>>({})
    const [buffSeidMetaMap, setBuffSeidMetaMap] = useState<Record<number, SeidMetaItem>>({})
    const [buffTypeOptions, setBuffTypeOptions] = useState<TalentTypeOption[]>([])
    const [buffTriggerOptions, setBuffTriggerOptions] = useState<TalentTypeOption[]>([])
    const [buffRemoveTriggerOptions, setBuffRemoveTriggerOptions] = useState<TalentTypeOption[]>([])
    const [buffOverlayTypeOptions, setBuffOverlayTypeOptions] = useState<TalentTypeOption[]>([])
    const [drawerOptionsMap, setDrawerOptionsMap] = useState<Record<string, TalentTypeOption[]>>({})
    const [buffDrawerFallbackOptions, setBuffDrawerFallbackOptions] = useState<TalentTypeOption[]>([])
    const [seidEditorOpen, setSeidEditorOpen] = useState(false)
    const [seidPickerOpen, setSeidPickerOpen] = useState(false)
    const [activeSeidId, setActiveSeidId] = useState<number | null>(null)
    const [addTalentOpen, setAddTalentOpen] = useState(false)
    const [addBuffOpen, setAddBuffOpen] = useState(false)

    const [treeExpanded, setTreeExpanded] = useState(true)
    const [createOpen, setCreateOpen] = useState(false)
    const [renameOpen, setRenameOpen] = useState(false)
    const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0 })
    const [newProjectName, setNewProjectName] = useState('mod/测试')
    const [newModName, setNewModName] = useState('测试')
    const [status, setStatus] = useState('请先从“文件”菜单打开项目。')

    const moduleConfigPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Config', 'modConfig.json') : ''), [modRootPath])
    const createAvatarPath = useMemo(
        () => (modRootPath ? joinWinPath(modRootPath, 'Data', 'CreateAvatarJsonData.json') : ''),
        [modRootPath]
    )
    const buffDirPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Data', 'BuffJsonData') : ''), [modRootPath])
    const buffIconDirPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Assets', 'Buff Icon') : ''), [modRootPath])
    const modFolderName = useMemo(() => pickLeafName(modRootPath) || 'mod默认', [modRootPath])
    const avatarRows = useMemo(() => toTalentRows(talentMap), [talentMap])
    const buffRows = useMemo(() => toBuffRows(buffMap), [buffMap])
    const selectedTalent = useMemo(
        () => (selectedTalentKey ? (talentMap[selectedTalentKey] ?? null) : null),
        [talentMap, selectedTalentKey]
    )
    const selectedBuff = useMemo(() => (selectedBuffKey ? (buffMap[selectedBuffKey] ?? null) : null), [buffMap, selectedBuffKey])
    const activeModuleLabel = useMemo(() => MODULES.find(item => item.key === activeModule)?.label ?? '-', [activeModule])
    const activeSeidMetaMap = useMemo(
        () => (activeModule === 'buff' ? buffSeidMetaMap : seidMetaMap),
        [activeModule, buffSeidMetaMap, seidMetaMap]
    )
    const seidPickerItems = useMemo(() => Object.values(activeSeidMetaMap).sort((a, b) => a.id - b.id), [activeSeidMetaMap])
    const selectedSeidDisplayRows = useMemo(() => {
        const currentSeid = activeModule === 'buff' ? (selectedBuff?.seid ?? []) : (selectedTalent?.seid ?? [])
        return currentSeid.map(id => ({
            id,
            name: activeSeidMetaMap[id]?.name ?? '',
        }))
    }, [activeModule, selectedTalent, selectedBuff, activeSeidMetaMap])
    const currentSeidOwner = useMemo(
        () => (activeModule === 'buff' ? selectedBuff : selectedTalent),
        [activeModule, selectedBuff, selectedTalent]
    )

    function cloneTalentEntry(entry: CreateAvatarEntry): CreateAvatarEntry {
        return {
            ...entry,
            seid: [...entry.seid],
            seidData: JSON.parse(JSON.stringify(entry.seidData ?? {})) as Record<string, Record<string, string | number | number[]>>,
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

    function isEditableElement(target: EventTarget | null): boolean {
        if (!(target instanceof HTMLElement)) return false
        const tag = target.tagName.toLowerCase()
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
        return Boolean(target.closest('[contenteditable="true"]'))
    }

    useSeidActiveSync({ activeSeidId, seidEditorOpen, selectedTalent: currentSeidOwner, setActiveSeidId })

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
        let active = true
        ;(async () => {
            try {
                const root = await getWorkspaceRoot()
                if (!active) return
                setWorkspaceRoot(root)
                await preloadMeta([root], true)
                await loadBuffSeidMeta([root], true)
                await loadBuffEnumMeta([root], true)
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
            if (activeModule !== 'talent' && activeModule !== 'buff') return
            if (isEditableElement(event.target)) return
            if (event.key === 'Delete') {
                event.preventDefault()
                if (activeModule === 'buff') {
                    handleDeleteBuffs()
                } else {
                    handleDeleteTalents()
                }
                return
            }
            if (!(event.ctrlKey || event.metaKey)) return
            const key = event.key.toLowerCase()
            if (key === 'c') {
                event.preventDefault()
                if (activeModule === 'buff') {
                    handleCopyBuff()
                } else {
                    handleCopyTalent()
                }
            } else if (key === 'v') {
                event.preventDefault()
                if (activeModule === 'buff') {
                    handlePasteBuff()
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
        avatarRows,
        buffRows,
        selectedTalent,
        selectedTalentKey,
        selectedTalentKeys,
        selectedBuffKey,
        selectedBuffKeys,
        talentClipboard,
        buffClipboard,
        talentMap,
        buffMap,
    ])

    async function preloadMeta(roots: string[], silent = false) {
        const result = await preloadEditorMeta({ roots, readFilePayload, loadProjectEntries })
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
        const candidates = Array.from(new Set(roots.filter(Boolean)))
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

    async function loadBuffEnumMeta(roots: string[], silent = false) {
        const candidates = Array.from(new Set(roots.filter(Boolean)))
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
                const id = Number(parsed.id ?? parsed.ID ?? parsed.buffid ?? parsed.skillid ?? entry.name.replace(/\.json$/i, ''))
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
        const candidates = Array.from(new Set(roots.filter(Boolean)))
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

        setProjectPath(rootPath)
        setModRootPath(nextModRoot)
        setActiveModule('')
        setViewMode('todo')
        setActivePath('')
        setConfigForm({ name: '', author: '', version: '0.0.1', description: '' })
        setRawConfigObject({})
        setPreservedSettings([])
        setConfigDirty(false)
        setConfigCachePath('')
        setTalentMap({})
        setTalentPath('')
        setTalentCachePath('')
        setTalentDirty(false)
        setBuffMap({})
        setBuffCachePath('')
        setBuffDirty(false)
        setSelectedBuffKey('')
        setSelectedBuffKeys([])
        setBuffSelectionAnchor('')
        setBuffClipboard([])
        setBuffTypeOptions([])
        setBuffTriggerOptions([])
        setBuffRemoveTriggerOptions([])
        setBuffOverlayTypeOptions([])
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
        setTreeExpanded(true)
        setAddBuffOpen(false)
        await preloadMeta([rootPath, nextModRoot, workspaceRoot], true)
        await loadBuffSeidMeta([rootPath, nextModRoot, workspaceRoot], true)
        await loadBuffEnumMeta([rootPath, nextModRoot, workspaceRoot], true)
        await loadSpecialDrawerOptions([rootPath, nextModRoot, workspaceRoot], nextModRoot, true)
        setStatus(modRoot ? `项目已打开: ${rootPath}` : `项目已打开，未发现 mod 目录，按预设路径加载: ${nextModRoot}`)
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
        const projectName = newProjectName.trim()
        const modName = (newModName.trim() || pickProjectTail(projectName)).trim()
        if (!projectName || !modName) {
            setStatus('请输入项目名字和 mod 名称。')
            return
        }
        try {
            const createdPath = await createProject(projectName, modName)
            await reloadProject(createdPath)
            setCreateOpen(false)
            setStatus(`项目已新建: ${createdPath}`)
        } catch (error) {
            setStatus(`新建失败: ${String(error)}`)
        }
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
        await preloadMeta([modRootPath, projectPath, workspaceRoot], true)
        if (talentCachePath === createAvatarPath) {
            setStatus(talentDirty ? '已加载天赋数据（缓存，未保存）。' : '已加载天赋数据（缓存）。')
            return
        }
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

    async function loadBuffTable() {
        setViewMode('table')
        setActivePath(buffDirPath)
        if (!modRootPath || !buffDirPath) return
        await preloadMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadBuffSeidMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadBuffEnumMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadSpecialDrawerOptions([modRootPath, projectPath, workspaceRoot], modRootPath, true)
        if (buffCachePath === buffDirPath) {
            setStatus(buffDirty ? '已加载 Buff 数据（缓存，未保存）。' : '已加载 Buff 数据（缓存）。')
            return
        }
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

    async function handleSelectModule(key: ModuleKey) {
        setActiveModule(key)
        if (key === 'project-config') {
            await loadConfigForm()
            return
        }
        if (key === 'talent') {
            await loadTalentTable()
            return
        }
        if (key === 'buff') {
            await loadBuffTable()
            return
        }
        if (key === 'skill' || key === 'staticskill') {
            setViewMode('table')
            setActivePath('')
            return
        }
        setViewMode('todo')
        setActivePath('')
    }

    function handleSelectTalent(key: string, index: number, options: { shift: boolean; ctrl: boolean }) {
        if (options.shift && talentSelectionAnchor) {
            const anchorIndex = avatarRows.findIndex(row => row.key === talentSelectionAnchor)
            if (anchorIndex >= 0) {
                const [start, end] = anchorIndex <= index ? [anchorIndex, index] : [index, anchorIndex]
                const nextKeys = avatarRows.slice(start, end + 1).map(row => row.key)
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
        const nextKeys = orderedTargets.map((_, index) => String(Number(`${prefix}${index + 1}`)))
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
        if (options.shift && buffSelectionAnchor) {
            const anchorIndex = buffRows.findIndex(row => row.key === buffSelectionAnchor)
            if (anchorIndex >= 0) {
                const [start, end] = anchorIndex <= index ? [anchorIndex, index] : [index, anchorIndex]
                const nextKeys = buffRows.slice(start, end + 1).map(row => row.key)
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
        const nextKeys = orderedTargets.map((_, index) => String(Number(`${prefix}${index + 1}`)))
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
        if (Object.keys(seidMetaMap).length > 0) return true
        const result = await preloadMeta([workspaceRoot, projectPath, modRootPath], true)
        return result.seidLoaded
    }

    async function handleOpenSeidEditor() {
        const selected = activeModule === 'buff' ? selectedBuff : selectedTalent
        if (!selected) return
        const ok = await ensureSeidMetaLoaded()
        if (!ok) {
            setStatus(
                activeModule === 'buff'
                    ? '未加载到 Buff Seid 元数据，请确认 editorMeta/BuffSeidMeta.json 路径和 JSON 格式。'
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
        const currentList = activeModule === 'buff' ? (selectedBuff?.seid ?? []) : (selectedTalent?.seid ?? [])
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
        if (!newName || !modRootPath) return
        try {
            const nextPath = await renameModFolder(modRootPath, newName)
            setModRootPath(nextPath)
            setRenameOpen(false)
            setStatus(`mod 目录已重命名: ${pickLeafName(nextPath)}`)
        } catch (error) {
            setStatus(`重命名失败: ${String(error)}`)
        }
    }

    async function handleDeleteModRoot() {
        setContextMenu({ open: false, x: 0, y: 0 })
        if (!modRootPath) return
        if (!window.confirm(`确认删除文件夹 ${pickLeafName(modRootPath)} 吗？`)) return
        try {
            await deleteModFolder(modRootPath)
            const inferred = inferModRootPath(projectPath)
            setModRootPath(inferred)
            setActiveModule('')
            setViewMode('todo')
            setSelectedTalentKey('')
            setSelectedTalentKeys([])
            setTalentSelectionAnchor('')
            setTalentMap({})
            setTalentCachePath('')
            setTalentDirty(false)
            setSelectedBuffKey('')
            setSelectedBuffKeys([])
            setBuffSelectionAnchor('')
            setBuffMap({})
            setBuffCachePath('')
            setBuffDirty(false)
            setStatus(`已删除文件夹，后续按预设路径加载: ${inferred}`)
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
                saveFilePayload,
            })

            setConfigDirty(false)
            setTalentDirty(false)
            setBuffDirty(false)
            setTalentCachePath(talentTarget)
            setBuffCachePath(buffDirPath)
            setStatus(
                `项目已保存：${moduleConfigPath}；天赋Seid ${seidFileCount} 个；Buff ${buffFileCount} 个，BuffSeid ${buffSeidFileCount} 个`
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
                configDirty={configDirty || talentDirty || buffDirty}
                onClose={() => appWindow.close()}
                onCreateProject={() => setCreateOpen(true)}
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
                onClose={() => setCreateOpen(false)}
                onSubmit={handleCreateProject}
                open={createOpen}
                projectName={newProjectName}
            />
            <RenameFolderModal
                initialName={modFolderName}
                onClose={() => setRenameOpen(false)}
                onSubmit={handleRenameModRoot}
                open={renameOpen}
            />
            <AddTalentModal open={addTalentOpen} onClose={() => setAddTalentOpen(false)} onSubmit={handleAddTalent} />
            <AddTalentModal
                open={addBuffOpen}
                onClose={() => setAddBuffOpen(false)}
                onSubmit={handleAddBuff}
                title="新增 Buff"
                confirmText="确认新增"
                placeholder="例如: 52000"
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
                seidData={activeModule === 'buff' ? (selectedBuff?.seidData ?? {}) : (selectedTalent?.seidData ?? {})}
                seidIds={activeModule === 'buff' ? (selectedBuff?.seid ?? []) : (selectedTalent?.seid ?? [])}
            />
            <SeidPickerModal
                items={seidPickerItems}
                onClose={() => setSeidPickerOpen(false)}
                onPick={handleAddSeidFromPicker}
                open={seidPickerOpen}
                selectedIds={activeModule === 'buff' ? (selectedBuff?.seid ?? []) : (selectedTalent?.seid ?? [])}
            />
            <FolderContextMenu
                onClose={() => setContextMenu({ open: false, x: 0, y: 0 })}
                onDelete={handleDeleteModRoot}
                onRename={() => {
                    setContextMenu({ open: false, x: 0, y: 0 })
                    setRenameOpen(true)
                }}
                open={contextMenu.open}
                x={contextMenu.x}
                y={contextMenu.y}
            />

            <main className={`workspace ${activeModule === 'project-config' ? 'workspace-config' : ''}`}>
                <ModuleSidebar
                    activeModule={activeModule}
                    expanded={treeExpanded}
                    onRootContextMenu={(x, y) => setContextMenu({ open: true, x, y })}
                    onSelect={handleSelectModule}
                    onToggleExpanded={() => setTreeExpanded(prev => !prev)}
                    rootName={modFolderName}
                />

                {activeModule && activeModule !== 'project-config' ? (
                    <InfoPanel
                        activeModule={activeModule}
                        onAddTalent={() => (activeModule === 'buff' ? setAddBuffOpen(true) : setAddTalentOpen(true))}
                        onBatchPrefixIds={prefix =>
                            activeModule === 'buff' ? handleBatchPrefixBuffIds(prefix) : handleBatchPrefixIds(prefix)
                        }
                        onDeleteTalents={() => (activeModule === 'buff' ? handleDeleteBuffs() : handleDeleteTalents())}
                        onCopyTalent={() => (activeModule === 'buff' ? handleCopyBuff() : handleCopyTalent())}
                        onPasteTalent={() => (activeModule === 'buff' ? handlePasteBuff() : handlePasteTalent())}
                        onSelectTalent={(key, index, options) =>
                            activeModule === 'buff' ? handleSelectBuff(key, index, options) : handleSelectTalent(key, index, options)
                        }
                        rows={activeModule === 'buff' ? buffRows : avatarRows}
                        selectedTalentKey={activeModule === 'buff' ? selectedBuffKey : selectedTalentKey}
                        selectedTalentKeys={activeModule === 'buff' ? selectedBuffKeys : selectedTalentKeys}
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
                        onChangeTalentForm={handleChangeTalentForm}
                        buffForm={selectedBuff}
                        onChangeBuffForm={handleChangeBuffForm}
                        buffIconDir={buffIconDirPath}
                        buffTypeOptions={buffTypeOptions}
                        buffTriggerOptions={buffTriggerOptions}
                        buffRemoveTriggerOptions={buffRemoveTriggerOptions}
                        buffOverlayTypeOptions={buffOverlayTypeOptions}
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
