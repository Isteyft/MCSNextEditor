# Step 5 Execution Log

## Scope

Extract module CRUD handler groups from `src/App.tsx` into per-module hooks.

## Changes Made

-   Added module hooks:
-   `src/features/modules/affix/useAffixHandlers.ts`
-   `src/features/modules/talent/useTalentHandlers.ts`
-   `src/features/modules/buff/useBuffHandlers.ts`
-   `src/features/modules/item/useItemHandlers.ts`
-   `src/features/modules/skill/useSkillHandlers.ts`
-   `src/features/modules/staticskill/useStaticSkillHandlers.ts`

-   Moved handler groups from `App.tsx` into module hooks:
-   Affix:
-   `handleSelectAffix`
-   `handleDeleteAffixes`
-   `handleBatchPrefixAffixIds`
-   `handleAddAffix`
-   `handleCopyAffix`
-   `handlePasteAffix`
-   `handleChangeAffixForm`
-   Talent:
-   `handleSelectTalent`
-   `handleDeleteTalents`
-   `handleBatchPrefixIds`
-   `handleAddTalent`
-   `handleCopyTalent`
-   `handlePasteTalent`
-   `handleChangeTalentForm`
-   Buff:
-   `handleSelectBuff`
-   `handleDeleteBuffs`
-   `handleBatchPrefixBuffIds`
-   `handleAddBuff`
-   `handleCopyBuff`
-   `handlePasteBuff`
-   `handleChangeBuffForm`
-   Item:
-   `handleSelectItem`
-   `handleDeleteItems`
-   `handleBatchPrefixItemIds`
-   `handleAddItem`
-   `handleCopyItem`
-   `handlePasteItem`
-   `handleChangeItemForm`
-   Skill:
-   `handleSelectSkill`
-   `handleDeleteSkills`
-   `handleBatchPrefixSkillIds`
-   `handleAddSkill`
-   `handleCopySkill`
-   `handlePasteSkill`
-   `handleChangeSkillForm`
-   `handleGenerateSkillGroup`
-   `handleGenerateSkillBooksFromSkill`
-   StaticSkill:
-   `handleSelectStaticSkill`
-   `handleDeleteStaticSkills`
-   `handleBatchPrefixStaticSkillIds`
-   `handleAddStaticSkill`
-   `handleCopyStaticSkill`
-   `handlePasteStaticSkill`
-   `handleChangeStaticSkillForm`
-   `handleGenerateStaticSkillGroup`
-   `handleGenerateSkillBooksFromStaticSkill`

-   Updated `src/App.tsx`:
-   Added `useAffixHandlers(...)`, `useTalentHandlers(...)`, `useBuffHandlers(...)`, `useItemHandlers(...)`, `useSkillHandlers(...)`, `useStaticSkillHandlers(...)` wiring.
-   Removed local implementations of all handler groups listed above.
-   Cleaned related imports.

## Verification

-   Ran: `pnpm run typecheck`
-   Result: passed (`tsc --noEmit` success)

## Step 5 Status

-   Completed.
