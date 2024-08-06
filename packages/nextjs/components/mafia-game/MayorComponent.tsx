import React from "react";
import { hardhat } from "viem/chains";
import { SwitchTheme } from "~~/components/SwitchTheme";
import PlayerList from "~~/components/mafia-game/PlayerList";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

interface MayorComponentProps {
  players: { addr: string; role: string; alive: boolean }[];
  gameStarted: boolean | undefined;
  handleStartGame: () => void;
  handleNextPhase: () => void;
  phase: string | undefined;
  votingCompleted: boolean | undefined;
  playerEliminated: boolean | undefined;
}

const MayorComponent: React.FC<MayorComponentProps> = ({
  players,
  gameStarted,
  handleStartGame,
  handleNextPhase,
  phase,
  votingCompleted,
  playerEliminated,
}) => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  const { writeContractAsync } = useScaffoldWriteContract("MafiaGame");

  const handleCheckWin = async () => {
    try {
      await writeContractAsync({
        functionName: "checkWin",
      });
    } catch (error) {
      console.error("Error executing checkWin", error);
    }
  };

  const handleEliminatePlayer = async () => {
    try {
      await writeContractAsync({
        functionName: "eliminatePlayer",
      });
    } catch (error) {
      console.error("Error executing eliminatePlayer", error);
    }
  };

  return (
    <div className="mb-6 flex flex-col items-center space-y-6">
      <h2 className="text-4xl font-semibold text-primary-lighter">Mayor</h2>
      {!gameStarted && (
        <div className="flex flex-col items-center space-y-4">
          <button
            className={`btn rounded-md btn-primary ${players.length < 4 ? "btn-disabled" : ""}`}
            onClick={handleStartGame}
          >
            Start Game
          </button>
          <ul className="list-none text-primary-lighter">
            {players.map((player, index) => (
              <li className="mt-2" key={index}>
                <strong>Player {index + 1}:</strong> {player.addr}
              </li>
            ))}
          </ul>
        </div>
      )}
      {gameStarted && (
        <div className="w-full max-w-3xl space-y-6">
          <div className="flex justify-between items-center">
            <SwitchTheme
              handleNextPhase={handleNextPhase}
              className={`pointer-events-auto ${isLocalNetwork ? "self-end md:self-auto" : ""}`}
            />
            <button
              className={`btn rounded-md btn-primary ${!votingCompleted ? "btn-disabled" : ""}`}
              onClick={handleEliminatePlayer}
              disabled={!votingCompleted || playerEliminated}
            >
              Eliminate Player
            </button>
            <button
              className={`btn rounded-md btn-primary ${!playerEliminated || phase !== "Day" ? "btn-disabled" : ""}`}
              onClick={handleCheckWin}
              disabled={!playerEliminated || phase !== "Day"}
            >
              Check Win
            </button>
          </div>
          <PlayerList players={players} showRoles={true} />
        </div>
      )}
    </div>
  );
};

export default MayorComponent;
