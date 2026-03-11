import { createEmptyNpcType } from '../../../components/npctype/npctype-domain'
import type { NpcTypeEntry } from '../../../types'

type Setter<T = any> = (value: T) => void

type Params = {
    filteredNpcTypeRows: Array<{ key: string }>
    npcTypeRows: Array<{ key: string }>
    npcTypeMap: Record<string, NpcTypeEntry>
    selectedNpcTypeKey: string
    selectedNpcTypeKeys: string[]
    npcTypeSelectionAnchor: string
    npcTypeClipboard: NpcTypeEntry[]
    cloneNpcTypeEntry: (entry: NpcTypeEntry) => NpcTypeEntry
    setSelectedNpcTypeKey: Setter
    setSelectedNpcTypeKeys: Setter
    setNpcTypeSelectionAnchor: Setter
    setNpcTypeMap: Setter
    setNpcTypeDirty: Setter
    setStatus: Setter
    setAddNpcTypeOpen: Setter
    setNpcTypeClipboard: Setter
}

export function useNpcTypeHandlers(params: Params) {
    const {
        filteredNpcTypeRows,
        npcTypeRows,
        npcTypeMap,
        selectedNpcTypeKey,
        selectedNpcTypeKeys,
        npcTypeSelectionAnchor,
        npcTypeClipboard,
        cloneNpcTypeEntry,
        setSelectedNpcTypeKey,
        setSelectedNpcTypeKeys,
        setNpcTypeSelectionAnchor,
        setNpcTypeMap,
        setNpcTypeDirty,
        setStatus,
        setAddNpcTypeOpen,
        setNpcTypeClipboard,
    } = params

    function handleSelectNpcType(key: string, index: number, options: { shift: boolean; ctrl: boolean }) {
        const sourceRows = filteredNpcTypeRows
        if (options.shift && npcTypeSelectionAnchor) {
            const anchorIndex = sourceRows.findIndex(row => row.key === npcTypeSelectionAnchor)
            if (anchorIndex >= 0) {
                const [start, end] = anchorIndex <= index ? [anchorIndex, index] : [index, anchorIndex]
                const nextKeys = sourceRows.slice(start, end + 1).map(row => row.key)
                setSelectedNpcTypeKeys(nextKeys)
                setSelectedNpcTypeKey(key)
                return
            }
        }
        if (options.ctrl) {
            setSelectedNpcTypeKeys((prev: string[]) => {
                if (prev.includes(key)) {
                    const next = prev.filter(item => item !== key)
                    setSelectedNpcTypeKey(next[next.length - 1] ?? '')
                    return next
                }
                return [...prev, key]
            })
            setSelectedNpcTypeKey(key)
            setNpcTypeSelectionAnchor(key)
            return
        }
        setSelectedNpcTypeKeys([key])
        setSelectedNpcTypeKey(key)
        setNpcTypeSelectionAnchor(key)
    }

    function handleDeleteNpcTypes() {
        const targets = selectedNpcTypeKeys.length > 0 ? selectedNpcTypeKeys : selectedNpcTypeKey ? [selectedNpcTypeKey] : []
        if (targets.length === 0) return
        const targetSet = new Set(targets)
        const remainingRows = npcTypeRows.filter(row => !targetSet.has(row.key))
        const nextActive = remainingRows[0]?.key ?? ''
        setNpcTypeMap((prev: Record<string, NpcTypeEntry>) => {
            const draft = { ...prev }
            targets.forEach(key => delete draft[key])
            return draft
        })
        setSelectedNpcTypeKey(nextActive)
        setSelectedNpcTypeKeys(nextActive ? [nextActive] : [])
        setNpcTypeSelectionAnchor(nextActive)
        setNpcTypeDirty(true)
        setStatus(`已删除 ${targets.length} 条 NPC类型 数据。`)
    }

    function handleBatchPrefixNpcTypeIds(prefix: string) {
        if (!/^\d+$/.test(prefix)) {
            setStatus('批量修改 ID 失败：请输入数字开头。')
            return
        }
        const targets = selectedNpcTypeKeys.length > 0 ? selectedNpcTypeKeys : selectedNpcTypeKey ? [selectedNpcTypeKey] : []
        if (targets.length === 0) {
            setStatus('请先选中要修改的 NPC类型。')
            return
        }
        const orderedTargets = [...targets].sort((a, b) => (npcTypeMap[a]?.id ?? 0) - (npcTypeMap[b]?.id ?? 0))
        const nextKeys = orderedTargets.map((_, index) => String(Number(prefix) + index))
        if (new Set(nextKeys).size !== nextKeys.length) {
            setStatus('批量修改 ID 失败：新 ID 出现重复。')
            return
        }
        const occupied = new Set(Object.keys(npcTypeMap).filter(key => !orderedTargets.includes(key)))
        const conflict = nextKeys.find(key => occupied.has(key))
        if (conflict) {
            setStatus(`批量修改 ID 失败：目标 ID ${conflict} 已存在。`)
            return
        }
        setNpcTypeMap((prev: Record<string, NpcTypeEntry>) => {
            const draft = { ...prev }
            orderedTargets.forEach(oldKey => delete draft[oldKey])
            orderedTargets.forEach((oldKey, index) => {
                const row = prev[oldKey]
                if (!row) return
                const nextKey = nextKeys[index]
                draft[nextKey] = { ...row, id: Number(nextKey) }
            })
            return draft
        })
        setSelectedNpcTypeKey(nextKeys[0] ?? '')
        setSelectedNpcTypeKeys(nextKeys)
        setNpcTypeSelectionAnchor(nextKeys[0] ?? '')
        setNpcTypeDirty(true)
        setStatus(`已批量修改 ${targets.length} 条 NPC类型 ID，开头为 ${prefix}。`)
    }

    function handleAddNpcType(id: number) {
        const key = String(id)
        setAddNpcTypeOpen(false)
        if (npcTypeMap[key]) {
            setSelectedNpcTypeKey(key)
            setSelectedNpcTypeKeys([key])
            setNpcTypeSelectionAnchor(key)
            setStatus(`ID ${id} 已存在，已定位到该条目。`)
            return
        }
        setNpcTypeMap((prev: Record<string, NpcTypeEntry>) => ({ ...prev, [key]: createEmptyNpcType(id) }))
        setSelectedNpcTypeKey(key)
        setSelectedNpcTypeKeys([key])
        setNpcTypeSelectionAnchor(key)
        setNpcTypeDirty(true)
    }

    function handleCopyNpcType() {
        const targets = selectedNpcTypeKeys.length > 0 ? selectedNpcTypeKeys : selectedNpcTypeKey ? [selectedNpcTypeKey] : []
        if (targets.length === 0) return
        const copied = targets
            .map(key => npcTypeMap[key])
            .filter((item): item is NpcTypeEntry => Boolean(item))
            .sort((a, b) => a.id - b.id)
            .map(item => cloneNpcTypeEntry(item))
        if (copied.length === 0) return
        setNpcTypeClipboard(copied)
        setStatus(copied.length === 1 ? `已复制 NPC类型 ${copied[0].id}` : `已复制 ${copied.length} 条 NPC类型 数据。`)
    }

    function handlePasteNpcType() {
        if (npcTypeClipboard.length === 0) return
        const existingKeys = new Set(Object.keys(npcTypeMap))
        const inserts: Array<{ key: string; row: NpcTypeEntry }> = []
        const conflicts: NpcTypeEntry[] = []
        npcTypeClipboard.forEach(item => {
            const id = Number(item.id)
            if (!Number.isFinite(id) || id <= 0) return
            const key = String(id)
            if (existingKeys.has(key)) {
                conflicts.push(item)
                return
            }
            inserts.push({ key, row: { ...cloneNpcTypeEntry(item), id } })
            existingKeys.add(key)
        })
        if (conflicts.length > 0) {
            const prefixText = window.prompt(`检测到 ${conflicts.length} 条 NPC类型 ID 重复，请输入新的 ID 前缀，例如 90`)
            if (prefixText === null) return
            const prefix = prefixText.trim()
            if (!/^\d+$/.test(prefix)) {
                setStatus('粘贴失败：请输入数字前缀。')
                return
            }
            for (let index = 0; index < conflicts.length; index += 1) {
                const nextKey = String(Number(`${prefix}${index + 1}`))
                if (existingKeys.has(nextKey)) {
                    setStatus(`粘贴失败：批量重命名 ID 冲突（${nextKey}）。`)
                    return
                }
                inserts.push({ key: nextKey, row: { ...cloneNpcTypeEntry(conflicts[index]), id: Number(nextKey) } })
                existingKeys.add(nextKey)
            }
        }
        if (inserts.length === 0) return
        setNpcTypeMap((prev: Record<string, NpcTypeEntry>) => {
            const draft = { ...prev }
            inserts.forEach(({ key, row }) => {
                draft[key] = row
            })
            return draft
        })
        const nextKeys = inserts.map(item => item.key)
        setSelectedNpcTypeKey(nextKeys[0] ?? '')
        setSelectedNpcTypeKeys(nextKeys)
        setNpcTypeSelectionAnchor(nextKeys[0] ?? '')
        setNpcTypeDirty(true)
        setStatus(`已粘贴 ${inserts.length} 条 NPC类型 数据。`)
    }

    function handleChangeNpcTypeForm(patch: Partial<NpcTypeEntry>) {
        if (!selectedNpcTypeKey || !npcTypeMap[selectedNpcTypeKey]) return
        const current = npcTypeMap[selectedNpcTypeKey]
        const next = { ...current, ...patch }
        const nextId = Number(next.id || 0)
        if (!Number.isFinite(nextId) || nextId <= 0) return
        const nextKey = String(nextId)
        setNpcTypeMap((prev: Record<string, NpcTypeEntry>) => {
            if (nextKey !== selectedNpcTypeKey && prev[nextKey]) {
                setStatus(`ID ${nextId} 已存在，不能重复。`)
                return prev
            }
            const draft = { ...prev }
            delete draft[selectedNpcTypeKey]
            draft[nextKey] = { ...next, id: nextId }
            return draft
        })
        setSelectedNpcTypeKey(nextKey)
        setSelectedNpcTypeKeys((prev: string[]) =>
            prev.map(key => (key === selectedNpcTypeKey ? nextKey : key)).filter((key, index, arr) => arr.indexOf(key) === index)
        )
        setNpcTypeSelectionAnchor(nextKey)
        setNpcTypeDirty(true)
    }

    function handleGenerateNpcTypeGroup() {
        if (!selectedNpcTypeKey) return
        const source = npcTypeMap[selectedNpcTypeKey]
        if (!source) return
        if (![0, 1].includes(Number(source.Level ?? 0))) {
            setStatus('只有境界为 0 或 1 的 NPC类型才能生成一组。')
            return
        }

        const inserts: Record<string, NpcTypeEntry> = {}
        const conflictIds: number[] = []
        for (let level = 1; level <= 15; level += 1) {
            const nextId = source.id + level - 1
            const nextKey = String(nextId)
            if (nextKey !== selectedNpcTypeKey && npcTypeMap[nextKey]) {
                conflictIds.push(nextId)
                continue
            }
            inserts[nextKey] = {
                ...cloneNpcTypeEntry(source),
                id: nextId,
                Level: level,
            }
        }

        if (conflictIds.length > 0) {
            setStatus(`生成 NPC类型 组失败，目标 ID 已存在：${conflictIds.join(', ')}`)
            return
        }

        setNpcTypeMap((prev: Record<string, NpcTypeEntry>) => ({
            ...prev,
            ...inserts,
        }))
        const nextKeys = Object.keys(inserts).sort((a, b) => Number(a) - Number(b))
        setSelectedNpcTypeKey(nextKeys[0] ?? '')
        setSelectedNpcTypeKeys(nextKeys)
        setNpcTypeSelectionAnchor(nextKeys[0] ?? '')
        setNpcTypeDirty(true)
        setStatus(`已生成同类型 1-15 级的 NPC类型，起始 ID 为 ${source.id}。`)
    }

    return {
        handleSelectNpcType,
        handleDeleteNpcTypes,
        handleBatchPrefixNpcTypeIds,
        handleAddNpcType,
        handleCopyNpcType,
        handlePasteNpcType,
        handleChangeNpcTypeForm,
        handleGenerateNpcTypeGroup,
    }
}
