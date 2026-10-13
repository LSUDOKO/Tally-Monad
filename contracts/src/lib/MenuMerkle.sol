// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// Leaf/node hashing from docs/07, with keccak256 instead of SHA-256.
/// leaf = keccak(0x00 ‖ itemId(16) ‖ category(u16) ‖ price(u128) ‖ floor(u128)); node = keccak(0x01 ‖ min ‖ max).
library MenuMerkle {
    function leaf(bytes16 itemId, uint16 category, uint128 price, uint128 floor) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(bytes1(0x00), itemId, category, price, floor));
    }

    function node(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return a < b
            ? keccak256(abi.encodePacked(bytes1(0x01), a, b))
            : keccak256(abi.encodePacked(bytes1(0x01), b, a));
    }

    function verify(bytes32 leafHash, bytes32[] calldata proof, bytes32 root) internal pure returns (bool) {
        if (proof.length > 16) return false;
        bytes32 h = leafHash;
        for (uint256 i; i < proof.length; ++i) h = node(h, proof[i]);
        return h == root;
    }
}
