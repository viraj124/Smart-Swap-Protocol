const getWeb3 =  require("web3");
const web3 = require('web3');

const from = web3.currentProvider.selectedAddress;

const Network = require("@maticnetwork/meta/network");
const Matic = require("@maticnetwork/maticjs").default;
// const config = require("../../../");

const network = new Network("testnet", "v2");
const MaticNetwork = network.Matic;
const MainNetwork = network.Main;

const Ropsten_Erc20Address = '0xcb79C63a66A7122D9EDc6C6f6a65d4eb0F01A141';
// const Matic_Erc20Address = config.Matic_Erc20Address;

const from = '0x2a5c6E0Eb76915466C0CE771DCFb6f258a572336'; // from address

const matic = new Matic({
    maticProvider: this.web3,
    parentProvider: this.web3,
    rootChainAddress: config.ROOTCHAIN_ADDRESS,
    syncerUrl: config.SYNCER_URL,
    watcherUrl: config.WATCHER_URL,
});

async function init() {
  await matic.initialize();
  await matic.setWallet("5D54A08F0B78E9190B17D4191A00B825E81C644F9C7B71A8F9B693BECEBD0C85");
}

getWeb3().then((result) => {
    this.web3 = result;
  });

async function demoErc20() {
  await init();
  const amount = "1000000"; // amount in wei
  console.log("*****Deposit ERC20*****");

  let token = Ropsten_Erc20Address;

  matic
  .approveERC20TokensForDeposit(token, amount, {
from
})
.then(logs => console.log(logs.transactionHash))
  .then(() => {
    matic.depositERC20ForUser(token, from, amount, {
from
})
.then(logs => console.log(logs.transactionHash));
})
}

demoErc20();
