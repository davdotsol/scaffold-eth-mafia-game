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
    <div className={`card w-full shadow-xl ${alive ? "bg-base-100 text-base-content" : "bg-red-800 text-red-200"}`}>
      <div className="card-body">
        <h2 className="card-title">Player Details</h2>
        <div>
          <Address address={addr} />
        </div>
        <div>
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
