import { useMemo } from 'react'

import { joinWinPath, pickLeafName } from '../../utils/path'

type UseModulePathsParams = {
    modRootPath: string
    renameTargetPath: string
}

export function useModulePaths({ modRootPath, renameTargetPath }: UseModulePathsParams) {
    const moduleConfigPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Config', 'modConfig.json') : ''), [modRootPath])
    const npcPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Data', 'AvatarJsonData.json') : ''), [modRootPath])
    const wudaoPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Data', 'WuDaoAllTypeJson.json') : ''), [modRootPath])
    const wudaoSkillPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Data', 'WuDaoJson.json') : ''), [modRootPath])
    const affixPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Data', 'TuJianChunWenBen.json') : ''), [modRootPath])
    const createAvatarPath = useMemo(
        () => (modRootPath ? joinWinPath(modRootPath, 'Data', 'CreateAvatarJsonData.json') : ''),
        [modRootPath]
    )
    const buffDirPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Data', 'BuffJsonData') : ''), [modRootPath])
    const buffIconDirPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Assets', 'Buff Icon') : ''), [modRootPath])
    const itemDirPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Data', 'ItemJsonData') : ''), [modRootPath])
    const itemIconDirPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Assets', 'Item Icon') : ''), [modRootPath])
    const skillDirPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Data', 'skillJsonData') : ''), [modRootPath])
    const skillIconDirPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Assets', 'skill Icon') : ''), [modRootPath])
    const staticSkillPath = useMemo(() => (modRootPath ? joinWinPath(modRootPath, 'Data', 'StaticSkillJsonData.json') : ''), [modRootPath])
    const modFolderName = useMemo(() => pickLeafName(renameTargetPath || modRootPath) || 'modĬ��', [renameTargetPath, modRootPath])

    return {
        moduleConfigPath,
        npcPath,
        wudaoPath,
        wudaoSkillPath,
        affixPath,
        createAvatarPath,
        buffDirPath,
        buffIconDirPath,
        itemDirPath,
        itemIconDirPath,
        skillDirPath,
        skillIconDirPath,
        staticSkillPath,
        modFolderName,
    }
}
