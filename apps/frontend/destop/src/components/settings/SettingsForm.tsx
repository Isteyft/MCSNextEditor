import { open } from '@tauri-apps/plugin-dialog'

type SettingsFormProps = {
    values: {
        jsonImportFolderPaths: string[]
        jsonImportFilePaths: string[]
        uniqueIdSyncEnabled: boolean
        uniqueIdSyncTriggerLevels: number[]
        batchIdChangeKeepOriginal: boolean
        autoSaveEnabled: boolean
        autoSaveIntervalSeconds: number
    }
    onChange: (patch: Partial<SettingsFormProps['values']>) => void
}

function pickPaths(value: string | string[] | null): string[] {
    if (!value) return []
    if (Array.isArray(value)) return value.filter(Boolean)
    return value ? [value] : []
}

function mergeUnique(current: string[], incoming: string[]): string[] {
    return Array.from(new Set([...current, ...incoming].filter(Boolean)))
}

export function SettingsForm({ values, onChange }: SettingsFormProps) {
    const triggerLevelsText = values.uniqueIdSyncTriggerLevels.join(',')

    async function handlePickJsonFolders() {
        const selected = await open({
            title: '选择 JSON 数据目录',
            directory: true,
            multiple: true,
        })
        const paths = pickPaths(selected)
        if (paths.length > 0) {
            onChange({ jsonImportFolderPaths: mergeUnique(values.jsonImportFolderPaths, paths) })
        }
    }

    async function handlePickJsonFiles() {
        const selected = await open({
            title: '选择 JSON 数据文件',
            directory: false,
            multiple: true,
            filters: [{ name: 'JSON', extensions: ['json'] }],
        })
        const paths = pickPaths(selected)
        if (paths.length > 0) {
            onChange({ jsonImportFilePaths: mergeUnique(values.jsonImportFilePaths, paths) })
        }
    }

    function removeFolder(path: string) {
        onChange({ jsonImportFolderPaths: values.jsonImportFolderPaths.filter(item => item !== path) })
    }

    function removeFile(path: string) {
        onChange({ jsonImportFilePaths: values.jsonImportFilePaths.filter(item => item !== path) })
    }

    function handleTriggerLevelsTextChange(input: string) {
        const nextLevels = Array.from(
            new Set(
                input
                    .split(',')
                    .map(item => Number(item.trim()))
                    .filter(item => Number.isFinite(item) && item >= 0 && item <= 5)
                    .map(item => Math.floor(item))
            )
        ).sort((a, b) => a - b)
        onChange({ uniqueIdSyncTriggerLevels: nextLevels })
    }

    const entries = [
        ...values.jsonImportFolderPaths.map(path => ({ kind: '目录' as const, path })),
        ...values.jsonImportFilePaths.map(path => ({ kind: '文件' as const, path })),
    ]

    return (
        <section className="settings-pref-page">
            <div className="settings-pref-section">
                <h3>JSON 导入</h3>
                <div className="settings-pref-card">
                    <div className="settings-pref-row">
                        <span>添加 JSON 目录</span>
                        <button className="settings-action-btn" onClick={() => void handlePickJsonFolders()} type="button">
                            选择目录
                        </button>
                    </div>
                    <div className="settings-pref-row">
                        <span>添加 JSON 文件</span>
                        <button className="settings-action-btn" onClick={() => void handlePickJsonFiles()} type="button">
                            选择文件
                        </button>
                    </div>
                    <div className="settings-pref-row settings-pref-row-list">
                        <span>已添加内容</span>
                        <div className="settings-pref-list-wrap">
                            {entries.length > 0 ? (
                                entries.map(item => (
                                    <div className="settings-pref-list-item" key={`${item.kind}:${item.path}`}>
                                        <span className="settings-kind-tag">{item.kind}</span>
                                        <code>{item.path}</code>
                                        <button
                                            className="settings-remove-btn"
                                            onClick={() => (item.kind === '目录' ? removeFolder(item.path) : removeFile(item.path))}
                                            type="button"
                                        >
                                            删除
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="muted">暂无内容</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="settings-pref-section">
                <h3>编辑器</h3>
                <div className="settings-pref-card">
                    <div className="settings-pref-row">
                        <span>启用唯一 ID 联动</span>
                        <label className="settings-switch">
                            <input
                                checked={values.uniqueIdSyncEnabled}
                                onChange={event => onChange({ uniqueIdSyncEnabled: event.target.checked })}
                                type="checkbox"
                            />
                            <span className="settings-switch-slider" />
                        </label>
                    </div>
                    <div className="settings-pref-row">
                        <span>触发等级（逗号分隔）</span>
                        <input
                            className="settings-level-input"
                            onChange={event => handleTriggerLevelsTextChange(event.target.value)}
                            placeholder="0-5，如: 1,2,3"
                            type="text"
                            value={triggerLevelsText}
                        />
                    </div>
                    <div className="settings-pref-row">
                        <span>批量改ID时保留原数据</span>
                        <label className="settings-switch">
                            <input
                                checked={values.batchIdChangeKeepOriginal}
                                onChange={event => onChange({ batchIdChangeKeepOriginal: event.target.checked })}
                                type="checkbox"
                            />
                            <span className="settings-switch-slider" />
                        </label>
                    </div>
                </div>
            </div>

            <div className="settings-pref-section">
                <h3>自动保存</h3>
                <div className="settings-pref-card">
                    <div className="settings-pref-row">
                        <span>自动保存</span>
                        <label className="settings-switch">
                            <input
                                checked={values.autoSaveEnabled}
                                onChange={event => onChange({ autoSaveEnabled: event.target.checked })}
                                type="checkbox"
                            />
                            <span className="settings-switch-slider" />
                        </label>
                    </div>
                    <div className="settings-pref-row">
                        <span>自动保存间隔（秒）</span>
                        <input
                            className="settings-level-input"
                            inputMode="numeric"
                            min={5}
                            onChange={event =>
                                onChange({
                                    autoSaveIntervalSeconds: Math.max(5, Number.parseInt(event.target.value || '0', 10) || 5),
                                })
                            }
                            type="number"
                            value={values.autoSaveIntervalSeconds}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}
