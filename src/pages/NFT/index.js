import React from 'react'
import NFTExchangePage from '../../components/NFTExchangePage'

export default function NFT({ initialCurrency, params }) {
  return <NFTExchangePage initialCurrency={initialCurrency} params={params} nft={true}  />
}