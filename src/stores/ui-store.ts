import { create } from 'zustand'

/** Session-only UI flags (not persisted). */
type UiState = {
  setupPromptOpen: boolean
  setSetupPromptOpen: (open: boolean) => void
  /** Phone/tablet slide-in sidebar. */
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
  /** The design's Create loyalty modal, opened from Overview and Loyalty. */
  createLoyaltyOpen: boolean
  openCreateLoyalty: () => void
  closeCreateLoyalty: () => void
}

export const useUiStore = create<UiState>()(set => ({
  setupPromptOpen: true,
  setSetupPromptOpen: open => set({ setupPromptOpen: open }),
  mobileNavOpen: false,
  setMobileNavOpen: open => set({ mobileNavOpen: open }),
  createLoyaltyOpen: false,
  openCreateLoyalty: () => set({ createLoyaltyOpen: true }),
  closeCreateLoyalty: () => set({ createLoyaltyOpen: false }),
}))
