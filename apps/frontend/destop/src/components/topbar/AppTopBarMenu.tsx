import { useRef, useState } from 'react'

import { useOutsideClick } from '../../hooks/useOutsideClick'
import { TopBar } from './TopBar'

type AppTopBarMenuProps = {
    configDirty: boolean
    onCreateProject: () => void
    onOpenProject: () => void
    onSaveProject: () => void
    onOpenSettings: () => void
    onClose: () => void
    onMinimize: () => void
    onToggleMaximize: () => void
    onStartDragging: () => void
}

export function AppTopBarMenu({
    configDirty,
    onCreateProject,
    onOpenProject,
    onSaveProject,
    onOpenSettings,
    onClose,
    onMinimize,
    onToggleMaximize,
    onStartDragging,
}: AppTopBarMenuProps) {
    const menuGroupRef = useRef<HTMLDivElement | null>(null)
    const [menuOpen, setMenuOpen] = useState<'file' | 'help' | null>(null)

    useOutsideClick(menuGroupRef, () => setMenuOpen(null), true)

    return (
        <TopBar onClose={onClose} onMinimize={onMinimize} onStartDragging={onStartDragging} onToggleMaximize={onToggleMaximize}>
            <div className="menu-row" data-no-drag ref={menuGroupRef}>
                <div className="menu-group">
                    <button className="menu-trigger" onClick={() => setMenuOpen(prev => (prev === 'file' ? null : 'file'))} type="button">
                        文件
                    </button>
                    {menuOpen === 'file' ? (
                        <div className="menu-dropdown">
                            <button
                                className="menu-item"
                                onClick={() => {
                                    setMenuOpen(null)
                                    onCreateProject()
                                }}
                                type="button"
                            >
                                新建项目
                            </button>
                            <button
                                className="menu-item"
                                onClick={() => {
                                    setMenuOpen(null)
                                    onOpenProject()
                                }}
                                type="button"
                            >
                                打开项目
                            </button>
                            <button
                                className="menu-item"
                                onClick={() => {
                                    setMenuOpen(null)
                                    onSaveProject()
                                }}
                                type="button"
                            >
                                保存项目{configDirty ? ' *' : ''}
                            </button>
                        </div>
                    ) : null}
                </div>
                <div className="menu-group">
                    <button className="menu-trigger" onClick={() => setMenuOpen(prev => (prev === 'help' ? null : 'help'))} type="button">
                        帮助
                    </button>
                    {menuOpen === 'help' ? (
                        <div className="menu-dropdown">
                            <button
                                className="menu-item"
                                onClick={() => {
                                    setMenuOpen(null)
                                    onOpenSettings()
                                }}
                                type="button"
                            >
                                设置
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </TopBar>
    )
}
