import React from "react";
import PlayerCard from "./PlayerCard";

interface PlayerListProps {
  players: { addr: string; role: string; alive: boolean }[];
  showRoles: boolean;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, showRoles }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {players.map((player, index) => (
        <PlayerCard key={index} addr={player.addr} role={showRoles ? player.role : "Hidden"} alive={player.alive} />
      ))}
    </div>
  );
};

export default PlayerList;
