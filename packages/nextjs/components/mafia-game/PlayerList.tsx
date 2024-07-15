// src/components/PlayerList.tsx
import React from "react";
import PlayerCard from "./PlayerCard";

interface PlayerListProps {
  players: { addr: string; role: string; alive: boolean }[];
  showRoles: boolean;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, showRoles }) => (
  <div className="w-full p-2">
    <h2 className="text-2xl font-semibold mb-4 text-primary-lighter">Players</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {players.map((player, index) => (
        <PlayerCard key={index} addr={player.addr} role={showRoles ? player.role : "Hidden"} alive={player.alive} />
      ))}
    </div>
  </div>
);

export default PlayerList;
