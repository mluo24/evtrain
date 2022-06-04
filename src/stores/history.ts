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
})
