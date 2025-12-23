'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { PeraWalletConnect } from '@perawallet/connect'
import algosdk from 'algosdk'

interface AlgorandContextType {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  isConnected: boolean
  address: string | null
  sendPayment: (to: string, amountAlgo: number) => Promise<string>
}

const AlgorandContext = createContext<AlgorandContextType | undefined>(undefined)

export function AlgorandWalletProvider({ children }: { children: ReactNode }) {
  const [peraWallet, setPeraWallet] = useState<PeraWalletConnect | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const pera = new PeraWalletConnect({ chainId: 'testnet' as any })
    setPeraWallet(pera)

    pera.reconnectSession().then((accounts) => {
      if (accounts.length > 0) {
        setAddress(accounts[0])
        setIsConnected(true)
      }
    }).catch(() => {
      console.log('No existing Pera session')
    })

    return () => {
      pera.disconnect()
    }
  }, [])

  const connect = async () => {
    if (!peraWallet) return

    try {
      const accounts = await peraWallet.connect()
      setAddress(accounts[0])
      setIsConnected(true)
    } catch (error) {
      console.error('Pera wallet connection error:', error)
    }
  }

  const disconnect = async () => {
    if (peraWallet) {
      await peraWallet.disconnect()
      setAddress(null)
      setIsConnected(false)
    }
  }

  const sendPayment = async (to: string, amountAlgo: number) => {
    if (!address || !peraWallet) throw new Error('Algorand wallet not connected')
    const algod = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')
    const sp = await algod.getTransactionParams().do()
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: address,
      to,
      amount: Math.round(amountAlgo * 1e6),
      suggestedParams: sp,
    })
    const encoded = algosdk.encodeUnsignedTransaction(txn)
    const signed = await peraWallet.signTransaction([{ txn: encoded }])
    const resp = await algod.sendRawTransaction(signed[0].blob).do()
    return resp.txId as string
  }

  return (
    <AlgorandContext.Provider value={{ connect, disconnect, isConnected, address, sendPayment }}>
      {children}
    </AlgorandContext.Provider>
  )
}

export const useAlgorandWallet = () => {
  const context = useContext(AlgorandContext)
  if (!context) {
    throw new Error('useAlgorandWallet must be used within AlgorandWalletProvider')
  }
  return context
}