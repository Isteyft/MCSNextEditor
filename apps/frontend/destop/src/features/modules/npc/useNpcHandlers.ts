import { createEmptyNpc } from '../../../components/npc/npc-domain'
import type { NpcEntry } from '../../../types'

type Setter = (value: any) => void

type Params = {
    filteredNpcRows: Array<{ key: string }>
    npcRows: Array<{ key: string }>
    npcMap: Record<string, NpcEntry>
    selectedNpcKey: string
    selectedNpcKeys: string[]
    npcSelectionAnchor: string
    npcClipboard: NpcEntry[]
    cloneNpcEntry: (entry: NpcEntry) => NpcEntry
    setSelectedNpcKey: Setter
    setSelectedNpcKeys: Setter
    setNpcSelectionAnchor: Setter
    setNpcMap: Setter
    setNpcDirty: Setter
    setStatus: Setter
    setAddNpcOpen: Setter
    setNpcClipboard: Setter
}

export function useNpcHandlers(params: Params) {
    const {
        filteredNpcRows,
        npcRows,
        npcMap,
        selectedNpcKey,
        selectedNpcKeys,
        npcSelectionAnchor,
        npcClipboard,
        cloneNpcEntry,
        setSelectedNpcKey,
        setSelectedNpcKeys,
        setNpcSelectionAnchor,
        setNpcMap,
        setNpcDirty,
        setStatus,
        setAddNpcOpen,
        setNpcClipboard,
    } = params

    function handleSelectNpc(key: string, index: number, options: { shift: boolean; ctrl: boolean }) {
        const sourceRows = filteredNpcRows
        if (options.shift && npcSelectionAnchor) {
            const anchorIndex = sourceRows.findIndex(row => row.key === npcSelectionAnchor)
            if (anchorIndex >= 0) {
                const [start, end] = anchorIndex <= index ? [anchorIndex, index] : [index, anchorIndex]
                const nextKeys = sourceRows.slice(start, end + 1).map(row => row.key)
                setSelectedNpcKeys(nextKeys)
                setSelectedNpcKey(key)
                return
            }
        }
        if (options.ctrl) {
            setSelectedNpcKeys((prev: string[]) => {
                if (prev.includes(key)) {
                    const next = prev.filter(item => item !== key)
                    const active = next[next.length - 1] ?? ''
                    setSelectedNpcKey(active)
                    return next
                }
                return [...prev, key]
            })
            setSelectedNpcKey(key)
            setNpcSelectionAnchor(key)
            return
        }
        setSelectedNpcKeys([key])
        setSelectedNpcKey(key)
        setNpcSelectionAnchor(key)
    }

    function handleDeleteNpcs() {
        const targets = selectedNpcKeys.length > 0 ? selectedNpcKeys : selectedNpcKey ? [selectedNpcKey] : []
        if (targets.length === 0) return
        const targetSet = new Set(targets)
        const remainingRows = npcRows.filter(row => !targetSet.has(row.key))
        const nextActive = remainingRows[0]?.key ?? ''
        setNpcMap((prev: Record<string, NpcEntry>) => {
            const draft = { ...prev }
            targets.forEach(key => delete draft[key])
            return draft
        })
        setSelectedNpcKey(nextActive)
        setSelectedNpcKeys(nextActive ? [nextActive] : [])
        setNpcSelectionAnchor(nextActive)
        setNpcDirty(true)
        setStatus(`已删除 ${targets.length} 条非实例NPC数据。`)
    }

    function handleBatchPrefixNpcIds(prefix: string) {
        if (!/^\d+$/.test(prefix)) {
            setStatus('批量修改ID失败：请输入数字开头。')
            return
        }
        const targets = selectedNpcKeys.length > 0 ? selectedNpcKeys : selectedNpcKey ? [selectedNpcKey] : []
        if (targets.length === 0) {
            setStatus('请先选中要修改的非实例NPC。')
            return
        }
        const orderedTargets = [...targets].sort((a, b) => (npcMap[a]?.id ?? 0) - (npcMap[b]?.id ?? 0))
        const nextKeys = orderedTargets.map((_, index) => String(Number(prefix) + index))
        const nextKeySet = new Set(nextKeys)
        if (nextKeySet.size !== nextKeys.length) {
            setStatus('批量修改ID失败：新ID出现重复。')
            return
        }
        const occupied = new Set(Object.keys(npcMap).filter(key => !orderedTargets.includes(key)))
        const conflict = nextKeys.find(key => occupied.has(key))
        if (conflict) {
            setStatus(`批量修改ID失败：目标ID ${conflict} 已存在。`)
            return
        }
        setNpcMap((prev: Record<string, NpcEntry>) => {
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
        const nextActive = nextKeys[0] ?? ''
        setSelectedNpcKey(nextActive)
        setSelectedNpcKeys(nextKeys)
        setNpcSelectionAnchor(nextActive)
        setNpcDirty(true)
        setStatus(`已批量修改 ${targets.length} 条非实例NPC ID，开头为 ${prefix}。`)
    }

    function handleAddNpc(id: number) {
        const key = String(id)
        setAddNpcOpen(false)
        if (npcMap[key]) {
            setSelectedNpcKey(key)
            setSelectedNpcKeys([key])
            setNpcSelectionAnchor(key)
            setStatus(`ID ${id} 已存在，已定位到该条目。`)
            return
        }
        setNpcMap((prev: Record<string, NpcEntry>) => ({ ...prev, [key]: createEmptyNpc(id) }))
        setSelectedNpcKey(key)
        setSelectedNpcKeys([key])
        setNpcSelectionAnchor(key)
        setNpcDirty(true)
    }

    function handleCopyNpc() {
        const targets = selectedNpcKeys.length > 0 ? selectedNpcKeys : selectedNpcKey ? [selectedNpcKey] : []
        if (targets.length === 0) return
        const copied = targets
            .map(key => npcMap[key])
            .filter((item): item is NpcEntry => Boolean(item))
            .sort((a, b) => a.id - b.id)
            .map(item => cloneNpcEntry(item))
        if (copied.length === 0) return
        setNpcClipboard(copied)
        setStatus(copied.length === 1 ? `已复制非实例NPC ${copied[0].id}` : `已复制 ${copied.length} 条非实例NPC数据。`)
    }

    function handlePasteNpc() {
        if (npcClipboard.length === 0) return
        const existingKeys = new Set(Object.keys(npcMap))
        const inserts: Array<{ key: string; row: NpcEntry }> = []
        const conflicts: NpcEntry[] = []
        npcClipboard.forEach(item => {
            const id = Number(item.id)
            if (!Number.isFinite(id) || id <= 0) return
            const key = String(id)
            if (existingKeys.has(key)) {
                conflicts.push(item)
                return
            }
            inserts.push({ key, row: { ...cloneNpcEntry(item), id } })
            existingKeys.add(key)
        })
        if (conflicts.length > 0) {
            const prefixText = window.prompt(`检测到 ${conflicts.length} 条非实例NPC ID重复，请输入新的ID前缀，例如 90`)
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
                inserts.push({ key: nextKey, row: { ...cloneNpcEntry(conflicts[index]), id: Number(nextKey) } })
                existingKeys.add(nextKey)
            }
        }
        if (inserts.length === 0) return
        setNpcMap((prev: Record<string, NpcEntry>) => {
            const draft = { ...prev }
            inserts.forEach(({ key, row }) => {
                draft[key] = row
            })
            return draft
        })
        const nextKeys = inserts.map(item => item.key)
        setSelectedNpcKey(nextKeys[0] ?? '')
        setSelectedNpcKeys(nextKeys)
        setNpcSelectionAnchor(nextKeys[0] ?? '')
        setNpcDirty(true)
        setStatus(`已粘贴 ${inserts.length} 条非实例NPC数据。`)
    }

    function handleChangeNpcForm(patch: Partial<NpcEntry>) {
        if (!selectedNpcKey || !npcMap[selectedNpcKey]) return
        const current = npcMap[selectedNpcKey]
        const next = { ...current, ...patch }
        const nextId = Number(next.id || 0)
        if (!Number.isFinite(nextId) || nextId <= 0) return
        const nextKey = String(nextId)
        setNpcMap((prev: Record<string, NpcEntry>) => {
            if (nextKey !== selectedNpcKey && prev[nextKey]) {
                setStatus(`ID ${nextId} 已存在，不能重复。`)
                return prev
            }
            const draft = { ...prev }
            delete draft[selectedNpcKey]
            draft[nextKey] = { ...next, id: nextId }
            return draft
        })
        setSelectedNpcKey(nextKey)
        setSelectedNpcKeys((prev: string[]) =>
            prev.map(key => (key === selectedNpcKey ? nextKey : key)).filter((key, index, arr) => arr.indexOf(key) === index)
        )
        setNpcSelectionAnchor(nextKey)
        setNpcDirty(true)
    }

    return {
        handleSelectNpc,
        handleDeleteNpcs,
        handleBatchPrefixNpcIds,
        handleAddNpc,
        handleCopyNpc,
        handlePasteNpc,
        handleChangeNpcForm,
    }
}
