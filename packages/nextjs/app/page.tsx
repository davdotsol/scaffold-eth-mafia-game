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
  const [gameOutcome, setGameOutcome] = useState<string>("");
  const [story, setStory] = useState<string>("");
  const [votingCompleted, setVotingCompleted] = useState<boolean>(false);
  const [playerEliminated, setPlayerEliminated] = useState<boolean>(false);
  const [alivePlayers, setAlivePlayers] = useState<Player[]>([]);
  const [eliminatedPlayers, setEliminatedPlayers] = useState<Player[]>([]);
  const [winChecked, setWinChecked] = useState<boolean>(false);
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

  const { data: phase } = useScaffoldReadContract({
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
          if (phaseName === "Night") {
            setGameOutcome("");
            setStory("");
          }
        }
      });
    },
  });

  useScaffoldWatchContractEvent({
    contractName: "MafiaGame",
    eventName: "PlayerEliminated",
    onLogs: logs => {
      logs.forEach(log => {
        const eliminated = log.args.eliminatedPlayer as string;
        const updatedPlayers = players.map(player =>
          player.addr === eliminated ? { ...player, alive: false } : player,
        );
        setPlayers(updatedPlayers);
        setPlayerEliminated(true);
        setAlivePlayers(updatedPlayers.filter(player => player.alive));
        setEliminatedPlayers(updatedPlayers.filter(player => !player.alive));
      });
    },
  });

  useScaffoldWatchContractEvent({
    contractName: "MafiaGame",
    eventName: "VotingCompleted",
    onLogs: logs => {
      logs.forEach(log => {
        const eliminatedPlayerAddr: string | undefined = log.args.eliminatedPlayer;
        if (eliminatedPlayerAddr) {
          setVotingCompleted(true);
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
        const _players: Player[] = [];
        for (let i = 0; i < playersAddress.length; i++) {
          const player = await mafiaGameContract?.read.players([playersAddress[i]]);
          if (player) {
            const roleName = roleMapping[player[1]];
            _players.push({ addr: player[0], role: roleName, alive: player[2] });
          }
        }
        setPlayers(_players);
        setAlivePlayers(_players.filter(player => player.alive));
        setEliminatedPlayers(_players.filter(player => !player.alive));
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
    if (phase != undefined) {
      const phaseName = phaseMapping[phase];
      setCurrentPhase(phaseName);
      if (phaseName === "Day") {
        setTheme("light");
        return;
      }
      setTheme("dark");
    }
  }, [phase]);

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
            setWinChecked(false); // Reset winChecked for the next round
          },
        },
      );
    } catch (e) {
      console.error("Error advancing to the next phase", e);
    }
  };

  const handleCheckWin = async () => {
    try {
      await writeContractAsync(
        {
          functionName: "checkWin",
        },
        {
          onBlockConfirmation: txnReceipt => {
            console.log("📦 Transaction blockHash", txnReceipt.blockHash);
            setWinChecked(true);
          },
        },
      );
    } catch (e) {
      console.error("Error checking win status", e);
    }
  };

  return (
    <div className="mb-6 flex flex-col items-center space-y-6">
      {!isMayor && !gameStarted && (
        <JoinGameComponent players={players} handleJoinGame={handleJoinGame} hasJoined={hasJoined} />
      )}

      {gameOutcome && (
        <div className="w-full max-w-3xl space-y-6">
          <div className="mt-4 p-4 border rounded-md">
            <h2 className="text-2xl font-semibold">{gameOutcome}</h2>
            {story && <p>{story}</p>}
          </div>
        </div>
      )}
      {!isMayor && gameStarted && (
        <PlayerComponent
          players={players}
          phase={currentPhase}
          setGameOutcome={setGameOutcome}
          setStory={setStory}
          votingCompleted={votingCompleted}
          alivePlayers={alivePlayers}
          eliminatedPlayers={eliminatedPlayers}
        />
      )}
      {isMayor && (
        <MayorComponent
          players={players}
          gameStarted={gameStarted}
          handleStartGame={handleStartGame}
          handleNextPhase={handleNextPhase}
          handleCheckWin={handleCheckWin}
          phase={currentPhase}
          votingCompleted={votingCompleted}
          playerEliminated={playerEliminated}
          alivePlayers={alivePlayers}
          eliminatedPlayers={eliminatedPlayers}
          winChecked={winChecked}
        />
      )}
    </div>
  );
};

export default Home;
