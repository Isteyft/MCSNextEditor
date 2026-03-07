import { appDataDir } from '@tauri-apps/api/path'

import { readFilePayload, saveFilePayload } from '../../services/project-api'

const SETTINGS_STORAGE_KEY = 'baize.destop.settings.v1'
const SETTINGS_FILE_NAME = 'app-settings.json'

export type AppSettings = {
    jsonImportFolderPaths: string[]
    jsonImportFilePaths: string[]
    uniqueIdSyncEnabled: boolean
    uniqueIdSyncTriggerLevels: number[]
    batchIdChangeKeepOriginal: boolean
    autoSaveEnabled: boolean
    autoSaveIntervalSeconds: number
}

const DEFAULT_SETTINGS: AppSettings = {
    jsonImportFolderPaths: [],
    jsonImportFilePaths: [],
    uniqueIdSyncEnabled: false,
    uniqueIdSyncTriggerLevels: [1],
    batchIdChangeKeepOriginal: false,
    autoSaveEnabled: true,
    autoSaveIntervalSeconds: 60,
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

function normalizeSettings(parsed: Record<string, unknown>): AppSettings {
    const folderPaths = toPathArray(parsed.jsonImportFolderPaths ?? parsed.globalImportRootPath)
    const filePaths = toPathArray(parsed.jsonImportFilePaths ?? parsed.jsonImportFilePath)
    const triggerLevels = toNumberArray(parsed.uniqueIdSyncTriggerLevels)
    return {
        jsonImportFolderPaths: Array.from(new Set(folderPaths)),
        jsonImportFilePaths: Array.from(new Set(filePaths)),
        uniqueIdSyncEnabled: Boolean(parsed.uniqueIdSyncEnabled ?? false),
        uniqueIdSyncTriggerLevels: Array.from(new Set(triggerLevels.length > 0 ? triggerLevels : [1])),
        batchIdChangeKeepOriginal: Boolean(parsed.batchIdChangeKeepOriginal ?? false),
        autoSaveEnabled: parsed.autoSaveEnabled === undefined ? true : Boolean(parsed.autoSaveEnabled),
        autoSaveIntervalSeconds: toPositiveInt(parsed.autoSaveIntervalSeconds, 60),
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
        autoSaveIntervalSeconds: toPositiveInt(patch.autoSaveIntervalSeconds ?? current.autoSaveIntervalSeconds, 60),
    }
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next))
    return next
}
