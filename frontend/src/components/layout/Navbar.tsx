'use client'

import { useEffect, useState } from 'react'
import { Menu, X, ShoppingCart, Wallet, User } from 'lucide-react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider'
import { useAptosWallet } from '@/components/providers/AptosWalletProvider'
import WalletConnectButton from '../wallet/WalletConnectButton'
import ChainSelector from '../wallet/ChainSelector'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { connected: solanaConnected } = useWallet()
  const { connection } = useConnection()
  const { isConnected: algorandConnected } = useAlgorandWallet()
  const { isConnected: aptosConnected, balance: aptosBalance } = useAptosWallet()

  const isAnyWalletConnected = solanaConnected || algorandConnected || aptosConnected

  // Testnet balances for status pills
  const [solBalance, setSolBalance] = useState<number | null>(null)
  const [algoBalance, setAlgoBalance] = useState<number | null>(null)

  // Get Solana public key from wallet hook
  const { publicKey } = useWallet()

  useEffect(() => {
    let active = true
    async function loadSol() {
      if (!solanaConnected || !publicKey) { setSolBalance(null); return }
      try {
        const lamports = await connection.getBalance(publicKey)
        if (!active) return
        setSolBalance(lamports / LAMPORTS_PER_SOL)
      } catch { setSolBalance(null) }
    }
    loadSol()
    return () => { active = false }
  }, [solanaConnected, publicKey, connection])

  const { address: algoAddress } = useAlgorandWallet()
  useEffect(() => {
    let active = true
    async function loadAlgo() {
      if (!algorandConnected || !algoAddress) { setAlgoBalance(null); return }
      try {
        const res = await fetch(`https://testnet-api.algonode.cloud/v2/accounts/${algoAddress}`)
        if (!res.ok) throw new Error('algo')
        const json = await res.json()
        const micro = json.amount as number
        if (!active) return
        setAlgoBalance(micro / 1e6)
      } catch { setAlgoBalance(null) }
    }
    loadAlgo()
    return () => { active = false }
  }, [algorandConnected, algoAddress])

  return (
    <nav className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">P</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Pokémon Marketplace
              </h1>
              <p className="text-xs text-gray-500">Multi-chain Web3 Trading</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <ChainSelector />
            
            <a href="/" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
              Marketplace
            </a>
            <a href="/sell" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
              Sell Card
            </a>
            {isAnyWalletConnected && (
              <>
                <a href="/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                  Dashboard
                </a>
                <a href="/transactions" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                  Transactions
                </a>
              </>
            )}

            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ShoppingCart className="w-5 h-5 text-gray-600" />
              </button>
              {aptosConnected && (
                <span className="hidden md:inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
                  {aptosBalance !== null ? `${aptosBalance.toFixed(2)} APT` : 'APT —'}
                  <span className="ml-2 opacity-70">testnet</span>
                </span>
              )}
              {!aptosConnected && solanaConnected && (
                <span className="hidden md:inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                  {solBalance !== null ? `${solBalance.toFixed(2)} SOL` : 'SOL —'}
                  <span className="ml-2 opacity-70">devnet</span>
                </span>
              )}
              {!aptosConnected && !solanaConnected && algorandConnected && (
                <span className="hidden md:inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                  {algoBalance !== null ? `${algoBalance.toFixed(2)} ALGO` : 'ALGO —'}
                  <span className="ml-2 opacity-70">testnet</span>
                </span>
              )}
              <WalletConnectButton />
              {isAnyWalletConnected && (
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <User className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-4">
            <ChainSelector mobile />
            <div className="space-y-2">
              <a href="/" className="block py-2 text-gray-700 hover:text-blue-600 transition-colors">
                Marketplace
              </a>
              <a href="/sell" className="block py-2 text-gray-700 hover:text-blue-600 transition-colors">
                Sell Card
              </a>
              {isAnyWalletConnected && (
                <>
                  <a href="/dashboard" className="block py-2 text-gray-700 hover:text-blue-600 transition-colors">
                    Dashboard
                  </a>
                  <a href="/transactions" className="block py-2 text-gray-700 hover:text-blue-600 transition-colors">
                    Transactions
                  </a>
                </>
              )}
            </div>
            <div className="pt-4 border-t">
              <WalletConnectButton mobile />
              {aptosConnected && (
                <div className="mt-2 text-xs px-2.5 py-1 rounded-full inline-block bg-orange-100 text-orange-700 font-medium">
                  {aptosBalance !== null ? `${aptosBalance.toFixed(2)} APT` : 'APT —'}
                  <span className="ml-2 opacity-70">testnet</span>
                </div>
              )}
              {!aptosConnected && solanaConnected && (
                <div className="mt-2 text-xs px-2.5 py-1 rounded-full inline-block bg-purple-100 text-purple-700 font-medium">
                  {solBalance !== null ? `${solBalance.toFixed(2)} SOL` : 'SOL —'} <span className="ml-2 opacity-70">devnet</span>
                </div>
              )}
              {!aptosConnected && !solanaConnected && algorandConnected && (
                <div className="mt-2 text-xs px-2.5 py-1 rounded-full inline-block bg-green-100 text-green-700 font-medium">
                  {algoBalance !== null ? `${algoBalance.toFixed(2)} ALGO` : 'ALGO —'} <span className="ml-2 opacity-70">testnet</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}