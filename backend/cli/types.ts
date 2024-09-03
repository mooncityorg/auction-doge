import * as anchor from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

export interface OpenAuction {
    owner: PublicKey,
    mint: PublicKey,
    tokenMint: PublicKey,
    tokenAmount: anchor.BN,

    startTime: anchor.BN,
    endTime: anchor.BN,
    cancelled: Boolean,

    title: String,

    bidderCap: anchor.BN,
    bidders: PublicKey[],
    bids: anchor.BN[],

    highestBidder: PublicKey,
    highestBid: anchor.BN,

    bidFloor: anchor.BN,
    minBidIncrement: anchor.BN,

    bump: anchor.BN,
    projectId: anchor.BN,
}

export interface SealedAuction {
    firstPrice: Boolean,

    owner: PublicKey,
    mint: PublicKey,
    tokenAmount: anchor.BN,

    startTime: anchor.BN,
    endTime: anchor.BN,
    revealPeriod: anchor.BN,
    cancelled: Boolean,

    title: String,

    bidderCap: anchor.BN,
    bidders: PublicKey[],
    sealedBids: Uint8Array[],

    fakeBids: anchor.BN[],

    highestBidder: PublicKey,
    highestBid: anchor.BN,
    secondHighestBid: anchor.BN,

    bidFloor: anchor.BN,
    winningBidWithdrawn: Boolean,

    bump: anchor.BN
}