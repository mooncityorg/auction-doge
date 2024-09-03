import { Program, web3 } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import {
    Keypair,
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Transaction,
    ParsedAccountData,
    TransactionInstruction,
    sendAndConfirmTransaction
} from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID, AccountLayout, MintLayout, ASSOCIATED_TOKEN_PROGRAM_ID, u64 } from "@solana/spl-token";

import * as fs from 'fs';
import { OpenAuction } from './types';

const PROGRAM_ID = "5JNnRQLNjzW21tJTPT6PaLnqiYN3d9jvtcCvHCfkoXuU";
const TREASURY_WALLET = new PublicKey("32NL69SFk8GLPFZfKQwsuexcXHd7rqAQn1mrasF1ksVj");
const DECIMALS = 100;

anchor.setProvider(anchor.Provider.local(web3.clusterApiUrl('devnet')));
const solConnection = anchor.getProvider().connection;
const payer = anchor.getProvider().wallet;
console.log("Payer:  ", payer.publicKey.toBase58());

const idl = JSON.parse(
    fs.readFileSync(__dirname + "/auctionhouse.json", "utf8")
);

let program: Program = null;

// Address of the deployed program.
const programId = new anchor.web3.PublicKey(PROGRAM_ID);

// Generate the program client from IDL.
program = new anchor.Program(idl, programId);
console.log('ProgramId: ', program.programId.toBase58());


const main = async () => {
    // let address = await getAuctionKey(new PublicKey('GF4XmpVKCf9aozU5igmr9sKNzDBkjvmiWujx8uC7Bnp4'), 5);
    // console.log(address.toBase58());
    // let state = await getOpenAuctionState(address);
    // console.log(state.endTime.toNumber());
    // console.log(state.title.toString());
    await CreateOpenAuction(payer.publicKey, new PublicKey('Fp7WgqJpzBcRyMJP1i9aoSiwhAr8ZtzVSorz4YbZusAL'), new PublicKey('DjHSPVtttbj25BTNmPVvjG9Tnm5F4Wm9arGtrmaYKM6N'), 'My Ff Auction', 10, 1, 5, 0, 1650950713, 1, 1);
    // await CancelOpenAuction(payer.publicKey, address);
    // await MakeOpenBid(payer.publicKey, address, 11);
    // await ReclaimItemOpen(payer.publicKey, address);
    // console.log(state.endTime.toNumber());
}

