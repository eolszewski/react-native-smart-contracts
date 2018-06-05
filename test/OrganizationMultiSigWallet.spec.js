const OrganizationMultiSigWallet = artifacts.require("./OrganizationMultiSigWallet.sol");
const IDToken = artifacts.require("./IDToken.sol");
const CreditToken = artifacts.require("./CreditToken.sol");

function deployOrganization(name, ethLimit, idLimit, creditLimit) {
  return OrganizationMultiSigWallet.new(name, ethLimit, idLimit, creditLimit, IDToken.address, CreditToken.address,
    { gas: 6721975 });
}

let organization;

contract('OrganizationMultiSigWallet', (accounts) => {

  it("should deploy new organization and check eth limit", async () => {
    const ethLimit = web3.toWei(2, "ether");
    organization = await deployOrganization("test org", ethLimit, web3.toWei(3, "ether"), web3.toWei(4, "ether"));
    assert.equal(ethLimit, await organization.dailyLimitEth(), "invalid deploy");
  });

  it("should add admins", async () => {
    await organization.addAdmin(accounts[1]);
    await organization.addAdmin(accounts[2]);
    console.log(await organization.getAdmins());
  });

  it("should add agents", async () => {
    await organization.addAgent(accounts[3]);
    await organization.addAgent(accounts[4], { from: accounts[2] });
    console.log(await organization.getAgents());
  });

  it("should remove agent " + accounts[4], async () => {
    await organization.removeAgent(accounts[4], { from: accounts[2] });
    const agentsCount = await organization.getAgents();
    assert.equal(agentsCount.length, 1, "removal error");
  });

  it("should remove admin " + accounts[2], async () => {
    await organization.removeAdmin(accounts[2], { from: accounts[0] });
    const adminsCount = await organization.getAdmins();
    assert.equal(adminsCount.length, 1, "removal error");
  });

  const testDailyLimit = web3.toWei(5, "ether");

  it("should set daily limit for ETH", async () => {
    await organization.setDailyLimit(testDailyLimit, 0);
    assert.equal(await organization.dailyLimitEth(), testDailyLimit);
  });

  it("should set daily limit for IDToken", async () => {
    await organization.setDailyLimit(testDailyLimit, 1);
    assert.equal(await organization.dailyLimitIDToken(), testDailyLimit);
  });

  it("should set daily limit for CreditToken", async () => {
    await organization.setDailyLimit(testDailyLimit, 2);
    assert.equal(await organization.dailyLimitCreditToken(), testDailyLimit);
  });

  it('transfers successfully', async () => {
    this.token = await CreditToken.at(CreditToken.address);

    await this.token.mint(organization.address, web3.toWei(1000, "ether"), { from: accounts[0] });

    let balance = await this.token.balanceOf(organization.address);
    console.log('balance: ', balance);
    assert.equal(balance.toString(10), web3.toWei(1000, "ether"));

	//mint tokens and send to the organization
    await this.token.mint(accounts[0], web3.toWei(1000, "ether"), { from: accounts[0] });	
	  await this.token.transfer(organization.address, web3.toWei(1000, "ether"), { from: accounts[0] });

    balance = await this.token.balanceOf(organization.address);
    assert.equal(balance.toString(10), web3.toWei(2000, "ether"));

  });
	
  it("should submit and execute CreditToken transaction", async () => {
    this.token = await CreditToken.at(CreditToken.address);

    const initialBalance = await this.token.balanceOf(organization.address);
    await organization.submitTransaction(accounts[1], web3.toWei(2, "ether"), 2, { from: accounts[4] });
    assert.equal((await this.token.balanceOf(organization.address)).toString(10), web3.toBigNumber(initialBalance).minus(web3.toWei(2, "ether")).toString(10), "transaction execution issue");
  });


  // it("should send funds to org contract", async () => {
  //   const initialBalance = await web3.eth.getBalance(organization.address);
  //   await organization.send(web3.toWei(20, "ether"));
  //   assert.equal(await web3.eth.getBalance(organization.address), web3.toBigNumber(web3.toWei(20, "ether")).add(initialBalance).toString(10), "funds transfer error");
  //   console.log("20 eth are sent from " + accounts[0] + " to organization");
  // });

  // it("should submit and execute eth transaction", async () => {
  //   const initialBalance = await web3.eth.getBalance(accounts[4]);
  //   await organization.submitTransaction(accounts[4], web3.toWei(2, "ether"), 0, { from: accounts[3] });
  //   assert.equal(await web3.eth.getBalance(accounts[4]), web3.toBigNumber(initialBalance).add(web3.toWei(2, "ether")).toString(10), "transaction execution issue");
  // });

  // it("should check daily crdt spendings and have 0 balance", async () => {
  //   const spentToday = await organization.spentToday(accounts[3]);
  //   assert.equal(spentToday[2], 0, "spentToday data issue");
  // });

  // it("should submit and execute crdt transaction", async () => {
  //   const initialBalance = await web3.eth.getBalance(accounts[4]);
  //   await organization.submitTransaction(accounts[4], web3.toWei(2, "ether"), 2, { from: accounts[3] });
  //   this.token = await CreditToken.at(CreditToken.address);
  //   assert.equal(await this.token.balanceOf(accounts[4]), web3.toWei(2, "ether").toString(10), "transaction execution issue");
  // });

  // it("should submit and execute crdt transaction", async () => {
  //   const initialBalance = await web3.eth.getBalance(accounts[4]);
  //   await organization.submitTransaction(accounts[4], web3.toWei(2, "ether"), 2, { from: accounts[3] });
  //   const balance = await this.token.balanceOf(accounts[4]);
  //   assert.equal(await web3.eth.getBalance(accounts[4]), web3.toWei(2, "ether").toString(10), "transaction execution issue");
  // });

  // it("should check org transactions count", async () => {
  //   assert.equal(await organization.transactionsCount(), 2, "transactions count issue");
  // });

  // it("should check transaction data", async () => {
  //   const transaction = await organization.transactions(0);
  //   assert.equal(transaction[0], accounts[3], "wrong sender");
  //   assert.equal(transaction[1], accounts[4], "wrong destination");
  //   assert.equal(transaction[2], web3.toWei(2, "ether"), "wrong value");
  //   assert.equal(transaction[3], 0, "wrong value type");
  //   assert.equal(transaction[4], true, "wrong execution status");
  // });

  // it("should check daily eth spendings", async () => {
  //   const spentToday = await organization.spentToday(accounts[3]);
  //   assert.equal(spentToday[0], web3.toWei(2, "ether"), "spentToday data issue");
  // });

  // it("should update daily limits and check daily spendings", async () => {
  //   await organization.updateDailyLimits();
  //   const spentToday = await organization.spentToday(accounts[3]);
  //   assert.equal(spentToday[0], web3.toWei(2, "ether"), "spentToday data issue");
  // });

  // it("should increase EVM block timestamp to the next day, update daily limits and check daily spendings", async () => {
  //   // change EVM block timestamp to tomorrow 00:00
  //   let lastBlockTimestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
  //   let lastBlockDate = new Date(lastBlockTimestamp * 1000);
  //   const tomorrowDate = new Date(Date.UTC(lastBlockDate.getFullYear(), lastBlockDate.getMonth(), lastBlockDate.getDate()));
  //   tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  //   const diff = tomorrowDate.getTime() / 1000 - lastBlockTimestamp;
  //   web3.currentProvider.send({ jsonrpc: "2.0", method: "evm_increaseTime", params: [diff], id: 0 });
  //   web3.currentProvider.send({ jsonrpc: "2.0", method: "evm_mint", params: [], id: 0 });

  //   // update limits
  //   await organization.updateDailyLimits();
  //   lastBlockTimestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
  //   lastBlockDate = new Date(lastBlockTimestamp * 1000);
  //   console.log("Update daily limits block timestamp: " + lastBlockTimestamp + " (" + lastBlockDate + ")");

  //   // check spendings
  //   const spentToday = await organization.spentToday(accounts[3]);
  //   assert.equal(spentToday[0].toString(), '0', "update daily limits issue");
  // });

});