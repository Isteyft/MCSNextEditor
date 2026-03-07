import { useState } from 'react'

import { SettingsForm } from './components/settings/SettingsForm'
import { STATUS_MESSAGES } from './features/app-core/status-messages'
import { useAppSettings } from './features/settings/useAppSettings'

export function SettingsWindowApp() {
    const { settingsDraft, patchSettings, persistSettings, resetSettings } = useAppSettings()
    const [status, setStatus] = useState('设置窗口已就绪。')

    return (
        <div className="settings-window-shell">
            <main className="settings-window-main">
                <section className="panel panel-editor settings-window-panel">
                    <h2>设置</h2>
                    <div className="panel-content">
                        <SettingsForm values={settingsDraft} onChange={patchSettings} />
                    </div>
                    <div className="settings-window-actions">
                        <button
                            className="save-btn"
                            onClick={async () => {
                                const { filePath } = await persistSettings()
                                setStatus(
                                    filePath ? `${STATUS_MESSAGES.settingsSaved} 配置文件: ${filePath}` : STATUS_MESSAGES.settingsSaved
                                )
                            }}
                            type="button"
                        >
                            保存设置
                        </button>
                        <button
                            className="save-btn"
                            onClick={async () => {
                                const { filePath } = await resetSettings()
                                setStatus(filePath ? `设置已重置。配置文件: ${filePath}` : '设置已重置。')
                            }}
                            type="button"
                        >
                            重置
                        </button>
                    </div>
                </section>
            </main>
            <div className="status-bar settings-window-status">{status}</div>
        </div>
    )
}
