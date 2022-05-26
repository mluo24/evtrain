<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { computedAsync } from '@vueuse/core'
import {
  Item,
  ItemClient,
  NamedAPIResource,
  PokemonClient,
  PokemonStat,
} from 'pokenode-ts'

const MAX_EVS = 510
const MAX_EVS_STAT = 255

const decrements = [1, 10].reverse()
const increments = [1, 2, 3, 10]

const statsToString = new Map([
  ['hp', 'HP'],
  ['attack', 'Attack'],
  ['defense', 'Defense'],
  ['specialAttack', 'Special Attack'],
  ['specialDefense', 'Special Defense'],
  ['special-attack', 'Special Attack'],
  ['special-defense', 'Special Defense'],
  ['speed', 'Speed'],
])

const statsCounter = reactive(
  new Map([
    ['hp', ref(0)],
    ['attack', ref(0)],
    ['defense', ref(0)],
    ['specialAttack', ref(0)],
    ['specialDefense', ref(0)],
    ['speed', ref(0)],
  ])
)

const changeStatEV = (stat: string, amt: number) => {
  const statRef = statsCounter.get(stat)
  if (statRef !== undefined) statRef.value += amt
}

const totalEVs = computed(() => {
  let sum = 0
  for (const [, value] of statsCounter.entries()) sum += value.value
  return sum
})

const presets = [
  { name: 'HP Up 100', effect: [{ stat: 'hp', value: 100 }] },
  { name: 'Protein 100', effect: [{ stat: 'attack', value: 100 }] },
  { name: 'Iron 100', effect: [{ stat: 'defense', value: 100 }] },
  { name: 'Calcium 100', effect: [{ stat: 'specialAttack', value: 100 }] },
  { name: 'Zinc 100', effect: [{ stat: 'specialDefense', value: 100 }] },
  { name: 'Carbos 100', effect: [{ stat: 'speed', value: 100 }] },
  {
    name: 'Physical Sweeper',
    effect: [
      { stat: 'attack', value: 100 },
      { stat: 'speed', value: 100 },
    ],
  },
  {
    name: 'Special Sweeper',
    effect: [
      { stat: 'specialAttack', value: 100 },
      { stat: 'speed', value: 100 },
    ],
  },
  {
    name: 'Physically Defensive',
    effect: [
      { stat: 'hp', value: 100 },
      { stat: 'defense', value: 100 },
    ],
  },
  {
    name: 'Specially Defensive',
    effect: [
      { stat: 'hp', value: 100 },
      { stat: 'specialDefense', value: 100 },
    ],
  },
]

const selectedPreset = ref('')

watch(selectedPreset, (newP, oldP) => {
  if (oldP !== '') {
    const oldPresetEffect = presets.filter((p) => p.name === oldP)[0].effect
    if (totalEVs.value > 0)
      oldPresetEffect.forEach((e) => {
        statsCounter.set(e.stat, ref(statsCounter.get(e.stat)!.value - e.value))
      })
  }

  if (newP !== '') {
    const newPresetEffect = presets.filter((p) => p.name === newP)[0].effect

    newPresetEffect.forEach((e) => {
      statsCounter.set(e.stat, ref(statsCounter.get(e.stat)!.value + e.value))
    })
  }
})

const pokerus = ref<boolean>(false)

const selectedItem = ref<string>('')

const evItems = ref<Item[]>([])

const getItemDetails = async (name: string) => {
  const itemData = await itemAPI.getItemByName(name)
  return itemData
}

// parse the effect text, return a function with the correct value
const parseEffectText = (effect: string, stat: string) => {
  const end = effect.indexOf('effort')
  const start = effect.indexOf('gains') + 'gains'.length
  const relText = effect.substring(start, end).trim()
  if (relText.includes('double')) {
    return (i: number) => i * 2
  } else if (relText.includes(stat)) {
    const inc = Number(relText.substring(0, relText.indexOf(stat)).trim())
    if (!isNaN(inc))
      // if it matches the stat passed in
      return (i: number) => i + inc
    else return (i: number) => i
  } else {
    // otherwise return identity function
    return (i: number) => i
  }
}

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

const computedIncrements = computed(() => {
  let incMap = new Map()
  for (const [key] of statsCounter.entries()) {
    const verboseName = statsToString.get(key)
    if (verboseName)
      incMap.set(
        key,
        increments.map((i) => {
          const calcValue = parseEffectText(effectText.value, verboseName)(i)
          return pokerus.value ? calcValue * 2 : calcValue
        })
      )
  }
  return incMap
})

// item fetching
const itemAPI = new ItemClient({
  cacheOptions: { maxAge: 5000, exclude: { query: false } },
})

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

getEVItems()

// POKEMON API

const pokemonAPI = new PokemonClient({
  cacheOptions: { maxAge: 10000, exclude: { query: false } },
})

const pokemonList = ref<NamedAPIResource[]>([])

const pokemonNamesList = ref<{ label: string; code: string }[]>([])

const getPokemonList = async () => {
  await pokemonAPI.listPokemons().then(async (data) => {
    pokemonList.value = data.results
  })
}

const getPokemonNamesList = async () => {
  await pokemonAPI.listPokemonSpecies().then(async (data) => {
    const pokemonNames = await Promise.all(
      data.results.map(async (p) => {
        const displayName = (
          await pokemonAPI.getPokemonSpeciesByName(p.name)
        ).names.filter((n) => n.language.name == 'en')[0].name
        return {
          label: displayName,
          code: p.name,
        }
      })
    )
    pokemonNamesList.value = pokemonNames
  })
}

