import React from "react";

const VotingComponent = ({ connectedAddress, voteAddress, setVoteAddress, handleVote, hasVoted, votingCompleted }) => {
  return (
    <div className="mb-4 p-4 border rounded-md w-full max-w-lg flex flex-col space-y-4">
      <h2 className="text-xl font-semibold text-primary-lighter">Vote to Eliminate</h2>
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Enter address to vote"
          value={voteAddress}
          onChange={e => setVoteAddress(e.target.value)}
          className="input input-bordered rounded-md w-full"
          disabled={hasVoted[connectedAddress] || votingCompleted}
        />
        <button
          onClick={handleVote}
          className={`btn rounded-md btn-primary ${hasVoted[connectedAddress] || votingCompleted ? "btn-disabled" : ""}`}
        >
          Vote
        </button>
      </div>
    </div>
  );
};

export default VotingComponent;
