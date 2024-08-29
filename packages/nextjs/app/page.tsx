"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
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
  const [accusationCompleted, setAccusationCompleted] = useState<boolean>(false);
  const [playerEliminated, setPlayerEliminated] = useState<boolean>(false);
  const [alivePlayers, setAlivePlayers] = useState<Player[]>([]);
  const [accusedPlayers, setAccusedPlayers] = useState<Player[]>([]);
  const [eliminatedPlayers, setEliminatedPlayers] = useState<Player[]>([]);
  const [winChecked, setWinChecked] = useState<boolean>(false);
  const [hasAccused, setHasAccused] = useState<{ [key: string]: boolean }>({});
  const [hasVoted, setHasVoted] = useState<{ [key: string]: boolean }>({});
  const [processedEventHashes, setProcessedEventHashes] = useState<string[]>([]);

  const [mafiaAttack, setMafiaAttack] = useState(null);
  const [doctorSave, setDoctorSave] = useState(null);
  const [detectiveInvestigation, setDetectiveInvestigation] = useState(null);

  const { address: connectedAddress } = useAccount();
  const { setTheme } = useTheme();

  const { data: mafiaGameContract } = useScaffoldContract({
    contractName: "MafiaGame",
  });

  const { data: accusationsCount, isLoading: isLoadingAccusationsCount } = useScaffoldReadContract({
    contractName: "MafiaGame",
    functionName: "accusationsCount",
  });

  const { data: playersAddress, isLoading: isLoadingPlayersAddress } = useScaffoldReadContract({
    contractName: "MafiaGame",
    functionName: "getPlayers",
  });

  const { data: accusedPlayersAddress, isLoading: isLoadingAccusedPlayersAddress } = useScaffoldReadContract({
    contractName: "MafiaGame",
    functionName: "getAccusedPlayers",
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
        const txHash = log.transactionHash;
        if (!processedEventHashes.includes(txHash)) {
          const playerAddress: string | undefined = log.args.player;
          const roleNumber: number | undefined = log.args.role;
          if (playerAddress && roleNumber !== undefined) {
            const roleName = roleMapping[roleNumber];
            const updatedPlayers = players.map(player =>
              player.addr === playerAddress ? { ...player, role: roleName } : player,
            );
            setPlayers(updatedPlayers);
            setAlivePlayers(updatedPlayers.filter(player => player.alive));
            setEliminatedPlayers(updatedPlayers.filter(player => !player.alive));
          }
          setProcessedEventHashes(prevHashes => [...prevHashes, txHash]); // Store the processed hash
        }
      });
    },
  });

  const resetCycle = () => {
    setGameOutcome("");
    setStory("The night has begun. The Mafia, Doctor, and Detective are taking their actions.\n");
    setAccusedPlayers([]);
    setAccusationCompleted(false);
    for (let i = 0; i < players.length; i++) {
      setHasAccused(prev => ({ ...prev, [players[i].addr]: false }));
    }
  };

  useScaffoldWatchContractEvent({
    contractName: "MafiaGame",
    eventName: "PhaseChanged",
    onLogs: logs => {
      logs.forEach(log => {
        const txHash = log.transactionHash;
        if (!processedEventHashes.includes(txHash)) {
          const phaseNumber: number | undefined = log.args.newPhase;
          if (phaseNumber !== undefined) {
            const phaseName = phaseMapping[phaseNumber];
            setCurrentPhase(phaseName);

            if (phaseName === "Night") {
              resetCycle();
            } else if (phaseName === "Day") {
              let nightStory = "Last night was peaceful";
              if (
                mafiaAttack !== doctorSave &&
                mafiaAttack !== "0x0000000000000000000000000000000000000000" &&
                mafiaAttack !== null &&
                mafiaAttack !== undefined &&
                mafiaAttack !== ""
              ) {
                nightStory = `Last night, the mafia killed ${mafiaAttack}`;
              } else if (
                mafiaAttack !== "0x0000000000000000000000000000000000000000" &&
                mafiaAttack !== null &&
                mafiaAttack !== undefined &&
                mafiaAttack !== ""
              ) {
                nightStory = `Last night, the mafia tried to kill ${mafiaAttack}, but the doctor saved them`;
              }

              if (
                detectiveInvestigation !== "0x0000000000000000000000000000000000000000" &&
                detectiveInvestigation !== null &&
                detectiveInvestigation !== undefined &&
                detectiveInvestigation !== ""
              ) {
                const investigationResult = players.find(
                  player => player.addr === detectiveInvestigation && player.role === "Mafia",
                );
                if (investigationResult) {
                  nightStory = `${nightStory}.\n The detective discovered that ${detectiveInvestigation} is a mafia member.`;
                } else {
                  nightStory = `${nightStory}.\n The detective found no evidence against ${detectiveInvestigation}.`;
                }
              }
              setStory(
                prevStory =>
                  prevStory + `The day has begun.\n${nightStory}.\nPlayers are discussing and accusing others.\n`,
              );
            }
          }
          setProcessedEventHashes(prevHashes => [...prevHashes, txHash]); // Store the processed hash
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
    eventName: "PlayerAccused",
    onLogs: logs => {
      logs.forEach(log => {
        const txHash = log.transactionHash;
        if (!processedEventHashes.includes(txHash)) {
          const accuser = log.args.accuser as string;
          const accused = log.args.accused as string;
          setStory(prevStory => prevStory + `Player ${accuser} has accused ${accused}.\n`);
          setProcessedEventHashes(txHash); // Update the last processed block number
        }
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

  useScaffoldWatchContractEvent({
    contractName: "MafiaGame",
    eventName: "VoteCast",
    onLogs: logs => {
      logs.forEach(log => {
        const txHash = log.transactionHash;
        if (!processedEventHashes.includes(txHash)) {
          // const voter = log.args.voter as string;
          // const accused = log.args.accused as string;
          // setStory(prevStory => prevStory + `Player ${voter} has voted to eliminate ${accused}.\n`);
          setProcessedEventHashes(txHash); // Update last processed block
        }
      });
    },
  });

  useScaffoldWatchContractEvent({
    contractName: "MafiaGame",
    eventName: "PlayerEliminated",
    onLogs: logs => {
      logs.forEach(log => {
        const txHash = log.transactionHash;
        if (!processedEventHashes.includes(txHash)) {
          const eliminated = log.args.eliminatedPlayer as string;
          setStory(prevStory => prevStory + `Player ${eliminated} has been eliminated.\n`);
          setProcessedEventHashes(txHash); // Update last processed block
        }
      });
    },
  });

  useScaffoldWatchContractEvent({
    contractName: "MafiaGame",
    eventName: "GameWon",
    onLogs: logs => {
      logs.forEach(log => {
        const txHash = log.transactionHash;
        if (!processedEventHashes.includes(txHash)) {
          const message: string | undefined = log.args.message;
          if (message) {
            setGameOutcome(message);
            setStory(prevStory => `${prevStory}\n${message}\n`);
          }
          setProcessedEventHashes(txHash); // Update last processed block
        }
      });
    },
  });

  useScaffoldWatchContractEvent({
    contractName: "MafiaGame",
    eventName: "GameContinue",
    onLogs: logs => {
      logs.forEach(log => {
        const txHash = log.transactionHash;
        if (!processedEventHashes.includes(txHash)) {
          setGameOutcome("The Game Continue\n");
          setProcessedEventHashes(txHash); // Update last processed block
        }
      });
    },
  });

  useEffect(() => {
    if (!isLoadingAccusationsCount) {
      setAccusationCompleted(Number(accusationsCount) === players.length);
    }
  }, [accusationsCount, isLoadingAccusationsCount, players]);

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
    if (isLoadingAccusedPlayersAddress) {
      return;
    }

    if (!accusedPlayersAddress || accusedPlayersAddress.length === 0) {
      return;
    }

    try {
      const _accusedPlayers: Player[] = [];

      accusedPlayersAddress.forEach(addr => {
        const accusedPlayer = players
          ?.filter(player => {
            return player.addr !== connectedAddress && player.alive;
          })
          ?.find(player => player.addr === addr);

        // Only add the player if they are not already in the list
        if (accusedPlayer && !_accusedPlayers.some(player => player.addr === accusedPlayer.addr)) {
          _accusedPlayers.push(accusedPlayer);
        }
      });

      setAccusedPlayers(prevAccusedPlayers => {
        // Avoid setting state if the players are the same
        if (JSON.stringify(prevAccusedPlayers) !== JSON.stringify(_accusedPlayers)) {
          return _accusedPlayers;
        }
        return prevAccusedPlayers;
      });
    } catch (error) {
      console.error("Error fetching accused players", error);
    }
  }, [accusedPlayersAddress, isLoadingAccusedPlayersAddress, connectedAddress, players]);

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

  useEffect(() => {
    const fetchAccusations = async () => {
      for (let i = 0; i < players.length; i++) {
        const accused = await mafiaGameContract?.read.accusations([players[i].addr as `0x${string}`]);
        if (accused && accused !== "0x0000000000000000000000000000000000000000" && players[i].alive) {
          setHasAccused(prev => ({ ...prev, [players[i].addr]: true }));
        }
      }
    };

    fetchAccusations();
  }, [accusedPlayersAddress, isLoadingAccusedPlayersAddress, players]);

  useEffect(() => {
    const fetchVotingStatus = async () => {
      for (let i = 0; i < players.length; i++) {
        const voted = await mafiaGameContract?.read.hasVoted([players[i].addr as `0x${string}`]);
        if (voted) {
          setHasVoted(prev => ({ ...prev, [players[i].addr]: true }));
        }
      }
    };

    if (phase === "Day") {
      fetchVotingStatus();
    }
  }, [phase, players]);

  const handleJoinGame = async () => {
    try {
      await writeContractAsync({
        functionName: "joinGame",
      });
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
            setStory(
              prevStory =>
                prevStory + "The night has begun. The Mafia, Doctor, and Detective are taking their actions.\n",
            );
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
            setWinChecked(true);
          },
        },
      );
    } catch (e) {
      console.error("Error checking win status", e);
    }
  };

  // Helper function to split the story by newline and wrap in <br />
  const renderStoryWithLineBreaks = (story: string) => {
    return story.split("\n").map((text, index) => (
      <Fragment key={index}>
        {text}
        <br />
      </Fragment>
    ));
  };

  return (
    <div className="mb-6 flex flex-col items-center space-y-6">
      {!isMayor && !gameStarted && (
        <JoinGameComponent players={players} handleJoinGame={handleJoinGame} hasJoined={hasJoined} />
      )}

      {story && (
        <div className="w-full max-w-3xl space-y-6">
          <div className="mt-4 p-4 border rounded-md">
            {/* Use a helper function to display the story with line breaks */}
            <p>{renderStoryWithLineBreaks(story)}</p>
            {gameOutcome && <h2 className="text-2xl font-semibold">{gameOutcome}</h2>}
          </div>
        </div>
      )}
      {!isMayor && gameStarted && (
        <PlayerComponent
          players={players}
          phase={currentPhase}
          votingCompleted={votingCompleted}
          accusationCompleted={accusationCompleted}
          alivePlayers={alivePlayers}
          accusedPlayers={accusedPlayers}
          eliminatedPlayers={eliminatedPlayers}
          hasAccused={hasAccused}
          hasVoted={hasVoted}
          setHasVoted={setHasVoted}
          setHasAccused={setHasAccused}
          setDetectiveInvestigation={setDetectiveInvestigation}
          setDoctorSave={setDoctorSave}
          setMafiaAttack={setMafiaAttack}
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