getPokemonList()

getPokemonNamesList()

const selectedPokemon = ref()

// pokemon history

const getStats = async (name: string) => {
  return (await pokemonAPI.getPokemonByName(name)).stats
}

const pokemonBattleHistory = ref<
  {
    label: string
    code: string
    stats: PokemonStat[]
    config: { effectText: string; pokerus: boolean }
  }[]
>([])

const addToHistory = async () => {
  if (selectedPokemon.value !== undefined) {
    const stats = await getStats(selectedPokemon.value.code)
    pokemonBattleHistory.value.push({
      stats: stats,
      ...selectedPokemon.value,
      config: { effectText: effectText.value, pokerus: pokerus.value },
    })
  }
}

// remove all of the zero stats
const relevantStats = (stats: PokemonStat[]) => {
  return stats.filter((s) => s.effort !== 0)
}

// ACTUALLY, YOU SHOULD ALWAYS INCLUDE ITEM EFFECTS IN THE CALCULATION BECAUSE THAT'S HOW THE POWER ITEMS WORK!!!
const historyValuesAdded = computed(() => {
  let histVals = new Map()
  pokemonBattleHistory.value.forEach((hist) => {
    hist.stats.forEach((stat) => {
      let statName = stat.stat.name
      if (statName === 'special-attack') statName = 'specialAttack'
      else if (statName === 'special-defense') statName = 'specialDefense'
      // verbose stat name
      const verboseName = statsToString.get(statName)
      const prevVal =
        histVals.get(statName) === undefined ? 0 : histVals.get(statName)
      if (verboseName)
        histVals.set(
          statName,
          prevVal +
            (hist.config.pokerus
              ? 2 * parseEffectText(hist.config.effectText, verboseName)(stat.effort)
              : parseEffectText(hist.config.effectText, verboseName)(stat.effort))
        )
    })
  })
  return histVals
})

const processStatString = (stats: PokemonStat[]) => {
  const relStats = relevantStats(stats)
  return relStats.reduce((prev, curr) => {
    return `${prev}, ${statsToString.get(curr.stat.name)}: ${curr.effort}`
  }, '')
}

// RESET EVERYTHING
const reset = () => {
  const res = confirm(
    'Are you sure you want to reset all EVs, settings, and battle history?'
  )
  if (res) {
    pokerus.value = false
    selectedItem.value = ''
    selectedPreset.value = ''
    pokemonBattleHistory.value = []
    for (const [key] of statsCounter.entries()) statsCounter.set(key, ref(0))
  }
}
</script>

<template>
  <h1 class="text-3xl font-bold mb-6 text-center">EV Train!</h1>
  <p>Note: Information only accurate for Generations III-VI</p>
  <div class="grid gap-4 grid-cols-2 mt-4">
    <div>
      <h2 class="text-xl font-bold mb-3">Track Battles</h2>
      <form @submit.prevent="addToHistory">
        <label class="label">
          <span class="label-text">Pokémon</span>
        </label>
        <v-select v-model="selectedPokemon" :options="pokemonNamesList"></v-select>
        <button type="submit" class="btn btn-primary">Defeated</button>
      </form>
      <div class="max-h-screen overflow-auto">
        <div v-for="hist in pokemonBattleHistory" :key="hist.code">
          {{ hist.label + processStatString(hist.stats) }}
        </div>
      </div>
    </div>
    <div>
      <h2 class="text-xl font-bold mb-3">Raw Values</h2>
      <label class="label">
        <span class="label-text">Presets</span>
      </label>
      <select v-model="selectedPreset" class="select select-bordered">
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
      {{ effectText }}
      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text">Pokerus</span>
          <input v-model="pokerus" type="checkbox" class="toggle" />
        </label>
      </div>
      <div v-for="[key, value] in statsCounter" :key="key" class="form-control">
        <label class="label">
          <span class="label-text">{{ statsToString.get(key) }}</span>
        </label>
        <div class="input-group">
          <button
            v-for="d in decrements"
            :key="d"
            class="btn btn-primary btn-square"
            :disabled="value.value - d < 0"
            @click="changeStatEV(key, -d)"
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
            :value="
              (historyValuesAdded.get(key) ? historyValuesAdded.get(key) : 0) +
              statsCounter.get(key)?.value
            "
            min="0"
            :max="MAX_EVS_STAT"
            class="input input-bordered"
            :class="{ 'input-error': value.value > 255 || value.value < 0 }"
            @input="(event) => (statsCounter.set(key, ref(Number((event.target as HTMLInputElement).value))))"
          />
          <button
            v-for="i in computedIncrements.get(key)"
            :key="i"
            class="btn btn-primary btn-square"
            :disabled="value.value + i > MAX_EVS_STAT || totalEVs + i > MAX_EVS"
            @click="changeStatEV(key, i)"
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
      </div>
      <button class="block my-5 btn btn-primary" @click="reset">Reset</button>
      Total EVs:
      <span :class="{ 'text-red-500': totalEVs > MAX_EVS || totalEVs < 0 }">
        {{ totalEVs }}/{{ MAX_EVS }}{{ totalEVs > MAX_EVS ? '; too many EVs!' : '' }}
      </span>
    </div>
  </div>
</template>
