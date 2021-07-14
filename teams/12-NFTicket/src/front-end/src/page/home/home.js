import React, { Component, button } from 'react';
import { ListView, Modal } from 'antd-mobile';
// import { Link, Element, Events, animateScroll as scroll, scrollSpy, scroller } from 'react-scroll'

import { connect } from 'react-redux';
import { bindActionCreators } from "redux";

//action
import {
  setTokenAction, setUsernameAction, setBottomstatusAction,
  setShowmodalAction, setShowmodaltwoAction, setAccountokmodalAction, setShowalertAction
} from '../../store/action/App';


import './home.css';
import TopBar from '../../component/TopBar';

import CreateWalletOne from '../../component/CreateWalletOne';
import CreateWalletTwo from '../../component/CreateWalletTwo';
import CreateWalletOK from '../../component/CreateWalletOK';
import NAlert from '../../component/Alert';


//polkadot
import { ApiPromise, WsProvider } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';

//合约abi
import tem_abi from './temmetadata.json'
import main_abi from './mainmetadata.json'
import { stringToU8a, u8aToHex } from '@polkadot/util';
import { Keyring } from '@polkadot/keyring'
import { mnemonicGenerate, blake2AsHex } from '@polkadot/util-crypto';

const keyring = new Keyring({ type: 'sr25519', ss58Format: 2 });
const message = stringToU8a('this is a message');

//模板合约abi
//const tem_abi = tem_abi;
//模板合约address
const tem_address = "61oncFjVSx8UP9MjT6qKzw1DmpQDcR79MGojqdcAUpWEra2Y";
let tem_contract;

//主合约abi
//const main_abi = main_abi;
//主合约address
const main_address = "629eniaUzqNLN1okBrmEbEpFY7TqzWcgi9ggquZRtVX6o1b3"
let main_contract;


const NUM_ROWS = 20;
let pageIndex = 0;

function genData(pIndex = 0) {
  const dataBlob = {};
  for (let i = 0; i < NUM_ROWS; i++) {
    const ii = (pIndex * NUM_ROWS) + i;
    dataBlob[`${ii}`] = `row - ${ii}`;
  }
  console.log("长度:",dataBlob)
  return dataBlob;
}

class Home extends Component {

  constructor(props) {
    super(props);
    const dataSource = new ListView.DataSource({
      rowHasChanged: (row1, row2) => row1 !== row2,
    });
    this.state = {
      words: [
        "minor",
        "nasty",
        "wasp",
        "major",
        "pumpkin",
        "lounge",
        "door",
        "blade",
        "trip",
        "value",
        "render",
        "cook"
      ],
      dataSource,
      isLoading: true,
      showToast: false,
      genesisHash: ''//polkadot
    };

  };

