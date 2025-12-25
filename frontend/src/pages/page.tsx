'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Flame, Droplets, Zap, Leaf } from 'lucide-react'
import PokemonCard from '@/components/cards/PokemonCard'
import { demoPokemonCards } from '@/data/demoData'
import { loadListings } from '@/utils/listings'
import { API_URL } from '@/utils/api'

const types = [
  { id: 'all', label: 'All', icon: null },
  { id: 'fire', label: 'Fire', icon: <Flame className="w-4 h-4" />, color: 'text-red-500' },
  { id: 'water', label: 'Water', icon: <Droplets className="w-4 h-4" />, color: 'text-blue-500' },
  { id: 'electric', label: 'Electric', icon: <Zap className="w-4 h-4" />, color: 'text-yellow-500' },
  { id: 'grass', label: 'Grass', icon: <Leaf className="w-4 h-4" />, color: 'text-green-500' },
]

const chains = ['All', 'Solana', 'Aptos', 'EVM']
const rarities = ['All', 'Common', 'Uncommon', 'Rare', 'Legendary']

export default function HomePage() {
  const [userListings, setUserListings] = useState([] as any[])
  useEffect(() => {
    let active = true
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/listings`)
        const apiItems = res.ok ? await res.json() : []
        const local = loadListings()
        if (!active) return
        setUserListings([...(apiItems || []), ...local, ...demoPokemonCards])
      } catch {
        const local = loadListings()
        if (!active) return
        setUserListings([...local, ...demoPokemonCards])
      }
    }
    load()
    return () => { active = false }
  }, [])
  const [selectedType, setSelectedType] = useState('all')
  const [selectedChain, setSelectedChain] = useState('All')
  const [selectedRarity, setSelectedRarity] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCards = userListings.filter(card => {
    const matchesType = selectedType === 'all' || card.type === selectedType
    const matchesChain = selectedChain === 'All' || card.chain === selectedChain
    const matchesRarity = selectedRarity === 'All' || card.rarity === selectedRarity
    const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         card.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesType && matchesChain && matchesRarity && matchesSearch
  })

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Trade Pokémon Cards on Web3
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Buy, sell, and trade digital Pokémon cards across multiple blockchains. 
          Secure transactions powered by smart contracts.
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/sell" className="btn-primary">
            List Your Card
          </a>
          <button className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
            Learn More
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="text-3xl font-bold text-blue-600">1,248</div>
          <div className="text-gray-600">Cards Listed</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="text-3xl font-bold text-green-600">892</div>
          <div className="text-gray-600">Successful Trades</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="text-3xl font-bold text-purple-600">3</div>
          <div className="text-gray-600">Supported Chains</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="text-3xl font-bold text-orange-600">42</div>
          <div className="text-gray-600">Active Sellers</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search Pokémon cards..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pokémon Type
              </label>
              <div className="flex flex-wrap gap-2">
                {types.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                      selectedType === type.id
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {type.icon && <span className={type.color}>{type.icon}</span>}
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chain Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blockchain
              </label>
              <div className="flex flex-wrap gap-2">
                {chains.map((chain) => (
                  <button
                    key={chain}
                    onClick={() => setSelectedChain(chain)}
                    className={`px-4 py-2 rounded-full border transition-colors ${
                      selectedChain === chain
                        ? 'bg-purple-100 border-purple-500 text-purple-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {chain}
                  </button>
                ))}
              </div>
            </div>

            {/* Rarity Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rarity
              </label>
              <div className="flex flex-wrap gap-2">
                {rarities.map((rarity) => (
                  <button
                    key={rarity}
                    onClick={() => setSelectedRarity(rarity)}
                    className={`px-4 py-2 rounded-full border transition-colors ${
                      selectedRarity === rarity
                        ? 'bg-yellow-100 border-yellow-500 text-yellow-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {rarity}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Featured Cards</h2>
          <div className="flex items-center gap-2 text-gray-600">
            <Filter className="w-4 h-4" />
            <span>{filteredCards.length} cards found</span>
          </div>
        </div>

        {filteredCards.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <p className="text-gray-500 text-lg">No cards found matching your criteria.</p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredCards.map((card) => (
              <PokemonCard key={card.id} card={card} />
            ))}
          </motion.div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mt-12">
        <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Connect Wallet</h3>
            <p className="text-gray-600">Connect your Phantom, Petra, or Pera wallet</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-purple-600">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Browse & Select</h3>
            <p className="text-gray-600">Choose from hundreds of Pokémon cards</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-600">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Buy Securely</h3>
            <p className="text-gray-600">Smart contract ensures safe transfer</p>
          </div>
        </div>
      </div>
    </div>
  )
}