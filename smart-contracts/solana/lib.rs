use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod pokemon_marketplace {
    use super::*;

    pub fn list_card(
        ctx: Context<ListCard>,
        card_id: String,
        price: u64,
        rarity: String,
        card_type: String,
    ) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        let seller = &ctx.accounts.seller;
        
        listing.seller = seller.key();
        listing.card_id = card_id;
        listing.price = price;
        listing.rarity = rarity;
        listing.card_type = card_type;
        listing.is_sold = false;
        listing.bump = *ctx.bumps.get("listing").unwrap();
        
        emit!(CardListed {
            seller: seller.key(),
            card_id: listing.card_id.clone(),
            price: listing.price,
        });
        
        Ok(())
    }

    pub fn buy_card(ctx: Context<BuyCard>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        let buyer = &ctx.accounts.buyer;
        let seller = &ctx.accounts.seller;
        
        require!(!listing.is_sold, MarketplaceError::AlreadySold);
        require!(listing.price <= ctx.accounts.buyer_token.amount, MarketplaceError::InsufficientFunds);
        
        // Transfer tokens from buyer to seller
        let cpi_accounts = Transfer {
            from: ctx.accounts.buyer_token.to_account_info(),
            to: ctx.accounts.seller_token.to_account_info(),
            authority: buyer.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::transfer(cpi_ctx, listing.price)?;
        
        // Update listing
        listing.is_sold = true;
        listing.buyer = Some(buyer.key());
        
        emit!(CardBought {
            seller: seller.key(),
            buyer: buyer.key(),
            card_id: listing.card_id.clone(),
            price: listing.price,
        });
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(card_id: String)]
pub struct ListCard<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    #[account(
        init,
        payer = seller,
        space = Listing::LEN,
        seeds = [b"listing", seller.key().as_ref(), card_id.as_bytes()],
        bump
    )]
    pub listing: Account<'info, Listing>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyCard<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(mut)]
    pub seller: SystemAccount<'info>,
    #[account(
        mut,
        seeds = [b"listing", seller.key().as_ref(), listing.card_id.as_bytes()],
        bump = listing.bump
    )]
    pub listing: Account<'info, Listing>,
    #[account(mut)]
    pub buyer_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub seller_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Listing {
    pub seller: Pubkey,
    pub buyer: Option<Pubkey>,
    pub card_id: String,
    pub price: u64,
    pub rarity: String,
    pub card_type: String,
    pub is_sold: bool,
    pub bump: u8,
}

impl Listing {
    pub const LEN: usize = 32 + 1 + 32 + 50 + 8 + 20 + 20 + 1 + 1;
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
    #[msg("Card is already sold")]
    AlreadySold,
    #[msg("Insufficient funds")]
    InsufficientFunds,
}