  async componentDidMount() {
    console.log("DidMount");
    const tokendata = "mytoken";
    //actions
    this.props.actions.setToken(tokendata);
    //actions  显示底部状态栏
    this.props.actions.setBottomstatus(false);

    //调用NFTMart区块链测试网
    const provider = new WsProvider('wss://test-chain.bcdata.top');
    const types = {
      Properties: 'u8',
      NFTMetadata: 'Vec<u8>',
      BlockNumber: 'u32',
      BlockNumberOf: 'BlockNumber',
      BlockNumberFor: 'BlockNumber',
      GlobalId: 'u64',
      CurrencyId: 'u32',
      CurrencyIdOf: 'CurrencyId',
      Amount: 'i128',
      AmountOf: 'Amount',
      CategoryId: 'u32',
      CategoryIdOf: 'CategoryId',
      ClassId: 'u32',
      ClassIdOf: 'ClassId',
      TokenId: 'u64',
      TokenIdOf: 'TokenId',

      OrmlAccountData: {
        free: 'Balance',
        reserved: 'Balance',
        frozen: 'Balance',
      },

      OrmlBalanceLock: {
        amount: 'Balance',
        id: 'LockIdentifier'
      },

      ClassInfoOf: {
        metadata: 'NFTMetadata',
        totalIssuance: 'Compact<TokenId>',
        owner: 'AccountId',
        data: 'ClassData'
      },

      ClassData: {
        deposit: 'Compact<Balance>',
        properties: 'Properties',
        name: 'Vec<u8>',
        description: 'Vec<u8>',
        createBlock: 'Compact<BlockNumberOf>'
      },

      TokenInfoOf: {
        metadata: 'NFTMetadata',
        data: 'TokenData',
        quantity: 'Compact<TokenId>',
      },

      TokenData: {
        deposit: 'Compact<Balance>',
        createBlock: 'Compact<BlockNumberOf>',
        royalty: 'bool',
        creator: 'AccountId',
        royalty_beneficiary: 'AccountId',
      },

      AccountToken: {
        quantity: 'Compact<TokenId>',
        reserved: 'Compact<TokenId>',
      },

      CategoryData: {
        metadata: 'NFTMetadata',
        nftCount: 'Compact<Balance>'
      },

      OrderItem: {
        classId: 'Compact<ClassId>',
        tokenId: 'Compact<TokenId>',
        quantity: 'Compact<TokenId>',
      },

      OrderOf: {
        currencyId: 'Compact<CurrencyId>',
        deposit: 'Compact<Balance>',
        price: 'Compact<Balance>',
        deadline: 'Compact<BlockNumberOf>',
        categoryId: 'Compact<CategoryId>',
        items: 'Vec<OrderItem>',
      },

      OfferOf: {
        currencyId: 'Compact<CurrencyId>',
        price: 'Compact<Balance>',
        deadline: 'Compact<BlockNumberOf>',
        categoryId: 'Compact<CategoryId>',
        items: 'Vec<OrderItem>',
      },
    };
    const api = await ApiPromise.create({ provider, types });
    const [chain, nodeName, nodeVersion] = await Promise.all([
      api.rpc.system.chain(),
      api.rpc.system.name(),
      api.rpc.system.version()
    ]);

    console.log(`You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`);
    if (api != null) {
      tem_contract = new ContractPromise(api, tem_abi, tem_address);
      main_contract = new ContractPromise(api, main_abi, main_address);

      //获取链上会议列表
      await this.getAllMeeting(api)
      //测试模板合约创建会议
      await this.getTem_Contract(api)
      //测试购票
      await this.addTemplate(api)
    }
  }

