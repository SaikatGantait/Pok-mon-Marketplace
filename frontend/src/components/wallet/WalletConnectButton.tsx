'use client'

import { useEffect, useState } from 'react'
import { Wallet, ChevronDown, LogOut, Copy, Check } from 'lucide-react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import WalletSelectModal from './WalletSelectModal'
import { useAptosWallet } from '@/components/providers/AptosWalletProvider'

export default function WalletConnectButton({ mobile = false }: { mobile?: boolean }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showSelectModal, setShowSelectModal] = useState(false)
  
  const { connect: connectSolana, disconnect: disconnectSolana, connected: solanaConnected, publicKey: solanaPublicKey } = useWallet()
  const { connection } = useConnection()
  const { connect: connectAlgorand, disconnect: disconnectAlgorand, isConnected: algorandConnected, address: algorandAddress } = useAlgorandWallet()
  const { setVisible: setSolanaModalVisible } = useWalletModal()
  const { connect: connectAptos, disconnect: disconnectAptos, isConnected: aptosConnected, address: aptosAddress, balance: aptosBalance } = useAptosWallet()

  const isAnyWalletConnected = solanaConnected || algorandConnected || aptosConnected
  const currentAddress = solanaConnected ? solanaPublicKey?.toBase58() : aptosConnected ? aptosAddress : algorandConnected ? algorandAddress : null

  // Balances (testnets only)
  const [solBalance, setSolBalance] = useState<number | null>(null)
  const [algoBalance, setAlgoBalance] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    async function loadSol() {
      if (!solanaConnected || !solanaPublicKey) { setSolBalance(null); return }
      try {
        const lamports = await connection.getBalance(solanaPublicKey)
        if (!active) return
        setSolBalance(lamports / LAMPORTS_PER_SOL)
      } catch { setSolBalance(null) }
    }
    loadSol()
    return () => { active = false }
  }, [solanaConnected, solanaPublicKey, connection])

  useEffect(() => {
    let active = true
    async function loadAlgo() {
      if (!algorandConnected || !algorandAddress) { setAlgoBalance(null); return }
      try {
        const res = await fetch(`https://testnet-api.algonode.cloud/v2/accounts/${algorandAddress}`)
        if (!res.ok) throw new Error('algo balance')
        const json = await res.json()
        const micro = json.amount as number
        if (!active) return
        setAlgoBalance(micro / 1e6)
      } catch { setAlgoBalance(null) }
    }
    loadAlgo()
    return () => { active = false }
  }, [algorandConnected, algorandAddress])

  const handleConnect = () => {
    if (!isAnyWalletConnected) setShowSelectModal(true)
  }

  const connectViaSolana = async () => {
    setShowSelectModal(false)
    // If Phantom isn't detected, help the user install it, then still show the modal
    const hasPhantom = typeof window !== 'undefined' && (window as any).solana?.isPhantom
    if (!hasPhantom) {
      try {
        window.open('https://phantom.app/download', '_blank', 'noopener,noreferrer')
      } catch {}
    }
    // For adapter-react 0.9, use the UI modal to pick Phantom
    setSolanaModalVisible(true)
  }

  const connectViaAlgorand = async () => {
    setShowSelectModal(false)
    await connectAlgorand()
    setShowDropdown(true)
  }

  const connectViaAptos = async () => {
    setShowSelectModal(false)
    await connectAptos()
    setShowDropdown(true)
  }

  const handleCopyAddress = async () => {
    if (currentAddress) {
      await navigator.clipboard.writeText(currentAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDisconnect = async () => {
    if (solanaConnected) {
      await disconnectSolana()
    }
    if (aptosConnected) {
      await disconnectAptos()
    }
    if (algorandConnected) {
      await disconnectAlgorand()
    }
    setShowDropdown(false)
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (mobile) {
    return (
      <>
        <button
          onClick={handleConnect}
          className="w-full btn-primary"
        >
          <Wallet className="w-4 h-4 mr-2" />
          {isAnyWalletConnected ? 'Wallet Connected' : 'Connect Wallet'}
        </button>
        <WalletSelectModal
          open={showSelectModal}
          onClose={() => setShowSelectModal(false)}
          onConnectSolana={connectViaSolana}
          onConnectAlgorand={connectViaAlgorand}
          onConnectAptos={connectViaAptos}
        />
      </>
    )
  }

  if (!isAnyWalletConnected) {
    return (
      <>
        <button
          onClick={handleConnect}
          className="btn-primary flex items-center gap-2"
        >
          <Wallet className="w-4 h-4" />
          Connect Wallet
        </button>
        <WalletSelectModal
          open={showSelectModal}
          onClose={() => setShowSelectModal(false)}
          onConnectSolana={connectViaSolana}
          onConnectAlgorand={connectViaAlgorand}
          onConnectAptos={connectViaAptos}
        />
      </>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
      >
        <Wallet className="w-4 h-4" />
        <span className="font-medium">{formatAddress(currentAddress!)}</span>
        {aptosConnected && (
          <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded">
            {aptosBalance !== null ? `${aptosBalance.toFixed(2)} APT` : 'APT —'}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="text-sm text-gray-600">Connected Wallet</div>
              <div className="flex items-center justify-between mt-1">
                <div className="font-mono text-sm truncate">{currentAddress}</div>
                <button
                  onClick={handleCopyAddress}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                </button>
              </div>
              {aptosConnected && (
                <div className="mt-2 text-sm text-gray-700">
                  Balance: <span className="font-semibold">{aptosBalance !== null ? aptosBalance.toFixed(4) : '—'} APT</span>
                  <span className="text-xs text-gray-500"> (testnet)</span>
                </div>
              )}
              {solanaConnected && (
                <div className="mt-2 text-sm text-gray-700">
                  Balance: <span className="font-semibold">{solBalance !== null ? solBalance.toFixed(4) : '—'} SOL</span>
                  <span className="text-xs text-gray-500"> (devnet)</span>
                </div>
              )}
              {algorandConnected && (
                <div className="mt-2 text-sm text-gray-700">
                  Balance: <span className="font-semibold">{algoBalance !== null ? algoBalance.toFixed(4) : '—'} ALGO</span>
                  <span className="text-xs text-gray-500"> (testnet)</span>
                </div>
              )}
            </div>
            <div className="p-2">
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Disconnect Wallet
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}