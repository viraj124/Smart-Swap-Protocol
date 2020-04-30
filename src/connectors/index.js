import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { WalletLinkConnector } from '@web3-react/walletlink-connector'
import { PortisConnector } from '@web3-react/portis-connector'
import { TorusConnector } from '@web3-react/torus-connector'

import { NetworkConnector } from './Network'
import { FortmaticConnector } from './Fortmatic'

const POLLING_INTERVAL = 10000
const NETWORK_URL = "https://testnet2.matic.network"
  // process.env.REACT_APP_IS_PRODUCTION_DEPLOY === 'true'
  //   ? process.env.REACT_APP_NETWORK_URL_PROD
  //   : process.env.REACT_APP_NETWORK_URL

export const network = new NetworkConnector({
  urls: { [Number("8995")]: NETWORK_URL },
  pollingInterval: POLLING_INTERVAL * 3
})

export const injected = new InjectedConnector({
  supportedChainIds: [Number("8995")]
})

// matic testnet 
export const walletconnect = new WalletConnectConnector({
  rpc: { [Number("8995")]: NETWORK_URL },
  bridge: 'https://walletconnect.matic.network',
  qrcode: false,
  pollingInterval: POLLING_INTERVAL * 3
})

// matic testnet
export const fortmatic = new FortmaticConnector({
  apiKey: 'pk_live_36DA4D2F0A4F9F2C',
  chainId: 1
})

// matic testnet
export const portis = new PortisConnector({
  dAppId: 'ad1d9de5-18e7-48ab-bcbf-a9929dc6d9cb',
  networks: [15001]
})

export const torus = new TorusConnector({
  chainId: 8995,
  initOptions: {
	host: "https://testnet2.matic.network",
    showTorusButton: false
  }
})
// matic testnet
export const walletlink = new WalletLinkConnector({
  url: NETWORK_URL,
  appName: 'Uniswap',
  appLogoUrl:
    'https://mpng.pngfly.com/20181202/bex/kisspng-emoji-domain-unicorn-pin-badges-sticker-unicorn-tumblr-emoji-unicorn-iphoneemoji-5c046729264a77.5671679315437924251569.jpg'
})