  async getTem_Contract(api) {
    //合约
    this.setState({ genesisHash: api.genesisHash.toHex() });
    const alice_address = "65ADzWZUAKXQGZVhQ7ebqRdqEzMEftKytB8a7rknW82EASXB";

    if (localStorage.hasOwnProperty('nft-pair')) {

      const alicePair = keyring.addFromUri('//Alice');
      console.log("Alice pair-->" + JSON.stringify(alicePair.address))
      let value = 0;
      let gasLimit = -1;//不限制gas

      //OK Template合约--(getController)/不需要携带参数用（query）
      // const { gasConsumed, result, output }  = await tem_contract.query
      //     .getController(alicePair.address,{value,gasLimit})
      // console.log(result.toHuman());
      // console.log(output.toHuman());

      //OK Template合约--(setController)/toaddress--要设置的新的地址,携带参数（tx）
      // const toaddress = 'DdYfnXdfpwCmNmNsLZmHGXGKi3GDbET1yUZx9qFcGiwVSNu';
      // await tem_contract.tx
      // .setController({ value, gasLimit }, toaddress)
      // .signAndSend(alicePair, (result) => {
      //   if (result.status.isInBlock) {
      //     console.log('正在提交到链上');
      //   } else if (result.status.isFinalized) {
      //     console.log('交易确认');
      //     console.log(result.toHuman())
      //   }
      // });

      //OK Template合约--(createMeeting)/
      // (name: Vec<u8>, 
      // desc: Vec<u8>, 
      // poster: Vec<u8>, 
      // uri: Vec<u8>, 
      // startTime: u64, 
      // endTime: u64, 
      // startSaleTime: u64, 
      // endSaleTime: u64, 
      // templateIndexName: Vec<u8>),携带参数（tx）
      // const name = '1';
      // const desc = '1';
      // const poster = '1';
      // const uri = '1';
      // const startTime = 1625910132;
      // const endTime = 1628588532;
      // const startSaleTime = 1625910132;
      // const endSaleTime = 1628588532;
      // const templateIndexName = '1';
      // value = 3000n * 1000000n;
      // gasLimit=3000n * 1000000n;
      // await tem_contract.tx.createMeeting(
      //   { value, gasLimit }, name, desc, poster, uri, startTime, endTime, startSaleTime, endSaleTime, templateIndexName
      // )
      //   .signAndSend(alicePair, (result) => {
      //     if (result.status.isInBlock) {
      //       console.log('正在提交到链上');
      //     } else if (result.status.isFinalized) {
      //       console.log('交易确认');
      //       console.log(result.toHuman())
      //     }
      //   });


    // }
      // const name = '第一个活动';
      // const desc = '第一个活动的描述';
      // const poster = '第一个创建人';
      // const uri = 'www.baidu.com';
      // const startTime = 1625910132;
      // const endTime = 1628588532;
      // const startSaleTime = 1625910132;
      // const endSaleTime = 1628588532;
      // //线下会议hash(必须32字节)0xa14ad4f877a7f110ef03bb1ed0c5dc4324ede59ec204000bceb65c1efe7c2903
      // const meetCodeHash = '0xa14ad4f877a7f110ef03bb1ed0c5dc4324ede59ec204000bceb65c1efe7c2903';
      // //主合约地址:6555P4ummgGtrsjrR2UL6oHWUaWQ7jC7pV2HZEXbnF3F89WQ
      // const mainAddress = '6555P4ummgGtrsjrR2UL6oHWUaWQ7jC7pV2HZEXbnF3F89WQ';
      // const mainStubAble = u8aToHex(keyring.decodeAddress(mainAddress));
      // console.log("decodeAddress--"+mainStubAble+"///"+JSON.stringify(api.query.assets));
      // value = 100n;
      // gasLimit=3000n * 1000000n;
      // await tem_contract.tx.createMeeting(
      //  { value, gasLimit },name,desc,poster,uri,startTime,endTime,startSaleTime,endSaleTime,meetCodeHash,mainStubAble
      // )
      // .signAndSend(alicePair, (result) => {
      //   if (result.status.isInBlock) {
      //     console.log('正在提交到链上');
      //   } else if (result.status.isFinalized) {
      //     console.log('交易确认');
      //     console.log(result.toHuman())
      //   }
      // });


      //主合约调用
      {
        //OK Main合约--(addMeeting)(
        //   meetingAddr: AccountId, 
        // creator: AccountId, 
        // name: Vec<u8>, 
        // desc: Vec<u8>, 
        // poster: Vec<u8>, 
        // uri: Vec<u8>, 
        // startTime: u64, 
        // endTime: u64, 
        // startSaleTime: u64, 
        // endSaleTime: u64)
        // /携带参数（tx）
        // const meetingAddr = alicePair.address;
        // const creator = alicePair.address;
        // const name = '第一个活动';
        // const desc = '第一个活动的描述';
        // const poster = '第一个创建人';
        // const uri = 'www.baidu.com';
        // const startTime = 1625910132;
        // const endTime = 1628588532;
        // const startSaleTime = 1625910132;
        // const endSaleTime = 1628588532;
        // //主合约abi
        // //const main_abi = main_abi;
        // //主合约地址:6555P4ummgGtrsjrR2UL6oHWUaWQ7jC7pV2HZEXbnF3F89WQ
        // const main_address = '629eniaUzqNLN1okBrmEbEpFY7TqzWcgi9ggquZRtVX6o1b3';
        // const main_contract = new ContractPromise(api,main_abi,main_address);
        // await main_contract.tx
        // .addMeeting({ value, gasLimit }, meetingAddr,
        //   creator,
        //   name,
        //   desc,
        //   poster,
        //   uri,
        //   startTime,
        //   endTime,
        //   startSaleTime,
        //   endSaleTime )
        // .signAndSend(alicePair, (result) => {
        //   if (result.status.isInBlock) {
        //     console.log('主合约addMeeting--正在提交到链上');
        //   } else if (result.status.isFinalized) {
        //     console.log('主合约addMeeting--交易确认');
        //     console.log(result.toHuman())
        //   }
        // });
      }
    }  

  }
  /**
   * 获取所有的会议
   */
  async getAllMeeting(api) {
    console.log("getAllMeeting---start")
    const value = 0;
    const gasLimit = -1;//不限制gas
    const alicePair = keyring.addFromUri('//Alice');
    console.log("Alice pair-->" + JSON.stringify(alicePair.address))

    const { result, output } = await main_contract.query.getAllMeeting(alicePair.address, { value, gasLimit });
    if (result.isOk) {
      // should output 123 as per our initial set (output here is an i32)
      console.log('Success', output.toHuman());
      setTimeout(() => {
        this.rData = output.toHuman();
        this.setState({
          dataSource: this.state.dataSource.cloneWithRows(this.rData),
          isLoading: false,
        });
      }, 200);
    } else {
      console.error('Error', result.asErr);
    }
  }

