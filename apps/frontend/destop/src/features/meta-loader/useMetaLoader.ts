import { loadBuffFiles } from '../../components/buff/buff-domain'
import { preloadEditorMeta, readEnumOptionsByFileName, readSeidMetaByFileName } from '../../components/tianfu/talent-meta'
import type { TalentTypeOption } from '../../types'
import { joinWinPath } from '../../utils/path'

type Setter = (value: any) => void

type MetaLoaderParams = {
    withMetaRoots: (roots: string[]) => string[]
    setTalentTypeOptions: Setter
    setSeidMetaMap: Setter
    setBuffSeidMetaMap: Setter
    setItemSeidMetaMap: Setter
    setSkillSeidMetaMap: Setter
    setStaticSkillSeidMetaMap: Setter
    setBuffTypeOptions: Setter
    setBuffTriggerOptions: Setter
    setBuffRemoveTriggerOptions: Setter
    setBuffOverlayTypeOptions: Setter
    setAffixTypeOptions: Setter
    setAffixProjectTypeOptions: Setter
    setItemGuideTypeOptions: Setter
    setItemShopTypeOptions: Setter
    setItemUseTypeOptions: Setter
    setItemTypeOptions: Setter
    setItemQualityOptions: Setter
    setItemPhaseOptions: Setter
    setSkillAttackTypeOptions: Setter
    setSkillConsultTypeOptions: Setter
    setSkillPhaseOptions: Setter
    setSkillQualityOptions: Setter
    setDrawerOptionsMap: Setter
    setBuffDrawerFallbackOptions: Setter
    setStatus: Setter
    readFilePayload: (path: string) => Promise<any>
    readBundledMetaPayload: (path: string) => Promise<any>
    loadProjectEntries: (path: string) => Promise<any>
}

export function useMetaLoader(params: MetaLoaderParams) {
    const {
        withMetaRoots,
        setTalentTypeOptions,
        setSeidMetaMap,
        setBuffSeidMetaMap,
        setItemSeidMetaMap,
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
    } = params

    async function preloadMeta(roots: string[], silent = false) {
        const result = await preloadEditorMeta({
            roots: withMetaRoots(roots),
            readFilePayload,
            readBundledMetaPayload,
            loadProjectEntries,
        })
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
                readBundledMetaPayload,
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
                    readBundledMetaPayload,
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
                readBundledMetaPayload,
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
                readBundledMetaPayload,
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
                    readBundledMetaPayload,
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
            { fileName: 'AffixProjectType.json', setter: setAffixProjectTypeOptions, transform: rows => rows },
        ]

        let loadedAny = false
        for (const loader of loaders) {
            let loaded = false
            for (const root of candidates) {
                const result = await readEnumOptionsByFileName({
                    rootPath: root,
                    fileName: loader.fileName,
                    readFilePayload,
                    readBundledMetaPayload,
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
                    readBundledMetaPayload,
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
                    readBundledMetaPayload,
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
                    readBundledMetaPayload,
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

    return {
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
    }
}
