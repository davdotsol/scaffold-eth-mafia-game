import { ethers } from "hardhat";

async function main() {
  const [deployerSigner] = await ethers.getSigners();

  // Replace this address with your deployed contract address
  const deployedContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  console.log("Using the contract deployed at:", deployedContractAddress);

  // Get the MafiaGame contract factory and attach to the deployed address
  const MafiaGame = await ethers.getContractFactory("MafiaGame");
  const mafiaGame = MafiaGame.attach(deployedContractAddress);

  // Restart the game
  await mafiaGame.connect(deployerSigner).resetGame();
  console.log("Game has restarted by the mayor:", deployerSigner.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
