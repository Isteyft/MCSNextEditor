import { createEmptyWuDao } from '../../../components/wudao/wudao-domain'
import type { WuDaoEntry } from '../../../types'

type Setter = (value: any) => void

type Params = {
    filteredWuDaoRows: Array<{ key: string }>
    wudaoRows: Array<{ key: string }>
    wudaoMap: Record<string, WuDaoEntry>
    selectedWuDaoKey: string
    selectedWuDaoKeys: string[]
    wudaoSelectionAnchor: string
    wudaoClipboard: WuDaoEntry[]
    cloneWuDaoEntry: (entry: WuDaoEntry) => WuDaoEntry
    setSelectedWuDaoKey: Setter
    setSelectedWuDaoKeys: Setter
    setWuDaoSelectionAnchor: Setter
    setWuDaoMap: Setter
    setWuDaoDirty: Setter
    setStatus: Setter
    setAddWuDaoOpen: Setter
    setWuDaoClipboard: Setter
}

export function useWuDaoHandlers(params: Params) {
    const {
        filteredWuDaoRows,
        wudaoRows,
        wudaoMap,
        selectedWuDaoKey,
        selectedWuDaoKeys,
        wudaoSelectionAnchor,
        wudaoClipboard,
        cloneWuDaoEntry,
        setSelectedWuDaoKey,
        setSelectedWuDaoKeys,
        setWuDaoSelectionAnchor,
        setWuDaoMap,
        setWuDaoDirty,
        setStatus,
        setAddWuDaoOpen,
        setWuDaoClipboard,
    } = params

    function handleSelectWuDao(key: string, index: number, options: { shift: boolean; ctrl: boolean }) {
        const sourceRows = filteredWuDaoRows
        if (options.shift && wudaoSelectionAnchor) {
            const anchorIndex = sourceRows.findIndex(row => row.key === wudaoSelectionAnchor)
            if (anchorIndex >= 0) {
                const [start, end] = anchorIndex <= index ? [anchorIndex, index] : [index, anchorIndex]
                const nextKeys = sourceRows.slice(start, end + 1).map(row => row.key)
                setSelectedWuDaoKeys(nextKeys)
                setSelectedWuDaoKey(key)
                return
            }
        }
        if (options.ctrl) {
            setSelectedWuDaoKeys((prev: string[]) => {
                if (prev.includes(key)) {
                    const next = prev.filter(item => item !== key)
                    const active = next[next.length - 1] ?? ''
                    setSelectedWuDaoKey(active)
                    return next
                }
                return [...prev, key]
            })
            setSelectedWuDaoKey(key)
            setWuDaoSelectionAnchor(key)
            return
        }
        setSelectedWuDaoKeys([key])
        setSelectedWuDaoKey(key)
        setWuDaoSelectionAnchor(key)
    }

    function handleDeleteWuDaos() {
        const targets = selectedWuDaoKeys.length > 0 ? selectedWuDaoKeys : selectedWuDaoKey ? [selectedWuDaoKey] : []
        if (targets.length === 0) return
        const targetSet = new Set(targets)
        const remainingRows = wudaoRows.filter(row => !targetSet.has(row.key))
        const nextActive = remainingRows[0]?.key ?? ''
        setWuDaoMap((prev: Record<string, WuDaoEntry>) => {
            const draft = { ...prev }
            targets.forEach(key => delete draft[key])
            return draft
        })
        setSelectedWuDaoKey(nextActive)
        setSelectedWuDaoKeys(nextActive ? [nextActive] : [])
        setWuDaoSelectionAnchor(nextActive)
        setWuDaoDirty(true)
        setStatus(`已删除 ${targets.length} 条悟道数据。`)
    }

    function handleBatchPrefixWuDaoIds(prefix: string) {
        if (!/^\d+$/.test(prefix)) {
            setStatus('批量修改ID失败：请输入数字开头。')
            return
        }
        const targets = selectedWuDaoKeys.length > 0 ? selectedWuDaoKeys : selectedWuDaoKey ? [selectedWuDaoKey] : []
        if (targets.length === 0) {
            setStatus('请先选中要修改的悟道。')
            return
        }
        const orderedTargets = [...targets].sort((a, b) => (wudaoMap[a]?.id ?? 0) - (wudaoMap[b]?.id ?? 0))
        const nextKeys = orderedTargets.map((_, index) => String(Number(prefix) + index))
        const nextKeySet = new Set(nextKeys)
        if (nextKeySet.size !== nextKeys.length) {
            setStatus('批量修改ID失败：新ID出现重复。')
            return
        }
        const occupied = new Set(Object.keys(wudaoMap).filter(key => !orderedTargets.includes(key)))
        const conflict = nextKeys.find(key => occupied.has(key))
        if (conflict) {
            setStatus(`批量修改ID失败：目标ID ${conflict} 已存在。`)
            return
        }
        setWuDaoMap((prev: Record<string, WuDaoEntry>) => {
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
        setSelectedWuDaoKey(nextActive)
        setSelectedWuDaoKeys(nextKeys)
        setWuDaoSelectionAnchor(nextActive)
        setWuDaoDirty(true)
        setStatus(`已批量修改 ${targets.length} 条悟道ID，开头为 ${prefix}。`)
    }

    function handleAddWuDao(id: number) {
        const key = String(id)
        setAddWuDaoOpen(false)
        if (wudaoMap[key]) {
            setSelectedWuDaoKey(key)
            setSelectedWuDaoKeys([key])
            setWuDaoSelectionAnchor(key)
            setStatus(`ID ${id} 已存在，已定位到该条目。`)
            return
        }
        setWuDaoMap((prev: Record<string, WuDaoEntry>) => ({ ...prev, [key]: createEmptyWuDao(id) }))
        setSelectedWuDaoKey(key)
        setSelectedWuDaoKeys([key])
        setWuDaoSelectionAnchor(key)
        setWuDaoDirty(true)
    }

    function handleCopyWuDao() {
        const targets = selectedWuDaoKeys.length > 0 ? selectedWuDaoKeys : selectedWuDaoKey ? [selectedWuDaoKey] : []
        if (targets.length === 0) return
        const copied = targets
            .map(key => wudaoMap[key])
            .filter((item): item is WuDaoEntry => Boolean(item))
            .sort((a, b) => a.id - b.id)
            .map(item => cloneWuDaoEntry(item))
        if (copied.length === 0) return
        setWuDaoClipboard(copied)
        setStatus(copied.length === 1 ? `已复制悟道 ${copied[0].id}` : `已复制 ${copied.length} 条悟道数据`)
    }

    function handlePasteWuDao() {
        if (wudaoClipboard.length === 0) return
        const existingKeys = new Set(Object.keys(wudaoMap))
        const inserts: Array<{ key: string; row: WuDaoEntry }> = []
        const conflicts: WuDaoEntry[] = []
        wudaoClipboard.forEach(item => {
            const id = Number(item.id)
            if (!Number.isFinite(id) || id <= 0) return
            const key = String(id)
            if (existingKeys.has(key)) {
                conflicts.push(item)
                return
            }
            inserts.push({ key, row: { ...cloneWuDaoEntry(item), id } })
            existingKeys.add(key)
        })
        if (conflicts.length > 0) {
            const prefixText = window.prompt(`检测到 ${conflicts.length} 条悟道ID重复，请输入新的ID前缀，例如 80`)
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
                inserts.push({ key: nextKey, row: { ...cloneWuDaoEntry(conflicts[index]), id: Number(nextKey) } })
                existingKeys.add(nextKey)
            }
        }
        if (inserts.length === 0) return
        setWuDaoMap((prev: Record<string, WuDaoEntry>) => {
            const draft = { ...prev }
            inserts.forEach(({ key, row }) => {
                draft[key] = row
            })
            return draft
        })
        const nextKeys = inserts.map(item => item.key)
        setSelectedWuDaoKey(nextKeys[0] ?? '')
        setSelectedWuDaoKeys(nextKeys)
        setWuDaoSelectionAnchor(nextKeys[0] ?? '')
        setWuDaoDirty(true)
        setStatus(`已粘贴 ${inserts.length} 条悟道数据。`)
    }

    function handleChangeWuDaoForm(patch: Partial<WuDaoEntry>) {
        if (!selectedWuDaoKey || !wudaoMap[selectedWuDaoKey]) return
        const current = wudaoMap[selectedWuDaoKey]
        const next = { ...current, ...patch }
        const nextId = Number(next.id || 0)
        if (!Number.isFinite(nextId) || nextId <= 0) return
        const nextKey = String(nextId)
        setWuDaoMap((prev: Record<string, WuDaoEntry>) => {
            if (nextKey !== selectedWuDaoKey && prev[nextKey]) {
                setStatus(`ID ${nextId} 已存在，不能重复。`)
                return prev
            }
            const draft = { ...prev }
            delete draft[selectedWuDaoKey]
            draft[nextKey] = { ...next, id: nextId }
            return draft
        })
        setSelectedWuDaoKey(nextKey)
        setSelectedWuDaoKeys((prev: string[]) =>
            prev.map(key => (key === selectedWuDaoKey ? nextKey : key)).filter((key, idx, arr) => arr.indexOf(key) === idx)
        )
        setWuDaoSelectionAnchor(nextKey)
        setWuDaoDirty(true)
    }

    return {
        handleSelectWuDao,
        handleDeleteWuDaos,
        handleBatchPrefixWuDaoIds,
        handleAddWuDao,
        handleCopyWuDao,
        handlePasteWuDao,
        handleChangeWuDaoForm,
    }
}
