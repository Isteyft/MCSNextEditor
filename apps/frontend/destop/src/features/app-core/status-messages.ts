export const STATUS_MESSAGES = {
    openProjectHint: '请先从“文件”菜单打开项目。',
    openProjectLoaded: (rootPath: string) => `项目已打开并预加载全部目录数据: ${rootPath}`,
    openProjectLoadedFallback: (modRootPath: string) => `项目已打开并预加载全部目录数据，按预设路径加载: ${modRootPath}`,
    switchedRootCached: (name: string) => `已切换目录（缓存命中）: ${name}`,
    switchedRootLoaded: (name: string) => `已切换目录并预加载全部数据: ${name}`,
    renamedModRoot: (name: string) => `mod 目录已重命名: ${name}`,
    deletedFolder: (name: string) => `已删除文件夹: ${name}`,
    requireModName: '请输入 mod 名称。',
    requireProjectAndModName: '请输入项目名字和 mod 名称。',
    requireOpenProjectFirst: '请先打开一个项目，再新增 mod 目录。',
    cannotLocateNextDir: '无法定位 plugins\\Next 目录。',
    createdMod: (path: string) => `mod目录已新建: ${path}`,
    createdProject: (path: string) => `项目已新建: ${path}`,
    settingsSaved: '设置已保存。',
    requireProjectForGlobalImport: '请先打开项目后再执行全局导入。',
    globalImportDone: '全局导入执行完成。',
    globalImportDoneWithFailed: (failedModules: string[]) => `全局导入完成，失败模块: ${failedModules.join(', ') || '-'}`,
}

export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message
    if (typeof error === 'string') return error
    try {
        return JSON.stringify(error)
    } catch {
        return String(error)
    }
}

export function statusError(action: string, error: unknown): string {
    return `${action}失败: ${getErrorMessage(error)}`
}
