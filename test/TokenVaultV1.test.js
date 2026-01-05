const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("TokenVaultV1", function () {
  let owner, user;
  let token, vault;

  const INITIAL_SUPPLY = ethers.utils.parseEther("1000000");
  const DEPOSIT_AMOUNT = ethers.utils.parseEther("1000");
  const DEPOSIT_FEE = 500; // 5%

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy(
      "Mock Token",
      "MOCK",
      INITIAL_SUPPLY
    );
    await token.deployed();

    const TokenVaultV1 = await ethers.getContractFactory("TokenVaultV1");
    vault = await upgrades.deployProxy(
      TokenVaultV1,
      [token.address, owner.address, DEPOSIT_FEE],
      { kind: "uups" }
    );
    await vault.deployed();

    await token.transfer(user.address, DEPOSIT_AMOUNT);
    await token.connect(user).approve(vault.address, DEPOSIT_AMOUNT);
  });

  it("should initialize with correct parameters", async function () {
    expect(await vault.token()).to.equal(token.address);
    expect((await vault.getDepositFee()).toString()).to.equal("500");
  });

  it("should allow deposits and update balances", async function () {
    await vault.connect(user).deposit(DEPOSIT_AMOUNT);

    const fee = DEPOSIT_AMOUNT.mul(DEPOSIT_FEE).div(10000);
    const credited = DEPOSIT_AMOUNT.sub(fee);

    expect((await vault.balanceOf(user.address)).toString())
      .to.equal(credited.toString());

    expect((await vault.totalDeposits()).toString())
      .to.equal(credited.toString());
  });

  it("should deduct deposit fee correctly", async function () {
    await vault.connect(user).deposit(DEPOSIT_AMOUNT);

    const fee = DEPOSIT_AMOUNT.mul(DEPOSIT_FEE).div(10000);
    const expectedBalance = DEPOSIT_AMOUNT.sub(fee);

    expect((await vault.balanceOf(user.address)).toString())
      .to.equal(expectedBalance.toString());
  });

  it("should allow withdrawals and update balances", async function () {
    await vault.connect(user).deposit(DEPOSIT_AMOUNT);

    const fee = DEPOSIT_AMOUNT.mul(DEPOSIT_FEE).div(10000);
    const credited = DEPOSIT_AMOUNT.sub(fee);

    await vault.connect(user).withdraw(credited);

    expect((await vault.balanceOf(user.address)).toString()).to.equal("0");
    expect((await vault.totalDeposits()).toString()).to.equal("0");
  });

  it("should prevent withdrawal of more than balance", async function () {
    try {
      await vault.connect(user).withdraw(DEPOSIT_AMOUNT);
      expect.fail("Withdrawal should have reverted");
    } catch (error) {
      expect(error.message).to.include("Insufficient balance");
    }
  });

  it("should prevent reinitialization", async function () {
    try {
      await vault.initialize(token.address, owner.address, DEPOSIT_FEE);
      expect.fail("Reinitialization should have reverted");
    } catch (error) {
      expect(error.message).to.include("already initialized");
    }
  });
});
