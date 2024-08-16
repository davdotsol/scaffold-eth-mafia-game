import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface Player {
  addr: string;
  role: string;
  alive: boolean;
}

interface PlayerActionsProps {
  currentPlayer: Player | undefined;
  phase: string;
  hasAccused: { [key: string]: boolean };
  setHasVoted: (voted: { [key: string]: boolean }) => void;
  hasVoted: { [key: string]: boolean };
  votingCompleted: boolean | undefined;
  setMafiaAttack: (address: string | null) => void;
  setDoctorSave: (address: string | null) => void;
  setDetectiveInvestigation: (address: string | null) => void;
  allPlayersAccused: boolean | undefined;
}

const PlayerActions: React.FC<PlayerActionsProps> = ({
  currentPlayer,
  phase,
  hasAccused,
  setHasVoted,
  hasVoted,
  votingCompleted,
  setMafiaAttack,
  setDoctorSave,
  setDetectiveInvestigation,
  allPlayersAccused,
}) => {
  const { address: connectedAddress } = useAccount();

  const [investigateAddress, setInvestigateAddress] = useState<string>("");
  const [saveAddress, setSaveAddress] = useState<string>("");
  const [targetAddress, setTargetAddress] = useState<string>("");
  const [accuseAddress, setAccuseAddress] = useState<string>("");
  const [voteAddress, setVoteAddress] = useState<string>("");

  const { writeContractAsync } = useScaffoldWriteContract("MafiaGame");

  const handleInvestigate = () => {
    if (investigateAddress) {
      setInvestigateAddress("");
      setDetectiveInvestigation(investigateAddress);
    }
  };

  const handleSave = () => {
    if (saveAddress) {
      setSaveAddress("");
      setDoctorSave(saveAddress);
    }
  };

  const handleTarget = () => {
    if (targetAddress) {
      setTargetAddress("");
      setMafiaAttack(targetAddress);
    }
  };

  const handleAccuse = async () => {
    if (accuseAddress) {
      try {
        await writeContractAsync({
          functionName: "accusePlayer",
          args: [accuseAddress as `0x${string}`],
        });
        setAccuseAddress("");
      } catch (error) {
        console.error("Error executing accusePlayer", error);
      }
    }
  };

  const handleVote = async () => {
    try {
      await writeContractAsync({
        functionName: "voteForElimination",
        args: [voteAddress as `0x${string}`],
      });
      const newHasVoted = {
        ...hasVoted,
        [connectedAddress as `0x${string}`]: true,
      };
      setHasVoted(newHasVoted);
      setVoteAddress("");
    } catch (error) {
      console.error("Error voting for elimination", error);
    }
  };

  return (
    <div className="w-full max-w-3xl space-y-6">
      {currentPlayer && phase === "Night" && (
        <div className="mb-4 p-4 border rounded-md">
          <h2 className="text-xl font-semibold text-primary-lighter">Current Player</h2>
          <p>Address: {currentPlayer.addr}</p>
          <p>Role: {currentPlayer.role}</p>
          <p>Status: {currentPlayer.alive ? "Alive" : "Dead"}</p>
          {currentPlayer.role === "Detective" && currentPlayer.alive && (
            <div className="mt-4 flex space-x-2">
              <input
                type="text"
                placeholder="Enter address to investigate"
                value={investigateAddress}
                onChange={e => setInvestigateAddress(e.target.value)}
                className="input input-bordered rounded-md w-full"
              />
              <button onClick={handleInvestigate} className="btn rounded-md btn-primary">
                Investigate
              </button>
            </div>
          )}
          {currentPlayer.role === "Doctor" && currentPlayer.alive && (
            <div className="mt-4 flex space-x-2">
              <input
                type="text"
                placeholder="Enter address to save"
                value={saveAddress}
                onChange={e => setSaveAddress(e.target.value)}
                className="input input-bordered rounded-md w-full"
              />
              <button onClick={handleSave} className="btn rounded-md btn-primary">
                Save
              </button>
            </div>
          )}
          {currentPlayer.role === "Mafia" && currentPlayer.alive && (
            <div className="mt-4 flex space-x-2">
              <input
                type="text"
                placeholder="Enter address to target"
                value={targetAddress}
                onChange={e => setTargetAddress(e.target.value)}
                className="input input-bordered rounded-md w-full"
              />
              <button onClick={handleTarget} className="btn rounded-md btn-primary">
                Target
              </button>
            </div>
          )}
        </div>
      )}
      {connectedAddress && currentPlayer && phase === "Day" && !allPlayersAccused && (
        <div className="mb-4 p-4 border rounded-md w-full max-w-lgflex flex-col space-y-4">
          <h2 className="text-xl font-semibold text-primary-lighter">Current Player</h2>
          <p>Address: {currentPlayer.addr}</p>
          <p>Role: {currentPlayer.role}</p>
          <p>Status: {currentPlayer.alive ? "Alive" : "Dead"}</p>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter address to accuse"
              value={accuseAddress}
              onChange={e => setAccuseAddress(e.target.value)}
              className="input input-bordered rounded-md w-full"
              disabled={hasAccused[connectedAddress]}
            />
            <button
              onClick={handleAccuse}
              className={`btn rounded-md btn-primary ${hasAccused[connectedAddress] ? "btn-disabled" : ""}`}
            >
              Accuse
            </button>
          </div>
        </div>
      )}
      {connectedAddress && currentPlayer && phase === "Day" && allPlayersAccused && (
        <div className="mb-4 p-4 border rounded-md w-full max-w-lgflex flex-col space-y-4">
          <h2 className="text-xl font-semibold text-primary-lighter">Current Player</h2>
          <p>Address: {currentPlayer.addr}</p>
          <p>Role: {currentPlayer.role}</p>
          <p>Status: {currentPlayer.alive ? "Alive" : "Dead"}</p>
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
              Vote to eliminate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerActions;
