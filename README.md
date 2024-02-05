# CrypdoeBucks Contract Overview

CrypdoeBucks is a blockchain-based game implemented as a smart contract on any EVM. It utilizes ERC721 tokens to represent unique digital assets called "bucks." Players can engage in battles, and participate in the breeding season to win a portion of the prize pool based on their performance. I made this for fun and to show ERC721 tokens can be used for more then 16 bit pieces of art.

### Key Features

- **ERC721 Implementation**: Each buck is a unique, non-fungible token with specific attributes such as points, fighting style, and the number of does (female deer) it controls.
- **Fighting Mechanism**: Bucks can engage in battles with each other, with outcomes determined by their attributes and a random number generator for fairness.
- **Seasonal Competitions**: The game unfolds in distinct seasons, with bucks concluding their competitive season and receiving rewards from the prize pool for their performance prior to the close of the mating season.
- **ReentrancyGuard**: Ensures secure transactions to prevent reentrancy attacks.
- **Ownership and Access Control**: Utilizes OpenZeppelin's `Ownable` contract to manage ownership and restricted access functionalities.

### Future Enhancements

- **Sales Contract**: Develop a contract that helps with the sale of the bucks. This could also use the random number generation to ensure a fair minting process.
- **PaymentSplitter**: Handle Price Pool with a separate funds contract, like OpenZeppelin's PaymentSplitter.
- **Improve Efficiency**: This is a proof of concept for fun, as such I didn't spend heaps of time making things cheaper. The primary target for this is the random number generation. Perhaps I could request a whole bunch of random numbers in such a way that only the contract knows them (like caching). As long as you can prove those numbers were secret prior to the fight to any potential players, then it is fair and cheaper.
- **Gameplay Expansion**: Introduce new attributes and mechanics to enrich the gameplay.
- **Generative Artwork**: Art generated with the random seed from minting, maybe using AI!
- **Frontend Integration**: Develop a user-friendly interface to interact with the contract. Probably with Next.js, but I have been hearing good things about Vue.js too.
- **Security Audits**: Conduct thorough audits to ensure contract security and reliability.

## Coverage Report

| Statements                                                                               | Functions                                                                              | Lines                                                                          |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| ![Statements](https://img.shields.io/badge/statements-100%25-brightgreen.svg?style=flat) | ![Functions](https://img.shields.io/badge/functions-100%25-brightgreen.svg?style=flat) | ![Lines](https://img.shields.io/badge/lines-100%25-brightgreen.svg?style=flat) |

## Prerequisites

- Docker

```shell
PATH+=":./bin"    # use your sh files (which are located in bin/) directly from the root of the project
```

```shell
yarn install      # install deps
yarn run build    # install solc and other tools in the docker image
```

Don't forget to copy the .env.example file to a file named .env, and then edit it to fill in the details.

## Running all the tests

```shell
yarn run test
yarn run test:trace       # shows logs + calls
yarn run test:fresh       # force compile and then run tests
yarn run test:coverage    # run tests with coverage reports
```

## Formatters & Linters

You can use the below packages,

- Solhint
- ESLint
- Prettier

```shell
yarn run format
yarn run lint
```

## Analyzers

You can use the below tools,

- Slither
- Mythril

```shell
yarn run analyze:static path/to/contract
yarn run analyze:security path/to/contract
yarn run analyze:all path/to/contract
```

## Deploy Contract & Verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Sepolia.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details.

- Enter your Etherscan API key
- Sepolia Node URL (eg from Alchemy)
- The private key of the account which will send the deployment transaction.

With a valid .env file in place, first deploy your contract:

```shell
yarn run deploy sepolia <CONTRACT_FILE_NAME>    # related to scripts/deploy/<CONTRACT_FILE_NAME>.ts
yarn run deploy:all sepolia                     # related to scripts/deploy.ts
```

Also, you can add contract(s) manually to your tenderly projects from the output.
`https://dashboard.tenderly.co/contract/<NETWORK_NAME>/<CONTRACT_ADDRESS>`

And then verify it:

```shell
yarn run verify sepolia <DEPLOYED_CONTRACT_ADDRESS> "<CONSTRUCTOR_ARGUMENT(S)>"    # hardhat.config.ts to see all networks
```

## Finder

```shell
yarn run finder --path contracts/Workshop.sol --name Workshop abi --colorify --compact --prettify    # find contract outputs of specific contract
```

```shell
yarn run finder --help    # see all supported outputs (abi, metadata, bytecode and more than 20+ outputs)
```

## Storage Vault

```shell
yarn run storage:lock    # create storage layout for all contracts
```

```shell
yarn run storage:lock --help    # see all supported options
```

```shell
yarn run storage:check    # check storage layout for all contracts by comparing with existing layout json file
```

```shell
yarn run storage:check --help    # see all supported options
```

## Miscellaneous

```shell
yarn run generate:docs    # generate docs according to the contracts/ folder
```

```shell
yarn run generate:flatten ./path/to/contract     # generate the flatten file (path must be "./" prefixed)
yarn run generate:abi ./path/to/contract         # generate the ABI file (path must be "./" prefixed)
yarn run generate:bin ./path/to/contract         # generate the binary in a hex (path must be "./" prefixed)
yarn run generate:metadata ./path/to/contract    # generate the metadata (path must be "./" prefixed)
yarn run generate:all-abi
yarn run generate:all-bin
yarn run generate:all-metadata
```

```shell
yarn run share    # share project folder with remix ide
```

# TODO

- Increase diversity in the Workshop Contract
- Add Workshop Contract tests
- Add Upgradeable Contract Examples
- Add OpenZeppelin Defender
- Add Tenderly
- Fix Prettier for Solidity files
