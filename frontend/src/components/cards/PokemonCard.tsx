import { PokemonCardType } from '@/types/pokemon'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { parsePrice, buyOnSolana, buyOnAptos } from '@/utils/buy'
import { useAptosWallet } from '@/components/providers/AptosWalletProvider'
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider'

export default function PokemonCard({ card }: { card: PokemonCardType }) {
  const wallet = useWallet()
  const { connection } = useConnection()
  const { isConnected: aptosConnected } = useAptosWallet()
  const { isConnected: algoConnected, sendPayment } = useAlgorandWallet()

  const handleBuy = async () => {
    const { amount, symbol } = parsePrice(card.price)
    try {
      if (card.chain === 'Solana' && symbol === 'SOL') {
        const sig = await buyOnSolana({ wallet, connection, seller: card.seller, amountSol: amount })
        alert(`Purchased on Solana Devnet. Tx: ${sig}`)
        return
      }
      if (card.chain === 'Aptos' && symbol === 'APT' && aptosConnected) {
        const hash = await buyOnAptos({ seller: card.seller, amountApt: amount })
        alert(`Purchased on Aptos Testnet. Tx: ${hash}`)
        return
      }
      if (card.chain === 'Algorand' && symbol === 'ALGO' && algoConnected) {
        const txId = await sendPayment(card.seller, amount)
        alert(`Purchased on Algorand TestNet. Tx: ${txId}`)
        return
      }
      alert('Purchase not supported for this chain yet.')
    } catch (e: any) {
      alert(`Purchase failed: ${e.message || e}`)
    }
  }
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
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
