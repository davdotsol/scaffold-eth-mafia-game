// packages/hardhat/scripts/dayPhaseAccuse.ts
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

  // Change the phase to day
  await mafiaGame.connect(deployerSigner).nextPhase();
  console.log("Phase changed to Day by the mayor:", deployerSigner.address);

  // Each player accuses another player
  await mafiaGame.connect(player1).accusePlayer(player2.address, "Reason for player 1 to accuse player 2");
  console.log("Player 1 accused Player 2");

  await mafiaGame.connect(player2).accusePlayer(player3.address, "Reason for player 2 to accuse player 3");
  console.log("Player 2 accused Player 3");

  await mafiaGame.connect(player3).accusePlayer(player4.address, "Reason for player 3 to accuse player 4");
  console.log("Player 3 accused Player 4");

  await mafiaGame.connect(player4).accusePlayer(player1.address, "Reason for player 4 to accuse player 1");
  console.log("Player 4 accused Player 1");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
