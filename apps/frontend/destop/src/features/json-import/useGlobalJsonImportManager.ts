import { useCallback, useState } from 'react'

import { parseJsonUnknown, readJsonUnknownWithFallback } from './json-import-core'
import {
    adaptAffixImport,
    adaptBuffImportWithMerge,
    adaptItemImportWithMerge,
    adaptSkillImportWithMerge,
    adaptStaticSkillImport,
    adaptTalentImport,
    type ModuleImportReport,
} from './module-adapters'

type GlobalImportDeps = {
    readFilePayload: (path: string) => Promise<{ content: string }>
    saveFilePayload: (path: string, content: string) => Promise<unknown>
    loadProjectEntries: (path: string) => Promise<any[]>
}

type GlobalImportParams = {
    modRootPath: string
    createAvatarPath: string
    affixPath: string
    staticSkillPath: string
}

type GlobalImportReport = {
    ok: boolean
    modules: ModuleImportReport[]
    failedModules: string[]
}

export function useGlobalJsonImportManager({ readFilePayload, saveFilePayload, loadProjectEntries }: GlobalImportDeps) {
    const [running, setRunning] = useState(false)
    const [lastReport, setLastReport] = useState<GlobalImportReport | null>(null)

    const runGlobalImport = useCallback(
        async ({ modRootPath, createAvatarPath, affixPath, staticSkillPath }: GlobalImportParams) => {
            setRunning(true)
            const modules: ModuleImportReport[] = []
            const failedModules: string[] = []

            const runSafe = async (name: string, task: () => Promise<ModuleImportReport>) => {
                try {
                    const report = await task()
                    modules.push(report)
                } catch {
                    failedModules.push(name)
                }
            }

            await runSafe('talent', async () => {
                const payload = await readJsonUnknownWithFallback({
                    filePath: createAvatarPath,
                    defaultContent: '{}\n',
                    readFilePayload,
                    saveFilePayload,
                })
                const parsed = parseJsonUnknown(payload.content, createAvatarPath)
                return adaptTalentImport(parsed.ok ? parsed.data : {}).report
            })

            await runSafe('affix', async () => {
                const payload = await readJsonUnknownWithFallback({
                    filePath: affixPath,
                    defaultContent: '{}\n',
                    readFilePayload,
                    saveFilePayload,
                })
                const parsed = parseJsonUnknown(payload.content, affixPath)
                return adaptAffixImport(parsed.ok ? parsed.data : {}).report
            })

            await runSafe('buff', async () => {
                const result = await adaptBuffImportWithMerge({ modRootPath, loadProjectEntries, readFilePayload })
                return result.report
            })

            await runSafe('item', async () => {
                const result = await adaptItemImportWithMerge({ modRootPath, loadProjectEntries, readFilePayload })
                return result.report
            })

            await runSafe('skill', async () => {
                const result = await adaptSkillImportWithMerge({ modRootPath, loadProjectEntries, readFilePayload })
                return result.report
            })

            await runSafe('staticskill', async () => {
                const payload = await readJsonUnknownWithFallback({
                    filePath: staticSkillPath,
                    defaultContent: '{}\n',
                    readFilePayload,
                    saveFilePayload,
                })
                const parsed = parseJsonUnknown(payload.content, staticSkillPath)
                return adaptStaticSkillImport(parsed.ok ? parsed.data : {}).report
            })

            const report: GlobalImportReport = {
                ok: failedModules.length === 0,
                modules,
                failedModules,
            }
            setLastReport(report)
            setRunning(false)
            return report
        },
        [readFilePayload, saveFilePayload, loadProjectEntries]
    )

    return {
        running,
        lastReport,
        runGlobalImport,
    }
}
