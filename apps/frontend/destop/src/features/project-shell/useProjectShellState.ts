import { useCallback, useEffect, useMemo, useState } from 'react'

import type {
    AffixEntry,
    BackpackEntry,
    BuffEntry,
    CreateAvatarEntry,
    ItemEntry,
    NpcEntry,
    NpcTypeEntry,
    NpcWuDaoEntry,
    SkillEntry,
    StaticSkillEntry,
    WuDaoEntry,
    WuDaoSkillEntry,
} from '../../types'
import type { RootModuleSnapshot } from './useProjectLifecycle'

type RootFolderItem = { path: string; name: string }

type UseProjectShellStateParams = {
    modRootPath: string
    modRootFolders: RootFolderItem[]
    normalizePath: (value: string) => string
    pickLeafName: (value: string) => string
    npcMap: Record<string, NpcEntry>
    npcTypeMap: Record<string, NpcTypeEntry>
    npcTypeCachePath: string
    npcWuDaoMap: Record<string, NpcWuDaoEntry>
    backpackMap: Record<string, BackpackEntry>
    wudaoMap: Record<string, WuDaoEntry>
    wudaoSkillMap: Record<string, WuDaoSkillEntry>
    affixMap: Record<string, AffixEntry>
    talentMap: Record<string, CreateAvatarEntry>
    buffMap: Record<string, BuffEntry>
    itemMap: Record<string, ItemEntry>
    skillMap: Record<string, SkillEntry>
    staticSkillMap: Record<string, StaticSkillEntry>
    npcDirty: boolean
    npcTypeDirty: boolean
    npcWuDaoDirty: boolean
    backpackDirty: boolean
    wudaoDirty: boolean
    wudaoSkillDirty: boolean
    affixDirty: boolean
    talentDirty: boolean
    buffDirty: boolean
    itemDirty: boolean
    skillDirty: boolean
    staticSkillDirty: boolean
}

export function useProjectShellState({
    modRootPath,
    modRootFolders,
    normalizePath,
    pickLeafName,
    npcMap,
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
}: UseProjectShellStateParams) {
    const [expandedRootPaths, setExpandedRootPaths] = useState<string[]>([])
    const [rootSnapshotCache, setRootSnapshotCache] = useState<Record<string, RootModuleSnapshot>>({})

    const rootFoldersForSidebar = useMemo(
        () =>
            modRootFolders.length > 0
                ? modRootFolders
                : modRootPath
                  ? [{ path: modRootPath, name: pickLeafName(modRootPath) || 'mod默认' }]
                  : [],
        [modRootFolders, modRootPath, pickLeafName]
    )

    const toggleExpandedRoot = useCallback(
        (path: string) => {
            setExpandedRootPaths(prev =>
                prev.some(item => normalizePath(item) === normalizePath(path))
                    ? prev.filter(item => normalizePath(item) !== normalizePath(path))
                    : [...prev, path]
            )
        },
        [normalizePath]
    )

    useEffect(() => {
        if (!modRootPath) return
        setExpandedRootPaths(prev =>
            prev.some(path => normalizePath(path) === normalizePath(modRootPath)) ? prev : [...prev, modRootPath]
        )
    }, [modRootPath, normalizePath])

    useEffect(() => {
        if (!modRootPath) return
        const cacheKey = normalizePath(modRootPath)
        setRootSnapshotCache(prev => ({
            ...prev,
            [cacheKey]: {
                npcMap,
                npcTypeMap,
                npcTypeSourcePath: npcTypeCachePath,
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
            },
        }))
    }, [
        modRootPath,
        normalizePath,
        npcMap,
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
    ])

    return { expandedRootPaths, setExpandedRootPaths, rootSnapshotCache, setRootSnapshotCache, rootFoldersForSidebar, toggleExpandedRoot }
}