  async buyTicket(api){
    //buyTicket (creator: AccountId, ticket: Ticket)
    console.log("购票-->")
    const value = 0;
    const gasLimit = -1;
    const alicePair = keyring.addFromUri('//Alice');
    const bobPair = keyring.addFromUri('//BOB');
    const ticket = {
      template_addr:tem_address,
      meeting:tem_address,
      hash:'1',
      price:0,
      zone_id:0,
      seat_id:(0,0),
      ticket_id:0,
      buyer:bobPair.address
    };
    await main_contract.tx
        .buyTicket({ value, gasLimit }, tem_address,
          ticket )
        .signAndSend(alicePair, (result) => {
          if (result.status.isInBlock) {
            console.log('购票--正在提交到链上');
          } else if (result.status.isFinalized) {
            console.log('购票--交易确认');
            console.log(result.toHuman())
          }
        });
  }

  //addTemplate (templateAddr: AccountId, name: Vec<u8>, desc: Vec<u8>, uri: Vec<u8>, ratio: u128)
  async addTemplate(api){
    console.log("添加模板-->")
    const value = 0;
    const gasLimit = -1;
    const alicePair = keyring.addFromUri('//Alice');
    const name='1';
    const desc='1';
    const uri = '1';
    const ratio=1;
    await main_contract.tx
        .addTemplate({ value, gasLimit }, tem_address,
          name,
          desc,
          uri,
          ratio )
        .signAndSend(alicePair, (result) => {
          if (result.status.isInBlock) {
            console.log('添加--正在提交到链上');
          } else if (result.status.isFinalized) {
            console.log('添加--交易确认');
            console.log(result.toHuman())
          }
        });
  }

  componentWillUnmount() {
    this.props.actions.setShowModal(false);
    this.props.actions.setShowModalTwo(false);
    this.props.actions.setAccountOKModal(false);
  }

  onEndReached = (event) => {
    // load new data
    // hasMore: from backend data, indicates whether it is the last page, here is false
    if (this.state.isLoading && !this.state.hasMore) {
      return;
    }
    console.log('reach end', document.documentElement.clientHeight);
    this.setState({ isLoading: true });
    setTimeout(() => {
      this.rData = { ...this.rData, ...genData(++pageIndex) };
      this.setState({
        dataSource: this.state.dataSource.cloneWithRows(this.rData),
        isLoading: false,
      });
    }, 1000);
  }

