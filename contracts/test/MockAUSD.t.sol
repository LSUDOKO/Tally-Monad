// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {Test} from "forge-std/Test.sol";
import {MockAUSD} from "../src/MockAUSD.sol";

contract MockAUSDTest is Test {
    MockAUSD t;
    function setUp() public { t = new MockAUSD(); }
    function test_DecimalsSix() public view { assertEq(t.decimals(), 6); }
    function test_MintCapped() public {
        t.mint(address(1), 1_000e6);
        assertEq(t.balanceOf(address(1)), 1_000e6);
        vm.expectRevert(MockAUSD.MintTooLarge.selector);
        t.mint(address(1), 1_000e6 + 1);
    }
}
