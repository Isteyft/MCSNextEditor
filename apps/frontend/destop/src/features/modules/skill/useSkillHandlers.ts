import { createEmptyItem } from '../../../components/item/item-domain'
import { createEmptySkill } from '../../../components/skill/skill-domain'
import type { ItemEntry, SkillEntry } from '../../../types'

type Setter = (value: any) => void

type Params = {
    filteredSkillRows: Array<{ key: string }>
    skillRows: Array<{ key: string }>
    skillMap: Record<string, SkillEntry>
    selectedSkillKey: string
    selectedSkillKeys: string[]
    skillSelectionAnchor: string
    skillClipboard: SkillEntry[]
    itemMap: Record<string, ItemEntry>
    cloneSkillEntry: (entry: SkillEntry) => SkillEntry
    setSelectedSkillKey: Setter
    setSelectedSkillKeys: Setter
    setSkillSelectionAnchor: Setter
    setSkillMap: Setter
    setSkillDirty: Setter
    setStatus: Setter
    setAddSkillOpen: Setter
    setSkillClipboard: Setter
    setItemMap: Setter
    setItemDirty: Setter
    uniqueIdSyncEnabled: boolean
    uniqueIdSyncTriggerLevels: number[]
    batchIdChangeKeepOriginal: boolean
}

