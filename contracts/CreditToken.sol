pragma solidity ^0.4.21;

import '../node_modules/openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol';
import '../node_modules/openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol';

contract CreditToken is MintableToken {
    string public name = "Credit Token";
    string public symbol = "CRDT";
    uint8 public decimals = 18;
}