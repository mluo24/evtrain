import { defineStore } from 'pinia'
import { increments, parseEffectText, statsToString } from '../utils'
import { useStatsStore } from './stats'
import { useSelectionsStore } from './selections'

export const useHistoryStore = defineStore('history', {
  state: () => ({
    battleHistory: [],
  }),
  getters: {
    computedIncrements() {
      const statsStore = useStatsStore()
      const selectionsStore = useSelectionsStore()
      selectionsStore.getEffectText()

      let incMap = new Map()
      for (const [key] of statsStore.stats.entries()) {
        const verboseName = statsToString.get(key)
        if (verboseName)
          incMap.set(
            key,
            increments.map((i) => {
              const calcValue = parseEffectText(
                selectionsStore.effectText,
                verboseName
              )(i)
              return selectionsStore.pokerus ? calcValue * 2 : calcValue
            })
          )
      }
      return incMap
    },
  },
  actions: {
    async addToHistory() {
      // loading.isLoadingAddHistory = true
      // if (selectedPokemon.value !== undefined) {
      //   const stats = await getStats(selectedPokemon.value.code)
      //   const hist = {
      //     stats: stats,
      //     ...selectedPokemon.value,
      //     config: {
      //       item: selectedItem.value,
      //       effectText: effectText.value,
      //       pokerus: pokerus.value,
      //     },
      //   }
      //   pokemonBattleHistory.value.push(hist)
      //   const entries = [...calculateHistoryLine(hist).entries()]
      //   entries.forEach(([key, value]) => {
      //     statsCounter.set(key, ref(statsCounter.get(key)!.value + value))
      //   })
      // }
      // loading.isLoadingAddHistory = false
    },
  },
})
