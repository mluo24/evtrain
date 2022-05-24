<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

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
</script>

<template>
  <div class="container my-4">
    <h1 class="text-3xl font-bold mb-6 text-center">EV Train!</h1>
    <h2 class="text-xl font-bold mb-4">Manual Version</h2>
    <div v-for="(value, key) in statsCounter" :key="key" class="form-control">
      <label class="label">
        <span class="label-text">{{ statsToString[key] }}</span>
      </label>
      <div class="input-group">
        <button
          v-for="d in decrements"
          :key="d"
          @click="changeStatEV(key, -d)"
          class="btn btn-square"
          :disabled="value - d < 0"
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
          @input="(event) => (statsCounter[key] = Number((event.target as HTMLInputElement).value))"
          min="0"
          :max="MAX_EVS_STAT"
          class="input input-bordered"
        />
        <button
          v-for="i in increments"
          :key="i"
          @click="changeStatEV(key, i)"
          class="btn btn-square"
          :disabled="value + i > MAX_EVS_STAT || totalEVs + i > MAX_EVS"
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
  </div>
</template>
