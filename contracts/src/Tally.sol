// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {MenuMerkle} from "./lib/MenuMerkle.sol";

/// Tally: an allowance that pays only for an item the merchant signed, at the signed price, to the
/// merchant's registered payout, inside the owner's rules. Port of the Solana program (docs/06).
contract Tally is EIP712, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint64 public constant MAX_AUTONOMOUS_WINDOW = 60;
    uint64 public constant MAX_EXTENDED_WINDOW = 3600;
    uint64 public constant CYCLE = 1 days;
    uint256 public constant SLASH_BPS = 2_000;
    uint256 public constant REPORTER_BPS = 1_000;

    bytes32 public constant MENU_TYPEHASH = keccak256(
        "Menu(address merchant,bytes32 menuRoot,uint64 issuedAt,uint64 expiresAt,uint64 menuNonce,uint32 itemCount)"
    );
    bytes32 public constant COSIGN_TYPEHASH =
        keccak256("Cosign(uint256 capsuleId,address merchant,uint64 menuNonce,bytes16 itemId,uint128 price)");

    struct Rules {
        uint256 categories;
        uint128 perTxCap;
        uint128 dailyCap;
        uint128 minMerchantBond;
        uint64 expiry;
        bool allowExtended;
    }

    struct Capsule {
        address owner;
        address agent;
        uint128 balance;
        uint128 spentInCycle;
        uint64 cycleStart;
        bool frozen;
        Rules rules;
    }

    struct Merchant {
        address signingKey;
        address payout;
        bytes32 name;
        uint128 bond;
        uint128 slashedTotal;
        bool active;
    }

    struct Menu {
        address merchant;
        bytes32 menuRoot;
        uint64 issuedAt;
        uint64 expiresAt;
        uint64 menuNonce;
        uint32 itemCount;
    }

    struct Item {
        bytes16 itemId;
        uint16 category;
        uint128 price;
        uint128 floor;
    }

    error Frozen();
    error Expired();
    error MerchantInactive();
    error WrongSigner();
    error Stale();
    error WindowTooLong();
    error NotOnMenu();
    error Category();
    error OverPerTx();
    error OverDaily();
    error OwnerCosignRequired();
    error PostCondition();
    error Unauthorized();
    error InsufficientBalance();
    error ReceiptUsed();
    error InvalidRules();
    error AlreadyRegistered();
    error NotAFraud();
    error AlreadySlashed();
    error SelfReport();

    event CapsuleCreated(uint256 indexed id, address indexed owner, address agent);
    event Funded(uint256 indexed id, address indexed from, uint128 amount, string note);
    event Withdrawn(uint256 indexed id, uint128 amount);
    event RulesUpdated(uint256 indexed id);
    event FrozenSet(uint256 indexed id, bool frozen);
    event AgentSet(uint256 indexed id, address agent);
    event MerchantRegistered(address indexed merchant, bytes32 name, address signingKey, address payout, uint128 bond);
    event Paid(
        uint256 indexed capsuleId,
        address indexed merchant,
        bytes16 itemId,
        uint16 category,
        uint128 price,
        bool cosigned,
        bytes32 receipt
    );
    event Slashed(address indexed merchant, bytes32 menuRoot, address reporter, uint128 amount);

    IERC20 public immutable token;
    uint256 public nextCapsuleId = 1;
    uint256 public compensationPool;
    mapping(uint256 => Capsule) internal _capsules;
    mapping(address => uint256[]) internal _ownerCapsules;
    mapping(address => Merchant) public merchants;
    mapping(bytes32 => bool) public receiptUsed;
    mapping(bytes32 => bool) public fraudProven;

    constructor(address token_) EIP712("Tally", "1") {
        token = IERC20(token_);
    }

    // ---------- merchants ----------

    function registerMerchant(bytes32 name, address signingKey, address payout, uint128 bond) external {
        if (merchants[msg.sender].payout != address(0)) revert AlreadyRegistered();
        if (payout == address(0) || payout == address(this) || signingKey == address(0)) revert InvalidRules();
        merchants[msg.sender] = Merchant(signingKey, payout, name, bond, 0, true);
        if (bond > 0) token.safeTransferFrom(msg.sender, address(this), bond);
        emit MerchantRegistered(msg.sender, name, signingKey, payout, bond);
    }

    function rotateSigningKey(address k) external {
        if (k == address(0)) revert InvalidRules();
        _m(msg.sender).signingKey = k;
    }

    function setActive(bool a) external {
        _m(msg.sender).active = a;
    }

    function setPayout(address p) external {
        if (p == address(0) || p == address(this)) revert InvalidRules();
        _m(msg.sender).payout = p;
    }

    function _m(address a) internal view returns (Merchant storage m) {
        m = merchants[a];
        if (m.payout == address(0)) revert Unauthorized();
    }

    // ---------- capsules ----------

    /// Creates an allowance owned by msg.sender. Any MON sent is forwarded to the agent as its fee float.
    function createCapsule(address agent, Rules calldata rules, uint128 deposit)
        external
        payable
        nonReentrant
        returns (uint256 id)
    {
        _checkRules(rules);
        id = nextCapsuleId++;
        Capsule storage c = _capsules[id];
        c.owner = msg.sender;
        c.agent = agent;
        c.rules = rules;
        c.cycleStart = uint64(block.timestamp);
        _ownerCapsules[msg.sender].push(id);
        emit CapsuleCreated(id, msg.sender, agent);
        if (deposit > 0) _fund(id, deposit, "");
        if (msg.value > 0) {
            (bool ok,) = agent.call{value: msg.value}("");
            require(ok, "agent float");
        }
    }

    /// Anyone may top up an allowance (family abroad); the note says what the money is for.
    function fund(uint256 id, uint128 amount, string calldata note) external nonReentrant {
        if (_capsules[id].owner == address(0)) revert Unauthorized();
        if (bytes(note).length > 64) revert InvalidRules();
        _fund(id, amount, note);
    }

    function _fund(uint256 id, uint128 amount, string memory note) internal {
        _capsules[id].balance += amount;
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit Funded(id, msg.sender, amount, note);
    }

    function withdraw(uint256 id, uint128 amount) external nonReentrant {
        Capsule storage c = _own(id);
        if (amount > c.balance) revert InsufficientBalance();
        c.balance -= amount;
        token.safeTransfer(msg.sender, amount);
        emit Withdrawn(id, amount);
    }

    function updateRules(uint256 id, Rules calldata rules) external {
        _checkRules(rules);
        _own(id).rules = rules;
        emit RulesUpdated(id);
    }

    function setFrozen(uint256 id, bool f) external {
        _own(id).frozen = f;
        emit FrozenSet(id, f);
    }

    function setAgent(uint256 id, address a) external {
        _own(id).agent = a;
        emit AgentSet(id, a);
    }

    function _own(uint256 id) internal view returns (Capsule storage c) {
        c = _capsules[id];
        if (c.owner != msg.sender) revert Unauthorized();
    }

    function _checkRules(Rules calldata r) internal view {
        if (r.perTxCap == 0 || r.perTxCap > r.dailyCap || r.expiry <= block.timestamp) revert InvalidRules();
    }

    // ---------- pay ----------

    function payOffer(
        uint256 id,
        Menu calldata menu,
        bytes calldata merchantSig,
        Item calldata item,
        bytes32[] calldata proof,
        bytes calldata ownerSig
    ) external nonReentrant returns (bytes32 receipt) {
        Capsule storage c = _capsules[id];
        Merchant storage m = merchants[menu.merchant];

        // 1. authority & liveness
        if (msg.sender != c.agent && msg.sender != c.owner) revert Unauthorized();
        if (c.frozen) revert Frozen();
        if (block.timestamp >= c.rules.expiry) revert Expired();
        if (!m.active) revert MerchantInactive();

        // 2-3. merchant signature over the EIP-712 menu header (the domain binds chain + this contract)
        if (ECDSA.recover(menuDigest(menu), merchantSig) != m.signingKey) revert WrongSigner();

        // 4. freshness tiers
        if (block.timestamp < menu.issuedAt || block.timestamp > menu.expiresAt) revert Stale();
        uint64 window = menu.expiresAt - menu.issuedAt;
        if (window > MAX_EXTENDED_WINDOW) revert WindowTooLong();
        bool extended = window > MAX_AUTONOMOUS_WINDOW;
        if (extended && !c.rules.allowExtended) revert WindowTooLong();

        // 5. the payout comes from the registry (m.payout), never from the QR

        // 6. Merkle inclusion of a leaf the contract hashes itself
        bytes32 leaf = MenuMerkle.leaf(item.itemId, item.category, item.price, item.floor);
        if (!MenuMerkle.verify(leaf, proof, menu.menuRoot)) revert NotOnMenu();

        // 7. policy: category bitmap, per-purchase cap, rolling 24h cap, balance
        if (item.category > 255 || (c.rules.categories >> item.category) & 1 == 0) revert Category();
        if (item.price > c.rules.perTxCap) revert OverPerTx();
        if (block.timestamp - c.cycleStart >= CYCLE) {
            c.cycleStart = uint64(block.timestamp);
            c.spentInCycle = 0;
        }
        uint128 newTotal = c.spentInCycle + item.price;
        if (newTotal > c.rules.dailyCap) revert OverDaily();
        if (item.price > c.balance) revert InsufficientBalance();

        // 8. Cheapest-Match, bond tier and extended windows need the owner
        bool needsOwner = item.price > item.floor || m.bond < c.rules.minMerchantBond || extended;
        if (needsOwner && msg.sender != c.owner) {
            bytes32 d = cosignDigest(id, menu.merchant, menu.menuNonce, item.itemId, item.price);
            if (ownerSig.length != 65 || ECDSA.recover(d, ownerSig) != c.owner) revert OwnerCosignRequired();
        }

        // 9. duplicate-settlement nullifier
        receipt = keccak256(abi.encode(id, menu.merchant, menu.menuNonce, item.itemId));
        if (receiptUsed[receipt]) revert ReceiptUsed();
        receiptUsed[receipt] = true;

        // 10. atomic outflow with an exact-delta post-condition
        c.balance -= item.price;
        c.spentInCycle = newTotal;
        uint256 selfBefore = token.balanceOf(address(this));
        uint256 payBefore = token.balanceOf(m.payout);
        token.safeTransfer(m.payout, item.price);
        if (
            selfBefore - token.balanceOf(address(this)) != item.price
                || token.balanceOf(m.payout) - payBefore != item.price
        ) revert PostCondition();

        emit Paid(id, menu.merchant, item.itemId, item.category, item.price, needsOwner, receipt);
    }

    // ---------- trustless slashing ----------

    /// A merchant certifies `floor` as the cheapest price in a category. If its own signed menu holds a
    /// cheaper leaf in that category, anyone can prove the contradiction and slash part of the bond.
    function proveFloorFraud(
        Menu calldata menu,
        bytes calldata sig,
        Item calldata a,
        bytes32[] calldata proofA,
        Item calldata b,
        bytes32[] calldata proofB
    ) external nonReentrant {
        Merchant storage m = _m(menu.merchant);
        if (msg.sender == menu.merchant) revert SelfReport();
        if (ECDSA.recover(menuDigest(menu), sig) != m.signingKey) revert WrongSigner();
        if (!MenuMerkle.verify(MenuMerkle.leaf(a.itemId, a.category, a.price, a.floor), proofA, menu.menuRoot)) {
            revert NotOnMenu();
        }
        if (!MenuMerkle.verify(MenuMerkle.leaf(b.itemId, b.category, b.price, b.floor), proofB, menu.menuRoot)) {
            revert NotOnMenu();
        }
        if (a.category != b.category || a.price >= b.floor) revert NotAFraud();
        bytes32 key = keccak256(abi.encode(menu.merchant, menu.menuRoot));
        if (fraudProven[key]) revert AlreadySlashed();
        fraudProven[key] = true;

        uint128 slash = uint128(uint256(m.bond) * SLASH_BPS / 10_000);
        uint128 bounty = uint128(uint256(slash) * REPORTER_BPS / 10_000);
        m.bond -= slash;
        m.slashedTotal += slash;
        compensationPool += slash - bounty;
        token.safeTransfer(msg.sender, bounty);
        emit Slashed(menu.merchant, menu.menuRoot, msg.sender, slash);
    }

    // ---------- views ----------

    function menuDigest(Menu calldata x) public view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(abi.encode(MENU_TYPEHASH, x.merchant, x.menuRoot, x.issuedAt, x.expiresAt, x.menuNonce, x.itemCount))
        );
    }

    function cosignDigest(uint256 id, address merchant, uint64 nonce, bytes16 itemId, uint128 price)
        public
        view
        returns (bytes32)
    {
        return _hashTypedDataV4(keccak256(abi.encode(COSIGN_TYPEHASH, id, merchant, nonce, itemId, price)));
    }

    function capsuleOf(uint256 id) external view returns (Capsule memory) {
        return _capsules[id];
    }

    function ownerCapsules(address o) external view returns (uint256[] memory) {
        return _ownerCapsules[o];
    }
}
