import React from "react";

interface JoinGameComponentProps {
  players: { addr: string; role: string; alive: boolean }[];
  handleJoinGame: () => void;
  hasJoined: boolean;
}

const JoinGameComponent: React.FC<JoinGameComponentProps> = ({ players, handleJoinGame, hasJoined }) => (
  <div className="mb-6 flex flex-col items-center">
    <h1>Join Game</h1>
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
          <strong>Player {index + 1}:</strong> {player.addr}
        </li>
      ))}
    </ul>
  </div>
);

export default JoinGameComponent;
