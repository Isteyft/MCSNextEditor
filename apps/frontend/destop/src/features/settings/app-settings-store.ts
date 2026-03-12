import { appDataDir } from '@tauri-apps/api/path'

import { readFilePayload, saveFilePayload } from '../../services/project-api'

const SETTINGS_STORAGE_KEY = 'baize.destop.settings.v1'
const SETTINGS_FILE_NAME = 'app-settings.json'
const MIN_MAIN_WINDOW_WIDTH = 800
const MIN_MAIN_WINDOW_HEIGHT = 600
export const DEFAULT_SKILL_SEID_SKIP_JSON_IDS = [5, 6, 22, 53, 78, 99, 115, 139, 155, 156, 157, 161]

export type AppSettings = {
    npcWuDaoExtraValues: Array<{ label: string; valueIndex: number }>
    staticSkillAttributeOptions: Array<{ id: number; name: string }>
    buffSeidSkipJsonIds: number[]
    skillSeidSkipJsonIds: number[]
    jsonImportFolderPaths: string[]
    jsonImportFilePaths: string[]
    uniqueIdSyncEnabled: boolean
    uniqueIdSyncTriggerLevels: number[]
    batchIdChangeKeepOriginal: boolean
    autoSaveEnabled: boolean
    autoSaveIntervalSeconds: number
    autoSyncSkillDescrWithAtlas: boolean
    replaceSkillDescrWithSpecialFormat: boolean
    mainWindowWidth: number
    mainWindowHeight: number
}

const DEFAULT_SETTINGS: AppSettings = {
    npcWuDaoExtraValues: [],
    staticSkillAttributeOptions: [],
    buffSeidSkipJsonIds: [],
    skillSeidSkipJsonIds: [...DEFAULT_SKILL_SEID_SKIP_JSON_IDS],
    jsonImportFolderPaths: [],
    jsonImportFilePaths: [],
    uniqueIdSyncEnabled: false,
    uniqueIdSyncTriggerLevels: [1],
    batchIdChangeKeepOriginal: false,
    autoSaveEnabled: true,
    autoSaveIntervalSeconds: 300,
    autoSyncSkillDescrWithAtlas: false,
    replaceSkillDescrWithSpecialFormat: false,
    mainWindowWidth: 1440,
    mainWindowHeight: 900,
}

function toPathArray(value: unknown): string[] {
    if (Array.isArray(value)) return value.map(item => String(item)).filter(Boolean)
    if (typeof value === 'string' && value.trim().length > 0) return [value]
    return []
}

function toNumberArray(value: unknown): number[] {
    if (Array.isArray(value)) {
        return value
            .map(item => Number(item))
            .filter(item => Number.isFinite(item) && item >= 0)
            .map(item => Math.floor(item))
    }
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return [Math.floor(value)]
    return []
}

function toPositiveInt(value: unknown, fallback: number) {
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback
    return Math.floor(parsed)
}

function toMinInt(value: unknown, fallback: number, min: number) {
    return Math.max(min, toPositiveInt(value, fallback))
}

function normalizeNpcWuDaoExtraValues(value: unknown): Array<{ label: string; valueIndex: number }> {
    if (!Array.isArray(value)) return []
    const result: Array<{ label: string; valueIndex: number }> = []
    for (const item of value) {
        if (!item || typeof item !== 'object') continue
        const row = item as Record<string, unknown>
        const label = String(row.label ?? '').trim()
        const valueIndex = Math.floor(Number(row.valueIndex ?? 0))
        if (!label || !Number.isFinite(valueIndex) || valueIndex <= 0) continue
        result.push({ label, valueIndex })
    }
    return result.filter((item, index, array) => array.findIndex(row => row.valueIndex === item.valueIndex) === index)
}

function normalizeStaticSkillAttributeOptions(value: unknown): Array<{ id: number; name: string }> {
    if (!Array.isArray(value)) return []
    const result: Array<{ id: number; name: string }> = []
    for (const item of value) {
        if (!item || typeof item !== 'object') continue
        const row = item as Record<string, unknown>
        const id = Math.floor(Number(row.id ?? 0))
        const name = String(row.name ?? '').trim()
        if (!Number.isFinite(id) || id < 0 || !name) continue
        result.push({ id, name })
    }
    return result.filter((item, index, array) => array.findIndex(row => row.id === item.id) === index)
}

