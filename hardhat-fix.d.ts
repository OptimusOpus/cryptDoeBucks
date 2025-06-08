// Type definitions to fix compatibility issues between Hardhat and Ethers.js v6

// Add missing SolidityStackTrace type declaration
declare interface SolidityStackTrace {
  message: string;
  trace: any[];
}

// Make the interface globally available
declare module '@nomicfoundation/edr' {
  export function printStackTrace(trace: SolidityStackTrace): void;
  export interface EthereumDebugRuntime {
    stackTrace(): SolidityStackTrace | null;
  }
}

// Ignore type checking for hardhat-ethers module
declare module '@nomicfoundation/hardhat-ethers' {
  export * from '@nomicfoundation/hardhat-ethers';
}
