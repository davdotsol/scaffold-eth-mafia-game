import React from "react";
import PlayerList from "~~/components/mafia-game/PlayerList";
import { Address } from "~~/components/scaffold-eth";

interface MayorComponentProps {
  players: { addr: string; role: string; alive: boolean }[];
  gameStarted: boolean | undefined;
  handleStartGame: () => void;
}

const MayorComponent: React.FC<MayorComponentProps> = ({ players, gameStarted, handleStartGame }) => {
  return (
    <div className="mb-6 flex flex-col items-center">
      <h1>Mayor</h1>
      {!gameStarted && (
        <>
          <button
            className={`btn font-bold py-2 px-4 ${players.length < 4 ? "btn-disabled" : ""}`}
            onClick={handleStartGame}
          >
            Start Game
          </button>
          <ul className="list-none text-primary-lighter">
            {players.map((player, index) => (
              <li className="mt-5" key={index}>
                <Address address={player.addr} />
              </li>
            ))}
          </ul>
        </>
      )}
      {gameStarted && <PlayerList players={players} showRoles={true} />}
    </div>
  );
};
export default MayorComponent;
