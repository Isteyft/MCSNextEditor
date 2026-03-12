import { open } from '@tauri-apps/plugin-dialog'

import { BUILTIN_STATIC_SKILL_ATTRIBUTE_OPTIONS } from '../../features/modules/staticskill/static-skill-attribute-options'
import { DEFAULT_SKILL_SEID_SKIP_JSON_IDS } from '../../features/settings/app-settings-store'

type SettingsFormProps = {
    values: {
        npcWuDaoExtraValues: Array<{ label: string; valueIndex: number }>
        staticSkillAttributeOptions: Array<{ id: number; name: string }>
        buffSeidSkipJsonIds: number[]
        skillSeidSkipJsonIds: number[]
        jsonImportFolderPaths: string[]
        jsonImportFilePaths: string[]
        uniqueIdSyncEnabled: boolean
        uniqueIdSyncTriggerLevels: number[]
        batchIdChangeKeepOriginal: boolean
        autoSaveEnabled: boolean
        autoSaveIntervalSeconds: number
        autoSyncSkillDescrWithAtlas: boolean
        replaceSkillDescrWithSpecialFormat: boolean
        mainWindowWidth: number
        mainWindowHeight: number
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

function parseNumberList(input: string): number[] {
    return Array.from(
        new Set(
            input
                .split(/[，,\s]+/)
                .map(item => Number(item.trim()))
                .filter(item => Number.isFinite(item) && item >= 0)
                .map(item => Math.floor(item))
        )
    ).sort((a, b) => a - b)
}

const MAIN_WINDOW_RESOLUTION_OPTIONS = ['800x600', '1280x968', '1440x1080', '1920x1080'] as const

export function SettingsForm({ values, onChange }: SettingsFormProps) {
    const triggerLevelsText = values.uniqueIdSyncTriggerLevels.join(',')
    const buffSeidSkipJsonText = values.buffSeidSkipJsonIds.join(',')
    const skillSeidSkipJsonText = values.skillSeidSkipJsonIds.join(',')
    const selectedResolution = `${values.mainWindowWidth}x${values.mainWindowHeight}`
    const customStaticSkillAttributeOptions = values.staticSkillAttributeOptions.filter(
        item => !BUILTIN_STATIC_SKILL_ATTRIBUTE_OPTIONS.some(option => option.id === item.id)
    )

    function updateNpcWuDaoExtraValue(index: number, patch: Partial<{ label: string; valueIndex: number }>) {
        onChange({
            npcWuDaoExtraValues: values.npcWuDaoExtraValues.map((item, currentIndex) =>
                currentIndex === index ? { ...item, ...patch } : item
            ),
        })
    }

    function addNpcWuDaoExtraValue() {
        onChange({
            npcWuDaoExtraValues: [...values.npcWuDaoExtraValues, { label: '', valueIndex: 0 }],
        })
    }

    function removeNpcWuDaoExtraValue(index: number) {
        onChange({
            npcWuDaoExtraValues: values.npcWuDaoExtraValues.filter((_, currentIndex) => currentIndex !== index),
        })
    }

    function updateStaticSkillAttribute(index: number, patch: Partial<{ id: number; name: string }>) {
        onChange({
            staticSkillAttributeOptions: customStaticSkillAttributeOptions.map((item, currentIndex) =>
                currentIndex === index ? { ...item, ...patch } : item
            ),
        })
    }

    function addStaticSkillAttribute() {
        onChange({
            staticSkillAttributeOptions: [...customStaticSkillAttributeOptions, { id: 10, name: '' }],
        })
    }

    function removeStaticSkillAttribute(index: number) {
        onChange({
            staticSkillAttributeOptions: customStaticSkillAttributeOptions.filter((_, currentIndex) => currentIndex !== index),
        })
    }

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
                    <div className="settings-pref-row">
                        <span>自动同步图鉴描述到技能描述</span>
                        <label className="settings-switch">
                            <input
                                checked={values.autoSyncSkillDescrWithAtlas}
                                onChange={event => onChange({ autoSyncSkillDescrWithAtlas: event.target.checked })}
                                type="checkbox"
                            />
                            <span className="settings-switch-slider" />
                        </label>
                    </div>
                    <div className="settings-pref-row">
                        <span>同步时替换为特殊格式</span>
                        <label className="settings-switch">
                            <input
                                checked={values.replaceSkillDescrWithSpecialFormat}
                                onChange={event => onChange({ replaceSkillDescrWithSpecialFormat: event.target.checked })}
                                type="checkbox"
                            />
                            <span className="settings-switch-slider" />
                        </label>
                    </div>
                    <div className="settings-pref-row">
                        <span>主窗口默认分辨率</span>
                        <div className="settings-size-inputs">
                            <select
                                className="settings-level-input settings-size-select"
                                onChange={event => {
                                    const [widthText, heightText] = event.target.value.split('x')
                                    const width = Number(widthText)
                                    const height = Number(heightText)
                                    if (!Number.isFinite(width) || !Number.isFinite(height)) return
                                    onChange({ mainWindowWidth: width, mainWindowHeight: height })
                                }}
                                value={selectedResolution}
                            >
                                {!MAIN_WINDOW_RESOLUTION_OPTIONS.includes(
                                    selectedResolution as (typeof MAIN_WINDOW_RESOLUTION_OPTIONS)[number]
                                ) ? (
                                    <option value={selectedResolution}>{selectedResolution}</option>
                                ) : null}
                                {MAIN_WINDOW_RESOLUTION_OPTIONS.map(option => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="settings-pref-section">
                <h3>NPC悟道扩展值</h3>
                <div className="settings-pref-card">
                    <div className="settings-pref-row settings-pref-row-list">
                        <span>扩展属性映射</span>
                        <div className="settings-pref-list-wrap settings-grid-wrap">
                            <div className="settings-grid-head">
                                <span>属性</span>
                                <span>Value序号</span>
                                <span />
                            </div>
                            {values.npcWuDaoExtraValues.map((item, index) => (
                                <div className="settings-grid-row" key={`npcwudao-extra-${index}`}>
                                    <input
                                        className="settings-level-input"
                                        onChange={event => updateNpcWuDaoExtraValue(index, { label: event.target.value })}
                                        placeholder="例如：魔"
                                        type="text"
                                        value={item.label}
                                    />
                                    <input
                                        className="settings-level-input"
                                        inputMode="numeric"
                                        min={1}
                                        onChange={event =>
                                            updateNpcWuDaoExtraValue(index, {
                                                valueIndex: Math.max(0, Number.parseInt(event.target.value || '0', 10) || 0),
                                            })
                                        }
                                        placeholder="例如：21"
                                        type="number"
                                        value={item.valueIndex || ''}
                                    />
                                    <button className="settings-remove-btn" onClick={() => removeNpcWuDaoExtraValue(index)} type="button">
                                        删除
                                    </button>
                                </div>
                            ))}
                            {values.npcWuDaoExtraValues.length === 0 ? <div className="muted">暂无扩展属性</div> : null}
                            <div className="settings-grid-actions">
                                <button className="settings-action-btn" onClick={addNpcWuDaoExtraValue} type="button">
                                    新增一行
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="settings-pref-section">
                <h3>功法属性</h3>
                <div className="settings-pref-card">
                    <div className="settings-pref-row settings-pref-row-list">
                        <span>内置属性</span>
                        <div className="settings-pref-list-wrap settings-grid-wrap">
                            <div className="settings-grid-head">
                                <span>ID</span>
                                <span>名称</span>
                                <span />
                            </div>
                            {BUILTIN_STATIC_SKILL_ATTRIBUTE_OPTIONS.map(item => (
                                <div className="settings-grid-row" key={`builtin-static-skill-attr-${item.id}`}>
                                    <input className="settings-level-input" disabled type="number" value={item.id} />
                                    <input className="settings-level-input" disabled type="text" value={item.name} />
                                    <span className="muted settings-grid-note">内置</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="settings-pref-row settings-pref-row-list">
                        <span>自定义属性</span>
                        <div className="settings-pref-list-wrap settings-grid-wrap">
                            <div className="settings-grid-head">
                                <span>ID</span>
                                <span>名称</span>
                                <span />
                            </div>
                            {customStaticSkillAttributeOptions.map((item, index) => (
                                <div className="settings-grid-row" key={`custom-static-skill-attr-${index}`}>
                                    <input
                                        className="settings-level-input"
                                        inputMode="numeric"
                                        min={10}
                                        onChange={event =>
                                            updateStaticSkillAttribute(index, {
                                                id: Math.max(10, Number.parseInt(event.target.value || '10', 10) || 10),
                                            })
                                        }
                                        type="number"
                                        value={item.id}
                                    />
                                    <input
                                        className="settings-level-input"
                                        onChange={event => updateStaticSkillAttribute(index, { name: event.target.value })}
                                        placeholder="例如：雷"
                                        type="text"
                                        value={item.name}
                                    />
                                    <button className="settings-remove-btn" onClick={() => removeStaticSkillAttribute(index)} type="button">
                                        删除
                                    </button>
                                </div>
                            ))}
                            {customStaticSkillAttributeOptions.length === 0 ? <div className="muted">暂无自定义属性</div> : null}
                            <div className="settings-grid-actions">
                                <button className="settings-action-btn" onClick={addStaticSkillAttribute} type="button">
                                    新增一行
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="settings-pref-section">
                <h3>Seid JSON 生成</h3>
                <div className="settings-pref-card">
                    <div className="settings-pref-row">
                        <span>Buff 跳过生成 JSON 的 Seid</span>
                        <input
                            className="settings-level-input"
                            onChange={event => onChange({ buffSeidSkipJsonIds: parseNumberList(event.target.value) })}
                            placeholder="例如：3,5,10"
                            type="text"
                            value={buffSeidSkipJsonText}
                        />
                    </div>
                    <div className="settings-pref-row">
                        <span>神通跳过生成 JSON 的 Seid</span>
                        <div className="settings-inline-actions">
                            <input
                                className="settings-level-input settings-wide-input"
                                onChange={event => onChange({ skillSeidSkipJsonIds: parseNumberList(event.target.value) })}
                                placeholder="例如：2,8,11"
                                type="text"
                                value={skillSeidSkipJsonText}
                            />
                            <button
                                className="settings-action-btn"
                                onClick={() => onChange({ skillSeidSkipJsonIds: [...DEFAULT_SKILL_SEID_SKIP_JSON_IDS] })}
                                type="button"
                            >
                                重置默认值
                            </button>
                        </div>
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
