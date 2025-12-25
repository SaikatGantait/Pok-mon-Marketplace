'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Image as ImageIcon, DollarSign, Hash, Type, FileText } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAptosWallet } from '@/components/providers/AptosWalletProvider'
import { useEvmWallet } from '@/components/providers/EvmWalletProvider'
import { addListing } from '@/utils/listings'
import { API_URL } from '@/utils/api'
import { uploadImageAndMetadata } from '@/utils/ipfs'
import { useRouter } from 'next/navigation'

export default function SellPage() {
  const router = useRouter()
  const { publicKey } = useWallet()
  const { isConnected: aptosConnected, address: aptosAddress } = useAptosWallet()
  const { isConnected: evmConnected, address: evmAddress } = useEvmWallet()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    rarity: 'Rare',
    type: 'fire',
    chain: 'Solana',
    hp: '',
    attack: '',
    defense: '',
    image: null as File | null,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Determine seller address from selected chain
    let seller: string | null = null
    if (formData.chain === 'Solana' && publicKey) seller = publicKey.toBase58()
    if (formData.chain === 'Aptos' && aptosConnected && aptosAddress) seller = aptosAddress
    if ((formData.chain === 'EVM' || formData.chain === 'Ethereum') && evmConnected && evmAddress) seller = evmAddress

    if (!seller) {
      alert(`Please connect your ${formData.chain} wallet before listing.`)
      return
    }

    const id = Date.now().toString()
    let imageUrl: string | undefined
    let metadataUrl: string | undefined

    if (formData.image) {
      try {
        const meta = {
          name: formData.name,
          description: formData.description,
          attributes: [{ trait_type: 'rarity', value: formData.rarity }, { trait_type: 'type', value: formData.type }],
        }
        const out = await uploadImageAndMetadata(formData.image, meta)
        imageUrl = out.imageUrl
        metadataUrl = out.metadataUrl
      } catch (e) {
        console.warn('IPFS upload failed, continuing without media', e)
      }
    }
    const newItem = {
      id,
      name: formData.name || 'Custom Card',
      description: formData.description,
      price: `${formData.price} ${formData.chain === 'Solana' ? 'SOL' : formData.chain === 'Aptos' ? 'APT' : 'ETH'}`,
      rarity: formData.rarity as any,
      type: formData.type as any,
      chain: formData.chain as any,
      seller,
      imageUrl,
      metadataUrl,
      hp: Number(formData.hp || 100),
      attack: Number(formData.attack || 100),
      defense: Number(formData.defense || 100),
      listedAt: new Date().toISOString().slice(0,10),
      sold: false,
    }
    try {
      const res = await fetch(`${API_URL}/api/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      })
      if (!res.ok) throw new Error('api')
      alert('Card listed on server.')
    } catch {
      addListing(newItem as any)
      alert('Server unavailable. Listed locally for demo.')
    }
    router.push('/')
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, image: file })
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">List Your Pokémon Card</h1>
        <p className="text-gray-600 mb-8">Fill in the details below to list your card for sale</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Card Image
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="w-20 h-20 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                  {formData.image ? (
                    <ImageIcon className="w-10 h-10 text-blue-500" />
                  ) : (
                    <Upload className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <p className="text-gray-600 mb-2">
                  {formData.image ? formData.image.name : 'Click to upload card image'}
                </p>
                <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Card Name
                </div>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Charizard GX"
                required
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Price (Testnet)
                </div>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 1.5"
                required
              />
            </div>

            {/* Rarity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rarity
              </label>
              <select
                value={formData.rarity}
                onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Common">Common</option>
                <option value="Uncommon">Uncommon</option>
                <option value="Rare">Rare</option>
                <option value="Legendary">Legendary</option>
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pokémon Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="fire">Fire 🔥</option>
                <option value="water">Water 💧</option>
                <option value="electric">Electric ⚡</option>
                <option value="grass">Grass 🌿</option>
                <option value="psychic">Psychic 🔮</option>
                <option value="fighting">Fighting 👊</option>
              </select>
            </div>

            {/* Blockchain */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blockchain
              </label>
              <select
                value={formData.chain}
                onChange={(e) => setFormData({ ...formData, chain: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Solana">Solana</option>
                <option value="Aptos">Aptos</option>
                <option value="EVM">EVM (Sepolia)</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Card Stats
              </div>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <input
                  type="number"
                  value={formData.hp}
                  onChange={(e) => setFormData({ ...formData, hp: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="HP"
                />
              </div>
              <div>
                <input
                  type="number"
                  value={formData.attack}
                  onChange={(e) => setFormData({ ...formData, attack: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Attack"
                />
              </div>
              <div>
                <input
                  type="number"
                  value={formData.defense}
                  onChange={(e) => setFormData({ ...formData, defense: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Defense"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Description
              </div>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Describe your Pokémon card..."
              required
            />
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-gray-200">
            <button
              type="submit"
              className="w-full btn-primary py-4 text-lg"
            >
              List Card for Sale
            </button>
            <p className="text-center text-sm text-gray-500 mt-3">
              By listing, you agree to our terms and 2% marketplace fee
            </p>
          </div>
        </form>
      </motion.div>

      {/* Sidebar Info */}
      <div className="mt-8 bg-blue-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Tips for Selling</h3>
        <ul className="space-y-3 text-blue-800">
          <li className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <span>Use high-quality images for better visibility</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <span>Research similar cards for competitive pricing</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <span>Be detailed in your description</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <span>Choose the right blockchain based on buyer preference</span>
          </li>
        </ul>
      </div>
    </div>
  )
}