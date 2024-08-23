import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import PlayerList from "~~/components/mafia-game/PlayerList";
import {
  useScaffoldContract,
  useScaffoldReadContract,
  useScaffoldWatchContractEvent,
  useScaffoldWriteContract,
} from "~~/hooks/scaffold-eth";

interface Player {
  addr: string;
  role: string;
  alive: boolean;
}

interface PlayerComponentProps {
  players: Player[];
  phase: string;
  setGameOutcome: (story: string) => void;
  setStory: (story: string) => void;
  votingCompleted: boolean | undefined;
  accusationCompleted: boolean | undefined;
  alivePlayers: Player[];
  accusedPlayers: Player[];
  eliminatedPlayers: Player[];
  hasAccused: { [key: string]: boolean };
}

const PlayerComponent: React.FC<PlayerComponentProps> = ({
  players,
  phase,
  setStory,
  setGameOutcome,
  votingCompleted,
  accusationCompleted,
  alivePlayers,
  accusedPlayers,
  eliminatedPlayers,
  hasAccused,
}) => {
  const { address: connectedAddress } = useAccount();
  const currentPlayer = players.find(player => player.addr === connectedAddress);

  const [investigateAddress, setInvestigateAddress] = useState<string>("");
  const [saveAddress, setSaveAddress] = useState<string>("");
  const [targetAddress, setTargetAddress] = useState<string>("");
  const [accuseAddress, setAccuseAddress] = useState<string>("");
  const [hasVoted, setHasVoted] = useState<{ [key: string]: boolean }>({});
  const [voteAddress, setVoteAddress] = useState<string>("");
  const [mafiaAttack, setMafiaAttack] = useState<string | null>(null);
  const [doctorSave, setDoctorSave] = useState<string | null>(null);
  const [detectiveInvestigation, setDetectiveInvestigation] = useState<string | null>(null);

  const { data: mafiaGameContract } = useScaffoldContract({
    contractName: "MafiaGame",
  });

  const { writeContractAsync } = useScaffoldWriteContract("MafiaGame");

  useScaffoldWatchContractEvent({
    contractName: "MafiaGame",
    eventName: "VoteCast",
    onLogs: logs => {
      logs.forEach(log => {
        const voter = log.args.voter as string;
        setHasVoted(prev => ({ ...prev, [voter as `0x${string}`]: true }));
      });
    },
  });

  useScaffoldWatchContractEvent({
    contractName: "MafiaGame",
    eventName: "GameWon",
    onLogs: logs => {
      logs.forEach(log => {
        const message: string | undefined = log.args.message;
        if (message) {
          setGameOutcome(message);
          // Assuming 0 is the Day phase
          let nightStory = "Last night was peaceful.";
          if (mafiaAttack) {
            nightStory = `Last night, the mafia killed ${mafiaAttack}.`;
            if (doctorSave && doctorSave === mafiaAttack) {
              nightStory = `Last night, the mafia tried to kill ${mafiaAttack}, but the doctor saved them.`;
            }
          }
          setStory(`${nightStory}\n${detectiveInvestigation || "The detective did not investigate anyone."}`);
          setMafiaAttack(null);
          setDoctorSave(null);
          setDetectiveInvestigation(null);
        }
      });
    },
  });

  useScaffoldWatchContractEvent({
    contractName: "MafiaGame",
    eventName: "GameContinue",
    onLogs: () => {
      setGameOutcome("The game continues!");
      // Assuming 0 is the Day phase
      let nightStory = "Last night was peaceful.";
      if (mafiaAttack && mafiaAttack !== doctorSave) {
        nightStory = `Last night, the mafia killed ${targetAddress}.`;
      } else if (mafiaAttack) {
        nightStory = `Last night, the mafia tried to kill ${targetAddress}, but the doctor save them.`;
      }

      if (detectiveInvestigation) {
        const investigated: Player | undefined = players.find(player => player.addr === detectiveInvestigation);
        if (investigated && investigated.role === "Mafia") {
          nightStory += `The detective discovered that ${detectiveInvestigation} is a mafia member.`;
        } else {
          nightStory += `The detective found no evidence against ${detectiveInvestigation}.`;
        }
      }
      setStory(`${nightStory}\n${detectiveInvestigation || "The detective did not investigate anyone."}`);
      setMafiaAttack(null);
      setDoctorSave(null);
      setDetectiveInvestigation(null);
    },
  });

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
      setHasVoted(prev => ({ ...prev, [connectedAddress as `0x${string}`]: true }));
      setVoteAddress("");
    } catch (error) {
      console.error("Error voting for elimination", error);
    }
  };

  if (currentPlayer && !currentPlayer.alive) {
    return (
      <div className="mb-6 flex flex-col items-center">
        <h2 className="text-4xl font-semibold mb-4 text-red-500">You have been eliminated</h2>
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-col items-center space-y-6">
      <h2 className="text-4xl font-semibold text-primary-lighter">Player</h2>
      <div className="w-full max-w-3xl space-y-6">
        {currentPlayer && phase === "Night" && (
          <div className="mb-4 p-4 border rounded-md">
            <h2 className="text-xl font-semibold  text-primary-lighter">Current Player</h2>
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
        {connectedAddress && currentPlayer && phase === "Day" && !accusationCompleted && (
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
        {connectedAddress && currentPlayer && phase === "Day" && accusationCompleted && (
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
        <>
          <h2 className="text-2xl font-semibold mb-4 text-primary-lighter">Players</h2>
          <PlayerList
            players={alivePlayers.filter(player => player.addr !== connectedAddress && player.alive)}
            showRoles={false}
          />
        </>
        {accusationCompleted && (
          <>
            <h2 className="text-2xl font-semibold mb-4 text-primary-lighter">Accused Players</h2>
            <PlayerList
              players={accusedPlayers.filter(player => player.addr !== connectedAddress && player.alive)}
              showRoles={false}
            />
          </>
        )}
        {eliminatedPlayers.length > 0 && (
          <>
            <h2 className="text-2xl font-semibold mb-4 text-red-500">Eliminated Players</h2>
            <PlayerList players={eliminatedPlayers} showRoles={true} />
          </>
        )}
      </div>
    </div>
  );
};

export default PlayerComponent;
