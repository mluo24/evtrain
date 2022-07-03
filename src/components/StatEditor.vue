<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import { useSelectionsStore } from '../stores/selections'
import { useStatsStore } from '../stores/stats'
import { StatEditorProps } from '../types'
import { presets } from '../utils'
import EVEditor from './EVEditor.vue'

defineProps<StatEditorProps>()

const statsStore = useStatsStore()

// need to subscribe to a state here to make sure effectText is properly updated
const selectionStore = useSelectionsStore()
const { selectedItem } = storeToRefs(selectionStore)

const loadingEffectText = ref(false)

// TODO: fix this logic
watch(selectedItem, async (newSI) => {
  loadingEffectText.value = newSI !== ''
  await selectionStore.getEffectText()
  loadingEffectText.value = false
})
</script>

<template>
  <label class="label">
    <span class="label-text">Presets</span>
  </label>
  <select v-model="selectionStore.selectedPreset" class="select select-bordered">
    <option selected value="">None</option>
    <option v-for="(preset, i) in presets" :key="i" :value="preset.name">
      {{ preset.name }}
    </option>
  </select>
  <label class="label">
    <span class="label-text">Held item</span>
  </label>
  <select v-model="selectedItem" class="select select-bordered">
    <option selected value="">No item</option>
    <option v-for="item in evItems" :key="item.id" :value="item.name">
      {{ item.names.filter((n) => n.language.name === 'en')[0].name }}
    </option>
  </select>
  <svg
    v-if="loadingEffectText"
    xmlns="http://www.w3.org/2000/svg"
    class="animate-spin h-5 w-5 inline"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fill-rule="evenodd"
      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
      clip-rule="evenodd"
    />
  </svg>
  {{ selectionStore.effectText }}
  <div class="form-control">
    <label class="label cursor-pointer">
      <span class="label-text">Pokerus</span>
      <input v-model="selectionStore.pokerus" type="checkbox" class="toggle" />
    </label>
  </div>
  <div
    v-for="[key, value] in statsStore.stats.entries()"
    :key="key"
    class="form-control"
  >
    <EVEditor :stat="key" :value="value" />
  </div>
</template>
