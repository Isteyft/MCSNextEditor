import { Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'

export type SeidMetaProperty = {
    ID: string
    Type: string
    Desc: string
    SpecialDrawer?: string[]
}

export type SeidMetaItem = {
    id: number
    name: string
    desc: string
    properties: SeidMetaProperty[]
}

type SeidPickerModalProps = {
    open: boolean
    items: SeidMetaItem[]
    selectedIds: number[]
    onClose: () => void
    onPick: (id: number) => void
}

function includesSearch(item: SeidMetaItem, search: string) {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return true
    const haystack = `${item.id} ${item.name || ''} ${item.desc || ''}`.toLowerCase()
    return haystack.includes(keyword)
}

export function SeidPickerModal({ open, items, selectedIds, onClose, onPick }: SeidPickerModalProps) {
    const [searchDraft, setSearchDraft] = useState('')
    const [searchText, setSearchText] = useState('')
    const filteredItems = useMemo(() => items.filter(item => includesSearch(item, searchText)), [items, searchText])

    if (!open) return null

    return (
        <div className="modal-mask" onClick={onClose}>
            <div className="create-modal seid-picker-modal" onClick={event => event.stopPropagation()}>
                <div className="create-modal-head">
                    <strong>选择 Seid</strong>
                    <button className="modal-close" onClick={onClose} type="button">
                        <X size={14} />
                    </button>
                </div>
                <div className="search-input-wrap">
                    <input
                        className="modal-search-input"
                        onChange={event => setSearchDraft(event.target.value)}
                        onKeyDown={event => {
                            if (event.key === 'Enter') setSearchText(searchDraft)
                        }}
                        placeholder="搜索 id/name/desc"
                        value={searchDraft}
                    />
                    <button className="search-action-btn" onClick={() => setSearchText(searchDraft)} title="搜索" type="button">
                        <Search size={14} />
                    </button>
                </div>
                <div className="seid-picker-list">
                    {filteredItems.length === 0 ? <div className="todo-box">未读取到 Seid 元数据</div> : null}
                    {filteredItems.map(item => {
                        const exists = selectedIds.includes(item.id)
                        return (
                            <button
                                className="seid-picker-row"
                                disabled={exists}
                                key={item.id}
                                onClick={() => onPick(item.id)}
                                type="button"
                            >
                                <div className="seid-picker-main">
                                    <span className="seid-picker-id">{item.id}</span>
                                    <strong>{item.name || '-'}</strong>
                                </div>
                                <div className="seid-picker-desc">{item.desc || '-'}</div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
