const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()
const Listing = require('./models/Listing')
const { Connection, PublicKey, SystemProgram } = require('@solana/web3.js')

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pokemon-marketplace', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Pokémon Marketplace API is running' })
})

// Listings API
app.get('/api/listings', async (req, res) => {
  try {
    const items = await Listing.find().sort({ createdAt: -1 }).lean()
    res.json(items)
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch listings' })
  }
})

app.post('/api/listings', async (req, res) => {
  try {
    const created = await Listing.create(req.body)
    res.status(201).json(created)
  } catch (e) {
    res.status(400).json({ error: 'Invalid listing payload' })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})

// Purchase confirmation API
app.post('/api/confirm', async (req, res) => {
  try {
    const { listingId, chain, txId } = req.body || {}
    if (!listingId || !chain || !txId) return res.status(400).json({ error: 'Missing fields' })
    const listing = await Listing.findById(listingId)
    if (!listing) return res.status(404).json({ error: 'Listing not found' })

    let ok = false
    if (chain === 'Solana') {
      ok = await verifySolanaTransfer({
        tx: txId,
        seller: listing.seller,
        amount: parsePrice(listing.price).amount * 1_000_000_000, // lamports
      })
    } else if (chain === 'Aptos') {
      ok = await verifyAptosTransfer({ tx: txId, seller: listing.seller, amountOctas: parsePrice(listing.price).amount * 1e8 })
    } else if (chain === 'Algorand') {
      ok = await verifyAlgorandPayment({ tx: txId, seller: listing.seller, microAlgos: parsePrice(listing.price).amount * 1e6 })
    }

    if (!ok) return res.status(400).json({ error: 'On-chain verification failed' })
    listing.sold = true
    await listing.save()
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Confirm failed' })
  }
})

function parsePrice(price) {
  const [num] = String(price).trim().split(/\s+/)
  const amount = parseFloat(num)
  return { amount }
}

async function verifySolanaTransfer({ tx, seller, amount }) {
  try {
    const conn = new Connection('https://api.devnet.solana.com', 'confirmed')
    const info = await conn.getTransaction(tx, { maxSupportedTransactionVersion: 0 })
    if (!info || !info.transaction) return false
    const sellerPk = new PublicKey(seller)
    const instructions = info.transaction.message.compiledInstructions || []
    // Fallback: iterate legacy message
    const message = info.transaction.message
    const accounts = message.accountKeys
    for (const ix of instructions) {
      const programId = accounts[ix.programIdIndex]
      if (!programId.equals(SystemProgram.programId)) continue
      const data = message.instructions ? null : null
    }
    // Easier approach: check postBalances - preBalances equals amount for seller
    const sellerIndex = info.transaction.message.accountKeys.findIndex(k => k.equals(sellerPk))
    if (sellerIndex === -1) return false
    const pre = info.meta?.preBalances?.[sellerIndex]
    const post = info.meta?.postBalances?.[sellerIndex]
    if (typeof pre !== 'number' || typeof post !== 'number') return false
    return post - pre >= Math.floor(amount)
  } catch (e) {
    console.error('verifySolanaTransfer', e)
    return false
  }
}

async function verifyAptosTransfer({ tx, seller, amountOctas }) {
  try {
    const res = await fetch(`https://fullnode.testnet.aptoslabs.com/v1/transactions/by_hash/${tx}`)
    if (!res.ok) return false
    const json = await res.json()
    if (json.success !== true) return false
    const payload = json.payload
    if (!payload || payload.type !== 'entry_function_payload') return false
    if (payload.function !== '0x1::coin::transfer') return false
    const args = payload.arguments || []
    const recv = args[0]
    const amt = Number(args[1])
    return recv?.toLowerCase() === seller.toLowerCase() && amt >= Math.floor(amountOctas)
  } catch (e) {
    console.error('verifyAptosTransfer', e)
    return false
  }
}

async function verifyAlgorandPayment({ tx, seller, microAlgos }) {
  try {
    const res = await fetch(`https://testnet-idx.algonode.cloud/v2/transactions/${tx}`)
    if (!res.ok) return false
    const json = await res.json()
    const txn = json.transaction
    if (!txn || txn['tx-type'] !== 'pay') return false
    const recv = txn['payment-transaction']?.receiver
    const amt = txn['payment-transaction']?.amount
    return recv === seller && Number(amt) >= Math.floor(microAlgos)
  } catch (e) {
    console.error('verifyAlgorandPayment', e)
    return false
  }
}
