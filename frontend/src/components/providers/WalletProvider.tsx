'use client'

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { getPhantomWallet } from '@solana/wallet-adapter-wallets'
import { ReactNode, useMemo } from 'react'
import { AlgorandWalletProvider } from './AlgorandWalletProvider'

import '@solana/wallet-adapter-react-ui/styles.css'

const SOLANA_ENDPOINT = 'https://api.devnet.solana.com'
const ALGORAND_ENDPOINT = 'https://testnet-api.algonode.cloud'

export function WalletProvider({ children }: { children: ReactNode }) {
  const solanaWallets = useMemo(() => [getPhantomWallet()], [])

  return (
    <ConnectionProvider endpoint={SOLANA_ENDPOINT}>
      <SolanaWalletProvider wallets={solanaWallets} autoConnect>
        <WalletModalProvider>
          <AlgorandWalletProvider>
            {children}
          </AlgorandWalletProvider>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}