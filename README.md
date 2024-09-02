# Mafia Game on the Blockchain

Welcome to the **Mafia Game on the Blockchain**, a decentralized implementation of the classic social deduction game "Mafia," where players take on different roles and work to eliminate the opposing team. This project leverages Ethereum smart contracts to create a transparent and fair game that anyone can participate in, using the power of the blockchain.

## Overview

This project is built using **Scaffold-ETH 2** and consists of a smart contract written in Solidity, a web-based front end using **Next.js** and **TypeScript**, and styling with **TailwindCSS**. The game is deployed on the Ethereum blockchain, ensuring decentralization, fairness, and transparency.

## Table of Contents

- [Smart Contract Overview](#smart-contract-overview)
  - [Roles and Phases](#roles-and-phases)
  - [Game Events](#game-events)
  - [Core Functions](#core-functions)
- [Game Rules](#game-rules)
  - [Setup](#setup)
  - [Roles](#roles)
  - [Gameplay](#gameplay)
  - [Winning Conditions](#winning-conditions)
- [How to Play](#how-to-play)

## Smart Contract Overview

The smart contract is written in Solidity and includes several core components that manage the game's logic, roles, phases, and events.

### Roles and Phases

- **Roles:**

  - **Mayor:** Directs the game and has control over the game flow.
  - **Mafia:** Kills other players while avoiding detection.
  - **Doctor:** Can save players from elimination.
  - **Detective:** Investigates players to determine if they are mafia.
  - **Townsperson:** Basic role, votes to eliminate suspected mafia.

- **Phases:**
  - **Day Phase:** Players discuss, accuse, and vote for elimination.
  - **Night Phase:** Mafia selects their target, the Doctor chooses someone to save, and the Detective investigates.

### Game Events

The smart contract emits several events to notify off-chain components (like the web frontend) about important changes in the game state:

- `PlayerJoined(Player player)`: Triggered when a player joins the game.
- `RoleAssigned(address indexed player, Role role)`: Triggered when roles are assigned.
- `PhaseChanged(Phase newPhase, string story)`: Triggered when the phase changes.
- `PlayerAccused(address indexed accuser, address indexed accused)`: Triggered when a player is accused.
- `VoteCast(address indexed voter, address indexed accused)`: Triggered when a player casts a vote.
- `VotingCompleted(address indexed eliminatedPlayer)`: Triggered when voting is completed.
- `PlayerEliminated(address indexed eliminatedPlayer)`: Triggered when a player is eliminated.
- `GameWon(string message)`: Triggered when a team wins the game.
- `GameContinue()`: Triggered when the game continues to the next cycle.
- `AccusationCompleted()`: Triggered when all accusations are completed.

### Core Functions

- `joinGame()`: Allows a player to join the game.
- `startGame()`: Starts the game once the minimum number of players have joined.
- `nextPhase()`: Moves the game to the next phase (Day or Night).
- `accusePlayer(address _accused, string memory _reason)`: Allows a player to accuse another player.
- `voteForElimination(address _accused)`: Allows a player to vote for eliminating an accused player.
- `eliminatePlayer()`: Eliminates a player based on votes.
- `checkWin()`: Checks for a win condition (Mafia or Townspeople win).
- `resetGame()`: Resets the game to its initial state.

## Game Rules

### Setup

1. **Gather Players**: At least 4 players are required to start the game, with one additional player acting as the Mayor. Ideally, 12-16 players are best.
2. **Assign Roles**: The smart contract randomly assigns roles based on the number of players:
   - For every 4 players, there is one Mafia.
   - One Doctor and one Detective are always included in the game.

### Roles

- **Mayor**: The game's director who assigns roles, announces events, and oversees voting. The Mayor is not an active player.
- **Mafia**: Work to eliminate the Townspeople and avoid detection.
- **Doctor**: Saves players from elimination, including themselves.
- **Detective**: Investigates other players to find the Mafia.
- **Townspeople**: Attempt to find and eliminate the Mafia through voting.

### Gameplay

1. **Day Phase**: Players discuss and accuse each other of being Mafia. Accusations are made, and votes are cast to eliminate a player.
2. **Night Phase**: The Mafia selects a target to eliminate, the Doctor selects someone to save, and the Detective investigates a player.

### Winning Conditions

- **Mafia Win**: The Mafia wins when they outnumber or equal the remaining Townspeople.
- **Town Win**: The Townspeople win when all Mafia members are eliminated.

## How to Play

1. **Join the Game**: Connect your Ethereum wallet and join the game.
2. **Wait for the Game to Start**: Once the Mayor starts the game, roles will be assigned.
3. **Participate in Phases**: During the day, discuss and vote; during the night, perform your role's actions.
4. **Win the Game**: Work with your team to eliminate the opposing side!