export const CreateOpenAuction = async (
    owner: PublicKey,
    nft_mint: PublicKey,
    token_mint: PublicKey,
    auctionTitle: String,
    floor: number,
    increment: number,
    biddercap: number,
    startTime: number,
    endTime: number,
    amount: number,
    project_id: number,
) => {

    const [auctionAddress, bump] = await PublicKey.findProgramAddress(
        [Buffer.from("open auction"), owner.toBytes(), Buffer.from(auctionTitle.slice(0, 32))],
        program.programId
    );

    let auctionAta = await getAssociatedTokenAccount(auctionAddress, nft_mint);
    let ownerAta = await getAssociatedTokenAccount(owner, nft_mint);

    let DECIMALS = await getDecimals(owner, token_mint);

    console.log(auctionAddress.toBase58(), "auctionAddress");
    console.log(auctionAta.toBase58(), "auctionAta");
    console.log(owner.toBase58(), "owner");
    console.log(ownerAta.toBase58(), "ownerAta");
    console.log(nft_mint.toBase58(), "nft_mint");
    console.log(token_mint.toBase58(), "token_mint");
    console.log(TOKEN_PROGRAM_ID.toBase58(), "TOKEN_PROGRAM_ID");
    console.log(ASSOCIATED_TOKEN_PROGRAM_ID.toBase58(), "ASSOCIATED_TOKEN_PROGRAM_ID");
    console.log(SYSVAR_RENT_PUBKEY.toBase58(), "SYSVAR_RENT_PUBKEY");


    const tx = await program.rpc.createOpenAuction(new anchor.BN(bump),
        auctionTitle,
        new anchor.BN(floor * DECIMALS),
        new anchor.BN(increment * DECIMALS),
        new anchor.BN(startTime),
        new anchor.BN(endTime),
        new anchor.BN(biddercap),
        new anchor.BN(amount),
        new anchor.BN(project_id), {
        accounts: {
            auction: auctionAddress,
            auctionAta: auctionAta,
            owner,
            ownerAta,
            mint: nft_mint,
            tokenMint: token_mint,
            tokenProgram: TOKEN_PROGRAM_ID,
            ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rentSysvar: SYSVAR_RENT_PUBKEY,
        },
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);

}

export const CancelOpenAuction = async (
    owner: PublicKey,
    auctionAddress: PublicKey
) => {
    const tx = await program.rpc.cancelOpenAuction({
        accounts: {
            auction: auctionAddress,
            owner,
            systemProgram: SystemProgram.programId,
        },
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);
}

export const MakeOpenBid = async (
    bidder: PublicKey,
    auctionAddress: PublicKey,
    amount: number
) => {
    let auctionState = await getOpenAuctionState(auctionAddress);
    let token_mint = auctionState.tokenMint;
    let DECIMALS = await getDecimals(bidder, token_mint);

    let auctionAta = await getAssociatedTokenAccount(auctionAddress, token_mint);
    let bidderAta = await getAssociatedTokenAccount(bidder, token_mint);

    const tx = await program.rpc.makeOpenBid(
        new anchor.BN(amount * DECIMALS), {
        accounts: {
            auction: auctionAddress,
            auctionAta: auctionAta,
            bidder,
            bidderAta,
            tokenMint: token_mint,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            rentSysvar: SYSVAR_RENT_PUBKEY,
        },
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);
}

export const ReclaimOpenBid = async (
    bidder: PublicKey,
    auctionAddress: PublicKey,
) => {
    let auctionState = await getOpenAuctionState(auctionAddress);
    let token_mint = auctionState.tokenMint;
    let auctionAta = await getAssociatedTokenAccount(auctionAddress, token_mint);
    let bidderAta = await getAssociatedTokenAccount(bidder, token_mint);

    const tx = await program.rpc.reclaimOpenBid({
        accounts: {
            auction: auctionAddress,
            auctionAta: auctionAta,
            bidder,
            bidderAta,
            treasuryWallet: TREASURY_WALLET,
            tokenMint: token_mint,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
        },
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);
}

export const WithdrawItemOpen = async (
    winner: PublicKey,
    auctionAddress: PublicKey,
) => {
    let auctionState = await getOpenAuctionState(auctionAddress);
    let nft_mint = auctionState.mint;
    let auctionAta = await getAssociatedTokenAccount(auctionAddress, nft_mint);
    let winnerAta = await getAssociatedTokenAccount(winner, nft_mint);

    const tx = await program.rpc.withdrawItemOpen({
        accounts: {
            auction: auctionAddress,
            auctionAta: auctionAta,
            highestBidder: winner,
            highestBidderAta: winnerAta,
            mint: nft_mint,
            tokenProgram: TOKEN_PROGRAM_ID,
            ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rentSysvar: SYSVAR_RENT_PUBKEY,
        },
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);
}

export const WithdrawWinningBidOpen = async (
    owner: PublicKey,
    auctionAddress: PublicKey,
) => {
    let auctionState = await getOpenAuctionState(auctionAddress);
    let token_mint = auctionState.tokenMint;
    let auctionAta = await getAssociatedTokenAccount(auctionAddress, token_mint);
    let ownerAta = await getAssociatedTokenAccount(owner, token_mint);

    const tx = await program.rpc.withdrawWinningBidOpen({
        accounts: {
            auction: auctionAddress,
            owner,
            auctionAta,
            ownerAta,
            tokenMint: token_mint,
            tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);
}

export const ReclaimItemOpen = async (
    owner: PublicKey,
    auctionAddress: PublicKey,
) => {
    let auctionState = await getOpenAuctionState(auctionAddress);
    let nft_mint = auctionState.mint;
    let auctionAta = await getAssociatedTokenAccount(auctionAddress, nft_mint);
    let ownerAta = await getAssociatedTokenAccount(owner, nft_mint);

    console.log(owner.toBase58());
    console.log(ownerAta.toBase58());
    console.log(auctionAddress.toBase58());
    console.log(auctionAta.toBase58());


    const tx = await program.rpc.reclaimItemOpen({
        accounts: {
            auction: auctionAddress,
            auctionAta,
            owner,
            ownerAta,
            mint: nft_mint,
            tokenProgram: TOKEN_PROGRAM_ID,
            ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rentSysvar: SYSVAR_RENT_PUBKEY,
        },
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);
}


export const getAuctionKey = async (
    nft_mint: PublicKey,
    bidderCap: number
): Promise<PublicKey | null> => {
    let poolAccounts = await solConnection.getParsedProgramAccounts(
        program.programId,
        {
            filters: [
                {
                    dataSize: 400 + 8 + 40 * bidderCap
                },
                {
                    memcmp: {
                        "offset": 40,
                        "bytes": nft_mint.toBase58()
                    }
                }
            ]
        }
    );

    if (poolAccounts.length !== 0) {
        let rentalKey = poolAccounts[0].pubkey;
        return rentalKey;
    } else {
        return null;
    }
}

export const getOpenAuctionState = async (
    auctionAddress: PublicKey
): Promise<OpenAuction | null> => {
    try {
        let auctionState = await program.account.openAuction.fetch(auctionAddress);
        return auctionState as OpenAuction;
    } catch {
        return null;
    }
}

export const getDecimals = async (owner: PublicKey, tokenMint: PublicKey): Promise<number | null> => {
    try {
        let ownerTokenAccount = await getAssociatedTokenAccount(owner, tokenMint);
        const tokenAccount = await solConnection.getParsedAccountInfo(ownerTokenAccount);
        let decimal = (tokenAccount.value?.data as ParsedAccountData).parsed.info.tokenAmount.decimals;
        let DECIMALS = Math.pow(10, decimal);
        return DECIMALS;
    } catch {
        return null;
    }
}

const getAssociatedTokenAccount = async (ownerPubkey: PublicKey, mintPk: PublicKey): Promise<PublicKey> => {
    let associatedTokenAccountPubkey = (await PublicKey.findProgramAddress(
        [
            ownerPubkey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            mintPk.toBuffer(), // mint address
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    ))[0];
    return associatedTokenAccountPubkey;
}

export const getATokenAccountsNeedCreate = async (
    connection: anchor.web3.Connection,
    walletAddress: anchor.web3.PublicKey,
    owner: anchor.web3.PublicKey,
    nfts: anchor.web3.PublicKey[],
) => {
    let instructions = [], destinationAccounts = [];
    for (const mint of nfts) {
        const destinationPubkey = await getAssociatedTokenAccount(owner, mint);
        let response = await connection.getAccountInfo(destinationPubkey);
        if (!response) {
            const createATAIx = createAssociatedTokenAccountInstruction(
                destinationPubkey,
                walletAddress,
                owner,
                mint,
            );
            instructions.push(createATAIx);
        }
        destinationAccounts.push(destinationPubkey);
        if (walletAddress != owner) {
            const userAccount = await getAssociatedTokenAccount(walletAddress, mint);
            response = await connection.getAccountInfo(userAccount);
            if (!response) {
                const createATAIx = createAssociatedTokenAccountInstruction(
                    userAccount,
                    walletAddress,
                    walletAddress,
                    mint,
                );
                instructions.push(createATAIx);
            }
        }
    }
    return {
        instructions,
        destinationAccounts,
    };
}

export const createAssociatedTokenAccountInstruction = (
    associatedTokenAddress: anchor.web3.PublicKey,
    payer: anchor.web3.PublicKey,
    walletAddress: anchor.web3.PublicKey,
    splTokenMintAddress: anchor.web3.PublicKey
) => {
    const keys = [
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
        { pubkey: walletAddress, isSigner: false, isWritable: false },
        { pubkey: splTokenMintAddress, isSigner: false, isWritable: false },
        {
            pubkey: anchor.web3.SystemProgram.programId,
            isSigner: false,
            isWritable: false,
        },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        {
            pubkey: anchor.web3.SYSVAR_RENT_PUBKEY,
            isSigner: false,
            isWritable: false,
        },
    ];
    return new anchor.web3.TransactionInstruction({
        keys,
        programId: ASSOCIATED_TOKEN_PROGRAM_ID,
        data: Buffer.from([]),
    });
}


main()