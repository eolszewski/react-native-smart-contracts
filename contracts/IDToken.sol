pragma solidity ^0.4.21;

import '../node_modules/openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol';

contract IDToken is MintableToken {
    string public name = "ID Token";
    string public symbol = "ID";
    uint8 public decimals = 18;
}