import type { AppProps } from 'next/app'
import Providers from '@/components/providers/Providers'
import '@/app/globals.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Providers>
      <Component {...pageProps} />
    </Providers>
  )
}
