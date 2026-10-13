// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {Test} from "forge-std/Test.sol";
import {MenuMerkle} from "../src/lib/MenuMerkle.sol";

contract MenuMerkleHarness {
    function leaf(bytes16 i, uint16 c, uint128 p, uint128 f) external pure returns (bytes32) { return MenuMerkle.leaf(i, c, p, f); }
    function node(bytes32 a, bytes32 b) external pure returns (bytes32) { return MenuMerkle.node(a, b); }
}

contract MenuMerkleTest is Test {
    MenuMerkleHarness h = new MenuMerkleHarness();
    function test_NodeIsOrderIndependent() public view {
        bytes32 a = keccak256("a"); bytes32 b = keccak256("b");
        assertEq(h.node(a, b), h.node(b, a));
    }
    function test_LeafVector() public view {
        // item 0x11..11, coffee(3), $4.50, floor $4.50; same vector in web/test/menu.test.ts
        bytes32 l = h.leaf(bytes16(0x11111111111111111111111111111111), 3, 4_500_000, 4_500_000);
        assertEq(l, keccak256(abi.encodePacked(hex"00", hex"11111111111111111111111111111111", hex"0003",
            hex"000000000000000000000000004faa30", hex"000000000000000000000000004faa30")));
    }
}
