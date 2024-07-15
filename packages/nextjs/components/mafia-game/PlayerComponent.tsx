import React from "react";
import PlayerList from "~~/components/mafia-game/PlayerList";

interface PlayerComponentProps {
  players: { addr: string; role: string; alive: boolean }[];
}

const PlayerComponent: React.FC<PlayerComponentProps> = ({ players }) => (
  <div className="mb-6 flex flex-col items-center">
    <h1>Player</h1>
    <PlayerList players={players} showRoles={true} />
  </div>
);

export default PlayerComponent;
