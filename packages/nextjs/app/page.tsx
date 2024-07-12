"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import JoinGameComponent from "~~/components/mafia-game/JoinGameComponent";
import {
  useScaffoldReadContract,
  useScaffoldWatchContractEvent,
  useScaffoldWriteContract,
} from "~~/hooks/scaffold-eth";

interface Player {
  addr: string;
  role: number;
  alive: boolean;
}

const Home: NextPage = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [hasJoined, setHasJoined] = useState(false);
  const { address: connectedAddress } = useAccount();

  const { writeContractAsync, isPending } = useScaffoldWriteContract("MafiaGame");
  console.log("ispending", isPending);
  const { data: playersAddress } = useScaffoldReadContract({
    contractName: "MafiaGame",
    functionName: "getPlayers",
  });

  console.log("player addresses", playersAddress);

  useScaffoldWatchContractEvent({
    contractName: "MafiaGame",
    eventName: "PlayerJoined",
    // The onLogs function is called whenever a GreetingChange event is emitted by the contract.
    // Parameters emitted by the event can be destructed using the below example
    // for this example: event GreetingChange(address greetingSetter, string newGreeting, bool premium, uint256 value);
    onLogs: logs => {
      logs.map(log => {
        const player: Player | undefined = log.args.player;
        if (player) {
          console.log("📡 PlayerJoined event", player);
          setPlayers(prevPlayers => {
            // Check if player already exists in the array
            const playerExists = prevPlayers.some(p => p.addr === player.addr);
            if (!playerExists) {
              return [...prevPlayers, player];
            }
            return prevPlayers;
          });
        }
      });
    },
  });

  useEffect(() => {
    if (connectedAddress) {
      setHasJoined(players.some(player => player.addr === connectedAddress));
    }
  }, [players, connectedAddress]);

  const handleJoinGame = async () => {
    try {
      await writeContractAsync(
        {
          functionName: "joinGame",
        },
        {
          onBlockConfirmation: txnReceipt => {
            console.log("📦 Transaction blockHash", txnReceipt.blockHash);
          },
        },
      );
    } catch (e) {
      console.error("Error setting greeting", e);
    }
  };

  return (
    <div>
      <JoinGameComponent players={players} handleJoinGame={handleJoinGame} hasJoined={hasJoined} />
    </div>
  );
};

export default Home;
