import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { WalletContextState } from '@solana/wallet-adapter-react'

export function parsePrice(price: string): { amount: number, symbol: 'SOL'|'APT'|'ALGO' } {
  const [num, sym] = price.trim().split(/\s+/)
  const amount = parseFloat(num)
  const symbol = (sym?.toUpperCase() as any) || 'SOL'
  return { amount, symbol }
}

export async function buyOnSolana(opts: {
  wallet: WalletContextState,
  connection: import('@solana/web3.js').Connection,
  seller: string,
  amountSol: number,
}): Promise<string> {
  const { wallet, connection, seller, amountSol } = opts
  if (!wallet.publicKey) throw new Error('Wallet not connected')
  const sellerKey = new PublicKey(seller)
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: sellerKey,
      lamports: Math.round(amountSol * 1_000_000_000),
    }),
  )
  const sig = await wallet.sendTransaction(tx, connection)
  await connection.confirmTransaction(sig, 'confirmed')
  return sig
}

export async function buyOnAptos(opts: {
  seller: string,
  amountApt: number,
}): Promise<string> {
  // Uses injected Petra API. Assumes window.aptos is present.
  const anyWindow: any = window as any
  const aptos = anyWindow.aptos
  if (!aptos?.signAndSubmitTransaction) throw new Error('Petra not available')
  const payload = {
    type: 'entry_function_payload',
    function: '0x1::coin::transfer',
    type_arguments: ['0x1::aptos_coin::AptosCoin'],
    arguments: [opts.seller, Math.round(opts.amountApt * 1e8).toString()],
  }
  const res = await aptos.signAndSubmitTransaction({ payload })
  return res.hash
}
