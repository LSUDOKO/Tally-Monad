// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IMintable {
    function mint(address to, uint256 amount) external;
}

/// Sends several MON fee floats (and the testnet welcome AUSD) in one transaction. Monad's reserve-balance
/// rule lets a sponsor below 10 MON make only one value-moving transaction per 3-block window, and any
/// later transaction in that window reverts, so a whole welcome has to travel together.
contract Drip {
    error BadValue();
    error SendFailed();

    function drip(address[] calldata to, uint256[] calldata amount) public payable {
        if (to.length != amount.length) revert BadValue();
        uint256 total;
        for (uint256 i; i < to.length; ++i) total += amount[i];
        if (total != msg.value) revert BadValue();
        for (uint256 i; i < to.length; ++i) {
            (bool ok,) = to[i].call{value: amount[i]}("");
            if (!ok) revert SendFailed();
        }
    }

    function welcome(address[] calldata to, uint256[] calldata amount, address token, address mintTo, uint256 mintAmount)
        external
        payable
    {
        drip(to, amount);
        if (mintAmount > 0) IMintable(token).mint(mintTo, mintAmount);
    }
}
