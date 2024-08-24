import React, { useEffect, useState } from "react";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";

interface VotingComponentProps {
  connectedAddress: string;
  voteAddress: string;
  setVoteAddress: React.Dispatch<React.SetStateAction<string>>;
  handleVote: () => void;
  hasVoted: { [key: string]: boolean };
  votingCompleted: boolean;
  accusedPlayers: { addr: string }[]; // Array of accused player addresses
}

const VotingComponent: React.FC<VotingComponentProps> = ({
  connectedAddress,
  voteAddress,
  setVoteAddress,
  handleVote,
  hasVoted,
  votingCompleted,
  accusedPlayers,
}) => {
  const [accusationStories, setAccusationStories] = useState<{ [key: string]: string }>({});

  const { data: mafiaGameContract } = useScaffoldContract({
    contractName: "MafiaGame",
  });

  useEffect(() => {
    const fetchReasons = async () => {
      const stories: { [key: string]: string } = {};
      for (const player of accusedPlayers) {
        const reasonsForPlayer = await mafiaGameContract?.read.getAccusationReasons([player.addr]);
        console.log("Reasons for accusing the accused", player.addr, reasonsForPlayer);
        if (reasonsForPlayer && reasonsForPlayer.length > 0) {
          const story = reasonsForPlayer.map((reason, idx) => `Reason ${idx + 1}: "${reason}".`).join(" ");
          stories[player.addr] = `Player ${player.addr} has been accused for the following reasons: ${story}`;
        } else {
          stories[player.addr] = `Player ${player.addr} has been accused, but no specific reasons were provided.`;
        }
      }
      setAccusationStories(stories);
    };

    if (accusedPlayers && accusedPlayers.length > 0) {
      fetchReasons();
    }
  }, [accusedPlayers]);

  return (
    <div className="mb-4 p-4 border rounded-lg bg-white shadow-lg w-full max-w-3xl flex flex-col space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Vote to Eliminate</h2>

      {accusedPlayers.map((player, index) => (
        <div
          key={index}
          className="p-4 border rounded-lg bg-gray-50 shadow-md mb-4 transition-transform transform hover:scale-105"
        >
          <h3 className="text-lg font-semibold text-gray-700">
            Accused Player: <span className="text-indigo-600">{player.addr}</span>
          </h3>
          <p className="mt-2 text-gray-600 text-sm">{accusationStories[player.addr]}</p>
        </div>
      ))}

      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Enter address to vote"
          value={voteAddress}
          onChange={e => setVoteAddress(e.target.value)}
          className="input input-bordered rounded-md w-full text-sm px-3 py-2 border-gray-300 focus:ring-2 focus:ring-indigo-600"
          disabled={hasVoted[connectedAddress] || votingCompleted}
        />
        <button
          onClick={handleVote}
          className={`btn rounded-md btn-primary ${hasVoted[connectedAddress] || votingCompleted ? "btn-disabled" : ""}`}
          disabled={hasVoted[connectedAddress] || votingCompleted}
        >
          Vote
        </button>
      </div>
    </div>
  );
};

export default VotingComponent;
