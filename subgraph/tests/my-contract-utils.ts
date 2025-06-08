import { newMockEvent } from "matchstick-as"
import { ethereum } from "@graphprotocol/graph-ts"
import { DummyEvent } from "../generated/MyContract/MyContract"

export function createDummyEventEvent(): DummyEvent {
  let dummyEventEvent = changetype<DummyEvent>(newMockEvent())

  dummyEventEvent.parameters = new Array()

  return dummyEventEvent
}
