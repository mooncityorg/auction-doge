import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cors from 'cors';

import { loadDump, saveDump } from './util'

const app = express();
const port = process.env.PORT || 8080;
// const index = fs.readFileSync('/home/solana-wallet-nft-track/public/test.html');
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

var corsOptions = {
  origin: 'http://localhost:8001',
  optionsSuccessStatus: 200 // For legacy browser support
}
app.use(cors(corsOptions));
// app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = http.createServer(app);

app.post('/registerAuctionInfo', async (req, res) => {
  try {
    var owner = req.body.owner as string;//req.body.cartId;
    var nft_mint = req.body.nft_mint as string;//req.body.cartId;
    var token_mint = req.body.token_mint as string;//req.body.cartId;
    var auctionTitle = req.body.auctionTitle as string;//req.body.cartId;
    var floor = parseInt(req.body.floor as string);//req.body.cartId;
    var increment = parseInt(req.body.increment as string);//req.body.cartId;
    var biddercap = parseInt(req.body.biddercap as string);//req.body.cartId;
    var startTime = req.body.startTime;//req.body.cartId;
    var endTime = req.body.endTime;//req.body.cartId;
    var amount = req.body.amount;//req.body.cartId;
    var auction_id = req.body.auction_id as string;//req.body.cartId;

    console.log(owner, nft_mint, token_mint, auctionTitle, floor, increment, biddercap, startTime, endTime, amount, auction_id);

    if (!owner || !nft_mint || !token_mint || !auctionTitle || !floor || !increment || !biddercap || !startTime || !endTime || !amount || !auction_id) {
      res.send(JSON.stringify(-1));
      return;
    }

    var dumpData = loadDump(`/dump.json`);

    if (!dumpData) dumpData = {};

    dumpData[auction_id] = {
      owner: owner,
      nft_mint: nft_mint,
      token_mint: token_mint,
      auctionTitle: auctionTitle,
      floor: floor,
      increment: increment,
      biddercap: biddercap,
      startTime: startTime,
      endTime: endTime,
      amount: amount,
      createdTime: new Date().getTime(),

    }

    saveDump(`/dump.json`, dumpData);
    console.log("return data success for registerAuctionInfo")
    res.send(JSON.stringify(0));
  } catch (err) {
    console.log(`error occured when register auction info: ${err}`);
    res.send(JSON.stringify(-100));
  }
});

app.post('/getAuctionInfo', async (req, res) => {
  try {
    var auction_id = req.body.auction_id as string;//req.body.cartId;

    // console.log(req);

    if (!auction_id) {
      res.send(JSON.stringify(-1));
      return;
    }
    var dumpData = loadDump(`/dump.json`);
    if (!dumpData || !dumpData[auction_id]) {
      res.send(JSON.stringify(0));
      return;
    }
    var result = {
      auction_id: auction_id,
      nft_mint: dumpData[auction_id].nft_mint,
      token_mint: dumpData[auction_id].token_mint,
      auctionTitle: dumpData[auction_id].auctionTitle,
      floor: dumpData[auction_id].floor,
      increment: dumpData[auction_id].increment,
      biddercap: dumpData[auction_id].biddercap,
      startTime: dumpData[auction_id].startTime,
      endTime: dumpData[auction_id].endTime,
      amount: dumpData[auction_id].amount,
    }
    console.log(result, "return data for getAuctionInfo")
    res.send(JSON.stringify(result));
  } catch (err) {
    console.log(`error occured when responsing for get auction info: ${err}`);
    res.send(JSON.stringify(-100));
  }
});

app.post('/getAllAuctionInfos', async (req, res) => {
  try {

    var dumpData = loadDump(`/dump.json`);

    if (!dumpData || dumpData.length === 0) {

      res.send(JSON.stringify([]));
      return;
    }
    var dumpArray: any[] = [];
    for (let item in dumpData) {

      let temp = dumpData[item];
      temp['auction_id'] = item;
      dumpArray.push(temp);
    }

    console.log("data returned for getAllAuctionInfos")
    res.send(JSON.stringify(dumpArray));
  } catch (err) {
    console.log(`error occured for getting all auction infos: ${err}`);
    res.send(JSON.stringify(-100));
  }
});

server.listen(port, () => {
  console.log(`server is listening on ${port}`);
  return;
});