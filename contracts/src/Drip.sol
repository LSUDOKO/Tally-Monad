// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// Sends several MON fee floats in one transaction. Monad's reserve-balance rule lets a sponsor below
/// 10 MON make only one value-moving transaction per 3-block window, so the floats must travel together.
contract Drip {
    error BadValue();
    error SendFailed();

    function drip(address[] calldata to, uint256[] calldata amount) external payable {
        if (to.length != amount.length) revert BadValue();
        uint256 total;
        for (uint256 i; i < to.length; ++i) total += amount[i];
        if (total != msg.value) revert BadValue();
        for (uint256 i; i < to.length; ++i) {
            (bool ok,) = to[i].call{value: amount[i]}("");
            if (!ok) revert SendFailed();
        }
    }
}
