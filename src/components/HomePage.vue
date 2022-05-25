<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { computedAsync } from '@vueuse/core'
import { Item, ItemClient } from 'pokenode-ts'

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

// RESET EVERYTHING
const reset = () => {
  const res = confirm('Are you sure you want to reset all EVs and settings?')
  if (res) {
    pokerus.value = false
    selectedItem.value = ''
    selectedPreset.value = ''
    for (const [key] of statsCounter.entries()) statsCounter.set(key, ref(0))
  }
}
</script>

<template>
  <h1 class="text-3xl font-bold mb-6 text-center">EV Train!</h1>
  <h2 class="text-xl font-bold mb-4">Manual Version</h2>
  <p>Note: Information only accurate for Generations III-VI</p>
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
        :value="statsCounter.get(key)?.value"
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
</template>
