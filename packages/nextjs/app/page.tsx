"use client";

import { useEffect, useMemo, useState } from "react";
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

  const { data: mayorAddress } = useScaffoldReadContract({
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
      logs.forEach(log => {
        const _player = log.args.player;
        if (_player && _player.addr) {
          const player: Player = {
            addr: _player.addr.toString(),
            role: "",
            alive: true,
          };
          // console.log("📡 PlayerJoined event", player);
          setPlayers(prevPlayers => {
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

  useScaffoldWatchContractEvent({
    contractName: "MafiaGame",
    eventName: "RoleAssigned",
    onLogs: logs => {
      logs.forEach(log => {
        const playerAddress: string | undefined = log.args.player;
        const roleNumber: number | undefined = log.args.role;
        if (playerAddress && roleNumber !== undefined) {
          // console.log("📡 RoleAssigned event", playerAddress, roleNumber);
          const roleName = roleMapping[roleNumber];
          setPlayers(prevPlayers =>
            prevPlayers.map(player => (player.addr === playerAddress ? { ...player, role: roleName } : player)),
          );
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
        if (phaseNumber !== undefined) {
          const phaseName = phaseMapping[phaseNumber];
          setCurrentPhase(phaseName);
        }
      });
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

  const isMayor = useMemo(() => connectedAddress === mayorAddress, [connectedAddress, mayorAddress]);

  useEffect(() => {
    console.log("useEffect phase:", isLoadingPhase);
    if (phase != undefined) {
      const phaseName = phaseMapping[phase];
      console.log("useEffect phase:", phaseName);
      setCurrentPhase(phaseName);
      if (phaseName === "Day") {
        setTheme("light");
        return;
      }
      setTheme("dark");
    }
  }, [phase, isLoadingPhase]);

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
        />
      )}
    </div>
  );
};

export default Home;
