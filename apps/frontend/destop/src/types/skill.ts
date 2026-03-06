export type SkillEntry = {
    id: number
    Skill_ID: number
    Skill_Lv: number
    skillEffect: string
    Skill_Type: number
    name: string
    qingjiaotype: number
    seid: number[]
    seidData: Record<string, Record<string, string | number | number[]>>
    Affix: number[]
    Affix2: number[]
    descr: string
    TuJiandescr: string
    Skill_LV: number
    AttackType: number[]
    typePinJie: number
    script: 'SkillAttack' | 'SkillSelf'
    HP: number
    speed: number
    icon: number
    Skill_DisplayType: number
    skill_SameCastNum: number[]
    skill_CastType: number[]
    skill_Cast: number[]
    DF: number
    TuJianType: number
    Skill_Open: number
    Skill_castTime: number
    canUseDistMax: number
    CD: number
}
