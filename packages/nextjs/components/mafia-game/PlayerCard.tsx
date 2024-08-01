// src/components/PlayerCard.tsx
import React from "react";
import { Address } from "~~/components/scaffold-eth";

interface PlayerCardProps {
  addr: string;
  role: string;
  alive: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ addr, role, alive }) => {
  return (
    <div
      className={`card w-full shadow-xl transition-transform transform hover:scale-105 ${
        alive ? "bg-base-100 text-base-content" : "bg-red-800 text-red-200"
      }`}
    >
      <div className="card-body p-4">
        <h2 className="card-title text-lg font-semibold">Player Details</h2>
        <div className="mb-2">
          <Address address={addr} />
        </div>
        <div className="mb-1">
          <strong>Role:</strong> {role}
        </div>
        <div>
          <strong>Status:</strong> {alive ? "Alive" : "Dead"}
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
