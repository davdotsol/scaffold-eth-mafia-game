import React from "react";
import { Address } from "~~/components/scaffold-eth";

interface JoinGameComponentProps {
  players: { addr: string; role: number; alive: boolean }[];
  handleJoinGame: () => void;
  hasJoined: boolean;
}

const JoinGameComponent: React.FC<JoinGameComponentProps> = ({ players, handleJoinGame, hasJoined }) => (
  <div className="mb-6 flex flex-col items-center">
    {hasJoined ? (
      <p className="text-primary-lighter">You joined! Waiting other players to join</p>
    ) : (
      <>
        {players.length < 8 ? (
          <button className="btn w-64 rounded-full" onClick={handleJoinGame}>
            Join Game
          </button>
        ) : (
          <p className="text-primary-lighter">Game is full, wait for new game</p>
        )}
      </>
    )}
    <ul className="list-none text-primary-lighter">
      {players.map((player, index) => (
        <li className="mt-5" key={index}>
          <Address address={player.addr} />
        </li>
      ))}
    </ul>
  </div>
);

export default JoinGameComponent;
