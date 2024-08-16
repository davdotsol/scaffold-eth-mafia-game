import React from "react";
import PlayerList from "~~/components/mafia-game/PlayerList";

interface Player {
  addr: string;
  role: string;
  alive: boolean;
}

interface PlayerListsProps {
  connectedAddress: string | undefined;
  alivePlayers: Player[];
  eliminatedPlayers: Player[];
  accusedPlayers: Player[];
  allPlayersAccused: boolean;
}

const PlayerLists: React.FC<PlayerListsProps> = ({
  connectedAddress,
  alivePlayers,
  eliminatedPlayers,
  accusedPlayers,
  allPlayersAccused,
}) => {
  return (
    <div className="w-full max-w-3xl space-y-6">
      {allPlayersAccused ? (
        <>
          <h2 className="text-2xl font-semibold mb-4 text-primary-lighter">Accused Players</h2>
          <PlayerList
            players={accusedPlayers.filter(player => player.addr !== connectedAddress && player.alive)}
            showRoles={false}
          />
        </>
      ) : (
        <>
          <h2 className="text-2xl font-semibold mb-4 text-primary-lighter">Players</h2>
          <PlayerList
            players={alivePlayers.filter(player => player.addr !== connectedAddress && player.alive)}
            showRoles={false}
          />
        </>
      )}
      {eliminatedPlayers.length > 0 && (
        <>
          <h2 className="text-2xl font-semibold mb-4 text-red-500">Eliminated Players</h2>
          <PlayerList players={eliminatedPlayers} showRoles={true} />
        </>
      )}
    </div>
  );
};

export default PlayerLists;
