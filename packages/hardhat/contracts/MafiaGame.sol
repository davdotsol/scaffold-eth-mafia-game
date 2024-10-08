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
	uint public cycleCount; // Added to count the number of cycles
	Phase public currentPhase;
	mapping(address => Player) public players;
	mapping(address => address) public accusations;
	mapping(address => uint) public votes;
	mapping(address => bool) public hasVoted;
	mapping(address => string[]) public accusationReasons; // New mapping to store reasons
	address[] public accusedPlayers;
	address[] public playerAddresses;
	address[] public mafiaAddresses;
	address[] public eliminatedAddresses;
	address public mayor;
	address public target;
	address public saved;
	address public investigated;
	string public story;
	bool public gameStarted;
	bool public votingCompleted;
	uint public votesCast;
	address public playerToEliminate;
	uint public accusationsCount;

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
	event VoteCast(address indexed voter, address indexed accused);
	event VotingCompleted(address indexed eliminatedPlayer);
	event PlayerEliminated(address indexed eliminatedPlayer);
	event GameWon(string message);
	event GameContinue();
	event AccusationCompleted();

	constructor() {
		mayor = msg.sender;
		currentPhase = Phase.Night;
		phaseStartTime = block.timestamp;
		cycleCount = 0; // Initialize cycleCount
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
			resetVotingStatus(); // Reset voting status for the new phase
		}
		phaseStartTime = block.timestamp;
		cycleCount++; // Increment cycleCount on each phase change
		target = address(0);
		saved = address(0);
		investigated = address(0);
		votesCast = 0; // Reset the vote count
		accusationsCount = 0; // Reset the accusations count
		emit PhaseChanged(currentPhase, story);
	}

	function resetVotingStatus() internal {
		for (uint i = 0; i < playerAddresses.length; i++) {
			hasVoted[playerAddresses[i]] = false; // Reset the hasVoted status
		}
	}

	function resetAccusationsAndVotes() internal {
		for (uint i = 0; i < playerAddresses.length; i++) {
			accusations[playerAddresses[i]] = address(0);
			votes[playerAddresses[i]] = 0; // Reset the votes
		}
		delete accusedPlayers;
	}

	function accusePlayer(
		address _accused,
		string memory _reason
	) public onlyAlive {
		require(currentPhase == Phase.Day, "Can only accuse during day phase");
		require(
			accusations[msg.sender] == address(0),
			"You have already accused a player"
		);

		accusations[msg.sender] = _accused;
		accusationReasons[_accused].push(_reason); // Store the reason
		accusedPlayers.push(_accused);
		accusationsCount++;
		emit PlayerAccused(msg.sender, _accused);

		if (accusationsCount == playerCount) {
			emit AccusationCompleted();
		}
	}

	function getAccusationReasons(
		address _accused
	) public view returns (string[] memory) {
		return accusationReasons[_accused];
	}

	function voteForElimination(address _accused) public onlyAlive {
		require(currentPhase == Phase.Day, "Can only vote during day phase");
		require(
			accusations[_accused] != address(0),
			"Player must be accused first"
		);
		require(!hasVoted[msg.sender], "You have already voted"); // Ensure player hasn't voted

		votes[_accused]++;
		votesCast++; // Increase the number of votes cast
		hasVoted[msg.sender] = true; // Mark the player as having voted
		emit VoteCast(msg.sender, _accused);

		if (votesCast == playerCount) {
			// Check if all players have voted
			address eliminatedPlayer = determineEliminatedPlayer();
			playerToEliminate = eliminatedPlayer;
			votingCompleted = true;
			emit VotingCompleted(eliminatedPlayer);
		}
	}

	function determineEliminatedPlayer() internal view returns (address) {
		address eliminatedPlayer;
		uint highestVotes = 0;
		for (uint i = 0; i < accusedPlayers.length; i++) {
			if (votes[accusedPlayers[i]] > highestVotes) {
				highestVotes = votes[accusedPlayers[i]];
				eliminatedPlayer = accusedPlayers[i];
			}
		}
		return eliminatedPlayer;
	}

	function eliminatePlayer() public onlyMayor {
		require(playerToEliminate != address(0), "Eliminated must be a player");
		players[playerToEliminate].alive = false;
		playerCount--;
		emit PlayerEliminated(playerToEliminate);
	}

	function checkWin() public {
		uint aliveMafia = 0;
		uint aliveTownspeople = 0;
		for (uint i = 0; i < playerAddresses.length; i++) {
			if (players[playerAddresses[i]].alive) {
				if (players[playerAddresses[i]].role == Role.Mafia) {
					aliveMafia++;
				} else {
					aliveTownspeople++;
				}
			}
		}
		if (aliveMafia == 0) {
			emit GameWon("Townspeople win!");
		} else if (aliveMafia >= aliveTownspeople) {
			emit GameWon("Mafia wins!");
		} else {
			emit GameContinue();
		}
	}

	function resetGame() private onlyMayor {
		for (uint i = 0; i < playerAddresses.length; i++) {
			delete players[playerAddresses[i]];
			delete accusations[playerAddresses[i]];
			delete votes[playerAddresses[i]];
		}
		delete playerAddresses;
		delete accusedPlayers;
		delete mafiaAddresses;

		playerCount = 0;
		mafiaCount = 0;
		phaseStartTime = block.timestamp;
		currentPhase = Phase.Night;
		gameStarted = false;
		votingCompleted = false;
		votesCast = 0;
		accusationsCount = 0;
		playerToEliminate = address(0);
		target = address(0);
		saved = address(0);
		investigated = address(0);
		story = "";
		cycleCount = 0; // Reset cycleCount on game reset

		emit PhaseChanged(currentPhase, story);
	}

	function getPlayers() public view returns (address[] memory) {
		return playerAddresses;
	}

	function getAccusedPlayers() public view returns (address[] memory) {
		return accusedPlayers;
	}

	function getEliminatedPlayers() public view returns (address[] memory) {
		return eliminatedAddresses;
	}
}
