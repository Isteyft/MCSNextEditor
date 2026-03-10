import { createEmptyWuDaoSkill } from '../../../components/wudaoskill/wudaoskill-domain'
import type { WuDaoSkillEntry } from '../../../types'

type Setter = (value: any) => void

type Params = {
    filteredWuDaoSkillRows: Array<{ key: string }>
    wudaoSkillRows: Array<{ key: string }>
    wudaoSkillMap: Record<string, WuDaoSkillEntry>
    selectedWuDaoSkillKey: string
    selectedWuDaoSkillKeys: string[]
    wudaoSkillSelectionAnchor: string
    wudaoSkillClipboard: WuDaoSkillEntry[]
    cloneWuDaoSkillEntry: (entry: WuDaoSkillEntry) => WuDaoSkillEntry
    setSelectedWuDaoSkillKey: Setter
    setSelectedWuDaoSkillKeys: Setter
    setWuDaoSkillSelectionAnchor: Setter
    setWuDaoSkillMap: Setter
    setWuDaoSkillDirty: Setter
    setStatus: Setter
    setAddWuDaoSkillOpen: Setter
    setWuDaoSkillClipboard: Setter
}

export function useWuDaoSkillHandlers(params: Params) {
    const {
        filteredWuDaoSkillRows,
        wudaoSkillRows,
        wudaoSkillMap,
        selectedWuDaoSkillKey,
        selectedWuDaoSkillKeys,
        wudaoSkillSelectionAnchor,
        wudaoSkillClipboard,
        cloneWuDaoSkillEntry,
        setSelectedWuDaoSkillKey,
        setSelectedWuDaoSkillKeys,
        setWuDaoSkillSelectionAnchor,
        setWuDaoSkillMap,
        setWuDaoSkillDirty,
        setStatus,
        setAddWuDaoSkillOpen,
        setWuDaoSkillClipboard,
    } = params

    function handleSelectWuDaoSkill(key: string, index: number, options: { shift: boolean; ctrl: boolean }) {
        const sourceRows = filteredWuDaoSkillRows
        if (options.shift && wudaoSkillSelectionAnchor) {
            const anchorIndex = sourceRows.findIndex(row => row.key === wudaoSkillSelectionAnchor)
            if (anchorIndex >= 0) {
                const [start, end] = anchorIndex <= index ? [anchorIndex, index] : [index, anchorIndex]
                const nextKeys = sourceRows.slice(start, end + 1).map(row => row.key)
                setSelectedWuDaoSkillKeys(nextKeys)
                setSelectedWuDaoSkillKey(key)
                return
            }
        }
        if (options.ctrl) {
            setSelectedWuDaoSkillKeys((prev: string[]) => {
                if (prev.includes(key)) {
                    const next = prev.filter(item => item !== key)
                    const active = next[next.length - 1] ?? ''
                    setSelectedWuDaoSkillKey(active)
                    return next
                }
                return [...prev, key]
            })
            setSelectedWuDaoSkillKey(key)
            setWuDaoSkillSelectionAnchor(key)
            return
        }
        setSelectedWuDaoSkillKeys([key])
        setSelectedWuDaoSkillKey(key)
        setWuDaoSkillSelectionAnchor(key)
    }

    function handleDeleteWuDaoSkills() {
        const targets = selectedWuDaoSkillKeys.length > 0 ? selectedWuDaoSkillKeys : selectedWuDaoSkillKey ? [selectedWuDaoSkillKey] : []
        if (targets.length === 0) return
        const targetSet = new Set(targets)
        const remainingRows = wudaoSkillRows.filter(row => !targetSet.has(row.key))
        const nextActive = remainingRows[0]?.key ?? ''
        setWuDaoSkillMap((prev: Record<string, WuDaoSkillEntry>) => {
            const draft = { ...prev }
            targets.forEach(key => delete draft[key])
            return draft
        })
        setSelectedWuDaoSkillKey(nextActive)
        setSelectedWuDaoSkillKeys(nextActive ? [nextActive] : [])
        setWuDaoSkillSelectionAnchor(nextActive)
        setWuDaoSkillDirty(true)
        setStatus(`已删除 ${targets.length} 条悟道技能数据。`)
    }

    function handleBatchPrefixWuDaoSkillIds(prefix: string) {
        if (!/^\d+$/.test(prefix)) {
            setStatus('批量修改ID失败：请输入数字开头。')
            return
        }
        const targets = selectedWuDaoSkillKeys.length > 0 ? selectedWuDaoSkillKeys : selectedWuDaoSkillKey ? [selectedWuDaoSkillKey] : []
        if (targets.length === 0) {
            setStatus('请先选中要修改的悟道技能。')
            return
        }
        const orderedTargets = [...targets].sort((a, b) => (wudaoSkillMap[a]?.id ?? 0) - (wudaoSkillMap[b]?.id ?? 0))
        const nextKeys = orderedTargets.map((_, index) => String(Number(prefix) + index))
        const nextKeySet = new Set(nextKeys)
        if (nextKeySet.size !== nextKeys.length) {
            setStatus('批量修改ID失败：新ID出现重复。')
            return
        }
        const occupied = new Set(Object.keys(wudaoSkillMap).filter(key => !orderedTargets.includes(key)))
        const conflict = nextKeys.find(key => occupied.has(key))
        if (conflict) {
            setStatus(`批量修改ID失败：目标ID ${conflict} 已存在。`)
            return
        }
        setWuDaoSkillMap((prev: Record<string, WuDaoSkillEntry>) => {
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
        setSelectedWuDaoSkillKey(nextActive)
        setSelectedWuDaoSkillKeys(nextKeys)
        setWuDaoSkillSelectionAnchor(nextActive)
        setWuDaoSkillDirty(true)
        setStatus(`已批量修改 ${targets.length} 条悟道技能ID，开头为 ${prefix}。`)
    }

    function handleAddWuDaoSkill(id: number) {
        const key = String(id)
        setAddWuDaoSkillOpen(false)
        if (wudaoSkillMap[key]) {
            setSelectedWuDaoSkillKey(key)
            setSelectedWuDaoSkillKeys([key])
            setWuDaoSkillSelectionAnchor(key)
            setStatus(`ID ${id} 已存在，已定位到该条目。`)
            return
        }
        setWuDaoSkillMap((prev: Record<string, WuDaoSkillEntry>) => ({ ...prev, [key]: createEmptyWuDaoSkill(id) }))
        setSelectedWuDaoSkillKey(key)
        setSelectedWuDaoSkillKeys([key])
        setWuDaoSkillSelectionAnchor(key)
        setWuDaoSkillDirty(true)
    }

    function handleCopyWuDaoSkill() {
        const targets = selectedWuDaoSkillKeys.length > 0 ? selectedWuDaoSkillKeys : selectedWuDaoSkillKey ? [selectedWuDaoSkillKey] : []
        if (targets.length === 0) return
        const copied = targets
            .map(key => wudaoSkillMap[key])
            .filter((item): item is WuDaoSkillEntry => Boolean(item))
            .sort((a, b) => a.id - b.id)
            .map(item => cloneWuDaoSkillEntry(item))
        if (copied.length === 0) return
        setWuDaoSkillClipboard(copied)
        setStatus(copied.length === 1 ? `已复制悟道技能 ${copied[0].id}` : `已复制 ${copied.length} 条悟道技能数据`)
    }

    function handlePasteWuDaoSkill() {
        if (wudaoSkillClipboard.length === 0) return
        const existingKeys = new Set(Object.keys(wudaoSkillMap))
        const inserts: Array<{ key: string; row: WuDaoSkillEntry }> = []
        const conflicts: WuDaoSkillEntry[] = []
        wudaoSkillClipboard.forEach(item => {
            const id = Number(item.id)
            if (!Number.isFinite(id) || id <= 0) return
            const key = String(id)
            if (existingKeys.has(key)) {
                conflicts.push(item)
                return
            }
            inserts.push({ key, row: { ...cloneWuDaoSkillEntry(item), id } })
            existingKeys.add(key)
        })
        if (conflicts.length > 0) {
            const prefixText = window.prompt(`检测到 ${conflicts.length} 条悟道技能ID重复，请输入新的ID前缀，例如 280`)
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
                inserts.push({ key: nextKey, row: { ...cloneWuDaoSkillEntry(conflicts[index]), id: Number(nextKey) } })
                existingKeys.add(nextKey)
            }
        }
        if (inserts.length === 0) return
        setWuDaoSkillMap((prev: Record<string, WuDaoSkillEntry>) => {
            const draft = { ...prev }
            inserts.forEach(({ key, row }) => {
                draft[key] = row
            })
            return draft
        })
        const nextKeys = inserts.map(item => item.key)
        setSelectedWuDaoSkillKey(nextKeys[0] ?? '')
        setSelectedWuDaoSkillKeys(nextKeys)
        setWuDaoSkillSelectionAnchor(nextKeys[0] ?? '')
        setWuDaoSkillDirty(true)
        setStatus(`已粘贴 ${inserts.length} 条悟道技能数据。`)
    }

    function handleChangeWuDaoSkillForm(patch: Partial<WuDaoSkillEntry>) {
        if (!selectedWuDaoSkillKey || !wudaoSkillMap[selectedWuDaoSkillKey]) return
        const current = wudaoSkillMap[selectedWuDaoSkillKey]
        const next = { ...current, ...patch }
        const nextId = Number(next.id || 0)
        if (!Number.isFinite(nextId) || nextId <= 0) return
        const nextKey = String(nextId)
        setWuDaoSkillMap((prev: Record<string, WuDaoSkillEntry>) => {
            if (nextKey !== selectedWuDaoSkillKey && prev[nextKey]) {
                setStatus(`ID ${nextId} 已存在，不能重复。`)
                return prev
            }
            const draft = { ...prev }
            delete draft[selectedWuDaoSkillKey]
            draft[nextKey] = { ...next, id: nextId }
            return draft
        })
        setSelectedWuDaoSkillKey(nextKey)
        setSelectedWuDaoSkillKeys((prev: string[]) =>
            prev.map(key => (key === selectedWuDaoSkillKey ? nextKey : key)).filter((key, idx, arr) => arr.indexOf(key) === idx)
        )
        setWuDaoSkillSelectionAnchor(nextKey)
        setWuDaoSkillDirty(true)
    }

    return {
        handleSelectWuDaoSkill,
        handleDeleteWuDaoSkills,
        handleBatchPrefixWuDaoSkillIds,
        handleAddWuDaoSkill,
        handleCopyWuDaoSkill,
        handlePasteWuDaoSkill,
        handleChangeWuDaoSkillForm,
    }
}
