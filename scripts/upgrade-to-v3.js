const { ethers, upgrades } = require("hardhat");

async function main() {
  const TokenVaultV3 = await ethers.getContractFactory("TokenVaultV3");

  const upgraded = await upgrades.upgradeProxy(
    process.env.VAULT_PROXY,
    TokenVaultV3
  );

  await upgraded.initializeV3(86400, process.env.EMERGENCY_ADMIN);
  console.log("Upgraded to V3 at:", upgraded.address);
}

main().catch(console.error);
