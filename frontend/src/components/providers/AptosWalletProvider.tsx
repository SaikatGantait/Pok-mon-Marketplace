'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type AptosContextType = {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  isConnected: boolean
  address: string | null
  balance: number | null // APT (not octas)
}

const AptosContext = createContext<AptosContextType | undefined>(undefined)

declare global {
  interface Window {
    aptos?: {
      connect: (opts?: any) => Promise<{ address: string }>
      account: () => Promise<{ address: string }>
      disconnect: () => Promise<void>
      isConnected: () => Promise<boolean>
        signAndSubmitTransaction?: (tx: any) => Promise<{ hash: string }>
    }
  }
}

export function AptosWalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)

  const fetchBalance = async (addr: string) => {
    try {
      const type = encodeURIComponent('0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>')
      const res = await fetch(`https://fullnode.testnet.aptoslabs.com/v1/accounts/${addr}/resource/${type}`)
      if (!res.ok) throw new Error('failed')
      const json = await res.json()
      const octas = BigInt(json.data.coin.value)
      const apt = Number(octas) / 1e8
      setBalance(apt)
    } catch {
      setBalance(null)
    }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        if (window.aptos) {
          const connected = await window.aptos.isConnected()
          if (!mounted) return
          if (connected) {
            const acc = await window.aptos.account()
            if (!mounted) return
            setIsConnected(true)
            setAddress(acc.address)
            fetchBalance(acc.address)
          }
        }
      } catch {}
    })()
    return () => {
      mounted = false
    }
  }, [])

  const connect = async () => {
    if (!window.aptos) {
      alert('Please install the Petra Wallet extension to connect on Aptos testnet.')
      return
    }
    try {
      const acc = await window.aptos.connect({})
      setIsConnected(true)
      setAddress(acc.address)
      fetchBalance(acc.address)
    } catch (e) {
      console.error('Aptos connect error:', e)
    }
  }

  const disconnect = async () => {
    try {
      if (window.aptos) await window.aptos.disconnect()
    } finally {
      setIsConnected(false)
      setAddress(null)
    }
  }

  return (
    <AptosContext.Provider value={{ connect, disconnect, isConnected, address, balance }}>
      {children}
    </AptosContext.Provider>
  )
}

export function useAptosWallet() {
  const ctx = useContext(AptosContext)
  if (!ctx) throw new Error('useAptosWallet must be used within AptosWalletProvider')
  return ctx
}
