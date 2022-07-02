<script setup lang="ts">
import { computedAsync } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { LocationClient, Name, PokemonStat } from 'pokenode-ts'
import { computed, reactive, ref, watch } from 'vue'
import { useHistoryStore } from '../stores/history'
import { useSelectionsStore } from '../stores/selections'
import { BattleHistory } from '../types'
import { calculateHistoryLine, pokemonAPI, regions, statsToString } from '../utils'

const historyStore = useHistoryStore()
const selectionsStore = useSelectionsStore()

const { battleHistory } = storeToRefs(historyStore)

const { selectedRegion, selectedLocation, selectedPokemon } =
  storeToRefs(selectionsStore)

// Location PI
const locationAPI = new LocationClient({
  cacheOptions: { maxAge: 10000, exclude: { query: false } },
})

const getNameFromLang = (arr: Name[], language = 'en') => {
  return arr.filter((n) => n.language.name === language)[0].name
}

// remove all of the zero stats
const relevantStats = (stats: PokemonStat[]) => {
  return stats.filter((s) => s.effort !== 0)
}

const regionList = ref<string[]>(regions)

// turns the region list into options digestable by the searchable dropdown
const regionListOptions = computed(() => {
  return regionList.value.map((region) => {
    return {
      label: region,
      code: region.toLowerCase(),
    }
  })
})

const areaList = computedAsync(async () => {
  if (selectedRegion.value !== undefined)
    return Promise.all(
      (await locationAPI.getRegionByName(selectedRegion.value.code)).locations.map(
        async (location) => {
          const regionData = await locationAPI.getLocationByName(location.name)
          return { label: getNameFromLang(regionData.names), code: location.name }
        }
      )
    )
  else return []
}, [])

// has only a list of the pokemon names
const pokemonList = computedAsync(async () => {
  if (selectedLocation.value !== undefined) {
    const loc = await locationAPI.getLocationByName(selectedLocation.value.code)
    const pList = (
      await Promise.all(
        loc.areas.map(async (area) => {
          const locArea = await locationAPI.getLocationAreaByName(area.name)
          return await Promise.all(
            locArea.pokemon_encounters.map(async (encounter) => {
              return encounter.pokemon.name
            })
          )
        })
      )
    ).flat()
    return pList.filter((p, index) => pList.indexOf(p) === index)
  }
  return []
}, [])

const pokemonNamesList = computedAsync(async () => {
  const namesList = await Promise.all(
    pokemonList.value.map(async (p) => {
      return {
        label: getNameFromLang(
          (
            await pokemonAPI.getPokemonSpeciesByName(
              (
                await pokemonAPI.getPokemonByName(p)
              ).species.name
            )
          ).names
        ),
        code: p,
      }
    })
  )
  return namesList.filter((p, index) => {
    let firstIndex = 0
    for (let i = 0; i < namesList.length; i++) {
      if (namesList[i].label === p.label) {
        firstIndex = i
        break
      }
    }
    return firstIndex === index
  })
}, [])

const processStatString = (hist: BattleHistory) => {
  const relStats = relevantStats(hist.stats)
  return (
    'EVs: ' +
    relStats
      .map((s) => `${statsToString.get(s.stat.name)}: ${s.effort}`)
      .join(', ') +
    '; Earned: ' +
    [...calculateHistoryLine(hist).entries()]
      .filter((e) => e[1] !== 0)
      .map((e) => `${e[1]} ${statsToString.get(e[0])} EV${e[1] === 1 ? '' : 's'}`)
      .join(', ') +
    ' with ' +
    (hist.config.item ? hist.config.item : 'no item') +
    (hist.config.pokerus ? ' and with Pokérus' : '')
  )
}

const submitToAddToHistory = async () => {
  loading.isLoadingAddHistory = true
  await historyStore.addToHistory()
  loading.isLoadingAddHistory = false
}

// loading logic

watch(selectedRegion, (newR) => {
  loading.isLoadingArea = newR.code !== ''
  selectedLocation.value = { label: '', code: '' }
  selectedPokemon.value = { label: '', code: '' }
})

watch(areaList, () => {
  loading.isLoadingArea = false
})

watch(selectedLocation, (newLoc) => {
  loading.isLoadingPokemon = newLoc.code !== ''
  selectedPokemon.value = { label: '', code: '' }
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
    <v-select v-model="selectedRegion" :options="regionListOptions"></v-select>
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
      :options="pokemonNamesList"
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
