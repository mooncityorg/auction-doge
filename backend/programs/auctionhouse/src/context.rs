use crate::account::*;
use crate::utils::*;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{system_program, sysvar};
use anchor_spl::token::{Mint, TokenAccount};

#[derive(Accounts)]
#[instruction(
    bump: u8,
    title: String,
    floor: u64,
    increment: u64,
    start_time: u64,
    end_time: u64,
    bidder_cap: u64,
    token_amount: u64
)]
pub struct CreateOpenAuction<'info> {
    #[account(init,
        seeds=[b"open auction", owner.to_account_info().key.as_ref(), name_seed(&title)],
        bump = bump,
        payer = owner,
        space = OpenAuction::LEN +
        VECTOR_LENGTH_PREFIX + (bidder_cap as usize)*PUBLIC_KEY_LENGTH +
        VECTOR_LENGTH_PREFIX + (bidder_cap as usize)*U64_LENGTH)]
    pub auction: Account<'info, OpenAuction>,
    // #[account(mut)]
    pub auction_ata: AccountInfo<'info>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub owner_ata: AccountInfo<'info>,
    pub mint: Account<'info, Mint>,
    pub token_mint: Account<'info, Mint>,
    #[account(address = anchor_spl::token::ID)]
    pub token_program: AccountInfo<'info>,
    #[account(address = spl_associated_token_account::ID)]
    pub ata_program: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    #[account(address = sysvar::rent::ID)]
    pub rent_sysvar: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct CancelOpenAuction<'info> {
    #[account(mut, has_one = owner)]
    pub auction: Account<'info, OpenAuction>,
    pub owner: Signer<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct MakeOpenBid<'info> {
    #[account(mut, has_one = token_mint)]
    pub auction: Account<'info, OpenAuction>,
    pub auction_ata: AccountInfo<'info>,
    #[account(mut)]
    pub bidder: Signer<'info>,
    #[account(
        mut,
        constraint = bidder_ata.mint == *token_mint.to_account_info().key,
        constraint = bidder_ata.owner == *bidder.key,
    )]
    pub bidder_ata: Account<'info, TokenAccount>,

    pub token_mint: Account<'info, Mint>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    #[account(address = anchor_spl::token::ID)]
    pub token_program: AccountInfo<'info>,
    #[account(address = spl_associated_token_account::ID)]
    pub ata_program: AccountInfo<'info>,
    #[account(address = sysvar::rent::ID)]
    pub rent_sysvar: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ReclaimOpenBid<'info> {
    #[account(mut, has_one = token_mint)]
    pub auction: Account<'info, OpenAuction>,
    // #[account(
    //     mut,
    //     constraint = auction_ata.mint == *token_mint.to_account_info().key,
    // )]
    pub auction_ata: AccountInfo<'info>,
    #[account(mut)]
    pub bidder: Signer<'info>,
    #[account(
        mut,
        constraint = bidder_ata.mint == *token_mint.to_account_info().key,
        constraint = bidder_ata.owner == *bidder.key,
    )]
    pub bidder_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = treasury_wallet.key() == TREASURY_WALLET.parse::<Pubkey>().unwrap(),
    )]
    pub treasury_wallet: AccountInfo<'info>,

    pub token_mint: Account<'info, Mint>,
    #[account(address = anchor_spl::token::ID)]
    pub token_program: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct WithdrawItemOpen<'info> {
    #[account(mut, has_one = highest_bidder.key(), has_one = mint)]
    pub auction: Account<'info, OpenAuction>,
    #[account(
        mut,
        constraint = auction_ata.mint == *mint.to_account_info().key,
    )]
    pub auction_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub highest_bidder: Signer<'info>,
    // #[account(
    //     mut,
    //     constraint = highest_bidder_ata.mint == *mint.to_account_info().key,
    //     constraint = highest_bidder_ata.owner == *highest_bidder.key,
    // )]
    pub highest_bidder_ata: AccountInfo<'info>,
    pub mint: Account<'info, Mint>,
    #[account(address = anchor_spl::token::ID)]
    pub token_program: AccountInfo<'info>,
    #[account(address = spl_associated_token_account::ID)]
    pub ata_program: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    #[account(address = sysvar::rent::ID)]
    pub rent_sysvar: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct WithdrawWinningBidOpen<'info> {
    #[account(mut, has_one = owner, has_one = token_mint)]
    pub auction: Account<'info, OpenAuction>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        mut,
        constraint = auction_ata.mint == *token_mint.to_account_info().key,
    )]
    pub auction_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = owner_ata.mint == *token_mint.to_account_info().key,
        constraint = owner_ata.owner == *owner.key,
    )]
    pub owner_ata: Account<'info, TokenAccount>,

    pub token_mint: Account<'info, Mint>,
    #[account(address = anchor_spl::token::ID)]
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ReclaimItemOpen<'info> {
    #[account(mut, has_one = owner.key(), has_one = mint.key())]
    pub auction: Account<'info, OpenAuction>,
    #[account(
        mut,
        constraint = auction_ata.mint == *mint.to_account_info().key,
    )]
    pub auction_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        mut,
        constraint = owner_ata.mint == *mint.to_account_info().key,
        constraint = owner_ata.owner == *owner.key,
    )]
    pub owner_ata: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    #[account(address = anchor_spl::token::ID)]
    pub token_program: AccountInfo<'info>,
    #[account(address = spl_associated_token_account::ID)]
    pub ata_program: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    #[account(address = sysvar::rent::ID)]
    pub rent_sysvar: AccountInfo<'info>,
}
