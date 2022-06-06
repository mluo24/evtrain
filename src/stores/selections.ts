import { defineStore } from 'pinia'
import { SelectOption } from '../types'
import { getItemDetails } from '../utils'

export const useSelectionsStore = defineStore('selections', {
  state: () => ({
    pokerus: false,
    selectedItem: '',
    effectText: '',
    selectedPreset: '',
    selectedPokemon: {} as SelectOption,
    selectedLocation: {} as SelectOption,
    selectedRegion: {} as SelectOption,
  }),
  actions: {
    async getEffectText() {
      if (this.selectedItem !== '') {
        this.effectText = (
          await getItemDetails(this.selectedItem)
        ).effect_entries.filter(
          (effect) => effect.language.name === 'en'
        )[0].short_effect
      }
    },
  },
})
