import React from "react";
import { hardhat } from "viem/chains";
import { SwitchTheme } from "~~/components/SwitchTheme";
import PlayerList from "~~/components/mafia-game/PlayerList";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

interface MayorComponentProps {
  players: { addr: string; role: string; alive: boolean }[];
  gameStarted: boolean | undefined;
  handleStartGame: () => void;
  handleNextPhase: () => void;
  phase: string | undefined;
}

const MayorComponent: React.FC<MayorComponentProps> = ({
  players,
  gameStarted,
  handleStartGame,
  handleNextPhase,
  phase,
}) => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;
  console.log("phase", phase);
  return (
    <div className="mb-6 flex flex-col items-center">
      <h2 className="text-4xl font-semibold mb-4 text-primary-lighter">Mayor</h2>
      {!gameStarted && (
        <>
          <button
            className={`btn rounded-md btn-primary ${players.length < 4 ? "btn-disabled" : ""}`}
            onClick={handleStartGame}
          >
            Start Game
          </button>
          <ul className="list-none text-primary-lighter">
            {players.map((player, index) => (
              <li className="mt-5" key={index}>
                <strong>Player {index}:</strong> {player.addr}
              </li>
            ))}
          </ul>
        </>
      )}
      {gameStarted && (
        <div>
          <SwitchTheme
            handleNextPhase={handleNextPhase}
            className={`pointer-events-auto ${isLocalNetwork ? "self-end md:self-auto" : ""}`}
          />
          <PlayerList players={players} showRoles={true} />
        </div>
      )}
    </div>
  );
};
export default MayorComponent;
