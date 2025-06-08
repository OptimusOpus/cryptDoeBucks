// import { useMemo, useCallback } from 'react';
// import { ethers } from 'ethers';

// // TypeChain-generated types & factories
// import type { CrypdoeBucks, PrizePool } from './typechain-types';
// import {
//   CrypdoeBucks__factory,
//   PrizePool__factory,
// } from './typechain-types';

// /* -------------------------------------------------------------------------- */
// /*                          Generic contract helper                           */
// /* -------------------------------------------------------------------------- */

// /**
//  * Returns a memoised contract instance created via the given TypeChain factory
//  * `connect` method.  If `signerOrProvider` is not supplied it attempts to:
//  *   • in browser → wrap `window.ethereum` (e.g. MetaMask)
//  *   • in Node / SSR → fall back to `ethers.getDefaultProvider()`
//  */
// function useContract<C>(
//   address: string,
//   factoryConnect: (addr: string, sp: ethers.Signer | ethers.Provider) => C,
//   signerOrProvider?: ethers.Signer | ethers.Provider,
// ): C {
//   return useMemo(() => {
//     const sp =
//       signerOrProvider ??
//       (typeof window !== 'undefined' && (window as any).ethereum
//         ? new ethers.BrowserProvider((window as any).ethereum)
//         : ethers.getDefaultProvider());

//     return factoryConnect(address, sp);
//   }, [address, factoryConnect, signerOrProvider]);
// }

// /* -------------------------------------------------------------------------- */
// /*                         CrypdoeBucks specific hook                         */
// /* -------------------------------------------------------------------------- */

// export function useCrypdoeBucks(
//   address: string,
//   signerOrProvider?: ethers.Signer | ethers.Provider,
// ) {
//   const contract = useContract(address, CrypdoeBucks__factory.connect, signerOrProvider);

//   /* -------------------------------- writes -------------------------------- */
//   const createBuck = useCallback(
//     async (owner: string, points: number, style: number, does: number) =>
//       (await contract.createBuck(owner, points, style, does)).wait(),
//     [contract],
//   );

//   const prepareForFight = useCallback(
//     async (attacker: number, defender: number) =>
//       (await contract.prepareForFight(attacker, defender)).wait(),
//     [contract],
//   );

//   const fight = useCallback(
//     async (attacker: number, defender: number) =>
//       (await contract.fight(attacker, defender)).wait(),
//     [contract],
//   );

//   const endSeason = useCallback(
//     async (buckId: number) => (await contract.endSeason(buckId)).wait(),
//     [contract],
//   );

//   /* -------------------------------- reads --------------------------------- */
//   const getBuck = useCallback((id: number) => contract.bucks(id), [contract]);
//   const getBuckOwner = useCallback((id: number) => contract.buckToOwner(id), [contract]);
//   const getPrizePoolValue = useCallback(() => contract.getPrizePoolValue(), [contract]);
//   const balanceOf = useCallback((owner: string) => contract.balanceOf(owner), [contract]);

//   return {
//     contract,
//     /* writes */
//     createBuck,
//     prepareForFight,
//     fight,
//     endSeason,
//     /* reads */
//     getBuck,
//     getBuckOwner,
//     getPrizePoolValue,
//     balanceOf,
//   } as const;
// }

// /* -------------------------------------------------------------------------- */
// /*                           PrizePool specific hook                          */
// /* -------------------------------------------------------------------------- */

// export function usePrizePool(
//   address: string,
//   signerOrProvider?: ethers.Signer | ethers.Provider,
// ) {
//   const contract = useContract(address, PrizePool__factory.connect, signerOrProvider);

//   /* reads */
//   const prizePool = useCallback(() => contract.prizePool(), [contract]);
//   const trainingCost = useCallback(() => contract.getTrainingCost(), [contract]);
//   const breedingCost = useCallback(() => contract.getBreedingCost(), [contract]);
//   const matingSeasonEnd = useCallback(() => contract.getMatingSeasonEnd(), [contract]);

//   return { contract, prizePool, trainingCost, breedingCost, matingSeasonEnd } as const;
// }

// /* -------------------------------------------------------------------------- */
// /*                                 Exports                                    */
// /* -------------------------------------------------------------------------- */

// export { useContract };
