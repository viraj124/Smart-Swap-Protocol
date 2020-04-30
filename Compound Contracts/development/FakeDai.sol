pragma solidity >=0.4.21 <0.6.5;

import "../../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract FakeDai is ERC20 {
    string public name = "Fake DAI";
    string public symbol = "DAI";
    uint public decimals = 18;
    uint public INITIAL_SUPPLY = 10000 * (10 ** decimals);

    constructor() public {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
}
