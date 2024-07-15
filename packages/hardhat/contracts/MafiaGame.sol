// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MafiaGame {
	enum Role {
		None,
		Mafia,
		Doctor,
		Detective,
		Townsperson
	}

	struct Player {
		address addr;
		Role role;
		bool alive;
	}

	uint public playerCount;
	uint public mafiaCount;
	uint public phaseStartTime;
	mapping(address => Player) public players;
	address[] public playerAddresses;
	address[] public mafiaAddresses;
	address public mayor;
	bool public gameStarted;

	modifier onlyMayor() {
		require(msg.sender == mayor, "Only the mayor can perform this action");
		_;
	}

	event PlayerJoined(Player player);
	event RoleAssigned(address indexed player, Role role);

	constructor() {
		mayor = msg.sender;
	}

	function joinGame() public {
		require(!gameStarted, "The game has already started");
		require(
			players[msg.sender].addr == address(0),
			"Player already joined"
		);

		players[msg.sender] = Player({
			addr: msg.sender,
			role: Role.None,
			alive: true
		});

		playerAddresses.push(msg.sender);
		playerCount++;
		emit PlayerJoined(players[msg.sender]);
	}

	function startGame() public onlyMayor {
		require(
			playerCount >= 4,
			"Minimum 4 players required to start the game"
		);
		require(!gameStarted, "The game has already started");

		gameStarted = true;
		uint mafiaNum = playerCount / 4;
		mafiaCount = mafiaNum;

		// Shuffle players for random role assignment
		for (uint i = 0; i < playerCount; i++) {
			uint randomIndex = i +
				(uint(
					keccak256(
						abi.encodePacked(block.timestamp, block.difficulty)
					)
				) % (playerCount - i));
			address temp = playerAddresses[i];
			playerAddresses[i] = playerAddresses[randomIndex];
			playerAddresses[randomIndex] = temp;
		}

		// Assign roles
		for (uint i = 0; i < playerCount; i++) {
			if (i < mafiaNum) {
				players[playerAddresses[i]].role = Role.Mafia;
				mafiaAddresses.push(playerAddresses[i]);
			} else if (i == mafiaNum) {
				players[playerAddresses[i]].role = Role.Doctor;
			} else if (i == mafiaNum + 1) {
				players[playerAddresses[i]].role = Role.Detective;
			} else {
				players[playerAddresses[i]].role = Role.Townsperson;
			}
			emit RoleAssigned(
				playerAddresses[i],
				players[playerAddresses[i]].role
			);
		}

		phaseStartTime = block.timestamp;
	}

	function getPlayers() public view returns (address[] memory) {
		return playerAddresses;
	}
}
