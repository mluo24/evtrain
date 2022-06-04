<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { computedAsync } from '@vueuse/core'
import { Item, LocationClient, Name, PokemonClient, PokemonStat } from 'pokenode-ts'
import { BattleHistory, SelectOption } from '../types'
import {
  MAX_EVS,
  statsToString,
  presets,
  regions,
  parseEffectText,
  getItemDetails,
  itemAPI,
} from '../utils'
import { useStatsStore } from '../stores/stats'
import { useSelectionsStore } from '../stores/selections'
import { useHistoryStore } from '../stores/history'
import StatEditor from './StatEditor.vue'
import { storeToRefs } from 'pinia'

const statsStore = useStatsStore()
const selectionsStore = useSelectionsStore()
const { pokerus, selectedItem, selectedPreset } = storeToRefs(selectionsStore)
const historyStore = useHistoryStore()

// put some watchers here so that you can save to the local storage

// const statsCounter = reactive(
//   new Map([
//     ['hp', ref(0)],
//     ['attack', ref(0)],
//     ['defense', ref(0)],
//     ['specialAttack', ref(0)],
//     ['specialDefense', ref(0)],
//     ['speed', ref(0)],
//   ])
// )

// const changeStatEV = (stat: string, amt: number) => {
//   const statRef = statsCounter.get(stat)
//   if (statRef !== undefined) statRef.value += amt
// }

// const totalEVs = computed(() => {
//   let sum = 0
//   for (const [, value] of statsCounter.entries()) sum += value.value
//   return sum
// })

// const selectedPreset = ref('')

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

const getNameFromLang = (arr: Name[], language = 'en') => {
  return arr.filter((n) => n.language.name === language)[0].name
}

// const pokerus = ref<boolean>(false)

// const selectedItem = ref<string>('')

const evItems = ref<Item[]>([])

const effectText = computedAsync(
  async () => {
    if (selectedItem.value !== '') {
      return (await getItemDetails(selectedItem.value)).effect_entries.filter(
        (effect) => effect.language.name === 'en'
      )[0].short_effect
    } else return ''
  },
  '' // initial state
)

// const computedIncrements = computed(() => {
//   let incMap = new Map()
//   for (const [key] of statsCounter.entries()) {
//     const verboseName = statsToString.get(key)
//     if (verboseName)
//       incMap.set(
//         key,
//         increments.map((i) => {
//           const calcValue = parseEffectText(effectText.value, verboseName)(i)
//           return pokerus.value ? calcValue * 2 : calcValue
//         })
//       )
//   }
//   return incMap
// })

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

// regions, locations, location areas, pokemon

const regionList = ref<string[]>(regions)

const selectedRegion = ref<SelectOption>()

const locationAPI = new LocationClient({
  cacheOptions: { maxAge: 10000, exclude: { query: false } },
})

const regionListOptions = computed(() => {
  return regionList.value.map((region) => {
    return {
      label: region,
      code: region.toLowerCase(),
    }
  })
})

const selectedLocation = ref<SelectOption>()

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

// add watchers for loading?

watch(areaList, () => {
  loading.isLoadingArea = false
})

// POKEMON API

const pokemonAPI = new PokemonClient({
  cacheOptions: { maxAge: 10000, exclude: { query: false } },
})

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

const selectedPokemon = ref<SelectOption>()

// pokemon history

const getStats = async (name: string) => {
  return (await pokemonAPI.getPokemonByName(name)).stats
}

const pokemonBattleHistory = ref<BattleHistory[]>([])

const calculateHistoryLine = (hist: BattleHistory) => {
  const statChanges = new Map()
  const { stats, config } = hist
  stats.forEach((stat) => {
    let statName = stat.stat.name
    if (statName === 'special-attack') statName = 'specialAttack'
    else if (statName === 'special-defense') statName = 'specialDefense'
    // verbose stat name
    const verboseName = statsToString.get(statName)
    if (verboseName)
      statChanges.set(
        statName,
        config.pokerus
          ? 2 * parseEffectText(config.effectText, verboseName)(stat.effort)
          : parseEffectText(config.effectText, verboseName)(stat.effort)
      )
  })
  return statChanges
}

const addToHistory = async () => {
  loading.isLoadingAddHistory = true
  if (selectedPokemon.value !== undefined) {
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
    pokemonBattleHistory.value.push(hist)
    const entries = [...calculateHistoryLine(hist).entries()]
    entries.forEach(([key, value]) => {
      statsStore.setStatEV(key, statsStore.stats.get(key)! + value)
    })
  }
  loading.isLoadingAddHistory = false
}

// remove all of the zero stats
const relevantStats = (stats: PokemonStat[]) => {
  return stats.filter((s) => s.effort !== 0)
}

const deleteHistoryEntry = (hist: BattleHistory) => {
  pokemonBattleHistory.value = pokemonBattleHistory.value.filter((h) => h !== hist)
  const entries = [...calculateHistoryLine(hist).entries()]
  entries.forEach(([key, value]) => {
    statsStore.setStatEV(key, statsStore.stats.get(key)! - value)
  })
}

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

// RESET EVERYTHING
const reset = () => {
  const res = confirm(
    'Are you sure you want to reset all EVs, settings, and battle history?'
  )
  if (res) {
    selectionsStore.$reset()
    statsStore.$reset()
    historyStore.$reset()
    // pokerus.value = false
    // selectedItem.value = ''
    // selectedPreset.value = ''
    pokemonBattleHistory.value = []
    // for (const [key] of statsCounter.entries()) statsCounter.set(key, ref(0))
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
      <form class="mb-4" @submit.prevent="addToHistory">
        <label class="label">
          <span class="label-text">Region</span>
        </label>
        <v-select v-model="selectedRegion" :options="regionListOptions"></v-select>
        <label class="label">
          <span class="label-text">Area</span
          ><svg
            v-if="loading.isLoadingArea"
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
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
        <v-select v-model="selectedLocation" :options="areaList"></v-select>
        <label class="label">
          <span class="label-text">Pokémon</span>
        </label>
        <v-select v-model="selectedPokemon" :options="pokemonNamesList"></v-select>
        <button
          type="submit"
          class="btn btn-primary"
          :class="{ loading: loading.isLoadingAddHistory }"
        >
          Defeated
        </button>
      </form>
      <div class="max-h-screen overflow-auto">
        <h3 class="text-lg font-bold mb-3">History</h3>
        <div v-for="hist in pokemonBattleHistory" :key="hist.code">
          <span class="font-semibold">{{ hist.label }}</span
          >:
          {{ processStatString(hist) }}
          <button
            class="btn btn-circle btn-error btn-xs"
            type="button"
            @click="deleteHistoryEntry(hist)"
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
