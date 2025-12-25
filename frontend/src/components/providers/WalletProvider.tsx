'use client'

import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { ReactNode, useMemo } from 'react'

import '@solana/wallet-adapter-react-ui/styles.css'

const SOLANA_ENDPOINT = 'https://api.testnet.solana.com'
// Only Solana is supported now

export function WalletProvider({ children }: { children: ReactNode }) {
  // Import only the Phantom adapter to avoid bundling optional wallets.
  // For wallet-adapter-react >= 0.15.x, pass adapter instances directly.
  const solanaWallets = useMemo(() => [new PhantomWalletAdapter()], [])

  return (
    <ConnectionProvider endpoint={SOLANA_ENDPOINT}>
      {/* Disable autoConnect so the Phantom permission popup is shown on user click */}
      <SolanaWalletProvider wallets={solanaWallets}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}