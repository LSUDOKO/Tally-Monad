// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {Test} from "forge-std/Test.sol";
import {Drip} from "../src/Drip.sol";
import {MockAUSD} from "../src/MockAUSD.sol";

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

contract DripWelcomeTest is Test {
    Drip d = new Drip();
    MockAUSD usd = new MockAUSD();

    function test_WelcomeSendsFloatsAndMintsInOneCall() public {
        address[] memory to = new address[](2);
        to[0] = address(0xA1);
        to[1] = address(0xA2);
        uint256[] memory amt = new uint256[](2);
        amt[0] = 0.05 ether;
        amt[1] = 0.08 ether;
        d.welcome{value: 0.13 ether}(to, amt, address(usd), address(0xA1), 50e6);
        assertEq(address(0xA2).balance, 0.08 ether);
        assertEq(usd.balanceOf(address(0xA1)), 50e6);
    }

    function test_WelcomeWithMintOnly() public {
        d.welcome(new address[](0), new uint256[](0), address(usd), address(0xB1), 50e6);
        assertEq(usd.balanceOf(address(0xB1)), 50e6);
    }
}
