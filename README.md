# CrypdoeBucks Contract Overview
![og_cryptoBuck](https://github.com/OptimusOpus/cryptDoeBucks/assets/34178563/a35e8002-94b4-4c3c-8489-90c105c958fb)

CrypdoeBucks is a blockchain-based game implemented as a smart contract on any EVM. It utilizes ERC721 tokens to represent unique digital assets called "bucks." Players can engage in battles, and participate in the breeding season to win a portion of the prize pool based on their performance. I made this for fun and to show ERC721 tokens can be used for more then 16 bit pieces of art.

The envisioned goal unfolds as follows: Each buck, upon its inception, is imbued with attributes randomly assigned by the Chainlink VRF (Verifiable Random Function), with the minting process financed by a player's fee in the EVM's native currency (e.g., ETH). Moving forward, my plan is to introduce a nominal operator fee. This fee is intended to cover the VRF call costs and to facilitate a modest profit margin. Such contributions will be pooled together to form the prize fund. Before the season draws to a close, buck owners are empowered to finalize their season using the endSeason function. This maneuver allows for the exchange of the buck's doe count for a corresponding slice of the prize pool, based on the total doe count, while simultaneously retiring the buck token. By way of example, consider a situation with a total of 1,000 does and a prize pool amounting to 10 ETH. Should an owner of a buck with a herd of 100 does (representing 10% of the overall doe population) decide to conclude their season, they would receive 1 ETH from the pool in exchange for retiring their buck.

Bucks have the option to immediately capitalize on their does, but for those seeking greater thrills, there are does ripe for the taking. Bucks can challenge any other buck as often as they like until they secure a victory, after which they must observe a brief cooldown period to recuperate. This cooldown not only gives your buck a well-deserved rest but also curtails spam attacks and levels the playing field for players across different time zones, encouraging the ownership of multiple bucks.

During an attack, the aggressor buck has an inherent advantage, safeguarding its does regardless of the battle's outcome. This strategic move ensures that even in defeat, the attacker's does remain secure, hidden away from the fray. However, victory for the attacker means claiming all the does from the vanquished defender, leaving the defender to tend to their wounds.

#### Three critical elements influence the battle's outcome:

- **Inherent Power**: Determined at the time of minting, a buck's points reflect its core strength, a static attribute that sets the foundation for its combat capabilities.
- **Fighting Style**: Each buck adopts a fighting style that can provide a tactical edge. With styles like "Brawler," "Tactician," and "Swift Hoof" forming a rock-paper-scissors dynamic, the advantage goes to the buck whose style trumps the opponent's, regardless of whether they're attacking or defending. Envisioning more complex fighting styles could add intriguing layers to the game.
- **Chainlink VRF**: This call infuses the game with a layer of provable randomness, ensuring that battles remain unpredictable and thrilling. Even a buck with lesser power can emerge victorious against a stronger adversary if the style matchup and randomness swing in its favor.
  
This intricate blend of strategy, chance, and valor makes for a dynamic and engaging gameplay experience, where every buck, regardless of its initial strength, stands a chance to rise to glory.

I think this gameplay element adds a fascinating layer of strategy and risk assessment. By accumulating does, a buck enhances its potential share of the prize pool, yet simultaneously becomes a more enticing target for rivals. This dynamic forces players to carefully consider the optimal moment to conclude their season, balancing the desire for a larger prize against the escalating risk of being challenged.

To further enrich this strategic depth, introducing an experience points (XP) system could provide an additional dimension. Here's how it could work:

- **Experience Points (XP)**: Bucks earn XP for each successful fight, with the amount potentially varying based on the strength of the opponent or the odds overcome during the battle.
- **Leveling Up**: Accumulating a certain amount of XP would allow a buck to "level up," enhancing its inherent power or unlocking new abilities. This progression system would encourage players to engage in battles to strengthen their bucks.
- **Strategic Decisions**: With the introduction of XP and leveling, players must make even more nuanced decisions. They must weigh the benefits of potentially increasing their buck's power against the risks of attracting attention from formidable challengers.
- **Skill Development**: Beyond mere strength enhancements, leveling up could allow bucks to develop unique skills or improve their fighting styles, offering strategic advantages in battles.

By integrating an XP system, the game would not only incentivize active participation in battles but also introduce a long-term development aspect for each buck, making the gameplay more engaging and the strategic decisions more impactful.

### Key Features

- **ChainLink's VRF**: Verified randomness on chain.
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
