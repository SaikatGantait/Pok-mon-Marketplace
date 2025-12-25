type Props = {
  open: boolean
  onClose: () => void
  onConnectSolana: () => void
  onConnectAptos: () => void
  onConnectEvm?: () => void
}

import { useEffect, useRef } from 'react'
import Portal from '@/components/layout/Portal'

export default function WalletSelectModal({ open, onClose, onConnectSolana, onConnectAptos, onConnectEvm }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.scrollTop = 0
    }
    function onKey(e: KeyboardEvent) {
      if (!open) return
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null

  return (
    <Portal>
      <div className="fixed inset-0 z-[10001] bg-black/40" onClick={onClose} />
      {/* Centered container rendered via portal to avoid ancestor transforms */}
      <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          className="w-[min(100%_-_2rem,32rem)] max-w-md max-h-[90vh] rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
        >
          <div className="px-6 py-4 border-b sticky top-0 bg-white/95 backdrop-blur z-10 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Connect your wallet</h3>
              <p className="text-sm text-gray-500 mt-1">Choose a network wallet to connect on testnet</p>
            </div>
            <button aria-label="Close" onClick={onClose} className="ml-4 rounded-md p-2 hover:bg-gray-100">✕</button>
          </div>
          <div className="p-6 space-y-3 overflow-y-auto">
            <button
              onClick={onConnectSolana}
              className="w-full flex items-center justify-between border rounded-xl p-4 hover:bg-gray-50 transition-colors transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  {/* Solana glyph */}
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                    <defs>
                      <linearGradient id="sol" x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0%" stopColor="#00FFA3"/>
                        <stop offset="100%" stopColor="#DC1FFF"/>
                      </linearGradient>
                    </defs>
                    <path fill="url(#sol)" d="M9 33h26l4 4H13zM9 11h26l4 4H13zM9 22h26l4 4H13z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">Solana</div>
                  <div className="text-xs text-gray-500">Phantom (Testnet)</div>
                </div>
              </div>
              <span className="text-sm text-purple-600 font-medium">Connect</span>
            </button>

            <button
              onClick={onConnectAptos}
              className="w-full flex items-center justify-between border rounded-xl p-4 hover:bg-gray-50 transition-colors transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-600/10 flex items-center justify-center">
                  {/* Aptos glyph */}
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                    <circle cx="12" cy="12" r="9" fill="#f59e0b" opacity="0.2"/>
                    <path fill="#f59e0b" d="M6 10h12v2H6zm0 4h12v2H6zM6 6h12v2H6z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">Aptos</div>
                  <div className="text-xs text-gray-500">Petra (Testnet)</div>
                </div>
              </div>
              <span className="text-sm text-orange-600 font-medium">Connect</span>
            </button>

            <button
              onClick={onConnectEvm}
              className="w-full flex items-center justify-between border rounded-xl p-4 hover:bg-gray-50 transition-colors transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-700/10 flex items-center justify-center">
                  {/* MetaMask glyph */}
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                    <path fill="#f6851b" d="M3 3l7 5-2 3-5-2zM21 3l-7 5 2 3 5-2zM12 13l-3 2 3 6 3-6z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">EVM</div>
                  <div className="text-xs text-gray-500">MetaMask (Sepolia)</div>
                </div>
              </div>
              <span className="text-sm text-gray-700 font-medium">Connect</span>
            </button>

            <div className="text-xs text-gray-500 pt-2">Testnets only — no real funds</div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
