<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { computedAsync } from '@vueuse/core'
import { Item, ItemClient } from 'pokenode-ts'

const MAX_EVS = 510
const MAX_EVS_STAT = 255

const decrements = [1, 10].reverse()
const increments = [1, 2, 3, 10]

const statsToString = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  specialAttack: 'Special Attack',
  specialDefense: 'Special Defense',
  speed: 'Speed',
}

const statsCounter = reactive({
  hp: 0,
  attack: 0,
  defense: 0,
  specialAttack: 0,
  specialDefense: 0,
  speed: 0,
})

const changeStatEV = (stat: string, amt: number) => {
  switch (stat) {
    case 'hp':
      statsCounter.hp += amt
      break
    case 'attack':
      statsCounter.attack += amt
      break
    case 'defense':
      statsCounter.defense += amt
      break
    case 'specialAttack':
      statsCounter.specialAttack += amt
      break
    case 'specialDefense':
      statsCounter.specialDefense += amt
      break
    case 'speed':
      statsCounter.speed += amt
      break
  }
}

const reset = () => {
  const res = confirm('Are you sure you want to reset the EVs?')
  if (res) {
    statsCounter.hp = 0
    statsCounter.attack = 0
    statsCounter.defense = 0
    statsCounter.specialAttack = 0
    statsCounter.specialDefense = 0
    statsCounter.speed = 0
  }
}

const totalEVs = computed(() => {
  return (
    statsCounter.hp +
    statsCounter.attack +
    statsCounter.defense +
    statsCounter.specialAttack +
    statsCounter.specialDefense +
    statsCounter.speed
  )
})

const pokerus = ref<boolean>(false)

const selectedItem = ref<string>('')

const evItems = ref<Item[]>([])

const getItemDetails = async (name: string) => {
  const itemData = await itemAPI.getItemByName(name)
  return itemData
}

// parse the effect text
const parseEffectText = (effectText: string, stat: string) => {
  const end = effectText.indexOf('effort')
  const start = effectText.indexOf('gains') + 'gains'.length
  const relText = effectText.substring(start, end).trim()
  if (relText.includes('double')) {
    return (i: number) => i * 2
  } else {
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
  return increments.map((i) => (pokerus.value ? i * 2 : i))
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
</script>

<template>
  <h1 class="text-3xl font-bold mb-6 text-center">EV Train!</h1>
  <h2 class="text-xl font-bold mb-4">Manual Version</h2>
  <label class="label">
    <span class="label-text">Held item</span>
  </label>
  <select class="select select-bordered" v-model="selectedItem">
    <option selected value="">No item</option>
    <option v-for="item in evItems" :key="item.id" :value="item.name">
      {{ item.names.filter((n) => n.language.name === 'en')[0].name }}
    </option>
  </select>
  {{ effectText }}
  <div class="form-control">
    <label class="label cursor-pointer">
      <span class="label-text">Pokerus</span>
      <input type="checkbox" class="toggle" v-model="pokerus" />
    </label>
  </div>
  <div v-for="(value, key) in statsCounter" :key="key" class="form-control">
    <label class="label">
      <span class="label-text">{{ statsToString[key] }}</span>
    </label>
    <div class="input-group">
      <button
        v-for="d in decrements"
        :key="d"
        class="btn btn-primary btn-square"
        :disabled="value - d < 0"
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
        :value="statsCounter[key]"
        min="0"
        :max="MAX_EVS_STAT"
        class="input input-bordered"
        :class="{ 'input-error': value > 255 }"
        @input="(event) => (statsCounter[key] = Number((event.target as HTMLInputElement).value))"
      />
      <button
        v-for="i in computedIncrements"
        :key="i"
        class="btn btn-primary btn-square"
        :disabled="value + i > MAX_EVS_STAT || totalEVs + i > MAX_EVS"
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
  <span :class="{ 'text-red-500': totalEVs > MAX_EVS }">
    {{ totalEVs }}/{{ MAX_EVS }}{{ totalEVs > MAX_EVS ? '; too many EVs!' : '' }}
  </span>
</template>
