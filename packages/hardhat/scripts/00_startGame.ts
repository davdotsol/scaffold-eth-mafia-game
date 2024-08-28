// packages/hardhat/scripts/seed.ts
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

  // Join the game with 4 players
  await mafiaGame.connect(player1).joinGame();
  console.log("Player 1 has joined the game:", player1.address);

  await mafiaGame.connect(player2).joinGame();
  console.log("Player 2 has joined the game:", player2.address);

  await mafiaGame.connect(player3).joinGame();
  console.log("Player 3 has joined the game:", player3.address);

  await mafiaGame.connect(player4).joinGame();
  console.log("Player 4 has joined the game:", player4.address);

  // Start the game
  // await mafiaGame.connect(deployerSigner).startGame();
  // console.log("Game has started by the mayor:", deployerSigner.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
