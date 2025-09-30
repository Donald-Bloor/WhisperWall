// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint32, euint64, externalEuint32, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title WishBoard - Decentralized Wish Wall (with FHE-encrypted cheers)
/// @notice Stores public wishes in plaintext but keeps cheer counts encrypted using FHE
contract WishBoard is SepoliaConfig {
    struct WishItem {
        uint256 id;              // Autoincrement ID (plaintext)
        address author;          // Author address
        string message;          // Wish content (plaintext)
        string aliasName;        // Optional alias (plaintext)
        uint64 createdAt;        // Timestamp (plaintext)
        euint32 cheers;          // Encrypted cheer counter
        uint32 cheersMirror;     // Plain mirror for UI convenience (not secure)
    }

    event WishCreated(uint256 indexed id, address indexed author, string aliasName, string message, uint64 createdAt);
    event WishCheered(uint256 indexed id, address indexed user);

    uint256 public nextWishId = 1;
    mapping(uint256 => WishItem) private _wishes;

    /// @notice Create a new wish
    function createWish(string memory message, string memory aliasName) external returns (uint256 id) {
        require(bytes(message).length > 0 && bytes(message).length <= 200, "invalid message length");
        require(bytes(aliasName).length <= 64, "invalid alias length");

        id = nextWishId++;

        euint32 encZero = FHE.asEuint32(0);

        _wishes[id] = WishItem({
            id: id,
            author: msg.sender,
            message: message,
            aliasName: aliasName,
            createdAt: uint64(block.timestamp),
            cheers: encZero,
            cheersMirror: 0
        });

        FHE.allowThis(_wishes[id].cheers);
        FHE.allow(_wishes[id].cheers, msg.sender);

        emit WishCreated(id, msg.sender, aliasName, message, uint64(block.timestamp));
    }

    /// @notice Cheer a wish with encrypted +1 provided by relayer-sdk input proof
    function cheerWish(uint256 id, externalEuint32 plusOneExt, bytes calldata inputProof) external {
        require(id > 0 && id < nextWishId, "invalid id");
        WishItem storage it = _wishes[id];
        require(it.author != address(0), "not found");

        euint32 plusOne = FHE.fromExternal(plusOneExt, inputProof);
        it.cheers = FHE.add(it.cheers, plusOne);

        FHE.allowThis(it.cheers);
        FHE.allow(it.cheers, it.author);
        FHE.allowTransient(it.cheers, msg.sender);

        unchecked { it.cheersMirror += 1; }

        emit WishCheered(id, msg.sender);
    }

    /// @notice Get a single wish (plaintext fields only)
    function getWish(uint256 id)
        external
        view
        returns (
            uint256 wishId,
            address author,
            string memory message,
            string memory aliasName,
            uint64 createdAt
        )
    {
        require(id > 0 && id < nextWishId, "invalid id");
        WishItem storage it = _wishes[id];
        require(it.author != address(0), "not found");
        return (it.id, it.author, it.message, it.aliasName, it.createdAt);
    }

    /// @notice Get all wishes (plaintext friendly)
    function getWishes() external view returns (WishItem[] memory items) {
        uint256 n = nextWishId - 1;
        items = new WishItem[](n);
        for (uint256 i = 1; i <= n; i++) {
            items[i-1] = _wishes[i];
        }
    }

    /// @notice Get encrypted cheer handle for a wish
    function getCheersHandle(uint256 id) external view returns (euint32) {
        require(id > 0 && id < nextWishId, "invalid id");
        WishItem storage it = _wishes[id];
        require(it.author != address(0), "not found");
        return it.cheers;
    }

    /// @notice Get plaintext mirror of cheers for UI
    function getCheersMirror(uint256 id) external view returns (uint32) {
        require(id > 0 && id < nextWishId, "invalid id");
        WishItem storage it = _wishes[id];
        require(it.author != address(0), "not found");
        return it.cheersMirror;
    }
}


