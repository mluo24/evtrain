import { PokemonStat } from 'pokenode-ts'

export interface BattleHistory {
  label: string
  code: string
  stats: PokemonStat[]
  config: { item: string; effectText: string; pokerus: boolean }
}

export interface SelectOption {
  label: string
  code: string
}

// COMPONENT TYPES

export interface EVEditorProps {
  stat: string
}
