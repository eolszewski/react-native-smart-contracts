const CreditToken = artifacts.require('CreditToken');

const BigNumber = web3.BigNumber;

assertRevert = async (promise) => {
  try {
    await promise;
    assert.fail('Expected revert not received');
  } catch (error) {
    const revertFound = error.message.search('revert') >= 0;
    assert(revertFound, `Expected "revert", got ${error} instead`);
  }
};

contract('CreditToken', function ([owner, recipient, anotherAccount]) {
  const minter = owner;

  beforeEach(async function () {
    // this.token = await CreditToken.new({ from: owner });
    this.token = await CreditToken.at('0x9327066cb015e733e8ba3d89e778855ef0a519b5');
  });
  
  // describe('as a basic mintable token', function () {

  //   describe('minting finished', function () {
  //     describe('when the token minting is not finished', function () {
  //       it('returns false', async function () {
  //         const mintingFinished = await this.token.mintingFinished();
  //         assert.equal(mintingFinished, false);
  //       });
  //     });

  //     describe('when the token is minting finished', function () {
  //       beforeEach(async function () {
  //         await this.token.finishMinting({ from: owner });
  //       });

  //       it('returns true', async function () {
  //         const mintingFinished = await this.token.mintingFinished();
  //         assert.equal(mintingFinished, true);
  //       });
  //     });
  //   });

  //   describe('finish minting', function () {
  //     describe('when the sender is the token owner', function () {
  //       const from = owner;

  //       describe('when the token minting was not finished', function () {
  //         it('finishes token minting', async function () {
  //           await this.token.finishMinting({ from });

  //           const mintingFinished = await this.token.mintingFinished();
  //           assert.equal(mintingFinished, true);
  //         });

  //         it('emits a mint finished event', async function () {
  //           const { logs } = await this.token.finishMinting({ from });

  //           assert.equal(logs.length, 1);
  //           assert.equal(logs[0].event, 'MintFinished');
  //         });
  //       });

  //       describe('when the token minting was already finished', function () {
  //         beforeEach(async function () {
  //           await this.token.finishMinting({ from });
  //         });

  //         it('reverts', async function () {
  //           await assertRevert(this.token.finishMinting({ from }));
  //         });
  //       });
  //     });

  //     describe('when the sender is not the token owner', function () {
  //       const from = anotherAccount;

  //       describe('when the token minting was not finished', function () {
  //         it('reverts', async function () {
  //           await assertRevert(this.token.finishMinting({ from }));
  //         });
  //       });

  //       describe('when the token minting was already finished', function () {
  //         beforeEach(async function () {
  //           await this.token.finishMinting({ from: owner });
  //         });

  //         it('reverts', async function () {
  //           await assertRevert(this.token.finishMinting({ from }));
  //         });
  //       });
  //     });
  //   });

  //   describe('transfer', function () {
  //     describe('when the recipient is not the zero address', function () {
  //       const from = minter;
  //       const to = recipient;

  //       describe('when the sender has enough balance', function () {
  //         const amount = 100;

  //         it('transfers successfully', async function () {
  //           await this.token.mint(to, amount, { from });

  //           const balance = await this.token.balanceOf(to);
  //           assert.equal(balance, amount);

  //           await this.token.transfer(anotherAccount, amount, { from: to });

  //           const senderBalance = await this.token.balanceOf(to);
  //           assert.equal(senderBalance, 0);

  //           const recipientBalance = await this.token.balanceOf(anotherAccount);
  //           assert.equal(recipientBalance, amount);

  //           const { logs } = await this.token.transfer(to, amount, { from: anotherAccount });

  //           assert.equal(logs.length, 1);
  //           assert.equal(logs[0].event, 'Transfer');
  //           assert.equal(logs[0].args.from, anotherAccount);
  //           assert.equal(logs[0].args.to, to);
  //           assert(logs[0].args.value.eq(amount));
  //         });
  //       });
  //     });
  //   });

    describe('mint', function () {
      const amount = 100;

      describe('when the sender has the minting permission', function () {
        const from = minter;

        credittokencontract.mint('0x2434228cBe90579b507CeCAf32c8e343e0d830dB', amount, { from: '0x2434228cBe90579b507CeCAf32c8e343e0d830dB' })
        describe('when the token minting is not finished', function () {
          it('mints the requested amount', async function () {
            await this.token.mint(owner, amount, { from });

            const balance = await this.token.balanceOf(owner);
            assert.equal(balance, amount);
          });

          it('emits a mint and a transfer event', async function () {
            const { logs } = await this.token.mint(owner, amount, { from });

            assert.equal(logs.length, 2);
            assert.equal(logs[0].event, 'Mint');
            assert.equal(logs[0].args.to, owner);
            assert.equal(logs[0].args.amount, amount);
            assert.equal(logs[1].event, 'Transfer');
          });
        });

        describe('when the token minting is finished', function () {
          beforeEach(async function () {
            await this.token.finishMinting({ from: owner });
          });

          it('reverts', async function () {
            await assertRevert(this.token.mint(owner, amount, { from }));
          });
        });
      });

      describe('when the sender has not the minting permission', function () {
        const from = anotherAccount;

        describe('when the token minting is not finished', function () {
          it('reverts', async function () {
            await assertRevert(this.token.mint(owner, amount, { from }));
          });
        });

        describe('when the token minting is already finished', function () {
          beforeEach(async function () {
            await this.token.finishMinting({ from: owner });
          });

          it('reverts', async function () {
            await assertRevert(this.token.mint(owner, amount, { from }));
          });
        });
      });
    });
  });
});