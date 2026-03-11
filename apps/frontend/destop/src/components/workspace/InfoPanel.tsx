import { ClipboardPaste, Copy, Plus, Search, Trash2, Upload } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { ModuleKey } from '../../modules'

export type CreateAvatarRow = {
    key: string
    id: number
    title: string
    fenLei: string
    desc: string
}

type InfoPanelProps = {
    activeModule: ModuleKey | ''
    rows: CreateAvatarRow[]
    searchText: string
    onSearchTextChange: (value: string) => void
    selectedTalentKey: string
    selectedTalentKeys: string[]
    onSelectTalent: (key: string, index: number, options: { shift: boolean; ctrl: boolean }) => void
    onAddTalent: () => void
    onDeleteTalents: () => void
    onBatchPrefixIds: (prefix: string) => void
    onCopyTalent: () => void
    onPasteTalent: () => void
    onImportTalent: (jsonText: string) => void
    onGenerateGroup?: () => void
    canGenerateGroup?: boolean
    generateGroupLabel?: string
    onGenerateBook?: () => void
    canGenerateBook?: boolean
    generateBookLabel?: string
}

function getColumnLabels(activeModule: ModuleKey | '') {
    switch (activeModule) {
        case 'npc':
            return { name: '名称', category: '势力' }
        case 'wudao':
            return { name: '名称', category: '道类' }
        case 'wudaoskill':
            return { name: '名称', category: '悟道类型' }
        case 'affix':
            return { name: '词缀名称', category: '类型' }
        case 'buff':
            return { name: 'Buff名称', category: 'Buff类型' }
        case 'item':
            return { name: '物品名称', category: '物品类型' }
        case 'skill':
            return { name: '神通名', category: '阶段' }
        case 'staticskill':
            return { name: '功法名', category: '品阶' }
        default:
            return { name: '名称', category: '分类' }
    }
}

