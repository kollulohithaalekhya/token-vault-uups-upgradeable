// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*//////////////////////////////////////////////////////////////
                        IMPORTS
//////////////////////////////////////////////////////////////*/

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

/*//////////////////////////////////////////////////////////////
                        TOKEN VAULT V1
//////////////////////////////////////////////////////////////*/

contract TokenVaultV1 is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable
{
    /*//////////////////////////////////////////////////////////////
                            ROLES
    //////////////////////////////////////////////////////////////*/

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    /*//////////////////////////////////////////////////////////////
                          STORAGE (V1)
    //////////////////////////////////////////////////////////////*/

    address public token;
    uint256 public totalDeposits;
    uint256 public depositFee; // basis points (100 = 1%)

    mapping(address => uint256) internal balances;

    // Storage gap for future upgrades
    uint256[50] private __gap;

    /*//////////////////////////////////////////////////////////////
                        INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _token,
        address _admin,
        uint256 _depositFee
    ) external initializer {
        require(_token != address(0), "Invalid token");
        require(_depositFee <= 1000, "Fee too high"); // max 10%

        __AccessControl_init();
        __UUPSUpgradeable_init();

        token = _token;
        depositFee = _depositFee;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(UPGRADER_ROLE, _admin);
    }

    /*//////////////////////////////////////////////////////////////
                        CORE LOGIC
    //////////////////////////////////////////////////////////////*/
    function deposit(uint256 amount) public virtual {

        require(amount > 0, "Amount must be > 0");

        uint256 fee = (amount * depositFee) / 10_000;
        uint256 credited = amount - fee;

        IERC20Upgradeable(token).transferFrom(
            msg.sender,
            address(this),
            amount
        );

        balances[msg.sender] += credited;
        totalDeposits += credited;
    }

    function withdraw(uint256 amount) public virtual {
        require(amount > 0, "Amount must be > 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;
        totalDeposits -= amount;

        IERC20Upgradeable(token).transfer(msg.sender, amount);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function balanceOf(address user) external view returns (uint256) {
        return balances[user];
    }

    function getDepositFee() external view returns (uint256) {
        return depositFee;
    }

    function getImplementationVersion()
    public
    pure
    virtual
    returns (string memory)
{

        return "V1";
    }

    /*//////////////////////////////////////////////////////////////
                        UPGRADE AUTH
    //////////////////////////////////////////////////////////////*/

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}
}
