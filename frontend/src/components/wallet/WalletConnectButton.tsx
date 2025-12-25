'use client'

import { useEffect, useState } from 'react'
import { Wallet, ChevronDown, LogOut, Copy, Check } from 'lucide-react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import type { WalletName } from '@solana/wallet-adapter-base'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
// Removed wallet modal usage to avoid showing the adapter UI
import WalletSelectModal from './WalletSelectModal'
import { useAptosWallet } from '../providers/AptosWalletProvider'
import { useEvmWallet } from '../providers/EvmWalletProvider'

export default function WalletConnectButton({ mobile = false }: { mobile?: boolean }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showSelectModal, setShowSelectModal] = useState(false)
  
  const {
    connect: connectSolana,
    disconnect: disconnectSolana,
    connected: solanaConnected,
    publicKey: solanaPublicKey,
    wallets: solanaWallets,
    select: selectSolanaWallet,
  } = useWallet()
  const { connection } = useConnection()
  const { connect: connectAptos, disconnect: disconnectAptos, isConnected: aptosConnected, address: aptosAddress } = useAptosWallet()
  const { connect: connectEvm, disconnect: disconnectEvm, isConnected: evmConnected, address: evmAddress } = useEvmWallet()

  const isAnyWalletConnected = solanaConnected || aptosConnected || evmConnected
  const currentAddress = solanaConnected ? solanaPublicKey?.toBase58() : aptosConnected ? aptosAddress : evmConnected ? evmAddress : null

  // Balances (testnets only)
  const [solBalance, setSolBalance] = useState<number | null>(null)

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

  // No Algorand/Aptos in this build

  const handleConnect = () => {
    if (!isAnyWalletConnected) setShowSelectModal(true)
  }

  const connectViaSolana = async () => {
    // No modal — connect directly
    // Always select the Phantom adapter first so wallet-adapter-react has a wallet
    try {
      await selectSolanaWallet('Phantom' as WalletName)
    } catch {}

    // 1) Try adapter connect (should prompt if not previously approved)
    try {
      await connectSolana()
      setShowDropdown(true)
      return
    } catch (e) {
      // Fall through to provider connect
    }

    // 2) Ask Phantom provider explicitly (forces extension popup on first connect)
    try {
      const w: any = typeof window !== 'undefined' ? (window as any) : undefined
      const provider = w?.phantom?.solana || w?.solana
      if (provider?.connect) {
        await provider.connect({ onlyIfTrusted: false })
        // Sync adapter state after provider approval
        try { await selectSolanaWallet('Phantom' as WalletName) } catch {}
        await connectSolana()
        setShowDropdown(true)
        return
      }
    } catch (e) {
      // Continue to adapter-based connect below
    }
    // 3) Retry adapter connect after provider prompt
    try {
      await selectSolanaWallet('Phantom' as WalletName)
      await connectSolana()
      setShowDropdown(true)
      return
    } catch {}
    // If Phantom isn't detected, help the user install it, then still show the modal
    const w: any = typeof window !== 'undefined' ? (window as any) : undefined
    const hasPhantom = !!(w?.solana?.isPhantom || w?.phantom?.solana)
    if (!hasPhantom) {
      try { window.open('https://phantom.app/download', '_blank', 'noopener,noreferrer') } catch {}
      alert('Phantom Wallet not detected. Please install Phantom and reload.')
      return
    }
    // 4) Last attempt via provider
    try {
      const provider = w?.phantom?.solana || w?.solana
      if (provider?.connect) {
        await provider.connect({ onlyIfTrusted: false })
        await connectSolana()
        setShowDropdown(true)
        return
      }
    } catch {}
  }

  // Removed Algorand
  const connectViaAptos = async () => {
    setShowSelectModal(false)
    try {
      await connectAptos()
      setShowDropdown(true)
    } catch (e: any) {
      alert(`Aptos connect failed: ${e?.message || e}`)
    }
  }

  const connectViaEvm = async () => {
    setShowSelectModal(false)
    try {
      await connectEvm()
      setShowDropdown(true)
    } catch (e: any) {
      alert(`EVM connect failed: ${e?.message || e}`)
    }
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
    if (evmConnected) {
      await disconnectEvm()
    }
    // Multi-chain supported: Solana, Aptos, EVM
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
          onConnectAptos={connectViaAptos}
          onConnectEvm={connectViaEvm}
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
              {solanaConnected && (
                <div className="mt-2 text-sm text-gray-700">
                  Balance: <span className="font-semibold">{solBalance !== null ? solBalance.toFixed(4) : '—'} SOL</span>
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