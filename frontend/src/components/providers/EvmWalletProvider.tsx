'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

// Minimal EVM wallet context for MetaMask-compatible providers
interface EvmContextType {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  isConnected: boolean
  address: string | null
  chainId: string | null // hex string, e.g. '0xaa36a7' for Sepolia
  sendPayment: (to: string, amountEth: number) => Promise<string>
}

const EvmContext = createContext<EvmContextType | undefined>(undefined)

declare global {
  interface Window {
    ethereum?: any
  }
}

export function EvmWalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<string | null>(null)
  const [provider, setProvider] = useState<any>(null)

  useEffect(() => {
    const eth = typeof window !== 'undefined' ? window.ethereum : undefined
    if (!eth) return
    // Do not auto-connect; only read chainId
    eth.request({ method: 'eth_chainId' }).then((id: string) => setChainId(id)).catch(() => {})

    const handleAccountsChanged = (accs: string[]) => {
      setAddress(accs && accs[0] ? accs[0] : null)
    }
    const handleChainChanged = (id: string) => setChainId(id)

    eth.on?.('accountsChanged', handleAccountsChanged)
    eth.on?.('chainChanged', handleChainChanged)
    return () => {
      eth.removeListener?.('accountsChanged', handleAccountsChanged)
      eth.removeListener?.('chainChanged', handleChainChanged)
    }
  }, [])

  // Select MetaMask specifically when multiple EVM providers are present
  const pickMetaMask = () => {
    const eth: any = (typeof window !== 'undefined') ? (window.ethereum as any) : undefined
    if (!eth) return null
    const mm = eth.providers?.find((p: any) => p?.isMetaMask) || (eth.isMetaMask ? eth : null)
    return mm
  }

  const connect = async () => {
    const mm = pickMetaMask()
    if (!mm) throw new Error('MetaMask provider not found. If Phantom EVM is enabled, disable it or set MetaMask as default.')
    try {
      // Optional: switch to Sepolia (0xaa36a7)
      try {
        await mm.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xaa36a7' }] })
      } catch {
        // ignore if not supported; user can stay on current chain
      }
      const accs: string[] = await mm.request({ method: 'eth_requestAccounts' })
      setAddress(accs && accs[0] ? accs[0] : null)
      const id: string = await mm.request({ method: 'eth_chainId' })
      setChainId(id)
      setProvider(mm)
    } catch (e) {
      throw e
    }
  }

  const disconnect = async () => {
    // MetaMask does not support programmatic disconnect; just clear local state
    setAddress(null)
  }

  const sendPayment = async (to: string, amountEth: number) => {
    const mm = provider || pickMetaMask()
    if (!mm) throw new Error('MetaMask provider not found')
    if (!address) throw new Error('EVM wallet not connected')
    const wei = BigInt(Math.floor(amountEth * 1e18))
    const tx = {
      from: address,
      to,
      value: '0x' + wei.toString(16),
    }
    const hash: string = await mm.request({ method: 'eth_sendTransaction', params: [tx] })
    return hash
  }

  const value = useMemo<EvmContextType>(() => ({
    connect, disconnect, isConnected: !!address, address, chainId, sendPayment,
  }), [address, chainId])

  return <EvmContext.Provider value={value}>{children}</EvmContext.Provider>
}

export function useEvmWallet() {
  const ctx = useContext(EvmContext)
  if (!ctx) throw new Error('useEvmWallet must be used within EvmWalletProvider')
  return ctx
}
