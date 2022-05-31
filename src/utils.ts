// CONSTANTS

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
