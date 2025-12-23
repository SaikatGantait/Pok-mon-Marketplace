const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()
const Listing = require('./models/Listing')

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
