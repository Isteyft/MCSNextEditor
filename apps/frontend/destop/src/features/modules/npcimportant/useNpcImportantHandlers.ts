import { createEmptyNpcImportant } from '../../../components/npcimportant/npcimportant-domain'
import type { NpcImportantEntry } from '../../../types'

type Setter = (value: any) => void

type Params = {
    filteredNpcImportantRows: Array<{ key: string }>
    npcImportantRows: Array<{ key: string }>
    npcImportantMap: Record<string, NpcImportantEntry>
    selectedNpcImportantKey: string
    selectedNpcImportantKeys: string[]
    npcImportantSelectionAnchor: string
    npcImportantClipboard: NpcImportantEntry[]
    cloneNpcImportantEntry: (entry: NpcImportantEntry) => NpcImportantEntry
    setSelectedNpcImportantKey: Setter
    setSelectedNpcImportantKeys: Setter
    setNpcImportantSelectionAnchor: Setter
    setNpcImportantMap: Setter
    setNpcImportantDirty: Setter
    setStatus: Setter
    setAddNpcImportantOpen: Setter
    setNpcImportantClipboard: Setter
}

export function useNpcImportantHandlers(params: Params) {
    const {
        filteredNpcImportantRows,
        npcImportantRows,
        npcImportantMap,
        selectedNpcImportantKey,
        selectedNpcImportantKeys,
        npcImportantSelectionAnchor,
        npcImportantClipboard,
        cloneNpcImportantEntry,
        setSelectedNpcImportantKey,
        setSelectedNpcImportantKeys,
        setNpcImportantSelectionAnchor,
        setNpcImportantMap,
        setNpcImportantDirty,
        setStatus,
        setAddNpcImportantOpen,
        setNpcImportantClipboard,
    } = params

    function handleSelectNpcImportant(key: string, index: number, options: { shift: boolean; ctrl: boolean }) {
        const sourceRows = filteredNpcImportantRows
        if (options.shift && npcImportantSelectionAnchor) {
            const anchorIndex = sourceRows.findIndex(row => row.key === npcImportantSelectionAnchor)
            if (anchorIndex >= 0) {
                const [start, end] = anchorIndex <= index ? [anchorIndex, index] : [index, anchorIndex]
                const nextKeys = sourceRows.slice(start, end + 1).map(row => row.key)
                setSelectedNpcImportantKeys(nextKeys)
                setSelectedNpcImportantKey(key)
                return
            }
        }
        if (options.ctrl) {
            setSelectedNpcImportantKeys((prev: string[]) => {
                if (prev.includes(key)) {
                    const next = prev.filter(item => item !== key)
                    setSelectedNpcImportantKey(next[next.length - 1] ?? '')
                    return next
                }
                return [...prev, key]
            })
            setSelectedNpcImportantKey(key)
            setNpcImportantSelectionAnchor(key)
            return
        }
        setSelectedNpcImportantKeys([key])
        setSelectedNpcImportantKey(key)
        setNpcImportantSelectionAnchor(key)
    }

    function handleDeleteNpcImportants() {
        const targets =
            selectedNpcImportantKeys.length > 0 ? selectedNpcImportantKeys : selectedNpcImportantKey ? [selectedNpcImportantKey] : []
        if (targets.length === 0) return
        const targetSet = new Set(targets)
        const remainingRows = npcImportantRows.filter(row => !targetSet.has(row.key))
        const nextActive = remainingRows[0]?.key ?? ''
        setNpcImportantMap((prev: Record<string, NpcImportantEntry>) => {
            const draft = { ...prev }
            targets.forEach(key => delete draft[key])
            return draft
        })
        setSelectedNpcImportantKey(nextActive)
        setSelectedNpcImportantKeys(nextActive ? [nextActive] : [])
        setNpcImportantSelectionAnchor(nextActive)
        setNpcImportantDirty(true)
        setStatus(`已删除 ${targets.length} 条重要NPC数据。`)
    }

    function handleBatchPrefixNpcImportantIds(prefix: string) {
        if (!/^\d+$/.test(prefix)) {
            setStatus('批量修改ID失败：请输入数字开头。')
            return
        }
        const targets =
            selectedNpcImportantKeys.length > 0 ? selectedNpcImportantKeys : selectedNpcImportantKey ? [selectedNpcImportantKey] : []
        if (targets.length === 0) {
            setStatus('请先选中要修改的重要NPC。')
            return
        }
        const orderedTargets = [...targets].sort((a, b) => (npcImportantMap[a]?.id ?? 0) - (npcImportantMap[b]?.id ?? 0))
        const nextKeys = orderedTargets.map((_, index) => String(Number(prefix) + index))
        if (new Set(nextKeys).size !== nextKeys.length) {
            setStatus('批量修改ID失败：新ID出现重复。')
            return
        }
        const occupied = new Set(Object.keys(npcImportantMap).filter(key => !orderedTargets.includes(key)))
        const conflict = nextKeys.find(key => occupied.has(key))
        if (conflict) {
            setStatus(`批量修改ID失败：目标ID ${conflict} 已存在。`)
            return
        }
        setNpcImportantMap((prev: Record<string, NpcImportantEntry>) => {
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
        setSelectedNpcImportantKey(nextKeys[0] ?? '')
        setSelectedNpcImportantKeys(nextKeys)
        setNpcImportantSelectionAnchor(nextKeys[0] ?? '')
        setNpcImportantDirty(true)
        setStatus(`已批量修改 ${targets.length} 条重要NPC ID，开头为 ${prefix}。`)
    }

    function handleAddNpcImportant(id: number) {
        const key = String(id)
        setAddNpcImportantOpen(false)
        if (npcImportantMap[key]) {
            setSelectedNpcImportantKey(key)
            setSelectedNpcImportantKeys([key])
            setNpcImportantSelectionAnchor(key)
            setStatus(`ID ${id} 已存在，已定位到该条目。`)
            return
        }
        setNpcImportantMap((prev: Record<string, NpcImportantEntry>) => ({ ...prev, [key]: createEmptyNpcImportant(id) }))
        setSelectedNpcImportantKey(key)
        setSelectedNpcImportantKeys([key])
        setNpcImportantSelectionAnchor(key)
        setNpcImportantDirty(true)
    }

    function handleCopyNpcImportant() {
        const targets =
            selectedNpcImportantKeys.length > 0 ? selectedNpcImportantKeys : selectedNpcImportantKey ? [selectedNpcImportantKey] : []
        if (targets.length === 0) return
        const copied = targets
            .map(key => npcImportantMap[key])
            .filter((item): item is NpcImportantEntry => Boolean(item))
            .sort((a, b) => a.id - b.id)
            .map(item => cloneNpcImportantEntry(item))
        if (copied.length === 0) return
        setNpcImportantClipboard(copied)
        setStatus(copied.length === 1 ? `已复制重要NPC ${copied[0].id}` : `已复制 ${copied.length} 条重要NPC数据。`)
    }

    function handlePasteNpcImportant() {
        if (npcImportantClipboard.length === 0) return
        const existingKeys = new Set(Object.keys(npcImportantMap))
        const inserts: Array<{ key: string; row: NpcImportantEntry }> = []
        const conflicts: NpcImportantEntry[] = []
        npcImportantClipboard.forEach(item => {
            const id = Number(item.id)
            if (!Number.isFinite(id) || id <= 0) return
            const key = String(id)
            if (existingKeys.has(key)) {
                conflicts.push(item)
                return
            }
            inserts.push({ key, row: { ...cloneNpcImportantEntry(item), id } })
            existingKeys.add(key)
        })
        if (conflicts.length > 0) {
            const prefixText = window.prompt(`检测到 ${conflicts.length} 条重要NPC ID重复，请输入新的ID前缀，例如 90`)
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
                inserts.push({ key: nextKey, row: { ...cloneNpcImportantEntry(conflicts[index]), id: Number(nextKey) } })
                existingKeys.add(nextKey)
            }
        }
        if (inserts.length === 0) return
        setNpcImportantMap((prev: Record<string, NpcImportantEntry>) => {
            const draft = { ...prev }
            inserts.forEach(({ key, row }) => {
                draft[key] = row
            })
            return draft
        })
        const nextKeys = inserts.map(item => item.key)
        setSelectedNpcImportantKey(nextKeys[0] ?? '')
        setSelectedNpcImportantKeys(nextKeys)
        setNpcImportantSelectionAnchor(nextKeys[0] ?? '')
        setNpcImportantDirty(true)
        setStatus(`已粘贴 ${inserts.length} 条重要NPC数据。`)
    }

    function handleChangeNpcImportantForm(patch: Partial<NpcImportantEntry>) {
        if (!selectedNpcImportantKey || !npcImportantMap[selectedNpcImportantKey]) return
        const current = npcImportantMap[selectedNpcImportantKey]
        const next = { ...current, ...patch }
        const nextId = Number(next.id || 0)
        if (!Number.isFinite(nextId) || nextId <= 0) return
        const nextKey = String(nextId)
        setNpcImportantMap((prev: Record<string, NpcImportantEntry>) => {
            if (nextKey !== selectedNpcImportantKey && prev[nextKey]) {
                setStatus(`ID ${nextId} 已存在，不能重复。`)
                return prev
            }
            const draft = { ...prev }
            delete draft[selectedNpcImportantKey]
            draft[nextKey] = { ...next, id: nextId }
            return draft
        })
        setSelectedNpcImportantKey(nextKey)
        setSelectedNpcImportantKeys((prev: string[]) =>
            prev.map(key => (key === selectedNpcImportantKey ? nextKey : key)).filter((key, index, arr) => arr.indexOf(key) === index)
        )
        setNpcImportantSelectionAnchor(nextKey)
        setNpcImportantDirty(true)
    }

    return {
        handleSelectNpcImportant,
        handleDeleteNpcImportants,
        handleBatchPrefixNpcImportantIds,
        handleAddNpcImportant,
        handleCopyNpcImportant,
        handlePasteNpcImportant,
        handleChangeNpcImportantForm,
    }
}
