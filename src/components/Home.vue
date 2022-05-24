<script setup lang="ts">
import { ref, reactive } from 'vue'

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
</script>

<template>
  <div class="container my-4 text-center">
    <h1 class="text-3xl font-bold">EV Train!</h1>
    <div v-for="(value, key) in statsCounter" :key="key" class="form-control">
      {{ statsToString[key] }}
      <div class="input-group">
        <button
          @click="changeStatEV(key, -1)"
          class="btn btn-square"
          :disabled="value - 1 < 0"
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
        </button>
        <input
          type="number"
          :value="statsCounter[key]"
          @input="(event: Event) => (statsCounter[key] = Number((event.target as HTMLInputElement).value))"
          min="0"
          max="255"
          class="input input-bordered"
        />
        <button
          @click="changeStatEV(key, 1)"
          class="btn btn-square"
          :disabled="value + 1 > 255"
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
        </button>
      </div>
    </div>
  </div>
</template>
