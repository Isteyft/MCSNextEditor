import { createEmptyNpcWuDao } from '../../../components/npcwudao/npcwudao-domain'
import type { NpcWuDaoEntry } from '../../../types'

type Setter = (value: any) => void

type Params = {
    filteredNpcWuDaoRows: Array<{ key: string }>
    npcWuDaoRows: Array<{ key: string }>
    npcWuDaoMap: Record<string, NpcWuDaoEntry>
    selectedNpcWuDaoKey: string
    selectedNpcWuDaoKeys: string[]
    npcWuDaoSelectionAnchor: string
    npcWuDaoClipboard: NpcWuDaoEntry[]
    cloneNpcWuDaoEntry: (entry: NpcWuDaoEntry) => NpcWuDaoEntry
    setSelectedNpcWuDaoKey: Setter
    setSelectedNpcWuDaoKeys: Setter
    setNpcWuDaoSelectionAnchor: Setter
    setNpcWuDaoMap: Setter
    setNpcWuDaoDirty: Setter
    setStatus: Setter
    setAddNpcWuDaoOpen: Setter
    setNpcWuDaoClipboard: Setter
}

export function useNpcWuDaoHandlers(params: Params) {
    const {
        filteredNpcWuDaoRows,
        npcWuDaoRows,
        npcWuDaoMap,
        selectedNpcWuDaoKey,
        selectedNpcWuDaoKeys,
        npcWuDaoSelectionAnchor,
        npcWuDaoClipboard,
        cloneNpcWuDaoEntry,
        setSelectedNpcWuDaoKey,
        setSelectedNpcWuDaoKeys,
        setNpcWuDaoSelectionAnchor,
        setNpcWuDaoMap,
        setNpcWuDaoDirty,
        setStatus,
        setAddNpcWuDaoOpen,
        setNpcWuDaoClipboard,
    } = params

    function handleSelectNpcWuDao(key: string, index: number, options: { shift: boolean; ctrl: boolean }) {
        const sourceRows = filteredNpcWuDaoRows
        if (options.shift && npcWuDaoSelectionAnchor) {
            const anchorIndex = sourceRows.findIndex(row => row.key === npcWuDaoSelectionAnchor)
            if (anchorIndex >= 0) {
                const [start, end] = anchorIndex <= index ? [anchorIndex, index] : [index, anchorIndex]
                const nextKeys = sourceRows.slice(start, end + 1).map(row => row.key)
                setSelectedNpcWuDaoKeys(nextKeys)
                setSelectedNpcWuDaoKey(key)
                return
            }
        }
        if (options.ctrl) {
            setSelectedNpcWuDaoKeys((prev: string[]) => {
                if (prev.includes(key)) {
                    const next = prev.filter(item => item !== key)
                    const active = next[next.length - 1] ?? ''
                    setSelectedNpcWuDaoKey(active)
                    return next
                }
                return [...prev, key]
            })
            setSelectedNpcWuDaoKey(key)
            setNpcWuDaoSelectionAnchor(key)
            return
        }
        setSelectedNpcWuDaoKeys([key])
        setSelectedNpcWuDaoKey(key)
        setNpcWuDaoSelectionAnchor(key)
    }

    function handleDeleteNpcWuDaos() {
        const targets = selectedNpcWuDaoKeys.length > 0 ? selectedNpcWuDaoKeys : selectedNpcWuDaoKey ? [selectedNpcWuDaoKey] : []
        if (targets.length === 0) return
        const targetSet = new Set(targets)
        const remainingRows = npcWuDaoRows.filter(row => !targetSet.has(row.key))
        const nextActive = remainingRows[0]?.key ?? ''
        setNpcWuDaoMap((prev: Record<string, NpcWuDaoEntry>) => {
            const draft = { ...prev }
            targets.forEach(key => delete draft[key])
            return draft
        })
        setSelectedNpcWuDaoKey(nextActive)
        setSelectedNpcWuDaoKeys(nextActive ? [nextActive] : [])
        setNpcWuDaoSelectionAnchor(nextActive)
        setNpcWuDaoDirty(true)
        setStatus(`已删除 ${targets.length} 条 NPC悟道 数据。`)
    }

    function handleBatchPrefixNpcWuDaoIds(prefix: string) {
        if (!/^\d+$/.test(prefix)) {
            setStatus('批量修改 ID 失败：请输入数字开头。')
            return
        }
        const targets = selectedNpcWuDaoKeys.length > 0 ? selectedNpcWuDaoKeys : selectedNpcWuDaoKey ? [selectedNpcWuDaoKey] : []
        if (targets.length === 0) {
            setStatus('请先选中要修改的 NPC悟道。')
            return
        }
        const orderedTargets = [...targets].sort((a, b) => (npcWuDaoMap[a]?.id ?? 0) - (npcWuDaoMap[b]?.id ?? 0))
        const nextKeys = orderedTargets.map((_, index) => String(Number(prefix) + index))
        const nextKeySet = new Set(nextKeys)
        if (nextKeySet.size !== nextKeys.length) {
            setStatus('批量修改 ID 失败：新 ID 出现重复。')
            return
        }
        const occupied = new Set(Object.keys(npcWuDaoMap).filter(key => !orderedTargets.includes(key)))
        const conflict = nextKeys.find(key => occupied.has(key))
        if (conflict) {
            setStatus(`批量修改 ID 失败：目标 ID ${conflict} 已存在。`)
            return
        }
        setNpcWuDaoMap((prev: Record<string, NpcWuDaoEntry>) => {
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
        setSelectedNpcWuDaoKey(nextActive)
        setSelectedNpcWuDaoKeys(nextKeys)
        setNpcWuDaoSelectionAnchor(nextActive)
        setNpcWuDaoDirty(true)
        setStatus(`已批量修改 ${targets.length} 条 NPC悟道 ID，开头为 ${prefix}。`)
    }

    function handleAddNpcWuDao(id: number) {
        const key = String(id)
        setAddNpcWuDaoOpen(false)
        if (npcWuDaoMap[key]) {
            setSelectedNpcWuDaoKey(key)
            setSelectedNpcWuDaoKeys([key])
            setNpcWuDaoSelectionAnchor(key)
            setStatus(`ID ${id} 已存在，已定位到该条目。`)
            return
        }
        setNpcWuDaoMap((prev: Record<string, NpcWuDaoEntry>) => ({ ...prev, [key]: createEmptyNpcWuDao(id) }))
        setSelectedNpcWuDaoKey(key)
        setSelectedNpcWuDaoKeys([key])
        setNpcWuDaoSelectionAnchor(key)
        setNpcWuDaoDirty(true)
    }

    function handleCopyNpcWuDao() {
        const targets = selectedNpcWuDaoKeys.length > 0 ? selectedNpcWuDaoKeys : selectedNpcWuDaoKey ? [selectedNpcWuDaoKey] : []
        if (targets.length === 0) return
        const copied = targets
            .map(key => npcWuDaoMap[key])
            .filter((item): item is NpcWuDaoEntry => Boolean(item))
            .sort((a, b) => a.id - b.id)
            .map(item => cloneNpcWuDaoEntry(item))
        if (copied.length === 0) return
        setNpcWuDaoClipboard(copied)
        setStatus(copied.length === 1 ? `已复制 NPC悟道 ${copied[0].id}` : `已复制 ${copied.length} 条 NPC悟道 数据。`)
    }

    function handlePasteNpcWuDao() {
        if (npcWuDaoClipboard.length === 0) return
        const existingKeys = new Set(Object.keys(npcWuDaoMap))
        const inserts: Array<{ key: string; row: NpcWuDaoEntry }> = []
        const conflicts: NpcWuDaoEntry[] = []
        npcWuDaoClipboard.forEach(item => {
            const id = Number(item.id)
            if (!Number.isFinite(id) || id <= 0) return
            const key = String(id)
            if (existingKeys.has(key)) {
                conflicts.push(item)
                return
            }
            inserts.push({ key, row: { ...cloneNpcWuDaoEntry(item), id } })
            existingKeys.add(key)
        })
        if (conflicts.length > 0) {
            const prefixText = window.prompt(`检测到 ${conflicts.length} 条 NPC悟道 ID 重复，请输入新的 ID 前缀，例如 90`)
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
                inserts.push({ key: nextKey, row: { ...cloneNpcWuDaoEntry(conflicts[index]), id: Number(nextKey) } })
                existingKeys.add(nextKey)
            }
        }
        if (inserts.length === 0) return
        setNpcWuDaoMap((prev: Record<string, NpcWuDaoEntry>) => {
            const draft = { ...prev }
            inserts.forEach(({ key, row }) => {
                draft[key] = row
            })
            return draft
        })
        const nextKeys = inserts.map(item => item.key)
        setSelectedNpcWuDaoKey(nextKeys[0] ?? '')
        setSelectedNpcWuDaoKeys(nextKeys)
        setNpcWuDaoSelectionAnchor(nextKeys[0] ?? '')
        setNpcWuDaoDirty(true)
        setStatus(`已粘贴 ${inserts.length} 条 NPC悟道 数据。`)
    }

    function handleChangeNpcWuDaoForm(patch: Partial<NpcWuDaoEntry>) {
        if (!selectedNpcWuDaoKey || !npcWuDaoMap[selectedNpcWuDaoKey]) return
        const current = npcWuDaoMap[selectedNpcWuDaoKey]
        const next = { ...current, ...patch }
        const nextId = Number(next.id || 0)
        if (!Number.isFinite(nextId) || nextId <= 0) return
        const nextKey = String(nextId)
        setNpcWuDaoMap((prev: Record<string, NpcWuDaoEntry>) => {
            if (nextKey !== selectedNpcWuDaoKey && prev[nextKey]) {
                setStatus(`ID ${nextId} 已存在，不能重复。`)
                return prev
            }
            const draft = { ...prev }
            delete draft[selectedNpcWuDaoKey]
            draft[nextKey] = { ...next, id: nextId }
            return draft
        })
        setSelectedNpcWuDaoKey(nextKey)
        setSelectedNpcWuDaoKeys((prev: string[]) =>
            prev.map(key => (key === selectedNpcWuDaoKey ? nextKey : key)).filter((key, index, arr) => arr.indexOf(key) === index)
        )
        setNpcWuDaoSelectionAnchor(nextKey)
        setNpcWuDaoDirty(true)
    }

    function handleGenerateNpcWuDaoGroup() {
        if (!selectedNpcWuDaoKey) return
        const source = npcWuDaoMap[selectedNpcWuDaoKey]
        if (!source) return
        if (Number(source.lv ?? 0) !== 1) {
            setStatus('只有境界为 1 的 NPC悟道 才能生成整组。')
            return
        }

        const inserts: Record<string, NpcWuDaoEntry> = {}
        const conflictIds: number[] = []
        for (let level = 1; level <= 15; level += 1) {
            const nextId = source.id + level - 1
            const nextKey = String(nextId)
            if (nextKey !== selectedNpcWuDaoKey && npcWuDaoMap[nextKey]) {
                conflictIds.push(nextId)
                continue
            }
            inserts[nextKey] = {
                ...cloneNpcWuDaoEntry(source),
                id: nextId,
                lv: level,
            }
        }

        if (conflictIds.length > 0) {
            setStatus(`生成 NPC悟道 组失败，目标 ID 已存在：${conflictIds.join(', ')}`)
            return
        }

        setNpcWuDaoMap((prev: Record<string, NpcWuDaoEntry>) => ({
            ...prev,
            ...inserts,
        }))
        const nextKeys = Object.keys(inserts).sort((a, b) => Number(a) - Number(b))
        setSelectedNpcWuDaoKey(nextKeys[0] ?? '')
        setSelectedNpcWuDaoKeys(nextKeys)
        setNpcWuDaoSelectionAnchor(nextKeys[0] ?? '')
        setNpcWuDaoDirty(true)
        setStatus(`已生成同类型 15 个境界的 NPC悟道，起始 ID 为 ${source.id}。`)
    }

    return {
        handleSelectNpcWuDao,
        handleDeleteNpcWuDaos,
        handleBatchPrefixNpcWuDaoIds,
        handleAddNpcWuDao,
        handleCopyNpcWuDao,
        handlePasteNpcWuDao,
        handleChangeNpcWuDaoForm,
        handleGenerateNpcWuDaoGroup,
    }
}
