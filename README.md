# CrypdoeBucks Contract Overview
![og_cryptoBuck](https://github.com/OptimusOpus/cryptDoeBucks/assets/34178563/a35e8002-94b4-4c3c-8489-90c105c958fb)

CrypdoeBucks is a blockchain-based game implemented as a smart contract on any EVM. It utilizes ERC721 tokens to represent unique digital assets called "bucks." Players can engage in battles, and participate in the breeding season to win a portion of the prize pool based on their performance. I made this for fun and to show ERC721 tokens can be used for more then 16 bit pieces of art.

## Smart Contract Architecture

The CryptDoeBucks project is built with a modular architecture using several interacting smart contracts. Below is a detailed explanation of each contract and their roles in the system:

### CrypdoeBucks.sol

The main contract that implements the ERC721 token standard with game mechanics for the bucks.

**Key Functionality:**
- **Buck Creation**: Mints new buck NFTs with randomized attributes (points, fighting style, and does)
- **Fighting Mechanism**: Allows bucks to challenge each other in battles
- **Experience System**: Bucks earn XP for fighting and can level up to gain advantages
- **Training & Breeding**: Functionality to improve buck attributes and breed them to create offspring
- **Season Management**: Handles the process of ending a buck's season to claim rewards from the prize pool

**Contract Inheritance:**
- `ERC721`: Base NFT functionality
- `ERC721Burnable`: Allows tokens to be burned
- `ERC721URIStorage`: Manages token metadata URIs
- `Ownable`: Access control for owner-only functions
- `ReentrancyGuard`: Prevents reentrancy attacks
- `Pausable`: Allows emergency pause of contract functionality

**Key Data Structures:**
- `Buck`: Struct storing buck attributes (points, readyTime, fightingStyle, does, experience, level, genetics, hasSpecialAbility)
- `Genetics`: Struct storing inherited traits (strength, speed, vitality, intelligence)

**External Contract Interactions:**
- Calls VRFv2Consumer for randomness in fights and breeding
- Interacts with PrizePool for managing rewards

### FightLib.sol

A library contract containing the logic for buck fights, extracted from the main contract to reduce its size.

**Key Functionality:**
- **Fighting Style Calculations**: Implements rock-paper-scissors style advantage system
- **Power Level Calculations**: Computes buck power for fight outcomes based on attributes and randomness
- **Critical Hit System**: Determines when bucks land a critical hit during combat
- **Special Ability System**: Logic for activating buck special abilities during fights

**Implementation Details:**
- Uses pure functions for calculations to save gas
- No state variables - operates only on input parameters
- Implements complex power level algorithms that factor in buck attributes and randomness

### PrizePool.sol

Manages the economic aspects of the game, including the prize pool distribution and various costs.

**Key Functionality:**
- **Prize Management**: Tracks and distributes the prize pool based on buck performance
- **Fee Collection**: Collects fees for training, breeding and other actions
- **Seasonal Rewards**: Calculates and distributes rewards at the end of mating seasons
- **Cost Management**: Sets and updates costs for various actions in the game

**Security Features:**
- `ReentrancyGuard`: Prevents reentrancy attacks during fund transfers
- `Pausable`: Allows emergency pause of functionality
- `Ownable`: Access control for admin functions

**External Contract Interactions:**
- Called by CrypdoeBucks.sol to update doe counts and award prizes
- Only the registered buck contract can call certain sensitive functions

### VRFv2Consumer.sol

Provides verifiable randomness for the game via Chainlink's VRF service.

**Key Functionality:**
- **Random Number Generation**: Requests and receives verifiable random numbers from Chainlink
- **Request Management**: Tracks the status of random number requests
- **Secure Randomness**: Ensures fair and unpredictable outcomes for game mechanics

**Implementation Details:**
- Uses Chainlink's VRFConsumerBaseV2 and VRFCoordinatorV2Interface
- Manages subscription-based randomness requests
- Tracks request fulfillment status

**External Contract Interactions:**
- Called by CrypdoeBucks.sol for random numbers
- Interacts with Chainlink's VRF Coordinator

### Workshop.sol

An example/demo contract that appears to be for educational purposes rather than core game functionality.

**Key Functionality:**
- **Data Structure Examples**: Shows how to implement complex data structures
- **Contract Design Patterns**: Demonstrates various Solidity patterns
- **Event and Error Handling**: Examples of proper event and error usage

## Contract Interactions

The contracts in the CryptDoeBucks ecosystem interact in the following ways:

1. **Game Flow**:
   - CrypdoeBucks contract is the main entry point for player interactions
   - When a buck is created, the CrypdoeBucks contract mints a new NFT and assigns attributes
   - Fees collected go to the PrizePool contract

2. **Fighting Mechanics**:
   - When a fight is initiated, CrypdoeBucks calls VRFv2Consumer to get random values
   - FightLib is used to calculate power levels and determine outcomes
   - Results are applied in CrypdoeBucks (doe transfers, experience gains, cooldowns)

3. **Randomness System**:
   - VRFv2Consumer requests random numbers from Chainlink
   - When fulfilled, the random values are used for fights, breeding, and other game mechanics
   - The request-response cycle ensures fair and unpredictable outcomes

4. **Prize Distribution**:
   - When a player ends their season, CrypdoeBucks calls PrizePool to award a prize
   - PrizePool calculates the amount based on the buck's doe percentage of the total
   - The buck is then burned, removing it from circulation

5. **Season Management**:
   - PrizePool keeps track of the mating season end time
   - CrypdoeBucks checks this when players try to end their season
   - After the season ends, remaining funds can be withdrawn by the owner

## Key Game Mechanics

### Buck Attributes and Genetics

Each buck has a combination of fixed and dynamic attributes:

- **Fixed at Creation**: 
  - Points (base strength)
  - Fighting Style (rock-paper-scissors mechanic)
  - Initial Genetics (strength, speed, vitality, intelligence)

- **Dynamic/Changeable**:
  - Experience (earned through fighting)
  - Level (increases with experience)
  - Doe Count (changes through fighting)
  - Genetics (can be improved through training)

### Fighting System

The battle system is balanced around three key elements:

1. **Base Power**: Determined by the buck's points and level
2. **Style Advantage**: Rock-paper-scissors mechanic where:
   - Style 1 beats Style 3
   - Style 2 beats Style 1
   - Style 3 beats Style 2
3. **Randomness**: Chainlink VRF ensures unpredictable outcomes

Additional combat mechanics include:
- Critical hits (chance increases with level)
- Special abilities (unlocked at level 5)
- Genetic bonuses (strength increases power, vitality improves defense)

### Breeding Mechanics

Bucks can be bred to create offspring with combined traits:

1. Bucks must be level 3 or higher to breed
2. Breeding has a cooldown period (24 hours by default)
3. Offspring inherit genetics from both parents with some randomness
4. New bucks start with 1 doe and must earn more through victories

### Economy and Rewards

The game economy revolves around:

1. **Doe Accumulation**: More does = larger share of the prize pool
2. **Risk vs. Reward**: More does also makes a buck a more attractive target
3. **Season Strategy**: Players must decide when to end their season and claim rewards
4. **Training Investment**: Fees paid for training and breeding go to the prize pool

## Interfaces

The system uses interfaces to define clear API boundaries:

- **IPrizePool**: Defines the functions the CrypdoeBucks contract can call on PrizePool
- **IVRFv2Consumer**: Defines the interface for requesting and retrieving random numbers

The envisioned goal unfolds as follows: Each buck, upon its inception, is imbued with attributes randomly assigned by the Chainlink VRF (Verifiable Random Function), with the minting process financed by a player's fee in the EVM's native currency (e.g., ETH). Moving forward, my plan is to introduce a nominal operator fee. This fee is intended to cover the VRF call costs and to facilitate a modest profit margin. Such contributions will be pooled together to form the prize fund. Before the season draws to a close, buck owners are empowered to finalize their season using the endSeason function. This maneuver allows for the exchange of the buck's doe count for a corresponding slice of the prize pool, based on the total doe count, while simultaneously retiring the buck token. By way of example, consider a situation with a total of 1,000 does and a prize pool amounting to 10 ETH. Should an owner of a buck with a herd of 100 does (representing 10% of the overall doe population) decide to conclude their season, they would receive 1 ETH from the pool in exchange for retiring their buck.

Bucks have the option to immediately capitalize on their does, but for those seeking greater thrills, there are does ripe for the taking. Bucks can challenge any other buck as often as they like until they secure a victory, after which they must observe a brief cooldown period to recuperate. This cooldown not only gives your buck a well-deserved rest but also curtails spam attacks and levels the playing field for players across different time zones, encouraging the ownership of multiple bucks.

During an attack, the aggressor buck has an inherent advantage, safeguarding its does regardless of the battle's outcome. This strategic move ensures that even in defeat, the attacker's does remain secure, hidden away from the fray. However, victory for the attacker means claiming all the does from the vanquished defender, leaving the defender to tend to their wounds.

#### Three critical elements influence the battle's outcome:

- **Inherent Power**: Determined at the time of minting, a buck's points reflect its core strength, a static attribute that sets the foundation for its combat capabilities.
- **Fighting Style**: Each buck adopts a fighting style that can provide a tactical edge. With styles like "Brawler," "Tactician," and "Swift Hoof" forming a rock-paper-scissors dynamic, the advantage goes to the buck whose style trumps the opponent's, regardless of whether they're attacking or defending. Envisioning more complex fighting styles could add intriguing layers to the game.
- **Chainlink VRF**: This call infuses the game with a layer of provable randomness, ensuring that battles remain unpredictable and thrilling. Even a buck with lesser power can emerge victorious against a stronger adversary if the style matchup and randomness swing in its favor.
  
This intricate blend of strategy, chance, and valor makes for a dynamic and engaging gameplay experience, where every buck, regardless of its initial strength, stands a chance to rise to glory.

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
