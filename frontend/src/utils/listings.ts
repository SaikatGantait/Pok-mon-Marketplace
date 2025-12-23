import { PokemonCardType } from '@/types/pokemon'

const LS_KEY = 'marketplace_listings_v1'

export function loadListings(): PokemonCardType[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveListings(items: PokemonCardType[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_KEY, JSON.stringify(items))
}

export function addListing(item: PokemonCardType) {
  const items = loadListings()
  items.unshift(item)
  saveListings(items)
}
