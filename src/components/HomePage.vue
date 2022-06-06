<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { Item } from 'pokenode-ts'
import { MAX_EVS, presets, getItemDetails, itemAPI } from '../utils'
import { useStatsStore } from '../stores/stats'
import { useSelectionsStore } from '../stores/selections'
import { useHistoryStore } from '../stores/history'
import StatEditor from './StatEditor.vue'
import { storeToRefs } from 'pinia'
import BattleTracker from './BattleTracker.vue'

const statsStore = useStatsStore()
const selectionsStore = useSelectionsStore()
const { selectedPreset } = storeToRefs(selectionsStore)
const historyStore = useHistoryStore()

// TODO: put some watchers here so that you can save to the local storage

watch(selectedPreset, (newP, oldP) => {
  if (oldP !== '') {
    const oldPresetEffect = presets.filter((p) => p.name === oldP)[0].effect
    if (statsStore.totalEVs > 0)
      oldPresetEffect.forEach((e) => {
        statsStore.setStatEV(e.stat, statsStore.stats.get(e.stat)! - e.value)
      })
  }
  if (newP !== '') {
    const newPresetEffect = presets.filter((p) => p.name === newP)[0].effect
    newPresetEffect.forEach((e) => {
      statsStore.setStatEV(e.stat, statsStore.stats.get(e.stat)! + e.value)
    })
  }
})

const evItems = ref<Item[]>([])

// LOADING FOR THE APIs
const loading = reactive({
  isLoading: true,
  isLoadingArea: false,
  isLoadingPokemon: false,
  isLoadingAddHistory: false,
})

// item fetching

const getEVItems = async () => {
  await itemAPI
    .getItemCategoryByName('effort-training')
    .then(async (data) => {
      const items = await Promise.all(
        data.items.map((itemResource) => {
          return getItemDetails(itemResource.name)
        })
      )
      evItems.value = items
    })
    .catch((error) => console.error(error))
}

// RESET EVERYTHING
const reset = () => {
  const res = confirm(
    'Are you sure you want to reset all EVs, settings, and battle history?'
  )
  if (res) {
    selectionsStore.$reset()
    statsStore.$reset()
    historyStore.$reset()
  }
}

// when mounted, call all of the functions here
onMounted(async () => {
  await getEVItems()
  loading.isLoading = false
})
</script>

<template>
  <h1 class="text-3xl font-bold mb-6 text-center">EV Train!</h1>
  <p>Note: Information only accurate for Generations III-VI</p>
  <div v-if="!loading.isLoading" class="grid gap-4 grid-cols-2 mt-4">
    <div>
      <h2 class="text-xl font-bold mb-3">Track Battles</h2>
      <BattleTracker />
    </div>
    <div>
      <h2 class="text-xl font-bold mb-3">Raw Values</h2>
      <StatEditor :ev-items="evItems" />
      Total EVs:
      <span
        :class="{
          'text-red-500': statsStore.totalEVs > MAX_EVS || statsStore.totalEVs < 0,
        }"
      >
        {{ statsStore.totalEVs }}/{{ MAX_EVS
        }}{{ statsStore.totalEVs > MAX_EVS ? '; too many EVs!' : '' }}
      </span>
      <button class="block my-5 btn btn-primary" @click="reset">Reset</button>
    </div>
  </div>
  <div v-else>Loading</div>
</template>
