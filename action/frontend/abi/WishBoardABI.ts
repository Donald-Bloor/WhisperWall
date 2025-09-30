export const FHE_WISH_BOARD_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "author", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "aliasName", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "message", "type": "string" },
      { "indexed": false, "internalType": "uint64", "name": "createdAt", "type": "uint64" }
    ],
    "name": "WishCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "WishCheered",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "message", "type": "string" },
      { "internalType": "string", "name": "aliasName", "type": "string" }
    ],
    "name": "createWish",
    "outputs": [ { "internalType": "uint256", "name": "id", "type": "uint256" } ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [ { "internalType": "uint256", "name": "id", "type": "uint256" } ],
    "name": "getCheersHandle",
    "outputs": [ { "internalType": "euint32", "name": "", "type": "bytes32" } ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [ { "internalType": "uint256", "name": "id", "type": "uint256" } ],
    "name": "getCheersMirror",
    "outputs": [ { "internalType": "uint32", "name": "", "type": "uint32" } ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [ { "internalType": "uint256", "name": "id", "type": "uint256" } ],
    "name": "getWish",
    "outputs": [
      { "internalType": "uint256", "name": "wishId", "type": "uint256" },
      { "internalType": "address", "name": "author", "type": "address" },
      { "internalType": "string", "name": "message", "type": "string" },
      { "internalType": "string", "name": "aliasName", "type": "string" },
      { "internalType": "uint64", "name": "createdAt", "type": "uint64" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getWishes",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "address", "name": "author", "type": "address" },
          { "internalType": "string", "name": "message", "type": "string" },
          { "internalType": "string", "name": "aliasName", "type": "string" },
          { "internalType": "uint64", "name": "createdAt", "type": "uint64" },
          { "internalType": "euint32", "name": "cheers", "type": "bytes32" },
          { "internalType": "uint32", "name": "cheersMirror", "type": "uint32" }
        ],
        "internalType": "struct WishBoard.WishItem[]",
        "name": "items",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" },
      { "internalType": "externalEuint32", "name": "plusOneExt", "type": "bytes32" },
      { "internalType": "bytes", "name": "inputProof", "type": "bytes" }
    ],
    "name": "cheerWish",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextWishId",
    "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "protocolId",
    "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ],
    "stateMutability": "pure",
    "type": "function"
  }
];


