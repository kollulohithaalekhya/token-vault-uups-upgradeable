const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("TokenVault upgrade V1 → V2", function () {
  let owner, user, pauser;
  let token, vaultV1, vaultV2;

  const INITIAL_SUPPLY = ethers.utils.parseEther("1000000");
  const DEPOSIT_AMOUNT = ethers.utils.parseEther("1000");
  const DEPOSIT_FEE = 500; // 5%
  const YIELD_RATE = 1000; // 10%

  beforeEach(async function () {
    [owner, user, pauser] = await ethers.getSigners();

    // Deploy mock token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy(
      "Mock Token",
      "MOCK",
      INITIAL_SUPPLY
    );
    await token.deployed();

    // Deploy V1 proxy
    const TokenVaultV1 = await ethers.getContractFactory("TokenVaultV1");
    vaultV1 = await upgrades.deployProxy(
      TokenVaultV1,
      [token.address, owner.address, DEPOSIT_FEE],
      { kind: "uups" }
    );
    await vaultV1.deployed();

    // Deposit in V1
    await token.transfer(user.address, DEPOSIT_AMOUNT);
    await token.connect(user).approve(vaultV1.address, DEPOSIT_AMOUNT);
    await vaultV1.connect(user).deposit(DEPOSIT_AMOUNT);

    // Upgrade to V2
    const TokenVaultV2 = await ethers.getContractFactory("TokenVaultV2");
    vaultV2 = await upgrades.upgradeProxy(
      vaultV1.address,
      TokenVaultV2
    );

    // Initialize V2
    await vaultV2.initializeV2(YIELD_RATE, pauser.address);

    // Fund vault for yield payouts
    await token.transfer(
      vaultV2.address,
      ethers.utils.parseEther("500")
    );
  });

  it("should preserve user balance after upgrade", async function () {
    const balance = await vaultV2.balanceOf(user.address);
    expect(balance.toString()).to.not.equal("0");
  });

  it("should preserve total deposits after upgrade", async function () {
    const total = await vaultV2.totalDeposits();
    expect(total.toString()).to.not.equal("0");
  });

  it("should allow yield claiming after time passes", async function () {
  // make a V2 deposit to have balance
  await token.transfer(user.address, DEPOSIT_AMOUNT);
  await token.connect(user).approve(vaultV2.address, DEPOSIT_AMOUNT);
  await vaultV2.connect(user).deposit(DEPOSIT_AMOUNT);

  // FIRST claim → initializes lastYieldClaim (expected to revert)
  try {
    await vaultV2.connect(user).claimYield();
  } catch {}

  // advance time
  await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
  await ethers.provider.send("evm_mine");

  // SECOND claim → must succeed
  await vaultV2.connect(user).claimYield();
});


  it("should allow pauser to pause and unpause deposits", async function () {
    await vaultV2.connect(pauser).pauseDeposits();

    try {
      await vaultV2.connect(user).deposit(DEPOSIT_AMOUNT);
      expect.fail("Deposit should revert");
    } catch (error) {
      expect(error.message).to.include("Deposits paused");
    }

    await vaultV2.connect(pauser).unpauseDeposits();

    await token.transfer(user.address, DEPOSIT_AMOUNT);
    await token.connect(user).approve(vaultV2.address, DEPOSIT_AMOUNT);
    await vaultV2.connect(user).deposit(DEPOSIT_AMOUNT);
  });

  it("should block unauthorized pause attempts", async function () {
    try {
      await vaultV2.connect(user).pauseDeposits();
      expect.fail("Unauthorized pause");
    } catch (error) {
      expect(error.message).to.include("missing role");
    }
  });
});
