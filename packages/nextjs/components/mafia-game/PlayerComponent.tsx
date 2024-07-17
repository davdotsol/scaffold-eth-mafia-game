import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import PlayerList from "~~/components/mafia-game/PlayerList";
import VoteComponent from "~~/components/mafia-game/VoteComponent";
import { useScaffoldWatchContractEvent, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface PlayerComponentProps {
  players: { addr: string; role: string; alive: boolean }[];
  phase: string;
}

const PlayerComponent: React.FC<PlayerComponentProps> = ({ players, phase }) => {
  const { address: connectedAddress } = useAccount();
  const currentPlayer = players.find(player => player.addr === connectedAddress);
  const otherPlayers = players.filter(player => player.addr !== connectedAddress);

  const [hasAccused, setHasAccused] = useState(false);
  const [investigateAddress, setInvestigateAddress] = useState<string>("");
  const [saveAddress, setSaveAddress] = useState<string>("");
  const [targetAddress, setTargetAddress] = useState<string>("");
  const [accuseAddress, setAccuseAddress] = useState<string>("");
  const [accusedPlayers, setAccusedPlayers] = useState<string[]>([]);
  const [accusations, setAccusations] = useState<{ [key: string]: string }>({});

  const { writeContractAsync } = useScaffoldWriteContract("MafiaGame");

  useEffect(() => {
    if (phase === "Day") {
      setHasAccused(false);
      setAccusations({});
      setAccusedPlayers([]);
    }
  }, [phase]);

  useScaffoldWatchContractEvent({
    contractName: "MafiaGame",
    eventName: "PlayerAccused",
    onLogs: logs => {
      logs.forEach(log => {
        const accuser = log.args.accuser;
        // const accused = log.args.accused;
        if (accuser === connectedAddress) {
          setHasAccused(true);
        }
        // setAccusations(prev => ({ ...prev, [accuser]: accused }));
        // setAccusedPlayers(prev => (prev.includes(accused) ? prev : [...prev, accused]));
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
          args: [accuseAddress],
        });
        console.log("Accusing player with address:", targetAddress);
        setAccuseAddress("");
      } catch (error) {
        console.error("Error executing accusePlayer", error);
      }
    }
  };

  const handleVote = async (vote: string) => {
    try {
      // await writeContractAsync({
      //   functionName: "voteForElimination",
      //   args: [vote],
      // });
      console.log("Voted for player with address:", vote);
    } catch (error) {
      console.error("Error voting for elimination", error);
    }
  };

  const allPlayersAccused = Object.keys(accusations).length === players.length - 1;

  return (
    <div className="mb-6 flex flex-col items-center">
      <h2 className="text-4xl font-semibold mb-4 text-primary-lighter">Player</h2>
      {currentPlayer && phase === "Night" && (
        <div className="mb-4 p-4 border rounded-md">
          <h2 className="text-xl font-semibold">Current Player</h2>
          <p>Address: {currentPlayer.addr}</p>
          <p>Role: {currentPlayer.role}</p>
          <p>Status: {currentPlayer.alive ? "Alive" : "Dead"}</p>
          {currentPlayer.role === "Detective" && currentPlayer.alive && phase === "Night" && (
            <div className="mt-4">
              <input
                type="text"
                placeholder="Enter address to investigate"
                value={investigateAddress}
                onChange={e => setInvestigateAddress(e.target.value)}
                className="p-2 border rounded-md mr-2"
              />
              <button onClick={handleInvestigate} className="p-2 bg-blue-500 text-white rounded-md">
                Investigate
              </button>
            </div>
          )}
          {currentPlayer.role === "Doctor" && currentPlayer.alive && phase === "Night" && (
            <div className="mt-4">
              <input
                type="text"
                placeholder="Enter address to save"
                value={saveAddress}
                onChange={e => setSaveAddress(e.target.value)}
                className="p-2 border rounded-md mr-2"
              />
              <button onClick={handleSave} className="p-2 bg-blue-500 text-white rounded-md">
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
                className="p-2 border rounded-md mr-2"
              />
              <button onClick={handleTarget} className="p-2 bg-blue-500 text-white rounded-md">
                Target
              </button>
            </div>
          )}
        </div>
      )}
      {currentPlayer && phase === "Day" && !hasAccused && (
        <div className="mb-4 p-4 border rounded-md">
          <h2 className="text-xl font-semibold">Current Player</h2>
          <p>Address: {currentPlayer.addr}</p>
          <p>Role: {currentPlayer.role}</p>
          <p>Status: {currentPlayer.alive ? "Alive" : "Dead"}</p>
          <div className="mt-4">
            <input
              type="text"
              placeholder="Enter address to accuse"
              value={accuseAddress}
              onChange={e => setAccuseAddress(e.target.value)}
              className="p-2 border rounded-md mr-2"
            />
            <button onClick={handleAccuse} className="p-2 bg-blue-500 text-white rounded-md">
              Accuse
            </button>
          </div>
        </div>
      )}
      {allPlayersAccused && phase === "Day" && (
        <VoteComponent accusedPlayers={accusedPlayers} handleVote={handleVote} />
      )}
      <PlayerList players={otherPlayers} showRoles={false} />
    </div>
  );
};

export default PlayerComponent;
