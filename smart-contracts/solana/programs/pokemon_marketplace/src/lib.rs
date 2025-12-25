use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("PoKEoNMarketPlace1111111111111111111111111111");

// A simple, audited-friendly marketplace skeleton that escrow the seller's SPL asset
// in a PDA vault and releases it to the buyer upon payment. Payment is in the same SPL mint.

#[program]
pub mod pokemon_marketplace {
    use super::*;

    pub fn list_card(ctx: Context<ListCard>, card_id: String, price: u64) -> Result<()> {
        require!(card_id.as_bytes().len() <= 50, MarketplaceError::CardIdTooLong);

        // Move the seller's tokens (1 for NFT or any amount for FT) to the PDA vault
        // For simplicity we assume 1 token of the asset mint represents the card.
        let listing = &mut ctx.accounts.listing;
        listing.seller = ctx.accounts.seller.key();
        listing.card_id = card_id;
        listing.price = price;
        listing.asset_mint = ctx.accounts.asset_mint.key();
        listing.is_sold = false;
        listing.bump = *ctx.bumps.get("listing").unwrap();

        // CPI transfer 1 token from seller to vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.seller_asset.to_account_info(),
            to: ctx.accounts.vault_asset.to_account_info(),
            authority: ctx.accounts.seller.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, 1)?;

        emit!(CardListed { seller: listing.seller, card_id: listing.card_id.clone(), price });
        Ok(())
    }

    pub fn buy_card(ctx: Context<BuyCard>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        require!(!listing.is_sold, MarketplaceError::AlreadySold);
        // Ensure the vault still holds the asset
        require!(ctx.accounts.vault_asset.amount >= 1, MarketplaceError::AssetMissing);

        // Check buyer payment mint == listing asset mint for this simple example
        require!(ctx.accounts.buyer_payment.mint == listing.asset_mint, MarketplaceError::WrongPaymentMint);
        require!(ctx.accounts.seller_payment.mint == listing.asset_mint, MarketplaceError::WrongPaymentMint);

        // Transfer payment tokens from buyer to seller
        let pay_cpi = Transfer {
            from: ctx.accounts.buyer_payment.to_account_info(),
            to: ctx.accounts.seller_payment.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), pay_cpi);
        token::transfer(cpi_ctx, listing.price)?;

        // Seeds for vault authority PDA
        let seeds: &[&[u8]] = &[b"listing", listing.seller.as_ref(), listing.card_id.as_bytes(), &[listing.bump]];
        let signer = &[&seeds[..]];

        // Transfer the escrowed asset to the buyer
        let asset_cpi = Transfer {
            from: ctx.accounts.vault_asset.to_account_info(),
            to: ctx.accounts.buyer_asset.to_account_info(),
            authority: ctx.accounts.listing.to_account_info(), // listing PDA is the authority
        };
        let cpi_ctx = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), asset_cpi, signer);
        token::transfer(cpi_ctx, 1)?;

        listing.is_sold = true;
        listing.buyer = Some(ctx.accounts.buyer.key());
        emit!(CardBought { seller: listing.seller, buyer: ctx.accounts.buyer.key(), card_id: listing.card_id.clone(), price: listing.price });
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(card_id: String)]
pub struct ListCard<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    pub asset_mint: Account<'info, Mint>,
    #[account(mut, constraint = seller_asset.owner == seller.key(), constraint = seller_asset.mint == asset_mint.key())]
    pub seller_asset: Account<'info, TokenAccount>,
    // PDA listing, also used as vault authority
    #[account(
        init,
        payer = seller,
        space = Listing::LEN,
        seeds = [b"listing", seller.key().as_ref(), card_id.as_bytes()],
        bump
    )]
    pub listing: Account<'info, Listing>,
    // Vault ATA owned by PDA
    #[account(
        init,
        payer = seller,
        associated_token::mint = asset_mint,
        associated_token::authority = listing,
    )]
    pub vault_asset: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct BuyCard<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// Seller is derived from listing.seller
    /// CHECK: seller is only used for seeds
    pub seller: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [b"listing", seller.key().as_ref(), listing.card_id.as_bytes()],
        bump = listing.bump
    )]
    pub listing: Account<'info, Listing>,
    #[account(mut, constraint = buyer_payment.owner == buyer.key())]
    pub buyer_payment: Account<'info, TokenAccount>,
    #[account(mut)]
    pub seller_payment: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_asset: Account<'info, TokenAccount>,
    #[account(mut)]
    pub buyer_asset: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Listing {
    pub seller: Pubkey,
    pub buyer: Option<Pubkey>,
    pub card_id: String,   // max 50 bytes
    pub price: u64,        // in smallest units of the payment mint
    pub asset_mint: Pubkey,
    pub is_sold: bool,
    pub bump: u8,
}

impl Listing {
    pub const LEN: usize = 8  // anchor account discriminator
        + 32                 // seller
        + 1 + 32            // buyer option
        + 4 + 50            // card_id (string: 4 + len)
        + 8                 // price
        + 32                // asset_mint
        + 1                 // is_sold
        + 1;                // bump
}

#[event]
pub struct CardListed {
    pub seller: Pubkey,
    pub card_id: String,
    pub price: u64,
}

#[event]
pub struct CardBought {
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub card_id: String,
    pub price: u64,
}

#[error_code]
pub enum MarketplaceError {
    #[msg("Card is already sold")] AlreadySold,
    #[msg("Insufficient or wrong payment mint")] WrongPaymentMint,
    #[msg("Card asset missing from vault")] AssetMissing,
    #[msg("Card ID too long")] CardIdTooLong,
}