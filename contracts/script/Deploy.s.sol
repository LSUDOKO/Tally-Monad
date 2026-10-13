// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {Script, console} from "forge-std/Script.sol";
import {Tally} from "../src/Tally.sol";
import {MockAUSD} from "../src/MockAUSD.sol";

/// Deploys MockAUSD + Tally and registers the demo cafe (authority = deployer, $500 bond).
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_KEY");
        vm.startBroadcast(pk);
        MockAUSD usd = new MockAUSD();
        Tally tally = new Tally(address(usd));
        usd.mint(vm.addr(pk), 1_000e6);
        usd.approve(address(tally), 500e6);
        tally.registerMerchant(
            "Tally Demo Cafe", vm.envAddress("DEMO_MERCHANT_SIGNER"), vm.envAddress("DEMO_PAYOUT"), 500e6
        );
        vm.stopBroadcast();
        console.log("AUSD", address(usd));
        console.log("TALLY", address(tally));
        console.log("MERCHANT", vm.addr(pk));
    }
}
