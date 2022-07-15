import { LocationClient, Name, PokemonStat } from 'pokenode-ts'
import { BattleHistory, SelectOption } from './types'
import { calculateHistoryLine, pokemonAPI, regions, statsToString } from './utils'

// Location API
const locationAPI = new LocationClient({
  cacheOptions: { maxAge: 10000, exclude: { query: false } },
})

/**
 * Returns the list of regions as a list of SelectOptions
 */
export const getRegionList = (): SelectOption[] => {
  return regions.map((region: string) => {
    return {
      label: region,
      code: region.toLowerCase(),
    }
  })
}

/**
 * Gets a specific "name" of a language given a list of named resources and the
 * language code
 * @param namedResources List of resources that have localization versions
 * @param languageCode Language code (default 'en')
 */
const getNameFromLang = (namedResources: Name[], languageCode = 'en'): string => {
  return namedResources.filter((n) => n.language.name === languageCode)[0].name
}

/**
 * Gets the list of locations that exist in the selected regions
 */
export const getAreaList = async (
  selectedRegion: SelectOption
): Promise<SelectOption[]> => {
  if (selectedRegion !== undefined) {
    const locations = (await locationAPI.getRegionByName(selectedRegion.code))
      .locations
    return Promise.all(
      locations.map(async (location) => {
        const regionData = await locationAPI.getLocationByName(location.name)
        return { label: getNameFromLang(regionData.names), code: location.name }
      })
    )
  } else return []
}

/**
 * Returns a list of possible encountered Pokémon given a location area
 */
const getPokemonEncounters = async (areaName: string) => {
  const locArea = await locationAPI.getLocationAreaByName(areaName)
  return Promise.all(
    locArea.pokemon_encounters.map(async (encounter) => {
      return encounter.pokemon.name
    })
  )
}

/**
 * Gets the display name of a Pokémon in English from its species.
 * @returns
 */
const getPokemonName = async (p: string): Promise<string> => {
  return getNameFromLang(
    (
      await pokemonAPI.getPokemonSpeciesByName(
        (
          await pokemonAPI.getPokemonByName(p)
        ).species.name
      )
    ).names
  )
}

/**
 * Converts a list of Pokémon string names as appropriate SelectOption instances
 */
const getPokemonNamesList = async (
  pokemonList: string[]
): Promise<SelectOption[]> => {
  const namesList = await Promise.all(
    pokemonList.map(async (p) => {
      return {
        label: await getPokemonName(p),
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
}

/**
 * Gets the list of Pokémon names as strings that could be found within that
 * location
 */
export const getPokemonList = async (
  selectedLocation: SelectOption
): Promise<SelectOption[]> => {
  if (selectedLocation !== undefined && selectedLocation.code !== '') {
    const loc = await locationAPI.getLocationByName(selectedLocation.code)
    const pokemonListPromise = loc.areas.map(async (area) => {
      return getPokemonEncounters(area.name)
    })
    const pokemonList = (await Promise.all(pokemonListPromise)).flat()
    // remove duplicates from list
    const noDups = pokemonList.filter((p, index) => pokemonList.indexOf(p) === index)
    return await getPokemonNamesList(noDups)
  }
  return []
}

/**
 * Returns a string that verbalizes EVs from Pokémon defeated, EVs earned in total,
 * and item used when the Pokémon was defeated.
 */
export const processStatString = (hist: BattleHistory): string => {
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

/**
 * Removes all of the properties equal to 0
 * @param stats A list of Pokémon stats
 * @returns A list of stats where each stat value is not 0
 */
export const relevantStats = (stats: PokemonStat[]): PokemonStat[] => {
  return stats.filter((s) => s.effort !== 0)
}
