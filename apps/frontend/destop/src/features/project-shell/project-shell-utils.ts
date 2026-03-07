import { pickLeafName } from '../../utils/path'
import { dirname } from '../app-core/app-core-utils'

type FsEntry = {
    is_dir: boolean
    name: string
    path: string
}

export async function collectSiblingModFolders(params: {
    anchorModRoot: string
    loadProjectEntries: (path: string) => Promise<FsEntry[]>
}) {
    const { anchorModRoot, loadProjectEntries } = params
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
