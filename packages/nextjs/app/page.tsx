"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useTheme } from "next-themes";
import { useAccount } from "wagmi";
import JoinGameComponent from "~~/components/mafia-game/JoinGameComponent";
import MayorComponent from "~~/components/mafia-game/MayorComponent";
import PlayerComponent from "~~/components/mafia-game/PlayerComponent";
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

const roleMapping: { [key: number]: string } = {
  1: "Mafia",
  2: "Doctor",
  3: "Detective",
  4: "Townsperson",
};

const phaseMapping: { [key: number]: string } = {
  0: "Day",
  1: "Night",
};

const Home: NextPage = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isMayor, setIsMayor] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string>("");
  const { address: connectedAddress } = useAccount();
  const { setTheme } = useTheme();

  const { data: mafiaGameContract } = useScaffoldContract({
    contractName: "MafiaGame",
  });

  const { data: playersAddress, isLoading: isLoadingPlayersAddress } = useScaffoldReadContract({
    contractName: "MafiaGame",
    functionName: "getPlayers",
  });

  const { data: mayorAddress, isLoading: isLoadingMayorAddress } = useScaffoldReadContract({
    contractName: "MafiaGame",
    functionName: "mayor",
  });

  const { data: gameStarted } = useScaffoldReadContract({
    contractName: "MafiaGame",
    functionName: "gameStarted",
  });

  const { data: phase, isLoading: isLoadingPhase } = useScaffoldReadContract({
    contractName: "MafiaGame",
    functionName: "currentPhase",
  });

  const { writeContractAsync } = useScaffoldWriteContract("MafiaGame");

  useScaffoldWatchContractEvent({
    contractName: "MafiaGame",
    eventName: "PlayerJoined",
    onLogs: logs => {
      const newPlayers = logs
        .map(log => ({
          addr: log.args.player?.toString() || "",
          role: "",
          alive: true,
        }))
        .filter(player => player.addr);

      setPlayers(prevPlayers => {
        const updatedPlayers = [...prevPlayers];
        newPlayers.forEach(newPlayer => {
          if (!updatedPlayers.some(player => player.addr === newPlayer.addr)) {
            updatedPlayers.push(newPlayer);
          }
        });
        return updatedPlayers;
      });
    },
  });

  useScaffoldWatchContractEvent({
    contractName: "MafiaGame",
    eventName: "RoleAssigned",
    onLogs: logs => {
      setPlayers(prevPlayers =>
        prevPlayers.map(player => {
          const log = logs.find(log => log.args.player === player.addr);
          if (log) {
            const roleNumber = log.args.role as keyof typeof roleMapping | undefined;
            if (roleNumber !== undefined) {
              return { ...player, role: roleMapping[roleNumber] };
            } else {
              console.error("roleNumber is undefined");
            }
          }
          return player;
        }),
      );
    },
  });

  useScaffoldWatchContractEvent({
    contractName: "MafiaGame",
    eventName: "PhaseChanged",
    onLogs: logs => {
      const log = logs[0];
      if (log) {
        const newPhase = log.args.newPhase as keyof typeof phaseMapping | undefined;
        if (newPhase !== undefined) {
          const phaseName = phaseMapping[newPhase];
          setCurrentPhase(phaseName);
        } else {
          console.error("newPhase is undefined");
        }
      }
    },
  });

  useEffect(() => {
    const fetchPlayers = async () => {
      if (!playersAddress) {
        console.error("playersAddress is undefined");
        return;
      }
      try {
        // const playersAddress = await readPlayersAddress();
        const _players: Player[] = [];

        for (let i = 0; i < playersAddress.length; i++) {
          const player = await mafiaGameContract?.read.players([playersAddress[i]]);
          console.log("player", player);
          if (player) {
            const roleName = roleMapping[player[1]];
            _players.push({ addr: player[0], role: roleName, alive: player[2] });
          }
        }
        setPlayers(_players);
      } catch (error) {
        console.error("Error fetching players", error);
      }
    };

    if (!isLoadingPlayersAddress) {
      fetchPlayers();
    }
  }, [playersAddress, isLoadingPlayersAddress]);

  useEffect(() => {
    if (connectedAddress) {
      setHasJoined(players.some(player => player.addr === connectedAddress));
    }
  }, [players, connectedAddress]);

  console.log("connectedAddress", connectedAddress);

  useEffect(() => {
    console.log("connectedAddress", connectedAddress);
    console.log("mayorAddress", mayorAddress);
    setIsMayor(connectedAddress === mayorAddress);
  }, [mayorAddress, isLoadingMayorAddress, connectedAddress]);

  useEffect(() => {
    if (phase !== undefined) {
      const phaseName = phaseMapping[phase];
      setCurrentPhase(phaseName);
      setTheme(phaseName === "Day" ? "light" : "dark");
    }
  }, [phase, isLoadingPhase, setTheme]);

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
      console.error("Error joining the game", e);
    }
  };

  const handleStartGame = async () => {
    try {
      await writeContractAsync(
        {
          functionName: "startGame",
        },
        {
          onBlockConfirmation: txnReceipt => {
            console.log("📦 Transaction blockHash", txnReceipt.blockHash);
          },
        },
      );
    } catch (e) {
      console.error("Error starting the game", e);
    }
  };

  const handleNextPhase = async () => {
    try {
      await writeContractAsync(
        {
          functionName: "nextPhase",
        },
        {
          onBlockConfirmation: txnReceipt => {
            console.log("📦 Transaction blockHash", txnReceipt.blockHash);
          },
        },
      );
    } catch (e) {
      console.error("Error starting the game", e);
    }
  };

  return (
    <div>
      {!isMayor && !gameStarted && (
        <JoinGameComponent players={players} handleJoinGame={handleJoinGame} hasJoined={hasJoined} />
      )}
      {!isMayor && gameStarted && <PlayerComponent players={players} phase={currentPhase} />}
      {isMayor && (
        <MayorComponent
          players={players}
          gameStarted={gameStarted}
          handleStartGame={handleStartGame}
          handleNextPhase={handleNextPhase}
          phase={currentPhase}
        />
      )}
    </div>
  );
};

export default Home;
