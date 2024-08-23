import React from "react";
import PlayerList from "~~/components/mafia-game/PlayerList";

const PlayerLists = ({ alivePlayers, accusedPlayers, eliminatedPlayers, connectedAddress }) => {
  return (
    <>
      <h2 className="text-2xl font-semibold mb-4 text-primary-lighter">Players</h2>
      <PlayerList
        players={alivePlayers.filter(player => player.addr !== connectedAddress && player.alive)}
        showRoles={false}
      />
      {accusedPlayers.length > 0 && (
        <>
          <h2 className="text-2xl font-semibold mb-4 text-primary-lighter">Accused Players</h2>
          <PlayerList
            players={accusedPlayers.filter(player => player.addr !== connectedAddress && player.alive)}
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
    </>
  );
};

export default PlayerLists;
