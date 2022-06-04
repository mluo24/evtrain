<script setup lang="ts">
import { useSelectionsStore } from '../stores/selections'
import { useStatsStore } from '../stores/stats'
import { StatEditorProps } from '../types'
import { presets } from '../utils'
import EVEditor from './EVEditor.vue'

defineProps<StatEditorProps>()

const statsStore = useStatsStore()

// need to subscribe to a state here to make sure effectText is properly updated
const selectionStore = useSelectionsStore()

selectionStore.$subscribe(() => {
  selectionStore.getEffectText()
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
  <select v-model="selectionStore.selectedItem" class="select select-bordered">
    <option selected value="">No item</option>
    <option v-for="item in evItems" :key="item.id" :value="item.name">
      {{ item.names.filter((n) => n.language.name === 'en')[0].name }}
    </option>
  </select>
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
