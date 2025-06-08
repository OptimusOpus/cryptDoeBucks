import { ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

// Simple mock event creator for testing
export function createDummyEvent(): ethereum.Event {
  return newMockEvent();
}
