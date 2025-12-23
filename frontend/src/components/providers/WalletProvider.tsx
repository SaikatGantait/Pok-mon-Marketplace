'use client'

import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { ReactNode, useMemo } from 'react'
import { AlgorandWalletProvider } from './AlgorandWalletProvider'

import '@solana/wallet-adapter-react-ui/styles.css'

const SOLANA_ENDPOINT = 'https://api.devnet.solana.com'
const ALGORAND_ENDPOINT = 'https://testnet-api.algonode.cloud'

export function WalletProvider({ children }: { children: ReactNode }) {
  // Import only the Phantom adapter to avoid bundling optional wallets (like Torus)
  // that pull in Node-native deps incompatible with Next.js SSR.
  const solanaWallets = useMemo(() => [new PhantomWalletAdapter()], [])

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