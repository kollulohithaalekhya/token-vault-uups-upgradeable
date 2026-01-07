const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("TokenVault upgrade V2 → V3", function () {
  let owner, user, emergencyAdmin;
  let token, vaultV1, vaultV2, vaultV3;

  const INITIAL_SUPPLY = ethers.utils.parseEther("1000000");
  const DEPOSIT_AMOUNT = ethers.utils.parseEther("1000");
  const DEPOSIT_FEE = 500; // 5%
  const YIELD_RATE = 1000; // 10%
  const WITHDRAW_DELAY = 3 * 24 * 60 * 60; // 3 days

  beforeEach(async function () {
    [owner, user, emergencyAdmin] = await ethers.getSigners();

    // Deploy mock token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy(
      "Mock Token",
      "MOCK",
      INITIAL_SUPPLY
    );
    await token.deployed();

    // Deploy V1
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
    await vaultV2.initializeV2(YIELD_RATE, owner.address);

    // Upgrade to V3
    const TokenVaultV3 = await ethers.getContractFactory("TokenVaultV3");
    vaultV3 = await upgrades.upgradeProxy(
      vaultV2.address,
      TokenVaultV3
    );
    await vaultV3.initializeV3(WITHDRAW_DELAY, emergencyAdmin.address);
  });

  it("should preserve user balance after V3 upgrade", async function () {
    const balance = await vaultV3.balanceOf(user.address);
    expect(balance).to.not.equal(0);
  });

  it("should enforce withdrawal delay", async function () {
  // ensure fresh balance for this test
  await token.transfer(user.address, DEPOSIT_AMOUNT);
  await token.connect(user).approve(vaultV3.address, DEPOSIT_AMOUNT);
  await vaultV3.connect(user).deposit(DEPOSIT_AMOUNT);

  await vaultV3.connect(user).requestWithdraw();

  try {
    await vaultV3.connect(user).withdraw(DEPOSIT_AMOUNT);
    expect.fail("Withdraw should be delayed");
  } catch (error) {
    expect(error.message).to.include("Withdrawal delay not passed");
  }

  await ethers.provider.send("evm_increaseTime", [WITHDRAW_DELAY]);
  await ethers.provider.send("evm_mine");

  await vaultV3.connect(user).withdraw(DEPOSIT_AMOUNT);
});


  it("should allow emergency withdraw without delay", async function () {
    await vaultV3.connect(emergencyAdmin).enableEmergencyMode();
    await vaultV3.connect(user).emergencyWithdraw();
  });

  it("should block non-emergency admin from enabling emergency mode", async function () {
    try {
      await vaultV3.connect(user).enableEmergencyMode();
      expect.fail("Unauthorized emergency enable");
    } catch (error) {
      expect(error.message).to.include("missing role");
    }
  });
});
