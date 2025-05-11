// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/IOwnable.sol";

interface IVRFv2Consumer is VRFCoordinatorV2Interface, IOwnable {
    // Events
    event RequestSent(uint256 requestId, uint32 numWords);
    event RequestFulfilled(uint256 requestId, uint256[] randomWords);

    // Functions
    function requestRandomWords() external returns (uint256 requestId);

    function getRequestStatus(uint256 _requestId) external view returns (bool fulfilled, uint256[] memory randomWords);
}
