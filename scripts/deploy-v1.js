const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const TokenVaultV1 = await ethers.getContractFactory("TokenVaultV1");
  const vault = await upgrades.deployProxy(
    TokenVaultV1,
    [process.env.TOKEN_ADDRESS, deployer.address, 500],
    { kind: "uups" }
  );

  await vault.deployed();
  console.log("TokenVaultV1 deployed to:", vault.address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
