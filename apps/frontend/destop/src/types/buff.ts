export type BuffEntry = {
    buffid: number
    BuffIcon: number
    skillEffect: string
    name: string
    Affix: number[]
    bufftype: number
    seid: number[]
    seidData: Record<string, Record<string, string | number | number[]>>
    descr: string
    trigger: number
    removeTrigger: number
    script: string
    looptime: number
    totaltime: number
    BuffType: number
    isHide: number
    ShowOnlyOne: number
}
