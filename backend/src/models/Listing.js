const mongoose = require('mongoose')

const ListingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: String, required: true }, // e.g., "1.5 SOL"
    rarity: { type: String, enum: ['Common','Uncommon','Rare','Legendary'], required: true },
    type: { type: String, required: true },
    chain: { type: String, enum: ['Solana','Aptos','Algorand'], required: true },
    seller: { type: String, required: true },
    imageUrl: { type: String },
    metadataUrl: { type: String },
    hp: { type: Number, default: 100 },
    attack: { type: Number, default: 100 },
    defense: { type: Number, default: 100 },
    sold: { type: Boolean, default: false },
  },
  { timestamps: true }
)

module.exports = mongoose.models.Listing || mongoose.model('Listing', ListingSchema)
