// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TokenVaultV2.sol";

/**
 * @title TokenVaultV3
 * @dev Adds emergency withdraw, withdrawal delay and circuit breaker
 */
contract TokenVaultV3 is TokenVaultV2 {
    /*//////////////////////////////////////////////////////////////
                            ROLES
    //////////////////////////////////////////////////////////////*/

    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    /*//////////////////////////////////////////////////////////////
                        STORAGE (V3 - APPEND ONLY)
    //////////////////////////////////////////////////////////////*/

    bool public emergencyMode;
    uint256 public withdrawDelay; // seconds
    mapping(address => uint256) public withdrawRequestTime;

    // V2 left 47 gap → consume 3
    uint256[44] private __gapV3;

    /*//////////////////////////////////////////////////////////////
                        INITIALIZATION (V3)
    //////////////////////////////////////////////////////////////*/

    function initializeV3(
        uint256 _withdrawDelay,
        address _emergencyAdmin
    ) external reinitializer(3) {
        withdrawDelay = _withdrawDelay;
        _grantRole(EMERGENCY_ROLE, _emergencyAdmin);
    }

    /*//////////////////////////////////////////////////////////////
                        WITHDRAWAL DELAY
    //////////////////////////////////////////////////////////////*/

    function requestWithdraw() external {
        withdrawRequestTime[msg.sender] = block.timestamp;
    }

    function withdraw(uint256 amount) public override {
        if (!emergencyMode) {
            uint256 requestTime = withdrawRequestTime[msg.sender];
            require(requestTime != 0, "Withdraw not requested");
            require(
                block.timestamp >= requestTime + withdrawDelay,
                "Withdrawal delay not passed"
            );
            withdrawRequestTime[msg.sender] = 0;
        }

        super.withdraw(amount);
    }

    /*//////////////////////////////////////////////////////////////
                        EMERGENCY MODE
    //////////////////////////////////////////////////////////////*/

    function enableEmergencyMode() external onlyRole(EMERGENCY_ROLE) {
        emergencyMode = true;
    }

    function disableEmergencyMode() external onlyRole(EMERGENCY_ROLE) {
        emergencyMode = false;
    }

    function emergencyWithdraw() external {
        require(emergencyMode, "Not in emergency");

        uint256 balance = balances[msg.sender];
        require(balance > 0, "No balance");

        balances[msg.sender] = 0;
        totalDeposits -= balance;

        IERC20Upgradeable(token).transfer(msg.sender, balance);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW
    //////////////////////////////////////////////////////////////*/

    function getImplementationVersion()
        public
        pure
        override
        returns (string memory)
    {
        return "V3";
    }
}
