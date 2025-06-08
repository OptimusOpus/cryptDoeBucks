import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Transaction } from "../generated/schema";
// It's common to import event types from the contract, e.g.:
// import { NewTransactionEvent } from "../generated/MyContract/MyContract";

// Replace 'NewTransactionEvent' with the actual event type if you have one
// and uncomment the import above.
// For this placeholder, we'll use a generic ethereum.Event.
export function handleNewTransaction(event: ethereum.Event): void {
  let transaction = new Transaction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());

  transaction.blockNumber = event.block.number;
  transaction.timestamp = event.block.timestamp;
  transaction.gasPrice = event.transaction.gasPrice;

  // If your event has specific parameters, you would access them here, e.g.:
  // transaction.someParameter = event.params.someValue;

  transaction.save();
}
