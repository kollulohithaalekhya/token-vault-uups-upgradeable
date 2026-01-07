# TokenVault – Upgradeable DeFi Vault (UUPS)

## 📌 Overview

**TokenVault** is a multi-version, upgradeable ERC-20 token vault built using **Solidity**, **Hardhat**, and **OpenZeppelin UUPS proxies**.

The project demonstrates:
- Safe upgradeability across multiple contract versions
- Storage layout preservation
- Role-based access control
- Yield generation
- Emergency controls
- Comprehensive test coverage

The vault evolves through **three versions (V1 → V2 → V3)**, each adding new functionality while preserving user state.

---

## 🏗️ Architecture

The system uses the **UUPS (Universal Upgradeable Proxy Standard)** pattern.

- A single proxy contract stores all state
- Logic is upgraded by replacing the implementation contract
- Only authorized roles can perform upgrades
- Storage gaps are reserved to ensure upgrade safety

```
Proxy
├── TokenVaultV1 (Deposits / Withdrawals)
├── TokenVaultV2 (Yield + Pause)
└── TokenVaultV3 (Emergency + Withdrawal Delay)
```

---

## 🔄 Contract Versions

### 🔹 TokenVaultV1
Core vault functionality:
- ERC-20 token deposits
- Withdrawals
- Deposit fee (basis points)
- Role-based upgrade authorization

### 🔹 TokenVaultV2
Adds:
- Yield generation (time-based)
- Deposit pause mechanism
- Pauser role
- Upgrade-safe yield initialization

### 🔹 TokenVaultV3
Adds:
- Withdrawal delay (timelock)
- Emergency mode (circuit breaker)
- Emergency withdrawal
- Dedicated emergency admin role

---

## 🔐 Security Design

- **UUPS upgrade authorization** (`UPGRADER_ROLE`)
- **Role-based access control** (OpenZeppelin `AccessControl`)
- **Emergency circuit breaker**
- **Withdrawal delay** to mitigate abuse
- **Storage gaps** to prevent layout collisions
- **No constructors** (initializer-only pattern)

---

## 🧪 Testing

The project includes **full test coverage**:

### Test Files
```
test/
├── TokenVaultV1.test.js
├── upgrade-v1-to-v2.test.js
├── upgrade-v2-to-v3.test.js
└── security.test.js
```

### Test Coverage Includes
- Unit tests for V1
- Upgrade safety (V1 → V2 → V3)
- State preservation across upgrades
- Yield lifecycle
- Pause & emergency controls
- Unauthorized access prevention

### Run Tests
```bash
npx hardhat test
```

---

## 🚀 Deployment & Upgrade Scripts

Scripts are provided for real-world usage.

### Scripts
```
scripts/
├── deploy-v1.js
├── upgrade-to-v2.js
└── upgrade-to-v3.js
```

### Environment Variables
```env
TOKEN_ADDRESS=0x...
VAULT_PROXY=0x...
PAUSER=0x...
EMERGENCY_ADMIN=0x...
```

### Deploy V1
```bash
npx hardhat run scripts/deploy-v1.js --network <network>
```

### Upgrade to V2
```bash
npx hardhat run scripts/upgrade-to-v2.js --network <network>
```

### Upgrade to V3
```bash
npx hardhat run scripts/upgrade-to-v3.js --network <network>
```

---

## 📂 Repository Structure

```
contracts/
├── TokenVaultV1.sol
├── TokenVaultV2.sol
├── TokenVaultV3.sol
└── mocks/MockERC20.sol

test/
├── TokenVaultV1.test.js
├── upgrade-v1-to-v2.test.js
├── upgrade-v2-to-v3.test.js
└── security.test.js

scripts/
├── deploy-v1.js
├── upgrade-to-v2.js
└── upgrade-to-v3.js

hardhat.config.js
package.json
submission.yml
README.md
```

---

## 🛠️ Tech Stack

* **Solidity** `^0.8.20`
* **Hardhat**
* **OpenZeppelin Contracts (Upgradeable)**
* **Ethers.js**
* **Mocha / Chai**

---
