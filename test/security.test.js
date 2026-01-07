const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Security invariants", function () {
  let owner, user, emergencyAdmin;
  let token, vault;

  const INITIAL_SUPPLY = ethers.utils.parseEther("1000000");
  const DEPOSIT_AMOUNT = ethers.utils.parseEther("1000");

  beforeEach(async function () {
    [owner, user, emergencyAdmin] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("Mock", "MOCK", INITIAL_SUPPLY);

    const TokenVaultV1 = await ethers.getContractFactory("TokenVaultV1");
    vault = await upgrades.deployProxy(
      TokenVaultV1,
      [token.address, owner.address, 0],
      { kind: "uups" }
    );

    await token.transfer(user.address, DEPOSIT_AMOUNT);
    await token.connect(user).approve(vault.address, DEPOSIT_AMOUNT);
  });

  it("should block unauthorized upgrades", async function () {
    try {
      await vault.connect(user).upgradeTo(vault.address);
      expect.fail("Upgrade should fail");
    } catch (err) {
      expect(err.message).to.include("missing role");
    }
  });

  it("should prevent deposit of zero amount", async function () {
    try {
      await vault.connect(user).deposit(0);
      expect.fail("Zero deposit allowed");
    } catch (err) {
      expect(err.message).to.include("Amount must be > 0");
    }
  });
});
