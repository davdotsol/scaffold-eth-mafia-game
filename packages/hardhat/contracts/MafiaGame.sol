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
	mapping(address => Player) public players;
	address[] public playerAddresses;
	address public mayor;
	bool public gameStarted;

	event PlayerJoined(Player player);

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

	function getPlayers() public view returns (address[] memory) {
		return playerAddresses;
	}
}
