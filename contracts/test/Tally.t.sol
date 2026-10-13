// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {Test} from "forge-std/Test.sol";
import {Tally} from "../src/Tally.sol";
import {MockAUSD} from "../src/MockAUSD.sol";
import {MenuMerkle} from "../src/lib/MenuMerkle.sol";

contract TallyTest is Test {
    Tally tally;
    MockAUSD usd;
    uint256 ownerPk = 0xA11CE;
    uint256 agentPk = 0xA6E7;
    uint256 signerPk = 0x5167;
    uint256 badPk = 0xBAD;
    address owner;
    address agent;
    address signer;
    address merchant = address(0xCAFE);
    address payout = address(0xBEEF);
    uint256 capId;
    // 4-item menu: two coffees ($4.50 regular, $5.90 large, floor $4.50), croissant ($3, cat 0), tip (cat 8)
    Tally.Item[4] items;
    bytes32[4] leaves;

    function setUp() public {
        vm.warp(1_760_000_000);
        owner = vm.addr(ownerPk);
        agent = vm.addr(agentPk);
        signer = vm.addr(signerPk);
        usd = new MockAUSD();
        tally = new Tally(address(usd));
        items[0] = Tally.Item(bytes16(uint128(1)), 3, 4_500_000, 4_500_000);
        items[1] = Tally.Item(bytes16(uint128(2)), 3, 5_900_000, 4_500_000);
        items[2] = Tally.Item(bytes16(uint128(3)), 0, 3_000_000, 3_000_000);
        items[3] = Tally.Item(bytes16(uint128(4)), 8, 1_000_000, 1_000_000);
        for (uint256 i; i < 4; ++i) {
            leaves[i] = MenuMerkle.leaf(items[i].itemId, items[i].category, items[i].price, items[i].floor);
        }
        // merchant registers with a $100 bond
        usd.mint(merchant, 100e6);
        vm.startPrank(merchant);
        usd.approve(address(tally), 100e6);
        tally.registerMerchant("Demo Cafe", signer, payout, 100e6);
        vm.stopPrank();
        // owner creates an allowance: coffee+food, $10/purchase, $12/day, min bond $50, 30 days, funded $50
        usd.mint(owner, 50e6);
        vm.startPrank(owner);
        usd.approve(address(tally), 50e6);
        capId = tally.createCapsule(agent, _rules(12e6), 50e6);
        vm.stopPrank();
    }

    function _rules(uint128 daily) internal view returns (Tally.Rules memory) {
        return Tally.Rules((1 << 3) | (1 << 0), 10e6, daily, 50e6, uint64(block.timestamp + 30 days), false);
    }

    function _root() internal view returns (bytes32) {
        return MenuMerkle.node(MenuMerkle.node(leaves[0], leaves[1]), MenuMerkle.node(leaves[2], leaves[3]));
    }

    function _proof(uint256 i) internal view returns (bytes32[] memory p) {
        p = new bytes32[](2);
        p[0] = leaves[i ^ 1];
        p[1] = i < 2 ? MenuMerkle.node(leaves[2], leaves[3]) : MenuMerkle.node(leaves[0], leaves[1]);
    }

    function _menu(uint64 nonce, uint64 window) internal view returns (Tally.Menu memory) {
        return Tally.Menu(merchant, _root(), uint64(block.timestamp - 5), uint64(block.timestamp - 5 + window), nonce, 4);
    }

    function _sign(uint256 pk, bytes32 digest) internal pure returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }

    function _pay(uint256 i, Tally.Menu memory m, uint256 sigPk, bytes memory ownerSig) internal returns (bytes32) {
        bytes memory sig = _sign(sigPk, tally.menuDigest(m));
        vm.prank(agent);
        return tally.payOffer(capId, m, sig, items[i], _proof(i), ownerSig);
    }

    function _payReverts(uint256 i, Tally.Menu memory m, uint256 sigPk, bytes memory ownerSig, bytes4 err) internal {
        bytes memory sig = _sign(sigPk, tally.menuDigest(m));
        Tally.Item memory it = items[i];
        bytes32[] memory p = _proof(i);
        vm.prank(agent);
        vm.expectRevert(err);
        tally.payOffer(capId, m, sig, it, p, ownerSig);
    }

    function test_PaysCheapestMatchAutonomously() public {
        _pay(0, _menu(1, 60), signerPk, "");
        assertEq(usd.balanceOf(payout), 4_500_000);
        assertEq(tally.capsuleOf(capId).balance, 45_500_000);
    }

    function test_RevertWrongSigner() public {
        Tally.Menu memory m = _menu(1, 60);
        bytes memory sig = _sign(badPk, tally.menuDigest(m));
        vm.prank(agent);
        vm.expectRevert(Tally.WrongSigner.selector);
        tally.payOffer(capId, m, sig, items[0], _proof(0), "");
    }

    function test_RevertPriceInflation() public {
        Tally.Menu memory m = _menu(1, 60);
        bytes memory sig = _sign(signerPk, tally.menuDigest(m));
        Tally.Item memory it = items[0];
        it.price = 9_900_000;
        vm.prank(agent);
        vm.expectRevert(Tally.NotOnMenu.selector);
        tally.payOffer(capId, m, sig, it, _proof(0), "");
    }

    function test_RevertPhantomAddOn() public {
        Tally.Menu memory m = _menu(1, 60);
        bytes memory sig = _sign(signerPk, tally.menuDigest(m));
        Tally.Item memory it = Tally.Item(bytes16(uint128(0xdead)), 3, 1_000_000, 1_000_000);
        vm.prank(agent);
        vm.expectRevert(Tally.NotOnMenu.selector);
        tally.payOffer(capId, m, sig, it, _proof(0), "");
    }

    function test_RevertReplay() public {
        Tally.Menu memory m = _menu(1, 60);
        _pay(0, m, signerPk, "");
                _payReverts(0, m, signerPk, "", Tally.ReceiptUsed.selector);
    }

    function test_RevertStale() public {
        Tally.Menu memory m = _menu(1, 60);
        vm.warp(block.timestamp + 120);
                _payReverts(0, m, signerPk, "", Tally.Stale.selector);
    }

    function test_RevertWindowTooLongWithoutFlag() public {
                _payReverts(0, _menu(1, 600), signerPk, "", Tally.WindowTooLong.selector);
    }

    function test_RevertCategoryNotAllowed() public {
                _payReverts(3, _menu(1, 60), signerPk, "", Tally.Category.selector);
    }

    function test_RevertOverDaily() public {
        _pay(0, _menu(1, 60), signerPk, "");
        _pay(0, _menu(2, 60), signerPk, "");
                _payReverts(0, _menu(3, 60), signerPk, "", Tally.OverDaily.selector);
    }

    function test_DailyResetsAfterCycle() public {
        _pay(0, _menu(1, 60), signerPk, "");
        _pay(0, _menu(2, 60), signerPk, "");
        vm.warp(block.timestamp + 1 days);
        _pay(0, _menu(3, 60), signerPk, "");
        assertEq(tally.capsuleOf(capId).spentInCycle, 4_500_000);
    }

    function test_RevertInsufficientBalance() public {
        vm.prank(owner);
        tally.withdraw(capId, 48e6);
                _payReverts(0, _menu(1, 60), signerPk, "", Tally.InsufficientBalance.selector);
    }

    function test_PricierPickNeedsOwner() public {
                _payReverts(1, _menu(1, 60), signerPk, "", Tally.OwnerCosignRequired.selector);
    }

    function test_PricierPickWithOwnerCosign() public {
        Tally.Menu memory m = _menu(1, 60);
        bytes memory os = _sign(ownerPk, tally.cosignDigest(capId, merchant, 1, items[1].itemId, items[1].price));
        bytes32 r = _pay(1, m, signerPk, os);
        assertTrue(tally.receiptUsed(r));
        assertEq(usd.balanceOf(payout), 5_900_000);
    }

    function test_RevertCosignByNonOwner() public {
        bytes memory os = _sign(badPk, tally.cosignDigest(capId, merchant, 1, items[1].itemId, items[1].price));
                _payReverts(1, _menu(1, 60), signerPk, os, Tally.OwnerCosignRequired.selector);
    }

    function test_RevertFrozen() public {
        vm.prank(owner);
        tally.setFrozen(capId, true);
                _payReverts(0, _menu(1, 60), signerPk, "", Tally.Frozen.selector);
    }

    function test_RevertNotAgent() public {
        Tally.Menu memory m = _menu(1, 60);
        bytes memory sig = _sign(signerPk, tally.menuDigest(m));
        vm.prank(address(0x1234));
        vm.expectRevert(Tally.Unauthorized.selector);
        tally.payOffer(capId, m, sig, items[0], _proof(0), "");
    }

    function test_UnderBondedMerchantNeedsOwner() public {
        Tally.Rules memory r = _rules(12e6);
        r.minMerchantBond = 500e6;
        vm.prank(owner);
        tally.updateRules(capId, r);
                _payReverts(0, _menu(1, 60), signerPk, "", Tally.OwnerCosignRequired.selector);
    }

    function test_AnyoneCanFundWithPurposeNote() public {
        usd.mint(address(0xFA), 20e6);
        vm.startPrank(address(0xFA));
        usd.approve(address(tally), 20e6);
        vm.expectEmit(true, true, false, true);
        emit Tally.Funded(capId, address(0xFA), 20e6, "For lunches this week");
        tally.fund(capId, 20e6, "For lunches this week");
        vm.stopPrank();
        assertEq(tally.capsuleOf(capId).balance, 70e6);
    }

    function test_RevertWithdrawByNonOwner() public {
        vm.prank(agent);
        vm.expectRevert(Tally.Unauthorized.selector);
        tally.withdraw(capId, 1e6);
    }

    function test_FloorFraudSlashes() public {
        // dishonest menu: regular coffee $3.00, but the large one certifies the coffee floor as $4.50
        items[0].price = 3_000_000;
        items[0].floor = 3_000_000;
        leaves[0] = MenuMerkle.leaf(items[0].itemId, 3, 3_000_000, 3_000_000);
        Tally.Menu memory m = _menu(9, 60);
        bytes memory sig = _sign(signerPk, tally.menuDigest(m));
        vm.prank(address(0x5EE));
        tally.proveFloorFraud(m, sig, items[0], _proof(0), items[1], _proof(1));
        assertEq(usd.balanceOf(address(0x5EE)), 2e6); // 10% of a 20% slash of $100
        vm.expectRevert(Tally.AlreadySlashed.selector);
        tally.proveFloorFraud(m, sig, items[0], _proof(0), items[1], _proof(1));
    }

    function test_RevertNotAFraud() public {
        Tally.Menu memory m = _menu(9, 60);
        bytes memory sig = _sign(signerPk, tally.menuDigest(m));
        vm.expectRevert(Tally.NotAFraud.selector);
        tally.proveFloorFraud(m, sig, items[0], _proof(0), items[1], _proof(1));
    }

    function test_RotatingKeyDoesNotEscapeSlashing() public {
        items[0].price = 3_000_000;
        items[0].floor = 3_000_000;
        leaves[0] = MenuMerkle.leaf(items[0].itemId, 3, 3_000_000, 3_000_000);
        Tally.Menu memory m = _menu(9, 60);
        bytes memory sig = _sign(signerPk, tally.menuDigest(m));
        vm.prank(merchant);
        tally.rotateSigningKey(vm.addr(0x9999));
        vm.prank(address(0x5EE));
        tally.proveFloorFraud(m, sig, items[0], _proof(0), items[1], _proof(1));
        assertEq(usd.balanceOf(address(0x5EE)), 2e6);
    }

    function test_RevertFraudProofFromNeverRegisteredKey() public {
        items[0].price = 3_000_000;
        items[0].floor = 3_000_000;
        leaves[0] = MenuMerkle.leaf(items[0].itemId, 3, 3_000_000, 3_000_000);
        Tally.Menu memory m = _menu(9, 60);
        bytes memory sig = _sign(badPk, tally.menuDigest(m));
        vm.prank(address(0x5EE));
        vm.expectRevert(Tally.WrongSigner.selector);
        tally.proveFloorFraud(m, sig, items[0], _proof(0), items[1], _proof(1));
    }
}
