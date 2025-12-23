export interface PokemonCardType {
  id: string
  name: string
  description: string
  price: string
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Legendary'
  type: 'fire' | 'water' | 'electric' | 'grass' | 'psychic' | 'fighting'
  chain: 'Solana' | 'Aptos' | 'Algorand'
  seller: string
  hp: number
  attack: number
  defense: number
  listedAt: string
  sold: boolean
}

export interface TransactionType {
  id: string
  cardId: string
  cardName: string
  buyer: string
  seller: string
  price: string
  chain: string
  timestamp: string
  status: 'pending' | 'success' | 'failed'
  txHash: string
}

export interface ListingType {
  id: string
  cardId: string
  seller: string
  price: string
  chain: string
  createdAt: string
  active: boolean
}