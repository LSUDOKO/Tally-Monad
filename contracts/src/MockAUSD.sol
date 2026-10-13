// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// Testnet stand-in for Agora AUSD (mainnet 0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a, 6 decimals).
contract MockAUSD is ERC20 {
    error MintTooLarge();
    constructor() ERC20("Agora USD (test)", "AUSD") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external {
        if (amount > 1_000e6) revert MintTooLarge();
        _mint(to, amount);
    }
}
