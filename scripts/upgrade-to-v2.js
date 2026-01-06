const { ethers, upgrades } = require("hardhat");

async function main() {
  const TokenVaultV2 = await ethers.getContractFactory("TokenVaultV2");

  const upgraded = await upgrades.upgradeProxy(
    process.env.VAULT_PROXY,
    TokenVaultV2
  );

  await upgraded.initializeV2(1000, process.env.PAUSER);
  console.log("Upgraded to V2 at:", upgraded.address);
}

main().catch(console.error);
