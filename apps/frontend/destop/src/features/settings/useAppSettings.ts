import { useEffect, useMemo, useState } from 'react'

import {
    type AppSettings,
    getDefaultAppSettings,
    readAppSettings,
    readAppSettingsFromFile,
    saveAppSettings,
    saveAppSettingsToFile,
} from './app-settings-store'

export function useAppSettings() {
    const [settingsDraft, setSettingsDraft] = useState<AppSettings>(() => readAppSettings())
    const [settingsFilePath, setSettingsFilePath] = useState<string | null>(null)
    const [settingsHydrated, setSettingsHydrated] = useState(false)

    useEffect(() => {
        let active = true
        ;(async () => {
            const fileSettings = await readAppSettingsFromFile()
            if (!active) return
            if (fileSettings) setSettingsDraft(fileSettings)
            setSettingsHydrated(true)
        })()
        return () => {
            active = false
        }
    }, [])

    const hasChanges = useMemo(() => {
        const stored = readAppSettings()
        return (
            JSON.stringify(stored.npcWuDaoExtraValues) !== JSON.stringify(settingsDraft.npcWuDaoExtraValues) ||
            JSON.stringify(stored.jsonImportFolderPaths) !== JSON.stringify(settingsDraft.jsonImportFolderPaths) ||
            JSON.stringify(stored.jsonImportFilePaths) !== JSON.stringify(settingsDraft.jsonImportFilePaths) ||
            stored.uniqueIdSyncEnabled !== settingsDraft.uniqueIdSyncEnabled ||
            JSON.stringify(stored.uniqueIdSyncTriggerLevels) !== JSON.stringify(settingsDraft.uniqueIdSyncTriggerLevels) ||
            stored.batchIdChangeKeepOriginal !== settingsDraft.batchIdChangeKeepOriginal ||
            stored.autoSaveEnabled !== settingsDraft.autoSaveEnabled ||
            stored.autoSaveIntervalSeconds !== settingsDraft.autoSaveIntervalSeconds ||
            stored.autoSyncSkillDescrWithAtlas !== settingsDraft.autoSyncSkillDescrWithAtlas ||
            stored.replaceSkillDescrWithSpecialFormat !== settingsDraft.replaceSkillDescrWithSpecialFormat ||
            stored.mainWindowWidth !== settingsDraft.mainWindowWidth ||
            stored.mainWindowHeight !== settingsDraft.mainWindowHeight
        )
    }, [settingsDraft])

    function patchSettings(patch: Partial<AppSettings>) {
        setSettingsDraft(prev => ({
            ...prev,
            ...patch,
        }))
    }

    async function persistSettings() {
        const next = saveAppSettings(settingsDraft)
        setSettingsDraft(next)
        const filePath = await saveAppSettingsToFile(next)
        if (filePath) setSettingsFilePath(filePath)
        return { next, filePath }
    }

    async function resetSettings() {
        const defaults = getDefaultAppSettings()
        const next = saveAppSettings(defaults)
        setSettingsDraft(next)
        const filePath = await saveAppSettingsToFile(next)
        if (filePath) setSettingsFilePath(filePath)
        return { next, filePath }
    }

    return {
        settingsDraft,
        settingsFilePath,
        settingsHydrated,
        hasChanges,
        patchSettings,
        persistSettings,
        resetSettings,
    }
}
