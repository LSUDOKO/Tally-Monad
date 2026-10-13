// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {Test} from "forge-std/Test.sol";
import {Drip} from "../src/Drip.sol";

contract DripTest is Test {
    Drip d = new Drip();

    function test_SplitsValueInOneTransaction() public {
        address[] memory to = new address[](2);
        to[0] = address(0xA1);
        to[1] = address(0xA2);
        uint256[] memory amt = new uint256[](2);
        amt[0] = 0.05 ether;
        amt[1] = 0.08 ether;
        d.drip{value: 0.13 ether}(to, amt);
        assertEq(address(0xA1).balance, 0.05 ether);
        assertEq(address(0xA2).balance, 0.08 ether);
    }

    function test_RevertWhenValueDoesNotMatch() public {
        address[] memory to = new address[](1);
        to[0] = address(0xA1);
        uint256[] memory amt = new uint256[](1);
        amt[0] = 1 ether;
        vm.expectRevert(Drip.BadValue.selector);
        d.drip{value: 0.5 ether}(to, amt);
    }
}
