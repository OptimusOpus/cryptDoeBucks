# Subgraph Starter

This directory contains a basic starter template for a new subgraph.

## Directory Structure

- **`subgraph.yaml`**: The manifest file. This is the main configuration file for your subgraph, defining data sources, schemas, and mappings.
- **`schema.graphql`**: Defines the GraphQL schema for your subgraph. You'll list the entities and their types here that your subgraph will store and that can be queried. The current placeholder schema includes a `Transaction` entity.
- **`src/my-contract.ts`**: Contains the AssemblyScript code that maps blockchain data (events, function calls) to the entities defined in your `schema.graphql`. The current placeholder handles a `DummyEvent` and creates `Transaction` entities.
- **`abis/`**: This directory (specifically `abis/MyContract.json` as per initialization) contains the ABI JSON files for your smart contracts. You'll need to replace `MyContract.json` with the ABI of your actual contract.
- **`generated/`**: This directory will contain AssemblyScript types generated from your `schema.graphql` and your contract ABIs when you run the codegen command. **Do not edit files in this directory directly.**
- **`build/`**: This directory will contain the compiled subgraph in WebAssembly format when you run the build command.

## Getting Started

1.  **Define Your Schema**:
    *   Edit `subgraph/schema.graphql` to define the entities you want to track.

2.  **Configure Your Subgraph**:
    *   Update `subgraph/subgraph.yaml`:
        *   Change `dataSources[0].name` to your contract's name.
        *   Update `dataSources[0].network` to the correct Ethereum network (e.g., `mainnet`, `goerli`, `sepolia`).
        *   Replace `dataSources[0].source.address` with your smart contract's address.
        *   Update `dataSources[0].source.abi` to match the name of your contract as defined in `mapping.abis[0].name`.
        *   Update `mapping.abis[0].name` to your contract's name.
        *   Replace `mapping.abis[0].file` with the path to your contract's ABI file (e.g., `./abis/YourContract.json`). You'll need to add your actual ABI file to the `abis` directory.
        *   Update `mapping.entities` to list the entities you defined in `schema.graphql`.
        *   Update `mapping.eventHandlers` (and/or `callHandlers`, `blockHandlers`) to specify which contract events/functions your mapping functions will handle.

3.  **Write Mappings**:
    *   Edit `subgraph/src/my-contract.ts` (you might want to rename this file to something more descriptive, like `mapping.ts` or `yourcontract.ts`, and update `subgraph.yaml` accordingly).
    *   Import your entities from `../generated/schema`.
    *   Import event/call types from `../generated/YourContractName/YourContractName`.
    *   Write handler functions that take event/call objects as arguments, create instances of your entities, populate them with data from the event/call, and save them using `.save()`.

## Available Scripts

These scripts can be run from the **root project directory**:

-   **`npm run graph:codegen`** (or `yarn graph:codegen`)
    *   Generates AssemblyScript types from your `schema.graphql` and contract ABIs. Run this after any changes to your schema or ABIs.
-   **`npm run graph:build`** (or `yarn graph:build`)
    *   Compiles your mappings to WebAssembly and prepares your subgraph for deployment. Run this after making changes to your mapping logic or `subgraph.yaml`.

## Next Steps

After customizing and building your subgraph:

-   **Test Locally**: You can run a local Graph Node to test your subgraph against a local or test network.
-   **Deploy**:
    -   To The Graph's decentralized network (requires GRT).
    -   To The Graph's hosted service (legacy, for testing/smaller projects).

Refer to the [official Graph Protocol documentation](https://thegraph.com/docs/) for more detailed information.
