const IDToken = artifacts.require("./IDToken.sol");
const CreditToken = artifacts.require("./CreditToken.sol");

module.exports = function(deployer) {
  deployer.deploy(IDToken);
  deployer.deploy(CreditToken);
};