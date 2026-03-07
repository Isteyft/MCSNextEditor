import { createEmptyItem } from '../../../components/item/item-domain'
import { createEmptyStaticSkill } from '../../../components/staticskill/staticskill-domain'
import type { ItemEntry, StaticSkillEntry } from '../../../types'
import { formatAtlasDescriptionToSkillDescription } from '../skill/description-sync'

type Setter = (value: any) => void

type Params = {
    filteredStaticSkillRows: Array<{ key: string }>
    staticSkillRows: Array<{ key: string }>
    staticSkillMap: Record<string, StaticSkillEntry>
    selectedStaticSkillKey: string
    selectedStaticSkillKeys: string[]
    staticSkillSelectionAnchor: string
    staticSkillClipboard: StaticSkillEntry[]
    itemMap: Record<string, ItemEntry>
    cloneStaticSkillEntry: (entry: StaticSkillEntry) => StaticSkillEntry
    setSelectedStaticSkillKey: Setter
    setSelectedStaticSkillKeys: Setter
    setStaticSkillSelectionAnchor: Setter
    setStaticSkillMap: Setter
    setStaticSkillDirty: Setter
    setStatus: Setter
    setAddStaticSkillOpen: Setter
    setStaticSkillClipboard: Setter
    setItemMap: Setter
    setItemDirty: Setter
    uniqueIdSyncEnabled: boolean
    uniqueIdSyncTriggerLevels: number[]
    batchIdChangeKeepOriginal: boolean
    autoSyncSkillDescrWithAtlas: boolean
    replaceSkillDescrWithSpecialFormat: boolean
}

export function useStaticSkillHandlers(params: Params) {
    const {
        filteredStaticSkillRows,
        staticSkillRows,
        staticSkillMap,
        selectedStaticSkillKey,
        selectedStaticSkillKeys,
        staticSkillSelectionAnchor,
        staticSkillClipboard,
        itemMap,
        cloneStaticSkillEntry,
        setSelectedStaticSkillKey,
        setSelectedStaticSkillKeys,
        setStaticSkillSelectionAnchor,
        setStaticSkillMap,
        setStaticSkillDirty,
        setStatus,
        setAddStaticSkillOpen,
        setStaticSkillClipboard,
        setItemMap,
        setItemDirty,
        uniqueIdSyncEnabled,
        uniqueIdSyncTriggerLevels,
        batchIdChangeKeepOriginal,
        autoSyncSkillDescrWithAtlas,
        replaceSkillDescrWithSpecialFormat,
    } = params

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
            setSelectedStaticSkillKeys((prev: string[]) => {
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
        setStaticSkillMap((prev: Record<string, StaticSkillEntry>) => {
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
        const occupied = batchIdChangeKeepOriginal
            ? new Set(Object.keys(staticSkillMap))
            : new Set(Object.keys(staticSkillMap).filter(key => !orderedTargets.includes(key)))
        const conflict = nextKeys.find((key, index) => {
            if (!occupied.has(key)) return false
            if (!batchIdChangeKeepOriginal) return true
            return key !== orderedTargets[index]
        })
        if (conflict) {
            setStatus(`批量修改ID失败：目标ID ${conflict} 已存在。`)
            return
        }
        setStaticSkillMap((prev: Record<string, StaticSkillEntry>) => {
            const draft = { ...prev }
            if (!batchIdChangeKeepOriginal) {
                orderedTargets.forEach(oldKey => delete draft[oldKey])
            }
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
        setStatus(`已批量修改 ${targets.length} 条功法ID，开头为 ${prefix}。`)
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
        setStaticSkillMap((prev: Record<string, StaticSkillEntry>) => ({ ...prev, [key]: createEmptyStaticSkill(id) }))
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
            const prefixText = window.prompt(`检测到 ${conflicts.length} 条功法ID重复，请输入新的ID前缀（例如 95）`)
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
        setStaticSkillMap((prev: Record<string, StaticSkillEntry>) => {
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
        setStatus(`已粘贴 ${inserts.length} 条功法数据。`)
    }

    function handleChangeStaticSkillForm(patch: Partial<StaticSkillEntry>) {
        if (!selectedStaticSkillKey || !staticSkillMap[selectedStaticSkillKey]) return
        const current = staticSkillMap[selectedStaticSkillKey]
        const nextPatch = { ...patch }
        if (autoSyncSkillDescrWithAtlas && Object.prototype.hasOwnProperty.call(nextPatch, 'TuJiandescr')) {
            const atlasText = String(nextPatch.TuJiandescr ?? '')
            nextPatch.descr = replaceSkillDescrWithSpecialFormat ? formatAtlasDescriptionToSkillDescription(atlasText) : atlasText
        }
        const next = { ...current, ...nextPatch }
        const nextId = Number(next.id || 0)
        if (!Number.isFinite(nextId) || nextId <= 0) return
        const nextKey = String(nextId)
        next.id = nextId
        const currentLevel = Number(current.Skill_Lv ?? 0)
        const shouldTriggerByLevel = uniqueIdSyncTriggerLevels.includes(currentLevel)
        const hasSkillIdPatch = Object.prototype.hasOwnProperty.call(patch, 'Skill_ID')
        const oldUniqueId = Number(current.Skill_ID ?? 0)
        const nextUniqueId = Number(next.Skill_ID ?? 0)
        const shouldUpdateUniqueGroup =
            uniqueIdSyncEnabled &&
            shouldTriggerByLevel &&
            hasSkillIdPatch &&
            Number.isFinite(oldUniqueId) &&
            oldUniqueId > 0 &&
            Number.isFinite(nextUniqueId) &&
            nextUniqueId > 0 &&
            oldUniqueId !== nextUniqueId
        setStaticSkillMap((prev: Record<string, StaticSkillEntry>) => {
            if (nextKey !== selectedStaticSkillKey && prev[nextKey]) {
                setStatus(`功法 ID ${nextId} 已存在，不能重复。`)
                return prev
            }
            const draft = { ...prev }
            delete draft[selectedStaticSkillKey]
            draft[nextKey] = { ...next, id: nextId }
            if (shouldUpdateUniqueGroup) {
                for (const [key, row] of Object.entries(draft)) {
                    if (Number(row.Skill_ID ?? 0) !== oldUniqueId) continue
                    draft[key] = { ...row, Skill_ID: nextUniqueId }
                }
            }
            return draft
        })
        setSelectedStaticSkillKey(nextKey)
        setSelectedStaticSkillKeys((prev: string[]) =>
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

        setStaticSkillMap((prev: Record<string, StaticSkillEntry>) => {
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
        setItemMap((prev: Record<string, ItemEntry>) => {
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

    return {
        handleSelectStaticSkill,
        handleDeleteStaticSkills,
        handleBatchPrefixStaticSkillIds,
        handleAddStaticSkill,
        handleCopyStaticSkill,
        handlePasteStaticSkill,
        handleChangeStaticSkillForm,
        handleGenerateStaticSkillGroup,
        handleGenerateSkillBooksFromStaticSkill,
    }
}
