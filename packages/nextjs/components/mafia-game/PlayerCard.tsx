// src/components/PlayerCard.tsx
import React from "react";

interface PlayerCardProps {
  addr: string;
  role: string;
  alive: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ addr, role, alive }) => {
  return (
    <div className="card w-full bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Player Details</h2>
        <p>
          <strong>Address:</strong> {addr}
        </p>
        <p>
          <strong>Role:</strong> {role}
        </p>
        <p>
          <strong>Status:</strong> {alive ? "Alive" : "Dead"}
        </p>
      </div>
    </div>
  );
};

export default PlayerCard;
