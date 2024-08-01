import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import PlayerList from "~~/components/mafia-game/PlayerList";
import { useScaffoldContract, useScaffoldWatchContractEvent, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface Player {
  addr: string;
  role: string;
  alive: boolean;
}

interface PlayerComponentProps {
  players: Player[];
  phase: string;
  setStory: (story: string) => void;
}

const PlayerComponent: React.FC<PlayerComponentProps> = ({ players, phase, setStory }) => {
  const { address: connectedAddress } = useAccount();
  const currentPlayer = players.find(player => player.addr === connectedAddress);

  const [investigateAddress, setInvestigateAddress] = useState<string>("");
  const [saveAddress, setSaveAddress] = useState<string>("");
  const [targetAddress, setTargetAddress] = useState<string>("");
  const [accuseAddress, setAccuseAddress] = useState<string>("");
  const [hasAccused, setHasAccused] = useState<{ [key: string]: boolean }>({});
  const [accusations, setAccusations] = useState<{ [key: string]: string }>({});
  const [hasVoted, setHasVoted] = useState<{ [key: string]: boolean }>({});
  const [eliminatedPlayers, setEliminatedPlayers] = useState<Player[]>([]);
  const [accusedPlayers, setAccusedPlayers] = useState<Player[]>([]);
  const [voteAddress, setVoteAddress] = useState<string>("");
  const [gameOutcome, setGameOutcome] = useState<string>("");
  const [mafiaAttack, setMafiaAttack] = useState<string | null>(null);
  const [doctorSave, setDoctorSave] = useState<string | null>(null);
  const [detectiveInvestigation, setDetectiveInvestigation] = useState<string | null>(null);

  const { data: mafiaGameContract } = useScaffoldContract({
    contractName: "MafiaGame",
  });

  const { writeContractAsync } = useScaffoldWriteContract("MafiaGame");

  useEffect(() => {
    const fetchAccusations = async () => {
      for (let i = 0; i < players.length; i++) {
        const accused = await mafiaGameContract?.read.accusations([players[i].addr as `0x${string}`]);
        if (accused && accused !== "0x0000000000000000000000000000000000000000") {
          setHasAccused(prev => ({ ...prev, [players[i].addr]: true }));
          setAccusations(prev => ({ ...prev, [players[i].addr]: accused }));
          const accusedPlayer = players.find(player => player.addr === accused);
          if (accusedPlayer) {
            setAccusedPlayers(prevPlayers => {
              const playerExists = prevPlayers.some(p => p.addr === accused);
              if (!playerExists) {
                return [...prevPlayers, accusedPlayer];
              }
              return prevPlayers;
            });
          }
        }
      }
    };

    fetchAccusations();
  }, [players]);

  useEffect(() => {
    const fetchEliminatedPlayers = async () => {
      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const isAlive = await mafiaGameContract?.read.players([player.addr as `0x${string}`]);
        if (isAlive) {
          player.alive = isAlive[2];
          if (!player.alive) {
            setEliminatedPlayers(prevPlayers => {
              const playerExists = prevPlayers.some(p => p.addr === player.addr);
              if (!playerExists) {
                return [...prevPlayers, player];
              }
              return prevPlayers;
            });
          }
        }
      }
    };

    fetchEliminatedPlayers();
  }, [players]);

  useScaffoldWatchContractEvent({
    contractName: "MafiaGame",
    eventName: "PlayerAccused",
    onLogs: logs => {
      logs.forEach(log => {
        const accuser = log.args.accuser as string;
        const accused = log.args.accused as string;
        if (
          connectedAddress &&
          accuser === connectedAddress &&
          accused !== "0x0000000000000000000000000000000000000000"
        ) {
          setHasAccused(prev => ({ ...prev, [connectedAddress]: true }));
          setAccusations(prev => ({ ...prev, [accuser]: accused || "" }));
          const accusedPlayer = players.find(player => player.addr === accused);
          if (accusedPlayer) {
            setAccusedPlayers(prevPlayers => {
              const playerExists = prevPlayers.some(p => p.addr === accused);
              if (!playerExists) {
                return [...prevPlayers, accusedPlayer];
              }
              return prevPlayers;
            });
          }
        }
      });
    },
  });

  useScaffoldWatchContractEvent({
    contractName: "MafiaGame",
    eventName: "VotingCompleted",
    onLogs: logs => {
      logs.forEach(log => {
        const eliminated = log.args.eliminatedPlayer as string;
        const eliminatedPlayer: Player | undefined = players.find(player => player.addr === eliminated);

        if (eliminatedPlayer) {
          eliminatedPlayer.alive = false;
          setEliminatedPlayers(prevPlayers => {
            const playerExists = prevPlayers.some(p => p.addr === eliminatedPlayer.addr);
            if (!playerExists) {
              return [...prevPlayers, eliminatedPlayer];
            }
            return prevPlayers;
          });
        }

        for (let i = 0; i < players.length; i++) {
          setHasVoted(prev => ({ ...prev, [players[i].addr as `0x${string}`]: true }));
        }
      });
    },
  });

  useScaffoldWatchContractEvent({
    contractName: "MafiaGame",
    eventName: "PhaseChanged",
    onLogs: logs => {
      logs.forEach(log => {
        const phaseNumber: number | undefined = log.args.newPhase;
        if (phaseNumber === 1) {
          // Assuming 1 is the Night phase
          setAccusations({});
          setHasAccused({});
          setAccusedPlayers([]);
        }
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

  const allPlayersAccused = Object.keys(accusations).length === players.length;

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
          <div className="mb-4 p-4 border rounded-md w-full max-w-lg text-white flex flex-col space-y-4">
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
                disabled={hasVoted[connectedAddress]}
              />
              <button
                onClick={handleVote}
                className={`btn rounded-md btn-primary ${hasVoted[connectedAddress] ? "btn-disabled" : ""}`}
              >
                Vote to eliminate
              </button>
            </div>
          </div>
        )}
        {allPlayersAccused ? (
          <>
            <h2 className="text-2xl font-semibold mb-4 text-primary-lighter">Accused Players</h2>
            <PlayerList
              players={accusedPlayers.filter(player => player.addr !== connectedAddress && player.alive)}
              showRoles={false}
            />
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold mb-4 text-primary-lighter">Players</h2>
            <PlayerList
              players={players.filter(player => player.addr !== connectedAddress && player.alive)}
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
        {gameOutcome && (
          <div className="mt-4 p-4 border rounded-md w-full max-w-lg">
            <h2 className="text-2xl font-semibold">{gameOutcome}</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerComponent;