  render = () => {
    const separator = (sectionID, rowID) => (
      <div
        key={`${sectionID}-${rowID}`}
        style={{
          height: 0
        }}
      />
    );
 
  
    const row = (rowData, sectionID, rowID) => {

      const imageHeight = window.innerWidth - 30 - 30;
      // var data= JSON.stringify(rowData)
      // var path=`/Home/activityDetail/${data}`
      var path={
         pathname:'/Home/activityDetail',
         state:rowData
      }
      return (
        <div key={rowID} className='card-content'
          style={{
            backgroundImage: "url('./images/cardimg.png')",
            backgroundRepeat: 'no-repeat',
            height: '' + imageHeight + 'px',
          }} onClick={() => this.props.history.push(path)}>
          <div className="top-container">
            <div className='top-name' style={{
              borderRadius: '50px', width: '50px', height: '50px',
              backgroundColor: "#ffffff",
              display: 'flex'
            }}>
              <span className="top-text">B</span>
            </div>
            <div className='top-time-group'>
              <div className='top-time-1'>12</div>
              <div className='top-time-2'>Nav</div>
            </div>
          </div>
          <div className='bottom-container'>
            <div>
              <div style={{ marginBottom: '8px', textShadow: '#fff 1px 0 0,#fff 0 1px 0,#fff -1px 0 0,#fff 0 -1px 0' }}>{rowData.desc}</div>
              <div style={{ marginBottom: '8px', fontSize: '24px', fontWeight: 'bold', textShadow: '#fff 1.2px 0 0,#fff 0 1.2px 0,#fff -1.2px 0 0,#fff 0 -1.2px 0' }}>{rowData.name}</div>
              <div style={{ display: 'flex' }}><div><img style={{ margin: '0px 5px 5px 0px', width: '15px', height: '15px' }} src='./images/location.png'></img></div><span style={{ textShadow: '#fff 1px 0 0,#fff 0 1px 0,#fff -1px 0 0,#fff 0 -1px 0' }}>{rowData.meeting_addr}</span></div>
              <div style={{ display: 'flex' }}><div><img style={{ margin: '0px 5px 5px 0px', width: '15px', height: '15px' }} src='./images/time.png'></img></div><span style={{ textShadow: '#fff 1px 0 0,#fff 0 1px 0,#fff -1px 0 0,#fff 0 -1px 0' }}>{rowData.start_time}</span></div>
            </div>
          </div>
        </div>
      );
    };

    //搜索框高度
    const searchbarHeight = 25;
    //空白区域高度
    const whitespaceHeight = 9;
    //账户信息高度
    const accountInfoHeight = 42;
    //底部Tab高度
    const tabbarHeight = 46;

    const height = parseInt(window.innerHeight) - searchbarHeight - whitespaceHeight - accountInfoHeight - 2 * tabbarHeight + 26;
    return (
      <div className="content" style={{ position: "absolute" }}>
        <TopBar></TopBar>
        <div>
          <ListView
            ref={el => this.lv = el}
            dataSource={this.state.dataSource}
            renderHeader={() => { console.log("card-height=" + window.innerHeight + "///" + document.documentElement.clientHeight) }}
            renderFooter={() => (<div style={{ padding: 30, textAlign: 'center' }}>
              {this.state.isLoading ? 'Loading...' : 'Loaded'}
            </div>)}
            renderRow={row}
            renderSeparator={separator}
            className=""
            pageSize={4}
            useBodyScroll
            onScroll={() => { console.log('scroll'); }}
            scrollRenderAheadDistance={500}
            onEndReached={this.onEndReached}
            onEndReachedThreshold={10}
            style={{ height: '' + height + 'px', overflow: 'auto' }}
          />
        </div>

        <div className={this.props.app.showmodal ? 'showmodal' : 'hidemodal'}
          style={{ height: "" + window.innerHeight + "px" }}>
          {/* 生成钱包助记词---弹窗 */}
          <CreateWalletOne words={this.state.words}></CreateWalletOne>
        </div>

        <div className={this.props.app.showmodaltwo ? 'showmodaltwo' : 'hidemodaltwo'}
          style={{ height: "" + window.innerHeight + "px" }}>
          {/* 输入钱包助记词---弹窗 */}
          <CreateWalletTwo ></CreateWalletTwo>
        </div>

        <div className={this.props.app.showaccountok ? 'showaccountokmodal' : 'hideaccountokmodal'}
          style={{ height: "" + window.innerHeight + "px" }}>
          {/* 输入钱包助记词---弹窗 */}
          <CreateWalletOK ></CreateWalletOK>
        </div>

        <div className={this.props.app.showalert ? 'showalertmodal' : 'hidealertmodal'}
          style={{ height: "" + window.innerHeight + "px" }}>
          <NAlert msg="助记词顺序有问题"></NAlert>
        </div>
      </div>
    );
  }
}

//获取最新的store里的状态，通过this.props获取
const mapStateToProps = (state) => {
  return {
    app: state.app
  }
}
//更新状态提交到store
const mapDispatchToProps = (dispatch) => {
  return {
    actions: bindActionCreators({
      setToken: setTokenAction,
      setUsername: setUsernameAction,
      setBottomstatus: setBottomstatusAction,
      setShowModal: setShowmodalAction,
      setShowModalTwo: setShowmodaltwoAction,
      setAccountOKModal: setAccountokmodalAction
    }, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Home);
