export type ItemEntry = {
    id: number
    ItemIcon: number
    maxNum: number
    name: string
    FaBaoType: string
    Affix: number[]
    TuJianType: number
    ShopType: number
    ItemFlag: number[]
    WuWeiType: number
    ShuXingType: number
    type: number
    quality: number
    typePinJie: number
    StuTime: number
    seid: number[]
    seidData: Record<string, Record<string, string | number | number[]>>
    vagueType: number
    price: number
    desc: string
    desc2: string
    CanSale: number
    DanDu: number
    CanUse: number
    NPCCanUse: number
    yaoZhi1: number
    yaoZhi2: number
    yaoZhi3: number
    wuDao: number[]
}