export function useSkillHandlers(params: Params) {
    const {
        filteredSkillRows,
        skillRows,
        skillMap,
        selectedSkillKey,
        selectedSkillKeys,
        skillSelectionAnchor,
        skillClipboard,
        itemMap,
        cloneSkillEntry,
        setSelectedSkillKey,
        setSelectedSkillKeys,
        setSkillSelectionAnchor,
        setSkillMap,
        setSkillDirty,
        setStatus,
        setAddSkillOpen,
        setSkillClipboard,
        setItemMap,
        setItemDirty,
        uniqueIdSyncEnabled,
        uniqueIdSyncTriggerLevels,
        batchIdChangeKeepOriginal,
    } = params

    function handleSelectSkill(key: string, index: number, options: { shift: boolean; ctrl: boolean }) {
        const sourceRows = filteredSkillRows
        if (options.shift && skillSelectionAnchor) {
            const anchorIndex = sourceRows.findIndex(row => row.key === skillSelectionAnchor)
            if (anchorIndex >= 0) {
                const [start, end] = anchorIndex <= index ? [anchorIndex, index] : [index, anchorIndex]
                const nextKeys = sourceRows.slice(start, end + 1).map(row => row.key)
                setSelectedSkillKeys(nextKeys)
                setSelectedSkillKey(key)
                return
            }
        }
        if (options.ctrl) {
            setSelectedSkillKeys((prev: string[]) => {
                if (prev.includes(key)) {
                    const next = prev.filter(item => item !== key)
                    const active = next[next.length - 1] ?? ''
                    setSelectedSkillKey(active)
                    return next
                }
                return [...prev, key]
            })
            setSelectedSkillKey(key)
            setSkillSelectionAnchor(key)
            return
        }
        setSelectedSkillKeys([key])
        setSelectedSkillKey(key)
        setSkillSelectionAnchor(key)
    }

    function handleDeleteSkills() {
        const targets = selectedSkillKeys.length > 0 ? selectedSkillKeys : selectedSkillKey ? [selectedSkillKey] : []
        if (targets.length === 0) return
        const targetSet = new Set(targets)
        const remainingRows = skillRows.filter(row => !targetSet.has(row.key))
        const nextActive = remainingRows[0]?.key ?? ''

        setSkillMap((prev: Record<string, SkillEntry>) => {
            const draft = { ...prev }
            targets.forEach(key => delete draft[key])
            return draft
        })
        setSelectedSkillKey(nextActive)
        setSelectedSkillKeys(nextActive ? [nextActive] : [])
        setSkillSelectionAnchor(nextActive)
        setSkillDirty(true)
        setStatus(`已删除 ${targets.length} 条 Skill 数据。`)
    }

    function handleBatchPrefixSkillIds(prefix: string) {
        if (!/^\d+$/.test(prefix)) {
            setStatus('批量修改ID失败：请输入数字开头。')
            return
        }
        const targets = selectedSkillKeys.length > 0 ? selectedSkillKeys : selectedSkillKey ? [selectedSkillKey] : []
        if (targets.length === 0) {
            setStatus('请先选中要修改的 Skill。')
            return
        }
        const orderedTargets = [...targets].sort((a, b) => (skillMap[a]?.id ?? 0) - (skillMap[b]?.id ?? 0))
        const nextKeys = orderedTargets.map((_, index) => String(Number(prefix) + index))
        const nextKeySet = new Set(nextKeys)
        if (nextKeySet.size !== nextKeys.length) {
            setStatus('批量修改ID失败：新ID出现重复。')
            return
        }
        const occupied = batchIdChangeKeepOriginal
            ? new Set(Object.keys(skillMap))
            : new Set(Object.keys(skillMap).filter(key => !orderedTargets.includes(key)))
        const conflict = nextKeys.find((key, index) => {
            if (!occupied.has(key)) return false
            if (!batchIdChangeKeepOriginal) return true
            return key !== orderedTargets[index]
        })
        if (conflict) {
            setStatus(`批量修改ID失败：目标ID ${conflict} 已存在。`)
            return
        }

        setSkillMap((prev: Record<string, SkillEntry>) => {
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
        setSelectedSkillKey(nextActive)
        setSelectedSkillKeys(nextKeys)
        setSkillSelectionAnchor(nextActive)
        setSkillDirty(true)
        setStatus(`已批量修改 ${targets.length} 条 Skill 主ID，开头为 ${prefix}。`)
    }

    function handleAddSkill(id: number) {
        const key = String(id)
        setAddSkillOpen(false)
        if (skillMap[key]) {
            setSelectedSkillKey(key)
            setSelectedSkillKeys([key])
            setSkillSelectionAnchor(key)
            setStatus(`Skill ID ${id} 已存在，已定位到该条目。`)
            return
        }
        setSkillMap((prev: Record<string, SkillEntry>) => ({ ...prev, [key]: createEmptySkill(id) }))
        setSelectedSkillKey(key)
        setSelectedSkillKeys([key])
        setSkillSelectionAnchor(key)
        setSkillDirty(true)
    }

    function handleCopySkill() {
        const targets = selectedSkillKeys.length > 0 ? selectedSkillKeys : selectedSkillKey ? [selectedSkillKey] : []
        if (targets.length === 0) return
        const copied = targets
            .map(key => skillMap[key])
            .filter((item): item is SkillEntry => Boolean(item))
            .sort((a, b) => a.id - b.id)
            .map(item => cloneSkillEntry(item))
        if (copied.length === 0) return
        setSkillClipboard(copied)
        setStatus(copied.length === 1 ? `已复制 Skill ${copied[0].id}` : `已复制 ${copied.length} 条 Skill 数据`)
    }

    function handlePasteSkill() {
        if (skillClipboard.length === 0) return
        const existingKeys = new Set(Object.keys(skillMap))
        const inserts: Array<{ key: string; row: SkillEntry }> = []
        const conflicts: SkillEntry[] = []
        skillClipboard.forEach(item => {
            const id = Number(item.id)
            if (!Number.isFinite(id) || id <= 0) return
            const key = String(id)
            if (existingKeys.has(key)) {
                conflicts.push(item)
                return
            }
            inserts.push({ key, row: { ...cloneSkillEntry(item), id } })
            existingKeys.add(key)
        })
        if (conflicts.length > 0) {
            const prefixText = window.prompt(`检测到 ${conflicts.length} 条Skill 主ID重复，请输入新的ID前缀（例如 25）`)
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
                inserts.push({ key: nextKey, row: { ...cloneSkillEntry(conflicts[index]), id: Number(nextKey) } })
                existingKeys.add(nextKey)
            }
        }
        if (inserts.length === 0) return
        setSkillMap((prev: Record<string, SkillEntry>) => {
            const draft = { ...prev }
            inserts.forEach(({ key, row }) => {
                draft[key] = row
            })
            return draft
        })
        const nextKeys = inserts.map(item => item.key)
        setSelectedSkillKey(nextKeys[0] ?? '')
        setSelectedSkillKeys(nextKeys)
        setSkillSelectionAnchor(nextKeys[0] ?? '')
        setSkillDirty(true)
        setStatus(`已粘贴 ${inserts.length} 条 Skill 数据。`)
    }

    function handleChangeSkillForm(patch: Partial<SkillEntry>) {
        if (!selectedSkillKey || !skillMap[selectedSkillKey]) return
        const current = skillMap[selectedSkillKey]
        const next = { ...current, ...patch }
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

        setSkillMap((prev: Record<string, SkillEntry>) => {
            if (nextKey !== selectedSkillKey && prev[nextKey]) {
                setStatus(`Skill 主ID ${nextId} 已存在，不能重复。`)
                return prev
            }
            const draft = { ...prev }
            delete draft[selectedSkillKey]
            draft[nextKey] = next
            if (shouldUpdateUniqueGroup) {
                for (const [key, row] of Object.entries(draft)) {
                    if (Number(row.Skill_ID ?? 0) !== oldUniqueId) continue
                    draft[key] = { ...row, Skill_ID: nextUniqueId }
                }
            }
            return draft
        })
        setSelectedSkillKey(nextKey)
        setSelectedSkillKeys((prev: string[]) =>
            prev.map(key => (key === selectedSkillKey ? nextKey : key)).filter((key, idx, arr) => arr.indexOf(key) === idx)
        )
        setSkillSelectionAnchor(nextKey)
        setSkillDirty(true)
    }

    function handleGenerateSkillGroup() {
        if (!selectedSkillKey || !skillMap[selectedSkillKey]) return
        const base = skillMap[selectedSkillKey]
        if (selectedSkillKeys.length > 1) {
            setStatus('生成技能组失败：请只选中一条神通。')
            return
        }
        if (Number(base.Skill_Lv) !== 0) {
            setStatus('生成技能组仅支持 0 级神通。')
            return
        }

        const baseId = Number(base.id)
        const targetIds = [baseId, baseId + 1, baseId + 2, baseId + 3, baseId + 4]
        const conflict = targetIds
            .slice(1)
            .find(id => String(id) !== selectedSkillKey && Object.prototype.hasOwnProperty.call(skillMap, String(id)))
        if (conflict) {
            setStatus(`生成技能组失败：ID ${conflict} 已存在。`)
            return
        }

        setSkillMap((prev: Record<string, SkillEntry>) => {
            const draft = { ...prev }
            draft[String(baseId)] = { ...cloneSkillEntry(base), id: baseId, Skill_Lv: 1 }
            for (let level = 2; level <= 5; level += 1) {
                const id = baseId + (level - 1)
                draft[String(id)] = { ...cloneSkillEntry(base), id, Skill_Lv: level }
            }
            return draft
        })
        const nextKeys = targetIds.map(id => String(id))
        setSelectedSkillKey(nextKeys[0])
        setSelectedSkillKeys(nextKeys)
        setSkillSelectionAnchor(nextKeys[0])
        setSkillDirty(true)
        setStatus(`已生成神通技能组（${baseId} -> ${baseId + 4}，1-5级）。`)
    }

    function handleGenerateSkillBooksFromSkill() {
        const targets = selectedSkillKeys.length > 0 ? selectedSkillKeys : selectedSkillKey ? [selectedSkillKey] : []
        if (targets.length === 0) return
        const inserts: Array<{ key: string; row: ItemEntry }> = []
        const existed: number[] = []
        const dedupe = new Set<string>()

        targets.forEach(key => {
            const source = skillMap[key]
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
            next.type = 3
            next.desc = String(uniqueId)
            next.desc2 = source.descr
            next.seid = [1]
            next.seidData = { '1': { value1: uniqueId } }
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
        handleSelectSkill,
        handleDeleteSkills,
        handleBatchPrefixSkillIds,
        handleAddSkill,
        handleCopySkill,
        handlePasteSkill,
        handleChangeSkillForm,
        handleGenerateSkillGroup,
        handleGenerateSkillBooksFromSkill,
    }
}
