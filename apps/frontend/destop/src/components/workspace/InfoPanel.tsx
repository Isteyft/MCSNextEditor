import { ClipboardPaste, Copy, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

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
}: InfoPanelProps) {
    const [menu, setMenu] = useState({ open: false, x: 0, y: 0 })
    const [searchDraft, setSearchDraft] = useState(searchText)

    useEffect(() => {
        setSearchDraft(searchText)
    }, [searchText])

    function handleBatchPrefix() {
        const value = window.prompt('请输入 ID 开头数字，例如 40')
        if (value === null) return
        const prefix = value.trim()
        if (!prefix) return
        onBatchPrefixIds(prefix)
    }

    const isTableModule = ['affix', 'talent', 'buff', 'item', 'skill', 'staticskill'].includes(activeModule)
    const nameCol =
        activeModule === 'affix'
            ? '词缀名称'
            : activeModule === 'buff'
              ? 'Buff 名称'
              : activeModule === 'item'
                ? '物品名称'
                : activeModule === 'skill'
                  ? '神通名称'
                  : activeModule === 'staticskill'
                    ? '功法名称'
                    : '天赋名称'
    const cateCol =
        activeModule === 'affix'
            ? '项目类型'
            : activeModule === 'buff'
              ? 'Buff 类型'
              : activeModule === 'item'
                ? '物品类型'
                : activeModule === 'skill'
                  ? '释放优先级'
                  : activeModule === 'staticskill'
                    ? '属性'
                    : '分类'

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
                            <div className="search-input-wrap">
                                <input
                                    className="table-search-input"
                                    onChange={event => setSearchDraft(event.target.value)}
                                    onKeyDown={event => {
                                        if (event.key === 'Enter') onSearchTextChange(searchDraft)
                                    }}
                                    placeholder="搜索 id/name/desc/info"
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
                                        <th>{nameCol}</th>
                                        <th>{cateCol}</th>
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
                                <div className="folder-menu" style={{ left: menu.x, top: menu.y }}>
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
                                </div>
                            </>
                        ) : null}
                    </>
                ) : (
                    <div className="todo-box">TODO: 当前模块暂无表格数据</div>
                )}
            </div>
        </section>
    )
}
