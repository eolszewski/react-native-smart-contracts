const DateTime = artifacts.require("./DateTime.sol");
const OrganizationMultiSigWallet = artifacts.require("./OrganizationMultiSigWallet.sol");

module.exports = function(deployer) {
  deployer.deploy(DateTime);
  deployer.link(DateTime, OrganizationMultiSigWallet);
};