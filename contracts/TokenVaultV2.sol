// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TokenVaultV1.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

/**
 * @title TokenVaultV2
 * @dev Adds yield generation and deposit pause functionality
 */
contract TokenVaultV2 is TokenVaultV1 {
    /*//////////////////////////////////////////////////////////////
                            ROLES
    //////////////////////////////////////////////////////////////*/

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /*//////////////////////////////////////////////////////////////
                        STORAGE (V2 - APPEND ONLY)
    //////////////////////////////////////////////////////////////*/

    uint256 public yieldRate; // basis points per year
    mapping(address => uint256) internal lastYieldClaim;
    bool public depositsPaused;

    // V1 had 50 gap slots → we consume 3
    uint256[47] private __gapV2;

    /*//////////////////////////////////////////////////////////////
                        INITIALIZATION (V2)
    //////////////////////////////////////////////////////////////*/

    function initializeV2(
        uint256 _yieldRate,
        address _pauser
    ) external reinitializer(2) {
        require(_yieldRate <= 5000, "Yield too high"); // max 50%

        yieldRate = _yieldRate;
        _grantRole(PAUSER_ROLE, _pauser);
    }

    /*//////////////////////////////////////////////////////////////
                        DEPOSIT OVERRIDE
    //////////////////////////////////////////////////////////////*/

    function deposit(uint256 amount) public override {
    require(!depositsPaused, "Deposits paused");

    // initialize yield timer on first interaction
    if (lastYieldClaim[msg.sender] == 0) {
        lastYieldClaim[msg.sender] = block.timestamp;
    }

    super.deposit(amount);
}


    /*//////////////////////////////////////////////////////////////
                        YIELD LOGIC
    //////////////////////////////////////////////////////////////*/

    function pendingYield(address user) public view returns (uint256) {
        uint256 lastClaim = lastYieldClaim[user];
        if (lastClaim == 0) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp - lastClaim;

        return
            (balances[user] * yieldRate * timeElapsed) /
            (365 days * 10_000);
    }

    function claimYield() external {
        uint256 yield = pendingYield(msg.sender);
        require(yield > 0, "No yield");

        lastYieldClaim[msg.sender] = block.timestamp;
        IERC20Upgradeable(token).transfer(msg.sender, yield);
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN CONTROLS
    //////////////////////////////////////////////////////////////*/

    function setYieldRate(uint256 newRate)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(newRate <= 5000, "Yield too high");
        yieldRate = newRate;
    }

    function pauseDeposits() external onlyRole(PAUSER_ROLE) {
        depositsPaused = true;
    }

    function unpauseDeposits() external onlyRole(PAUSER_ROLE) {
        depositsPaused = false;
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW
    //////////////////////////////////////////////////////////////*/

    function getImplementationVersion()
        public
        pure
        virtual
        override
        returns (string memory)
    {
        return "V2";
    }
}
