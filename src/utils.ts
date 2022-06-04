// CONSTANTS

import { ItemClient } from 'pokenode-ts'

export const MAX_EVS = 510
export const MAX_EVS_STAT = 255

export const decrements = [1, 10].reverse()
export const increments = [1, 2, 3, 10]

export const regions = ['Hoenn', 'Sinnoh', 'Unova', 'Kalos']

export const statsToString = new Map([
  ['hp', 'HP'],
  ['attack', 'Attack'],
  ['defense', 'Defense'],
  ['specialAttack', 'Special Attack'],
  ['specialDefense', 'Special Defense'],
  ['special-attack', 'Special Attack'],
  ['special-defense', 'Special Defense'],
  ['speed', 'Speed'],
])

export const presets = [
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

// API for PokeAPI

export const itemAPI = new ItemClient({
  cacheOptions: { maxAge: 5000, exclude: { query: false } },
})

// FUNCTIONS

export const unwrapUndefined = (n: undefined | number) => {
  return n === undefined ? 0 : n
}

// parse the effect text, return a function with the correct value
export const parseEffectText = (effect: string, stat: string) => {
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

export const getItemDetails = async (name: string) => {
  const itemData = await itemAPI.getItemByName(name)
  return itemData
}
