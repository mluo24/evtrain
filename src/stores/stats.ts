import { defineStore } from 'pinia'

export const useStatsStore = defineStore('stats', {
  state: () => ({
    stats: new Map([
      ['hp', 0],
      ['attack', 0],
      ['defense', 0],
      ['specialAttack', 0],
      ['specialDefense', 0],
      ['speed', 0],
    ]),
  }),
  getters: {
    totalEVs(state) {
      let sum = 0
      for (const [, value] of state.stats.entries()) sum += value
      return sum
    },
  },
  actions: {
    changeStatEV(stat: string, amt: number) {
      const statRef = this.stats.get(stat)
      if (statRef !== undefined) this.stats.set(stat, statRef + amt)
    },
    setStatEV(stat: string, amt: number) {
      this.stats.set(stat, amt)
    },
  },
})
