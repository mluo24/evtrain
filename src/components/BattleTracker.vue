<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { reactive, ref, watch } from 'vue'
import {
  getAreaList,
  getPokemonList,
  getRegionList,
  processStatString,
} from '../battle-tracker'
import { useHistoryStore } from '../stores/history'
import { useSelectionsStore } from '../stores/selections'
import { SelectOption } from '../types'

// stores
const historyStore = useHistoryStore()
const selectionsStore = useSelectionsStore()

// refs
const { battleHistory } = storeToRefs(historyStore)

const { selectedRegion, selectedLocation, selectedPokemon } =
  storeToRefs(selectionsStore)

const areaList = ref<SelectOption[]>([])

const pokemonList = ref<SelectOption[]>([])

// loading logic
const submitToAddToHistory = async () => {
  loading.isLoadingAddHistory = true
  await historyStore.addToHistory()
  loading.isLoadingAddHistory = false
}

watch(selectedRegion, async (newR) => {
  loading.isLoadingArea = newR.code !== ''
  selectedLocation.value = { label: '', code: '' }
  selectedPokemon.value = { label: '', code: '' }
  areaList.value = await getAreaList(selectedRegion.value)
})

watch(areaList, () => {
  loading.isLoadingArea = false
})

watch(selectedLocation, async (newLoc) => {
  loading.isLoadingPokemon = newLoc.code !== ''
  selectedPokemon.value = { label: '', code: '' }
  pokemonList.value = await getPokemonList(selectedLocation.value)
})

watch(pokemonList, () => {
  loading.isLoadingPokemon = false
})

const loading = reactive({
  isLoadingArea: false,
  isLoadingPokemon: false,
  isLoadingAddHistory: false,
})
</script>

<template>
  <form class="mb-4" @submit.prevent="submitToAddToHistory">
    <label class="label">
      <span class="label-text">Region</span>
    </label>
    <v-select v-model="selectedRegion" :options="getRegionList()"></v-select>
    <label class="label">
      <span class="label-text">Area</span>
      <svg
        v-if="loading.isLoadingArea"
        xmlns="http://www.w3.org/2000/svg"
        class="animate-spin h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
          clip-rule="evenodd"
        />
      </svg>
    </label>
    <v-select
      v-model="selectedLocation"
      :options="areaList"
      :disabled="areaList.length === 0"
    ></v-select>
    <label class="label">
      <span class="label-text">Pokémon</span>
      <svg
        v-if="loading.isLoadingPokemon"
        xmlns="http://www.w3.org/2000/svg"
        class="animate-spin h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
          clip-rule="evenodd"
        />
      </svg>
    </label>
    <v-select
      v-model="selectedPokemon"
      :options="pokemonList"
      :disabled="pokemonList.length === 0"
    ></v-select>
    <button
      type="submit"
      class="btn btn-primary"
      :class="{
        loading: loading.isLoadingAddHistory,
        'btn-disabled': selectedPokemon.code === '',
      }"
    >
      Defeated
    </button>
  </form>
  <div class="max-h-screen overflow-auto">
    <h3 class="text-lg font-bold mb-3">History</h3>
    <div v-for="hist in battleHistory" :key="hist.code">
      <span class="font-semibold">{{ hist.label }}</span
      >:
      {{ processStatString(hist) }}
      <!-- TODO: REPLACE THE ABOVE WITH A BETTER COMPONENT-->
      <button
        class="btn btn-circle btn-error btn-xs"
        type="button"
        @click="historyStore.deleteHistoryEntry(hist)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>
  </div>
</template>
