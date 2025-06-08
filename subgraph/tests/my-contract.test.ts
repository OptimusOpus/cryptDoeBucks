import { describe, test, beforeAll, afterAll } from 'matchstick-as/assembly/index';
import { clearStore } from 'matchstick-as/assembly/store';
import { createDummyEvent } from './my-contract-utils';

describe('Example test suite', () => {
  beforeAll(() => {
    // Setup code here
    createDummyEvent();
    // Handle the event if needed
  });

  afterAll(() => {
    clearStore();
  });

  test('Example test', () => {
    // Test assertions here
  });
});
