'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { WalletProvider } from './WalletProvider'
import { ThemeProvider } from './ThemeProvider'
import { AptosWalletProvider } from './AptosWalletProvider'
import { EvmWalletProvider } from './EvmWalletProvider'

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <AptosWalletProvider>
          <EvmWalletProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </EvmWalletProvider>
        </AptosWalletProvider>
      </WalletProvider>
    </QueryClientProvider>
  )
}