export function InfoPanel({
    activeModule,
    rows,
    searchText,
    onSearchTextChange,
    selectedTalentKey,
    selectedTalentKeys,
    onSelectTalent,
    onAddTalent,
    onDeleteTalents,
    onBatchPrefixIds,
    onCopyTalent,
    onPasteTalent,
    onImportTalent,
    onGenerateGroup,
    canGenerateGroup = false,
    generateGroupLabel = '生成技能组',
    onGenerateBook,
    canGenerateBook = false,
    generateBookLabel = '生成技能书',
}: InfoPanelProps) {
    const [menu, setMenu] = useState({ open: false, x: 0, y: 0 })
    const [searchDraft, setSearchDraft] = useState(searchText)
    const [importModalOpen, setImportModalOpen] = useState(false)
    const [importJsonText, setImportJsonText] = useState('')

    const menuPosition = useMemo(() => {
        const itemCount = 2 + (onGenerateGroup ? 1 : 0) + (onGenerateBook ? 1 : 0)
        const menuWidth = 160
        const menuHeight = 12 + itemCount * 36
        const maxX = Math.max(8, window.innerWidth - menuWidth - 8)
        const maxY = Math.max(8, window.innerHeight - menuHeight - 8)
        return {
            left: Math.min(Math.max(menu.x, 8), maxX),
            top: Math.min(Math.max(menu.y, 8), maxY),
        }
    }, [menu.x, menu.y, onGenerateBook, onGenerateGroup])

    useEffect(() => {
        setSearchDraft(searchText)
    }, [searchText])

    function handleBatchPrefix() {
        const value = window.prompt('请输入新的 ID 开头数字，例如 40')
        if (value === null) return
        const prefix = value.trim()
        if (!prefix) return
        onBatchPrefixIds(prefix)
    }

    const isTableModule = ['npc', 'backpack', 'wudao', 'wudaoskill', 'affix', 'talent', 'buff', 'item', 'skill', 'staticskill'].includes(
        activeModule
    )
    const columnLabels = getColumnLabels(activeModule)

    return (
        <section className="panel panel-data">
            <h2>数据内容</h2>
            <div className="panel-content">
                {isTableModule ? (
                    <>
                        <div className="table-toolbar">
                            <button className="icon-btn" onClick={onAddTalent} title="新增" type="button">
                                <Plus size={14} />
                            </button>
                            <button className="icon-btn" onClick={onDeleteTalents} title="删除" type="button">
                                <Trash2 size={14} />
                            </button>
                            <button className="icon-btn" onClick={onCopyTalent} title="复制" type="button">
                                <Copy size={14} />
                            </button>
                            <button className="icon-btn" onClick={onPasteTalent} title="粘贴" type="button">
                                <ClipboardPaste size={14} />
                            </button>
                            <button
                                className="icon-btn"
                                onClick={() => {
                                    setImportJsonText('')
                                    setImportModalOpen(true)
                                }}
                                title="导入 JSON"
                                type="button"
                            >
                                <Upload size={14} />
                            </button>
                            <div className="search-input-wrap">
                                <input
                                    className="table-search-input"
                                    onChange={event => setSearchDraft(event.target.value)}
                                    onKeyDown={event => {
                                        if (event.key === 'Enter') onSearchTextChange(searchDraft)
                                    }}
                                    placeholder="搜索 id / 名称 / 描述"
                                    value={searchDraft}
                                />
                                <button
                                    className="search-action-btn"
                                    onClick={() => onSearchTextChange(searchDraft)}
                                    title="搜索"
                                    type="button"
                                >
                                    <Search size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="todo-table-wrap">
                            <table className="todo-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>{columnLabels.name}</th>
                                        <th>{columnLabels.category}</th>
                                        <th>描述</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, index) => (
                                        <tr
                                            className={
                                                selectedTalentKeys.includes(row.key) || selectedTalentKey === row.key ? 'row-selected' : ''
                                            }
                                            key={row.key}
                                            onClick={event =>
                                                onSelectTalent(row.key, index, {
                                                    shift: event.shiftKey,
                                                    ctrl: event.ctrlKey || event.metaKey,
                                                })
                                            }
                                            onContextMenu={event => {
                                                event.preventDefault()
                                                if (!selectedTalentKeys.includes(row.key)) {
                                                    onSelectTalent(row.key, index, { shift: false, ctrl: false })
                                                }
                                                setMenu({ open: true, x: event.clientX, y: event.clientY })
                                            }}
                                        >
                                            <td>{row.id}</td>
                                            <td>{row.title}</td>
                                            <td>{row.fenLei}</td>
                                            <td>{row.desc}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {menu.open ? (
                            <>
                                <div className="context-mask" onClick={() => setMenu({ open: false, x: 0, y: 0 })} />
                                <div className="folder-menu" style={{ left: menuPosition.left, top: menuPosition.top }}>
                                    <button
                                        className="folder-menu-item danger"
                                        onClick={() => {
                                            onDeleteTalents()
                                            setMenu({ open: false, x: 0, y: 0 })
                                        }}
                                        type="button"
                                    >
                                        删除所选
                                    </button>
                                    <button
                                        className="folder-menu-item"
                                        onClick={() => {
                                            setMenu({ open: false, x: 0, y: 0 })
                                            handleBatchPrefix()
                                        }}
                                        type="button"
                                    >
                                        批量修改 ID 开头
                                    </button>
                                    {onGenerateGroup ? (
                                        <button
                                            className="folder-menu-item"
                                            disabled={!canGenerateGroup}
                                            onClick={() => {
                                                if (!canGenerateGroup) return
                                                setMenu({ open: false, x: 0, y: 0 })
                                                onGenerateGroup()
                                            }}
                                            type="button"
                                        >
                                            {generateGroupLabel}
                                        </button>
                                    ) : null}
                                    {onGenerateBook ? (
                                        <button
                                            className="folder-menu-item"
                                            disabled={!canGenerateBook}
                                            onClick={() => {
                                                if (!canGenerateBook) return
                                                setMenu({ open: false, x: 0, y: 0 })
                                                onGenerateBook()
                                            }}
                                            type="button"
                                        >
                                            {generateBookLabel}
                                        </button>
                                    ) : null}
                                </div>
                            </>
                        ) : null}
                        {importModalOpen ? (
                            <div className="modal-mask">
                                <div className="create-modal json-import-modal">
                                    <div className="create-modal-head">
                                        <h3>导入 JSON</h3>
                                        <button className="modal-close" onClick={() => setImportModalOpen(false)} type="button">
                                            ×
                                        </button>
                                    </div>
                                    <textarea
                                        className="config-desc-input json-import-textarea"
                                        onChange={event => setImportJsonText(event.target.value)}
                                        placeholder="请输入或粘贴 JSON 数据"
                                        value={importJsonText}
                                    />
                                    <div className="settings-window-actions">
                                        <button
                                            className="save-btn"
                                            onClick={() => {
                                                const text = importJsonText.trim()
                                                if (!text) return
                                                onImportTalent(text)
                                                setImportModalOpen(false)
                                            }}
                                            type="button"
                                        >
                                            确认导入
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </>
                ) : (
                    <div className="todo-box">当前模块暂无表格数据</div>
                )}
            </div>
        </section>
    )
}
