import type { AppSettings } from './app-settings-store'

export const SETTINGS_APPLIED_EVENT = 'baize://settings-applied'

export type SettingsAppliedPayload = {
    settings: AppSettings
}
