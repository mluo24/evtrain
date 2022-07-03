import { defineStore, storeToRefs } from 'pinia'
import {
  calculateHistoryLine,
  getStats,
  increments,
  parseEffectText,
  statsToString,
} from '../utils'
import { useStatsStore } from './stats'
import { useSelectionsStore } from './selections'
import { BattleHistory } from '../types'

export const useHistoryStore = defineStore('history', {
  state: () => ({
    battleHistory: [] as BattleHistory[],
  }),
  getters: {
    // it's actually possible to get rid of this since it doesn't seem like it's being used anywhere
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
      const selectionsStore = useSelectionsStore()
      const statsStore = useStatsStore()

      const { selectedPokemon, selectedItem, effectText, pokerus } =
        storeToRefs(selectionsStore)

      if (selectedPokemon.value.code) {
        const stats = await getStats(selectedPokemon.value.code)
        const hist = {
          stats: stats,
          ...selectedPokemon.value,
          config: {
            item: selectedItem.value,
            effectText: effectText.value,
            pokerus: pokerus.value,
          },
        }
        this.battleHistory.push(hist)
        const entries = [...calculateHistoryLine(hist).entries()]
        entries.forEach(([key, value]) => {
          statsStore.changeStatEV(key, value)
        })
      }
    },
    deleteHistoryEntry(hist: BattleHistory) {
      const statsStore = useStatsStore()

      this.battleHistory = this.battleHistory.filter((h) => h !== hist)
      const entries = [...calculateHistoryLine(hist).entries()]
      entries.forEach(([key, value]) => {
        statsStore.changeStatEV(key, -value)
      })
    },
  },
})
