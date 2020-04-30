pragma solidity ^0.5.17;

import "https://github.com/snaketh4x0r/openzeppelin-contracts/blob/master/contracts/ownership/Ownable.sol";
import "https://github.com/snaketh4x0r/openzeppelin-contracts/blob/master/contracts/token/ERC721/ERC721Full.sol";
import "https://github.com/snaketh4x0r/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol";

/**
 * flow
 * admin pass the address of nft token during deployment in Constructor
 * admin use setCurrentPrice setter function to set price 
 * admin use sendTo to send funds in contract to desired address
 * 
 * tokenSeller deposit token to sell by passing token id in depositToken function
 * 
 * buyer call purchaseToken with token id with appropriate ether amount sent
 * 
 * use depositToken function to sell NFt token by transfering it to contract
 * 
 * */

contract nftMarketplace is Ownable {

    event Sent(address indexed payee, uint256 amount, uint256 balance);
    event Received(address indexed payer, uint256 tokenId, uint256 amount, uint256 balance);

    ERC721Full public nftAddress;
    ERC20 public manaAddress;
    uint256 public currentPrice;
    mapping(uint256 => address) public tokenSeller;

    /**
    * @dev Contract Constructor
    * @param _nftAddress address for non-fungible token contract 
    * @param _currentPrice initial price
    */
    constructor(address _nftAddress,address _manaAddress, uint256 _currentPrice) public { 
        require(_nftAddress != address(0) && _nftAddress != address(this));
        require(_currentPrice > 0);
        nftAddress = ERC721Full(_nftAddress);
        manaAddress = ERC20(_manaAddress);
        currentPrice = _currentPrice;
    }
    
    /**
    * @dev Deposit _tokenId
    * @param _tokenId uint256 token ID 
    */
    function depositToken(uint256 _tokenId) public {
        require(msg.sender != address(0) && msg.sender != address(this));
        require(msg.sender == nftAddress.ownerOf(_tokenId),"You are Owner of NFT");
        nftAddress.transferFrom(msg.sender, address(this), _tokenId);
        tokenSeller[_tokenId] = msg.sender;
    }
    
    /**
    * @dev Purchase _tokenId
    * @param _tokenId uint256 token ID 
    */
    function purchaseTokenETH(uint256 _tokenId) public payable {
        require(msg.sender != address(0) && msg.sender != address(this),"wrong addresses interaction");
        require(msg.value >= currentPrice,"not enough ETH funds");
        address temp = tokenSeller[_tokenId];
        address payable Seller = address(uint160(temp));
        Seller.transfer(msg.value);
        nftAddress.transferFrom(address(this), msg.sender, _tokenId);
        
        emit Received(msg.sender, _tokenId, msg.value, address(this).balance);
    }
    
    /**
    * @dev Purchase _tokenId
    * @param _tokenId uint256 token ID 
    * @param _amount uint256 amount of ERC20 Mana
    */
    function purchaseTokenMana(uint256 _tokenId,uint256 _amount) public returns (bool) {
        require(msg.sender != address(0) && msg.sender != address(this),"wrong addresses interaction");
        require(_amount >= currentPrice,"not enough Mana funds");
        nftAddress.approve(msg.sender,_tokenId);
        address temp = tokenSeller[_tokenId];
        require(manaAddress.transferFrom(msg.sender, temp, _amount),"Not Enough tokens Transfered");
        nftAddress.transferFrom(address(this), msg.sender, _tokenId);
        emit Received(msg.sender, _tokenId, _amount, address(this).balance);
        return true;
    }

    /**
    * @dev send / withdraw _amount to _payee
    */
    function sendTo(address payable _payee, uint256 _amount) public onlyOwner {
        require(_payee != address(0) && _payee != address(this));
        require(_amount > 0 && _amount <= address(this).balance);
        _payee.transfer(_amount);
        emit Sent(_payee, _amount, address(this).balance);
    }    

    /**
    * @dev set _currentPrice
    */
    function setCurrentPrice(uint256 _currentPrice) public onlyOwner {
        require(_currentPrice >= 0);
        currentPrice = _currentPrice;
    } 
    
    function getCurrentRate() public view returns (uint256) {
        return currentPrice;
    }

}