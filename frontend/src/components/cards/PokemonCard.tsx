import { PokemonCardType } from '@/types/pokemon'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { parsePrice, buyOnSolana, buyOnAptos } from '@/utils/buy'
import { useAptosWallet } from '@/components/providers/AptosWalletProvider'
import { useEvmWallet } from '@/components/providers/EvmWalletProvider'
import { API_URL } from '@/utils/api'

export default function PokemonCard({ card }: { card: PokemonCardType }) {
  const wallet = useWallet()
  const { connection } = useConnection()
  const { isConnected: aptosConnected } = useAptosWallet()
  const { isConnected: evmConnected, sendPayment: sendEvm } = useEvmWallet()
  

  const handleBuy = async () => {
    const { amount, symbol } = parsePrice(card.price)
    try {
      if (card.chain === 'Solana' && symbol === 'SOL') {
        // Validate seller address; fallback to paying your own wallet on testnet for demo data
        let sellerAddr = card.seller
        try { new PublicKey(sellerAddr) } catch {
          if (wallet.publicKey) {
            sellerAddr = wallet.publicKey.toBase58()
          } else {
            throw new Error('Invalid seller address in listing')
          }
        }
        const sig = await buyOnSolana({ wallet, connection, seller: sellerAddr, amountSol: amount })
        await fetch(`${API_URL}/api/confirm`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listingId: card.id, chain: 'Solana', txId: sig }) })
        alert(`Purchased on Solana Testnet. Tx: ${sig}`)
        return
      }
      if (card.chain === 'Aptos' && symbol === 'APT' && aptosConnected) {
        const hash = await buyOnAptos({ seller: card.seller, amountApt: amount })
        await fetch(`${API_URL}/api/confirm`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listingId: card.id, chain: 'Aptos', txId: hash }) })
        alert(`Purchased on Aptos Testnet. Tx: ${hash}`)
        return
      }
      
      if (card.chain === 'EVM' && evmConnected) {
        const hash = await sendEvm(card.seller, amount) // amount in ETH
        await fetch(`${API_URL}/api/confirm`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listingId: card.id, chain: 'EVM', txId: hash }) })
        alert(`Purchased on EVM Testnet. Tx: ${hash}`)
        return
      }
      
      alert('Purchase not supported for this chain yet.')
    } catch (e: any) {
      alert(`Purchase failed: ${e.message || e}`)
    }
  }
  // Build a Web3-style header if image is missing
  const typeColors: Record<string, string> = {
    fire: 'from-orange-500 via-red-500 to-pink-600',
    water: 'from-sky-500 via-blue-600 to-indigo-700',
    electric: 'from-yellow-400 via-amber-500 to-orange-600',
    grass: 'from-emerald-400 via-green-600 to-teal-700',
    psychic: 'from-fuchsia-400 via-purple-600 to-violet-800',
    fighting: 'from-slate-400 via-slate-600 to-gray-800',
  }
  const gradient = typeColors[card.type] || 'from-blue-400 via-purple-600 to-fuchsia-700'
  const header = (
    <div className="h-40 w-full overflow-hidden">
      {card.imageUrl ? (
        <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${gradient} relative`}>
          <div className="absolute inset-0 opacity-30" style={{backgroundImage:'radial-gradient(circle at 20% 20%, rgba(255,255,255,.6) 0, transparent 40%), radial-gradient(circle at 80% 0%, rgba(255,255,255,.25) 0, transparent 35%), radial-gradient(circle at 50% 100%, rgba(255,255,255,.2) 0, transparent 40%)'}}/>
          <div className="absolute inset-0 flex items-center justify-center text-white/90 text-5xl drop-shadow-lg">
            {card.type === 'fire' && '🔥'}
            {card.type === 'water' && '💧'}
            {card.type === 'electric' && '⚡'}
            {card.type === 'grass' && '🌿'}
            {card.type === 'psychic' && '🔮'}
            {card.type === 'fighting' && '👊'}
          </div>
        </div>
      )}
    </div>
  )
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all">
      {header}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{card.rarity}</span>
          <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">{card.chain}</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{card.name}</h3>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{card.description}</p>
        <div className="grid grid-cols-3 gap-2 text-center text-sm mt-4">
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-gray-500">HP</div>
            <div className="font-semibold">{card.hp}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-gray-500">ATK</div>
            <div className="font-semibold">{card.attack}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-gray-500">DEF</div>
            <div className="font-semibold">{card.defense}</div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <span className="font-semibold text-blue-600">{card.price}</span>
        <button className="btn-primary" onClick={handleBuy}>Buy</button>
      </div>
    </div>
  )
}
