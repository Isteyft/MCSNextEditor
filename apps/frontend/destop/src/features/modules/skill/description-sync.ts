export function formatAtlasDescriptionToSkillDescription(input: string) {
    return String(input ?? '').replace(
        /【([^】]+)】/g,
        (_matched, content: string) => `#c449491【<hy t=${content} l=2_101_3_34 fhc=#e86524 ul=1>】#n`
    )
}
