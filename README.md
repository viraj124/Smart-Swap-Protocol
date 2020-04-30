
# SmartSwap

## Introduction

- Exchanging has been part of human civilization right from when humans began trading,in early phase it was Barter system which was used to exchange goods between two parties,fast forward to modern age we have blockchain to trade goods(represented by monetary units of tokens).

- Now its possible to trade without trusting the opposite part thanks to guarantees provided by blockchain

- First we have Order-Book based Dexes for transacting between multiple parties,They had their weekness such as                
1. No fair pricing
2. multiple transactions just to do a simple exchange of two tokens
3. Bad UI/UX and many more
4. Then we had introduction of AMM by vitalik which led to creation of bancor and uniswap
5. This solved quick exchange swap for many users

#### Only problem is now we have Ethereum blockchain

1. which has 15 sec transaction confirmation
2. high gas prices which makes transacting anytime you want difficult
3. waiting for hours due to high gas prices which can affect price you get when trading(Makerdao black thursday is such a example)
4. we need a place for fast exchange

- thankfully we have plasma sidechain binded to main etherum network which solves much problems with scalability without scarificing much decentralization.
- We have come up with plasma exchange solution with fast exchange and less gas fees

- Users can visit test website link and login using wallet of their choice by clicking on connect

- They can transfer thier assets from mainet to matic network using bridge

- If Users want to buy Land Tokens they can select NFT

- If Users want to buy any ERC20 Token they can buy using swap page by selecting tokens from dropdown

- They can swap and send tokens to another address using send page

- They can provide their assets to be available for exchange and collect fees

### Functionality

1. Token(ERC20)-Token(ERC20) conversion
2. Dai->Cdai(Compound Dai) conversion
3. Token(mana)->NFT(Land) conversion
4. Login using multiple wallets(Portis,Torus,Fortmatic,walletconnect,metamask)
5. ETH-Token(ERC20,ERC721) conversion

### Installation Steps
1. Clone the Repo
2. Do npm install
3. Naviagte to ------ and start swapping:)
   (Note -> The Addresses used mentioned in the Contract Addresses Section below are our own so you need to replace those to run the dapp    for your self, contact virajm72@gmail.com/aveeshshetty1@gmail.com/snaketh4xor@protonmail.com as there are a few files where you need   to change the addresses)

#### Set Up NFT Market
1. As the [NftMarket Contract](https://github.com/viraj124/Smart-Swap/blob/master/NFT-Exchange/contracts/NFTMarketplace.sol) has admin level permissions so you will need to set up your own.
2. Refer [this](https://gist.github.com/snaketh4x0r/78e673a3c865ac5240aad49d4751d8dc) to get started.
   Note - You can use the Nft Test Contract mentioned in the above link [here](https://gist.github.com/snaketh4x0r/6968fa193cf7b46e801529478375e737)
   
#### Matic Bridge 

1. Go to depositerc20.js

2. Create a ropsten custom token on matic using this address
0xe2B7a0c7bC21E000B8327713513b9D4d2620A414 (TERC20)

3. Create a matic custom token on matic using this address
0xe2B7a0c7bC21E000B8327713513b9D4d2620A414 (TERC20)

4. Enter your metamask address in from field in the script

5. Enter your private key in SetWallet function

6. run node depositerc20.js in cmd

(We're facing some issues , while integrating Matic.js with Reactjs's forms without the private key, we had discussions with matic guys
and they gave the go ahead for scripts)

### Screenshots
![1](https://user-images.githubusercontent.com/26670962/80628142-8b84e700-8a6e-11ea-9ddd-ea11cb6969c6.png)
![2](https://user-images.githubusercontent.com/26670962/80628145-8cb61400-8a6e-11ea-905c-ef8322c8a573.png)
![3](https://user-images.githubusercontent.com/26670962/80628149-8d4eaa80-8a6e-11ea-8bfa-e824f0411e93.png)
![4](https://user-images.githubusercontent.com/26670962/80628151-8de74100-8a6e-11ea-9f53-1e553b37d2d0.png)
![7](https://user-images.githubusercontent.com/26670962/80628154-8e7fd780-8a6e-11ea-8b2b-33f5f3a0758d.png)
![8](https://user-images.githubusercontent.com/26670962/80628158-8f186e00-8a6e-11ea-8c4d-3d735a6a0dc7.png)
![9](https://user-images.githubusercontent.com/26670962/80628160-8fb10480-8a6e-11ea-82d2-8d6dd85972f3.png)


### Video
[Smart Swap Demo](https://youtu.be/s1MwWU7gymQ)

### Website
[Links with title](http://localhost/ "link title")

### Sample Transaction Links For Reference
- ETH<->MANA -> 0x003b9b872b81b0b9ad0f4745eb61c196a813a1ef7501c1a058aec5a817e9fad6
- DAI<->ETH -> 0xb770cca7949d3a353edff6f7ade40cc32bd57a314d11b40e90cb8759089ebd7
- DAI<->CDAI -> 0xbed4ff336ef8e2337b369702398d11f7881f5969c0eaa62af227c8e33694e3ea
- CDAI<->DAI -> 0xe52737c9049db16ad05f21592dda422a076ec3f797273d65e480d3140f79b89c
- ETH-LAND -> 0x75d4c19afa3a521fc0043b5889a5d122ce34743cfd4c5625cc543406cab00420
- MANA<->LAND -> 0x645e317d67bc65daaa902d48abaa92c308a9eeb4ec693e9b03330778351d16e4
- Adding Liquidity -> 0x16a0f0a1f32ba3eb6ca6c52f11dbee4400b5f78d05adb66187eb2c0cd70c79c6

  Copy the Tx Hash and check out [here](https://explorer.testnet2.matic.network/)<br/>
  [NOTE - We Would recommend checking out the demo video first]
  
### Contract Addresses
- You can find the ERC20, NFT(LAND) and Uniswap Exchange addresses [here](https://github.com/viraj124/Smart-Swap/blob/master/src/contexts/Tokens.js)
- All Compound Contract Addresses are [here](https://github.com/viraj124/Smart-Swap/blob/master/Compound%20Contract%20Addresses.txt)
- NFT MarketPlace Address -> 0x1b5666b40f30231879f8a5dedfc78cdda7cacf77

### Tools Used

1. Compound protocol
2. Uniswap protocol
3. Kyber protocol
4. NFT markerplace exchange
5. Matic bridge
6. Truffle
7. React
8. Web3react library

### Authors

1. Viraz
2. snaketh4x0r
3. Aveesh
