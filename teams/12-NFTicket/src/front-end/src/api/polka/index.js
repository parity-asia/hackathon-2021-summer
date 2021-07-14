import { globalStore } from 'rekv';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { setSS58Format } from '@polkadot/util-crypto';
import { ContractPromise } from '@polkadot/api-contract';


import {
    TYPES,
    NODE_URL
} from '../../constants'
import meeting_abi from './offlinemeeting.json'

let api = null;
let initializing = false;

const ss58Format = 50;
const keyring = new Keyring({ type: 'sr25519', ss58Format });



export const initPolkadotApi = (cb) => {
    if (initializing) return;
    // set ss58Format
    initializing = true;
    setSS58Format(50);
    const wsProvider = new WsProvider(NODE_URL);
    const ws = new WebSocket(NODE_URL);

    ApiPromise.create({ provider: wsProvider, types: TYPES }).then((res) => {
        res.ws = ws;
        globalStore.setState({ api: res });
        api = res;
        console.log('api inited ......');
        if (cb) cb();
    });
};
// get timestamp
export const getTimestamp = async () => {
    const res = await api.query.timestamp.now();
    return res;
};
// get address balance
export const getBalance = async (address) => {
    const  { nonce, data: balance }= await api.query.system.account(address);
    // store.setState({ nonce, balance: balance.toHuman() });
    return balance.toHuman()
};
//监听余额的变化
export const regBalanceEvent = async (address,cb) => {
    const unsub = await api.query.system.account(address,({nonce,data:balance}) =>{
        if(cb) cb(balance.toHuman())
    });
}

export const regEvent= async () =>{
    // const unsub = await api.query.system.events((event) => {
    //     console.log(`Event: ${JSON.stringify(event)}`);
    //     console.log('event==========')
    // });

    // const lastHdr = await api.rpc.chain.getHeader();
    // const startHdr = await api.rpc.chain.getBlockHash(lastHdr.number.unwrap().subn(100));
    // const events = await api.query.system.events.range([startHdr]);
    // events.forEach((event) => {
    //     console.log(`Event1: ${JSON.stringify(event)}`);
    // });

    // const result= await api.query.system.account("5FTxYMDsAvjpVXA2rfjoeZeAuZq9yqYNnbVC4EnACutJ9tHH");
    // console.log(`result: ${JSON.stringify(result)}`);
    // console.log("xujie-----regEvent")
    // const name=await api.query.assets.metadata("5FTxYMDsAvjpVXA2rfjoeZeAuZq9yqYNnbVC4EnACutJ9tHH");
    // console.log(name);
    // console.log("xujie-----regEvent")
}

//线下合约address
const meeting_address = "64RWinXw26GE2cDPwStsDz96uRdwSwrg6EAex8BovXVEWqq4";
let meeting_contract;
//获取用户的NFT编号
export const getUserNftTicket = async (cb) =>{
    console.log("getUserNftTicket---start")
    const value = 0;
    const gasLimit = -1;//不限制gas
    const alicePair = keyring.addFromUri('//Alice');
    console.log("Alice pair-->" + JSON.stringify(alicePair.address))

    meeting_contract = new ContractPromise(api, meeting_abi, meeting_address);

    const { result, output } = await meeting_contract.query.getUserNftTicket(alicePair.address, { value, gasLimit });
    if (result.isOk) {
      // should output 123 as per our initial set (output here is an i32)
      console.log('Success', output.toHuman());
      console.log('success',result);
      if(cb) cb(output.toHuman())
    } else {
      console.error('Error', result.asErr);
    }
    
}


