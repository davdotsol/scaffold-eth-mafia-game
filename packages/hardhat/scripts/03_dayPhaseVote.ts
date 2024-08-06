// packages/hardhat/scripts/dayPhaseVote.ts
import { ethers } from "hardhat";

async function main() {
  // const { deployer } = await getNamedAccounts();
  const [deployerSigner, player1, player2, player3, player4] = await ethers.getSigners();

  // Replace this address with your deployed contract address
  const deployedContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  console.log("Using the contract deployed at:", deployedContractAddress);

  // Get the MafiaGame contract factory and attach to the deployed address
  const MafiaGame = await ethers.getContractFactory("MafiaGame");
  const mafiaGame = MafiaGame.attach(deployedContractAddress);

  // Make sure the phase is Day. If not, change it.
  const currentPhase = await mafiaGame.currentPhase();
  if (currentPhase === 1) {
    // 1 indicates Night, 0 indicates Day
    await mafiaGame.connect(deployerSigner).nextPhase();
    console.log("Phase changed to Day by the mayor:", deployerSigner.address);
  } else {
    console.log("The current phase is already Day.");
  }

  // Each player votes for a player they believe is a mafia member
  await mafiaGame.connect(player1).voteForElimination(player3.address);
  console.log("Player 1 voted for Player 3");

  await mafiaGame.connect(player2).voteForElimination(player3.address);
  console.log("Player 2 voted for Player 3");

  await mafiaGame.connect(player3).voteForElimination(player4.address);
  console.log("Player 3 voted for Player 4");

  await mafiaGame.connect(player4).voteForElimination(player1.address);
  console.log("Player 4 voted for Player 1");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
