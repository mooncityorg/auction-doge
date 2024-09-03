# Tomb-Auction
This is the auction project that users made their bids and the highest bidder(winner) will be receive the NFT.

## Install Dependencies
- Install `node` and `yarn`
- Install `ts-node` as global command
- Confirm the solana wallet preparation: `/home/fury/.config/solana/id.json` in test case

## Usage
- Main script source for all functionality is here: `/cli/script.ts`
- Program account types are declared here: `/cli/types.ts`
- Idl to make the JS binding easy is here: `/cli/raffle.json`

Able to test the script functions working in this way.
- Change commands properly in the main functions of the `script.ts` file to call the other functions
- Confirm the `ANCHOR_WALLET` environment variable of the `ts-node` script in `package.json`
- Run `yarn ts-node`

## Features

### - As the Creator of Auction
The NFTs will be stored in the auction address.
When the `admin` creates an auction, call the `create_open_auction` function, the NFT will be sent to the PDA and the data of this auction is stored on blockchain.
```js
pub fn create_open_auction(
        ctx: Context<CreateOpenAuction>,
        bump: u8,
        title: String,
        floor: u64,
        increment: u64,
        start_time: u64,
        end_time: u64,
        bidder_cap: u64,
        token_amount: u64,
        project_id: u16,
    )
```

The creator can reclaim NFT from the PDA if nobody buys tickets and the time exceeds the endTime of auction. 
```js
pub fn reclaim_item_open(ctx: Context<ReclaimItemOpen>)
```

The creator can withdraw the winning bid from the PDA.
```js
pub fn withdraw_winning_bid_open(ctx: Context<WithdrawWinningBidOpen>)
```

### - As the User of Auction
When users make a bid, they use this fucntion to bid.
```js
pub fn make_open_bid(ctx: Context<MakeOpenBid>, amount: u64)
```

When users are not winners, reclaim their bid from the PDA.
```js
pub fn reclaim_open_bid(ctx: Context<ReclaimOpenBid>)
```

### - As the Winner of Auction
Winners can receive the NFT from the PDA.
```js
pub fn withdraw_item_open(ctx: Context<WithdrawItemOpen>)
```
