export type WuDaoSkillEntry = {
    id: number
    icon: string
    name: string
    Cast: number
    Type: number[]
    Lv: number
    seid: number[]
    seidData: Record<string, Record<string, string | number | number[]>>
    desc: string
    xiaoguo: string
    CanForget: number
}
