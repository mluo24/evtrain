import { defineStore } from 'pinia'
import { SelectOption } from '../types'
import { getItemDetails } from '../utils'

export const useSelectionsStore = defineStore('selections', {
  state: () => ({
    pokerus: false,
    selectedItem: '',
    effectText: '',
    selectedPreset: '',
    selectedPokemon: { label: '', code: '' } as SelectOption,
    selectedLocation: { label: '', code: '' } as SelectOption,
    selectedRegion: { label: '', code: '' } as SelectOption,
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