function normalizeSettings(parsed: Record<string, unknown>): AppSettings {
    const folderPaths = toPathArray(parsed.jsonImportFolderPaths ?? parsed.globalImportRootPath)
    const filePaths = toPathArray(parsed.jsonImportFilePaths ?? parsed.jsonImportFilePath)
    const triggerLevels = toNumberArray(parsed.uniqueIdSyncTriggerLevels)
    return {
        npcWuDaoExtraValues: normalizeNpcWuDaoExtraValues(parsed.npcWuDaoExtraValues),
        staticSkillAttributeOptions: normalizeStaticSkillAttributeOptions(parsed.staticSkillAttributeOptions),
        buffSeidSkipJsonIds: Array.from(new Set(toNumberArray(parsed.buffSeidSkipJsonIds))),
        skillSeidSkipJsonIds: Array.from(new Set(toNumberArray(parsed.skillSeidSkipJsonIds ?? DEFAULT_SKILL_SEID_SKIP_JSON_IDS))),
        jsonImportFolderPaths: Array.from(new Set(folderPaths)),
        jsonImportFilePaths: Array.from(new Set(filePaths)),
        uniqueIdSyncEnabled: Boolean(parsed.uniqueIdSyncEnabled ?? false),
        uniqueIdSyncTriggerLevels: Array.from(new Set(triggerLevels.length > 0 ? triggerLevels : [1])),
        batchIdChangeKeepOriginal: Boolean(parsed.batchIdChangeKeepOriginal ?? false),
        autoSaveEnabled: parsed.autoSaveEnabled === undefined ? true : Boolean(parsed.autoSaveEnabled),
        autoSaveIntervalSeconds: toPositiveInt(parsed.autoSaveIntervalSeconds, 300),
        autoSyncSkillDescrWithAtlas: Boolean(parsed.autoSyncSkillDescrWithAtlas ?? false),
        replaceSkillDescrWithSpecialFormat:
            parsed.replaceSkillDescrWithSpecialFormat === undefined
                ? Boolean(parsed.autoSyncSkillDescrWithAtlas ?? false)
                : Boolean(parsed.replaceSkillDescrWithSpecialFormat),
        mainWindowWidth: toMinInt(parsed.mainWindowWidth, 1440, MIN_MAIN_WINDOW_WIDTH),
        mainWindowHeight: toMinInt(parsed.mainWindowHeight, 900, MIN_MAIN_WINDOW_HEIGHT),
    }
}

function settingsFilePathFromDir(dir: string) {
    const normalized = dir.replace(/\\/g, '/').replace(/\/+$/, '')
    return `${normalized}/${SETTINGS_FILE_NAME}`
}

export function getDefaultAppSettings(): AppSettings {
    return { ...DEFAULT_SETTINGS }
}

export function readAppSettings(): AppSettings {
    if (typeof window === 'undefined') return getDefaultAppSettings()
    try {
        const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
        if (!raw) return getDefaultAppSettings()
        return normalizeSettings(JSON.parse(raw) as Record<string, unknown>)
    } catch {
        return getDefaultAppSettings()
    }
}

export async function readAppSettingsFromFile(): Promise<AppSettings | null> {
    try {
        const dir = await appDataDir()
        const filePath = settingsFilePathFromDir(dir)
        const payload = await readFilePayload(filePath)
        const parsed = JSON.parse(payload.content) as Record<string, unknown>
        return normalizeSettings(parsed)
    } catch {
        return null
    }
}

export async function saveAppSettingsToFile(settings: AppSettings): Promise<string | null> {
    try {
        const dir = await appDataDir()
        const filePath = settingsFilePathFromDir(dir)
        await saveFilePayload(filePath, `${JSON.stringify(settings, null, 2)}\n`)
        return filePath
    } catch {
        return null
    }
}

export function saveAppSettings(patch: Partial<AppSettings>) {
    if (typeof window === 'undefined') return getDefaultAppSettings()
    const current = readAppSettings()
    const next: AppSettings = {
        ...current,
        ...patch,
        npcWuDaoExtraValues: normalizeNpcWuDaoExtraValues(patch.npcWuDaoExtraValues ?? current.npcWuDaoExtraValues),
        staticSkillAttributeOptions: normalizeStaticSkillAttributeOptions(
            patch.staticSkillAttributeOptions ?? current.staticSkillAttributeOptions
        ),
        buffSeidSkipJsonIds: Array.from(new Set(toNumberArray(patch.buffSeidSkipJsonIds ?? current.buffSeidSkipJsonIds))),
        skillSeidSkipJsonIds: Array.from(new Set(toNumberArray(patch.skillSeidSkipJsonIds ?? current.skillSeidSkipJsonIds))),
        jsonImportFolderPaths: Array.from(new Set((patch.jsonImportFolderPaths ?? current.jsonImportFolderPaths).filter(Boolean))),
        jsonImportFilePaths: Array.from(new Set((patch.jsonImportFilePaths ?? current.jsonImportFilePaths).filter(Boolean))),
        uniqueIdSyncEnabled: patch.uniqueIdSyncEnabled ?? current.uniqueIdSyncEnabled,
        uniqueIdSyncTriggerLevels: Array.from(
            new Set(
                (patch.uniqueIdSyncTriggerLevels ?? current.uniqueIdSyncTriggerLevels)
                    .map(item => Number(item))
                    .filter(item => Number.isFinite(item) && item >= 0)
                    .map(item => Math.floor(item))
            )
        ),
        batchIdChangeKeepOriginal: patch.batchIdChangeKeepOriginal ?? current.batchIdChangeKeepOriginal,
        autoSaveEnabled: patch.autoSaveEnabled ?? current.autoSaveEnabled,
        autoSaveIntervalSeconds: toPositiveInt(patch.autoSaveIntervalSeconds ?? current.autoSaveIntervalSeconds, 300),
        autoSyncSkillDescrWithAtlas: patch.autoSyncSkillDescrWithAtlas ?? current.autoSyncSkillDescrWithAtlas,
        replaceSkillDescrWithSpecialFormat: patch.replaceSkillDescrWithSpecialFormat ?? current.replaceSkillDescrWithSpecialFormat,
        mainWindowWidth: toMinInt(patch.mainWindowWidth ?? current.mainWindowWidth, 1440, MIN_MAIN_WINDOW_WIDTH),
        mainWindowHeight: toMinInt(patch.mainWindowHeight ?? current.mainWindowHeight, 900, MIN_MAIN_WINDOW_HEIGHT),
    }
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next))
    return next
}
