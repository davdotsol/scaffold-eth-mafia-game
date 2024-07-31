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
}

const PlayerComponent: React.FC<PlayerComponentProps> = ({ players, phase }) => {
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

  const { data: mafiaGameContract } = useScaffoldContract({
    contractName: "MafiaGame",
  });

  const { writeContractAsync } = useScaffoldWriteContract("MafiaGame");

  useEffect(() => {
    const fetchAccusations = async () => {
      for (let i = 0; i < players.length; i++) {
        console.log(`Fetching accusation for player ${players[i].addr}`);
        const accused = await mafiaGameContract?.read.accusations([players[i].addr as `0x${string}`]);
        console.log(`Accused address for player ${players[i].addr}: ${accused}`);
        if (accused && accused !== "0x0000000000000000000000000000000000000000") {
          setHasAccused(prev => ({ ...prev, [players[i].addr]: true }));
          setAccusations(prev => ({ ...prev, [players[i].addr]: accused }));
          const accusedPlayer = players.find(player => player.addr === accused);
          console.log("Found accused player", accusedPlayer);
          if (accusedPlayer) {
            setAccusedPlayers(prevPlayers => {
              const playerExists = prevPlayers.some(p => p.addr === accused);
              if (!playerExists) {
                console.log(`Adding accused player ${accusedPlayer.addr}`);
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
        console.log(`Fetching alive status for player ${player.addr}`);
        const isAlive = await mafiaGameContract?.read.players([player.addr as `0x${string}`]);
        if (isAlive) {
          player.alive = isAlive[2];
          console.log(`Player ${player.addr} alive status: ${player.alive}`);

          if (!player.alive) {
            setEliminatedPlayers(prevPlayers => {
              const playerExists = prevPlayers.some(p => p.addr === player.addr);
              if (!playerExists) {
                console.log(`Adding eliminated player ${player.addr}`);
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
                console.log(`Adding accused player ${accusedPlayer.addr}`);
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
        const eliminatedPlayer = players.find(player => player.addr === eliminated);
        console.log("Eliminated player", eliminatedPlayer);

        if (eliminatedPlayer) {
          setEliminatedPlayers(prevPlayers => {
            const playerExists = prevPlayers.some(p => p.addr === eliminatedPlayer.addr);
            if (!playerExists) {
              console.log(`Adding eliminated player ${eliminatedPlayer.addr}`);
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
          console.log("Resetting accusations for the night phase");
          setAccusations({});
          setHasAccused({});
          setAccusedPlayers([]);
        }
      });
    },
  });

  const handleInvestigate = () => {
    if (investigateAddress) {
      console.log("Investigating player with address:", investigateAddress);
      setInvestigateAddress("");
    }
  };

  const handleSave = () => {
    if (saveAddress) {
      console.log("Saving player with address:", saveAddress);
      setSaveAddress("");
    }
  };

  const handleTarget = () => {
    if (targetAddress) {
      console.log("Targeting player with address:", targetAddress);
      setTargetAddress("");
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
        <h2 className="text-4xl font-semibold mb-4 text-primary-lighter">You have been eliminated</h2>
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-col items-center">
      <h2 className="text-4xl font-semibold mb-4 text-primary-lighter">Player</h2>
      {currentPlayer && phase === "Night" && (
        <div className="mb-4 p-4 border rounded-md">
          <h2 className="text-xl font-semibold">Current Player</h2>
          <p>Address: {currentPlayer.addr}</p>
          <p>Role: {currentPlayer.role}</p>
          <p>Status: {currentPlayer.alive ? "Alive" : "Dead"}</p>
          {currentPlayer.role === "Detective" && currentPlayer.alive && (
            <div className="mt-4">
              <input
                type="text"
                placeholder="Enter address to investigate"
                value={investigateAddress}
                onChange={e => setInvestigateAddress(e.target.value)}
                className="input input-bordered rounded-md w-full max-w-xs mr-1"
              />
              <button onClick={handleInvestigate} className="btn rounded-md btn-primary ml-1">
                Investigate
              </button>
            </div>
          )}
          {currentPlayer.role === "Doctor" && currentPlayer.alive && (
            <div className="mt-4">
              <input
                type="text"
                placeholder="Enter address to save"
                value={saveAddress}
                onChange={e => setSaveAddress(e.target.value)}
                className="input input-bordered rounded-md w-full max-w-xs mr-1"
              />
              <button onClick={handleSave} className="btn rounded-md btn-primary ml-1">
                Save
              </button>
            </div>
          )}
          {currentPlayer.role === "Mafia" && currentPlayer.alive && (
            <div className="mt-4">
              <input
                type="text"
                placeholder="Enter address to target"
                value={targetAddress}
                onChange={e => setTargetAddress(e.target.value)}
                className="input input-bordered rounded-md w-full max-w-xs mr-1"
              />
              <button onClick={handleTarget} className="btn rounded-md btn-primary ml-1">
                Target
              </button>
            </div>
          )}
        </div>
      )}
      {connectedAddress && currentPlayer && phase === "Day" && !allPlayersAccused && (
        <div className="mb-4 p-4 border rounded-md flex-col">
          <h2 className="text-xl font-semibold">Current Player</h2>
          <p>Address: {currentPlayer.addr}</p>
          <p>Role: {currentPlayer.role}</p>
          <p>Status: {currentPlayer.alive ? "Alive" : "Dead"}</p>
          <div className="mt-4 flex">
            <input
              type="text"
              placeholder="Enter address to accuse"
              value={accuseAddress}
              onChange={e => setAccuseAddress(e.target.value)}
              className="input input-bordered rounded-md w-full max-w-xs mr-1"
              disabled={hasAccused[connectedAddress]}
            />
            <button
              onClick={handleAccuse}
              className={`btn rounded-md btn-primary ml-1 ${hasAccused[connectedAddress] ? "btn-disabled" : ""}`}
            >
              Accuse
            </button>
          </div>
        </div>
      )}
      {connectedAddress && currentPlayer && phase === "Day" && allPlayersAccused && (
        <div className="mb-4 p-4 border rounded-md flex-col">
          <h2 className="text-xl font-semibold">Current Player</h2>
          <p>Address: {currentPlayer.addr}</p>
          <p>Role: {currentPlayer.role}</p>
          <p>Status: {currentPlayer.alive ? "Alive" : "Dead"}</p>
          <div className="mt-4 flex">
            <input
              type="text"
              placeholder="Enter address to vote"
              value={voteAddress}
              onChange={e => setVoteAddress(e.target.value)}
              className="input input-bordered rounded-md w-full max-w-xs mr-1"
              disabled={hasVoted[connectedAddress]}
            />
            <button
              onClick={handleVote}
              className={`btn rounded-md btn-primary ml-1 ${hasVoted[connectedAddress] ? "btn-disabled" : ""}`}
            >
              Vote to eliminate
            </button>
          </div>
        </div>
      )}
      {allPlayersAccused ? (
        <div className="mb-6 flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-4 text-primary-lighter">Accused Players</h2>
          <PlayerList players={accusedPlayers.filter(player => player.addr !== connectedAddress)} showRoles={false} />
        </div>
      ) : (
        <div className="mb-6 flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-4 text-primary-lighter">Players</h2>
          <PlayerList players={players.filter(player => player.addr !== connectedAddress)} showRoles={false} />
        </div>
      )}
      {eliminatedPlayers.length > 0 && (
        <div className="mb-6 flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-4 text-primary-lighter">Eliminated Players</h2>
          <PlayerList players={eliminatedPlayers} showRoles={true} />
        </div>
      )}
    </div>
  );
};

export default PlayerComponent;
