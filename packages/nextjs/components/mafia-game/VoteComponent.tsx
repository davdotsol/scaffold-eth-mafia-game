import React from "react";

interface VoteComponentProps {
  accusedPlayers: string[];
  handleVote: (vote: string) => void;
}

const VoteComponent: React.FC<VoteComponentProps> = ({ accusedPlayers, handleVote }) => {
  return (
    <div className="mt-4 p-4 border rounded-md">
      <h2 className="text-xl font-semibold">Vote for Elimination</h2>
      <ul>
        {accusedPlayers.map(player => (
          <li key={player} className="mb-2">
            <button onClick={() => handleVote(player)} className="p-2 bg-red-500 text-white rounded-md">
              Vote to Eliminate {player}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VoteComponent;
