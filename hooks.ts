import { useMemo, useCallback } from 'react';
import { ethers } from 'ethers';

/* -------------------------------------------------------------------------- */
/*                          Generic contract helper                           */
/* -------------------------------------------------------------------------- */

/**
 * Returns a memoised contract instance created with ethers.Contract.
 * If `signerOrProvider` is not supplied it attempts to:
 *   • in browser → wrap `window.ethereum` (e.g. MetaMask)
 *   • in Node / SSR → fall back to `ethers.getDefaultProvider()`
 */
function useContract(
  address: string,
  abi: any[],
  signerOrProvider?: ethers.Signer | ethers.Provider,
): ethers.Contract {
  return useMemo(() => {
    const sp =
      signerOrProvider ??
      (typeof window !== 'undefined' && (window as any).ethereum
        ? new ethers.BrowserProvider((window as any).ethereum)
        : ethers.getDefaultProvider());

    return new ethers.Contract(address, abi, sp);
  }, [address, abi, signerOrProvider]);
}

/* -------------------------------------------------------------------------- */
/*                         CrypdoeBucks specific hook                         */
/* -------------------------------------------------------------------------- */

// Minimal ABI for CrypdoeBucks contract
const CRYPDOBUCKS_ABI = [
  'function createBuck(address owner, uint256 points, uint256 style, uint256 does) returns (uint256)',
  'function prepareForFight(uint256 attacker, uint256 defender)',
  'function fight(uint256 attacker, uint256 defender)',
  'function endSeason(uint256 buckId)',
  'function bucks(uint256) view returns (tuple(uint256 id, uint256 points, uint256 fights, uint256 wins, uint256 losses, uint256 style, uint256 does, uint256 doeBalance, uint256 lastMatingSeasonEntered, uint256 lastGameTime))',
  'function buckToOwner(uint256) view returns (address)',
  'function getPrizePoolValue() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
];

export function useCrypdoeBucks(
  address: string,
  signerOrProvider?: ethers.Signer | ethers.Provider,
) {
  const contract = useContract(address, CRYPDOBUCKS_ABI, signerOrProvider);

  /* -------------------------------- writes -------------------------------- */
  const createBuck = useCallback(
    async (owner: string, points: number, style: number, does: number) => {
      const tx = await contract.createBuck(owner, points, style, does);
      return tx.wait();
    },
    [contract],
  );

  const prepareForFight = useCallback(
    async (attacker: number, defender: number) => {
      const tx = await contract.prepareForFight(attacker, defender);
      return tx.wait();
    },
    [contract],
  );

  const fight = useCallback(
    async (attacker: number, defender: number) => {
      const tx = await contract.fight(attacker, defender);
      return tx.wait();
    },
    [contract],
  );

  const endSeason = useCallback(
    async (buckId: number) => {
      const tx = await contract.endSeason(buckId);
      return tx.wait();
    },
    [contract],
  );

  /* -------------------------------- reads --------------------------------- */
  const getBuck = useCallback((id: number) => contract.bucks(id), [contract]);
  const getBuckOwner = useCallback((id: number) => contract.buckToOwner(id), [contract]);
  const getPrizePoolValue = useCallback(() => contract.getPrizePoolValue(), [contract]);
  const balanceOf = useCallback((owner: string) => contract.balanceOf(owner), [contract]);

  return {
    contract,
    /* writes */
    createBuck,
    prepareForFight,
    fight,
    endSeason,
    /* reads */
    getBuck,
    getBuckOwner,
    getPrizePoolValue,
    balanceOf,
  } as const;
}

/* -------------------------------------------------------------------------- */
/*                           PrizePool specific hook                          */
/* -------------------------------------------------------------------------- */

// Minimal ABI for PrizePool contract
const PRIZEPOOL_ABI = [
  'function prizePool() view returns (uint256)',
  'function getTrainingCost() view returns (uint256)',
  'function getBreedingCost() view returns (uint256)',
  'function getMatingSeasonEnd() view returns (uint256)',
];

export function usePrizePool(address: string, signerOrProvider?: ethers.Signer | ethers.Provider) {
  const contract = useContract(address, PRIZEPOOL_ABI, signerOrProvider);

  /* reads */
  const prizePool = useCallback(() => contract.prizePool(), [contract]);
  const trainingCost = useCallback(() => contract.getTrainingCost(), [contract]);
  const breedingCost = useCallback(() => contract.getBreedingCost(), [contract]);
  const matingSeasonEnd = useCallback(() => contract.getMatingSeasonEnd(), [contract]);

  return { contract, prizePool, trainingCost, breedingCost, matingSeasonEnd } as const;
}

/* -------------------------------------------------------------------------- */
/*                                 Exports                                    */
/* -------------------------------------------------------------------------- */

export { useContract };
