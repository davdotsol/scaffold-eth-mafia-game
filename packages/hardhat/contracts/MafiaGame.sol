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

	enum Phase {
		Day,
		Night
	}

	uint public playerCount;
	uint public mafiaCount;
	uint public phaseStartTime;
	Phase public currentPhase;
	mapping(address => Player) public players;
	mapping(address => address) public accusations;
	address[] public accusedPlayers;
	address[] public playerAddresses;
	address[] public mafiaAddresses;
	address public mayor;
	address public target;
	address public saved;
	address public investigated;
	string public story;
	bool public gameStarted;

	modifier onlyMayor() {
		require(msg.sender == mayor, "Only the mayor can perform this action");
		_;
	}

	modifier onlyAlive() {
		require(
			players[msg.sender].alive,
			"You are dead and cannot perform this action"
		);
		_;
	}

	event PlayerJoined(Player player);
	event RoleAssigned(address indexed player, Role role);
	event PhaseChanged(Phase newPhase, string story);
	event PlayerAccused(address indexed accuser, address indexed accused);

	constructor() {
		mayor = msg.sender;
		currentPhase = Phase.Night;
		phaseStartTime = block.timestamp;
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

	function nextPhase() public onlyMayor {
		require(gameStarted, "The game has not started yet");

		if (currentPhase == Phase.Night) {
			currentPhase = Phase.Day;
		} else {
			currentPhase = Phase.Night;
			resetAccusationsAndVotes();
		}
		phaseStartTime = block.timestamp;
		target = address(0);
		saved = address(0);
		investigated = address(0);
		emit PhaseChanged(currentPhase, story);
	}

	function resetAccusationsAndVotes() internal {
		for (uint i = 0; i < playerAddresses.length; i++) {
			accusations[playerAddresses[i]] = address(0);
		}
		accusedPlayers = new address[](playerCount);
	}

	function accusePlayer(address _accused) public onlyAlive {
		require(currentPhase == Phase.Day, "Can only accuse during day phase");
		accusations[msg.sender] = _accused;
		accusedPlayers.push(_accused);
		emit PlayerAccused(msg.sender, _accused);
	}

	function getPlayers() public view returns (address[] memory) {
		return playerAddresses;
	}

	function getAccusedPlayers() public view returns (address[] memory) {
		return accusedPlayers;
	}
}
