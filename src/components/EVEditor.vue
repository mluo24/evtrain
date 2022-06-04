<script setup lang="ts">
import { useHistoryStore } from '../stores/history'
import { useStatsStore } from '../stores/stats'
import { EVEditorProps } from '../types'
import { MAX_EVS_STAT, MAX_EVS, decrements, statsToString } from '../utils'

defineProps<EVEditorProps>()

const statsStore = useStatsStore()
const historyStore = useHistoryStore()
</script>

<template>
  <label class="label">
    <span class="label-text">{{ statsToString.get(stat) }}</span>
  </label>
  <div class="input-group">
    <button
      v-for="d in decrements"
      :key="d"
      class="btn btn-primary btn-square"
      :disabled="value - d < 0"
      @click="statsStore.changeStatEV(stat, -d)"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
          clip-rule="evenodd"
        />
      </svg>
      {{ d }}
    </button>
    <input
      type="number"
      :value="statsStore.stats.get(stat)"
      min="0"
      :max="MAX_EVS_STAT"
      class="input input-bordered"
      :class="{ 'input-error': value > 255 || value < 0 }"
      @input="(event) => (statsStore.setStatEV(stat, Number((event.target as HTMLInputElement).value)))"
    />
    <button
      v-for="i in historyStore.computedIncrements.get(stat)"
      :key="i"
      class="btn btn-primary btn-square"
      :disabled="value + i > MAX_EVS_STAT || statsStore.totalEVs + i > MAX_EVS"
      @click="statsStore.changeStatEV(stat, i)"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
          clip-rule="evenodd"
        />
      </svg>
      {{ i }}
    </button>
  </div>
</template>
