import { ChevronDown, ChevronRight, Folder } from 'lucide-react'

import { ModuleKey, MODULES } from '../../modules'

type RootFolderItem = {
    path: string
    name: string
}

function normalizePath(path: string) {
    return path.replace(/\//g, '\\').toLowerCase()
}

const SIDEBAR_MODULES = MODULES.filter(module => module.key !== 'settings')

type ModuleSidebarProps = {
    activeModule: ModuleKey | ''
    activeRootPath: string
    rootFolders: RootFolderItem[]
    expandedRootPaths: string[]
    onSelect: (key: ModuleKey) => void
    onSelectRoot: (path: string) => void
    onToggleExpanded: (path: string) => void
    onRootContextMenu?: (x: number, y: number, path: string) => void
    onBlankContextMenu?: (x: number, y: number) => void
}

export function ModuleSidebar({
    activeModule,
    activeRootPath,
    rootFolders,
    expandedRootPaths,
    onSelect,
    onSelectRoot,
    onToggleExpanded,
    onRootContextMenu,
    onBlankContextMenu,
}: ModuleSidebarProps) {
    return (
        <aside className="panel panel-tree">
            <h2>项目文件夹</h2>
            <div
                className="panel-content"
                onContextMenu={event => {
                    const target = event.target as HTMLElement
                    if (target.closest('.tree-root') || target.closest('.tree-item')) return
                    event.preventDefault()
                    onBlankContextMenu?.(event.clientX, event.clientY)
                }}
            >
                {rootFolders.map(root => {
                    const rootKey = normalizePath(root.path)
                    const isActiveRoot = rootKey === normalizePath(activeRootPath)
                    const isExpanded = expandedRootPaths.some(path => normalizePath(path) === rootKey)
                    return (
                        <div key={root.path}>
                            <button
                                className={`tree-root ${isActiveRoot ? 'active' : ''}`}
                                onClick={() => {
                                    if (isActiveRoot) {
                                        onToggleExpanded(root.path)
                                    } else {
                                        onSelectRoot(root.path)
                                    }
                                }}
                                onContextMenu={event => {
                                    event.preventDefault()
                                    onRootContextMenu?.(event.clientX, event.clientY, root.path)
                                }}
                                type="button"
                            >
                                <Folder size={14} />
                                <span>{root.name}</span>
                                <span className="tree-expand-icon">
                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </span>
                            </button>

                            {isExpanded ? (
                                <div className="tree-children">
                                    {SIDEBAR_MODULES.map(module => (
                                        <button
                                            className={`tree-item ${isActiveRoot && module.key === activeModule ? 'active' : ''}`}
                                            key={module.key}
                                            onClick={() => {
                                                if (!isActiveRoot) onSelectRoot(root.path)
                                                onSelect(module.key)
                                            }}
                                            type="button"
                                        >
                                            {module.label}
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    )
                })}
            </div>
        </aside>
    )
}
