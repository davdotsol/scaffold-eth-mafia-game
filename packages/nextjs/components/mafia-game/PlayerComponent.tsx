import React, { useState } from "react";
import { useAccount } from "wagmi";
import AccusationComponent from "~~/components/mafia-game/AccusationComponent";
import CurrentPlayerInfo from "~~/components/mafia-game/CurrentPlayerInfo";
import PlayerLists from "~~/components/mafia-game/PlayerLists";
import VotingComponent from "~~/components/mafia-game/VotingComponent";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const PlayerComponent = ({
  players,
  phase,
  votingCompleted,
  accusationCompleted,
  alivePlayers,
  accusedPlayers,
  eliminatedPlayers,
  hasAccused,
  hasVoted,
  setHasVoted,
  setHasAccused,
}) => {
  const { address: connectedAddress } = useAccount();
  const currentPlayer = players.find(player => player.addr === connectedAddress);

  const [investigateAddress, setInvestigateAddress] = useState("");
  const [saveAddress, setSaveAddress] = useState("");
  const [targetAddress, setTargetAddress] = useState("");
  const [accuseAddress, setAccuseAddress] = useState("");
  const [voteAddress, setVoteAddress] = useState("");
  const [mafiaAttack, setMafiaAttack] = useState(null);
  const [doctorSave, setDoctorSave] = useState(null);
  const [detectiveInvestigation, setDetectiveInvestigation] = useState(null);

  const { writeContractAsync } = useScaffoldWriteContract("MafiaGame");

  // Event listeners and handlers here

  if (currentPlayer && !currentPlayer.alive) {
    return (
      <div className="mb-6 flex flex-col items-center">
        <h2 className="text-4xl font-semibold mb-4 text-red-500">You have been eliminated</h2>
      </div>
    );
  }

  const handleInvestigate = () => {
    if (investigateAddress) {
      setInvestigateAddress("");
      setDetectiveInvestigation(investigateAddress);
    }
  };

  const handleSave = () => {
    if (saveAddress) {
      setSaveAddress("");
      setDoctorSave(saveAddress);
    }
  };

  const handleTarget = () => {
    if (targetAddress) {
      setTargetAddress("");
      setMafiaAttack(targetAddress);
    }
  };

  const handleAccuse = async (reason: string) => {
    if (accuseAddress) {
      try {
        await writeContractAsync(
          {
            functionName: "accusePlayer",
            args: [accuseAddress as `0x${string}`, reason],
          },
          {
            onBlockConfirmation: txnReceipt => {
              console.log("📦 Transaction blockHash", txnReceipt.blockHash);
              setHasAccused(prev => ({ ...prev, [connectedAddress as `0x${string}`]: true }));
            },
          },
        );
      } catch (error) {
        console.error("Error executing accusePlayer", error);
      }
    }
  };

  const handleVote = async () => {
    try {
      await writeContractAsync(
        {
          functionName: "voteForElimination",
          args: [voteAddress as `0x${string}`],
        },
        {
          onBlockConfirmation: txnReceipt => {
            console.log("📦 Transaction blockHash", txnReceipt.blockHash);
            setHasVoted(prev => ({ ...prev, [connectedAddress as `0x${string}`]: true }));
          },
        },
      );

      setVoteAddress("");
    } catch (error) {
      console.error("Error voting for elimination", error);
    }
  };

  return (
    <div className="mb-6 flex flex-col items-center space-y-6">
      <h2 className="text-4xl font-semibold text-primary-lighter">Player</h2>
      <div className="w-full max-w-3xl space-y-6">
        {currentPlayer && phase === "Night" && (
          <CurrentPlayerInfo
            currentPlayer={currentPlayer}
            phase={phase}
            handleInvestigate={handleInvestigate}
            handleSave={handleSave}
            handleTarget={handleTarget}
            investigateAddress={investigateAddress}
            setInvestigateAddress={setInvestigateAddress}
            saveAddress={saveAddress}
            setSaveAddress={setSaveAddress}
            targetAddress={targetAddress}
            setTargetAddress={setTargetAddress}
          />
        )}
        {connectedAddress && currentPlayer && phase === "Day" && !accusationCompleted && (
          <AccusationComponent
            connectedAddress={connectedAddress}
            accuseAddress={accuseAddress}
            setAccuseAddress={setAccuseAddress}
            handleAccuse={handleAccuse}
            hasAccused={hasAccused}
          />
        )}
        {connectedAddress && currentPlayer && phase === "Day" && accusationCompleted && (
          <VotingComponent
            connectedAddress={connectedAddress}
            voteAddress={voteAddress}
            setVoteAddress={setVoteAddress}
            handleVote={handleVote}
            hasVoted={hasVoted}
            votingCompleted={votingCompleted}
            accusedPlayers={accusedPlayers}
          />
        )}
        <PlayerLists
          alivePlayers={alivePlayers}
          accusedPlayers={accusedPlayers}
          eliminatedPlayers={eliminatedPlayers}
          connectedAddress={connectedAddress}
        />
      </div>
    </div>
  );
};

export default PlayerComponent;
