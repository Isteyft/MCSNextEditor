type CacheIO = {
    readFilePayload: (path: string) => Promise<{ content: string }>
    saveFilePayload: (path: string, content: string) => Promise<unknown>
}

export type DraftCachePayload = {
    version: 1
    writtenAt: string
    unsaved: boolean
    projectPath: string
    modRootPath: string
    data?: {
        rawConfigObject: Record<string, unknown>
        configForm: { name: string; author: string; version: string; description: string }
        preservedSettings: unknown
        npcMap: Record<string, unknown>
        npcImportantMap: Record<string, unknown>
        npcTypeMap: Record<string, unknown>
        npcWuDaoMap: Record<string, unknown>
        backpackMap: Record<string, unknown>
        wudaoMap: Record<string, unknown>
        wudaoSkillMap: Record<string, unknown>
        affixMap: Record<string, unknown>
        talentMap: Record<string, unknown>
        buffMap: Record<string, unknown>
        itemMap: Record<string, unknown>
        skillMap: Record<string, unknown>
        staticSkillMap: Record<string, unknown>
    }
}

function fnv1a32(input: string) {
    let hash = 0x811c9dc5
    for (let index = 0; index < input.length; index += 1) {
        hash ^= input.charCodeAt(index)
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
    }
    return (hash >>> 0).toString(16)
}

export function buildDraftCachePath(appDataDirPath: string, modRootPath: string) {
    const normalized = appDataDirPath.replace(/\\/g, '/').replace(/\/+$/, '')
    const hash = fnv1a32(modRootPath)
    return `${normalized}/editor-cache/draft-${hash}.json`
}

export async function loadDraftCache(io: CacheIO, filePath: string): Promise<DraftCachePayload | null> {
    try {
        const payload = await io.readFilePayload(filePath)
        return JSON.parse(payload.content) as DraftCachePayload
    } catch {
        return null
    }
}

export async function saveDraftCache(io: CacheIO, filePath: string, payload: DraftCachePayload) {
    await io.saveFilePayload(filePath, `${JSON.stringify(payload, null, 2)}\n`)
}
