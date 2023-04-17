const container = document.querySelector("#game-container");
const option = document.querySelector(".option-container");
const flipBtn = document.querySelector("#flip-button");
const startBtn = document.querySelector("#start-button");
const info = document.querySelector("#info");
const turn = document.querySelector("#turn-display");

//ship create
class ship {
  constructor(name, length) {
    this.name = name;
    this.length = length;
  }
}

const destroyer = new ship("destroyer", 2);
const submarine = new ship("submarine", 3);
const cruiser = new ship("cruiser", 3);
const battleship = new ship("battleship", 4);
const carrier = new ship("carrier", 5);

const ships = [destroyer, submarine, cruiser, battleship, carrier];
let notDragged;

//flip ship
let angle = 0;
function flip() {
  //get all childs of options container, make them into an array
  const optionShips = Array.from(option.children);
  if (angle === 0) {
    angle = 90;
  } else {
    angle = 0;
  }
  optionShips.forEach(
    (child) => (child.style.transform = `rotate(${angle}deg)`)
  );
}
//if you click on flip button call flip func
flipBtn.addEventListener("click", flip);

//create game boards
const width = 10;
function createBoard(color, user) {
  const gameContainer = document.createElement("div");
  gameContainer.classList.add("game-board");
  gameContainer.style.backgroundColor = color;
  gameContainer.id = user;

  for (let i = 0; i < width * width; i++) {
    const block = document.createElement("div");
    block.classList.add("block");
    block.id = i;
    gameContainer.append(block);
  }

  container.append(gameContainer);
}

createBoard("steelblue", "player");
createBoard("#2b2b2b", "computer");

function handleValidity(allBlocks, isHorizontal, startIndex, ship) {
  let validStart = isHorizontal
    ? startIndex <= width * width - ship.length
      ? startIndex
      : width * width - ship.length
    : startIndex <= width * width - (ship.length - 1) * width
    ? startIndex
    : startIndex - ship.length * width + width;

  let shipBlocks = [];

  for (let i = 0; i < ship.length; i++) {
    if (isHorizontal) {
      shipBlocks.push(allBlocks[Number(validStart) + i]);
    } else {
      shipBlocks.push(allBlocks[Number(validStart) + i * width]);
    }
  }

  let valid = true;
  if (isHorizontal) {
    valid = shipBlocks.every(
      (_shipBlock, index) =>
        shipBlocks[0].id % width <= width - ship.length + index
    );
  } else {
    valid = shipBlocks.every(
      (_shipBlock, index) =>
        shipBlocks[0].id + index * width === shipBlocks[index].id
    );
  }

  const notTaken = shipBlocks.every(
    (shipBlock) => !shipBlock.classList.contains("taken")
  );
  return { shipBlocks, valid, notTaken };
}

function addShipPiece(user, ship, startId) {
  //get all divs
  const allBlocks = document.querySelectorAll(`#${user} div`);
  let randomBoolean = Math.random() < 0.5;
  let isHorizontal = user === "player" ? angle === 0 : randomBoolean;
  let randomStartIndex = Math.floor(Math.random() * width * width);

  let startIndex = startId ? startId : randomStartIndex;

  const { shipBlocks, valid, notTaken } = handleValidity(
    allBlocks,
    isHorizontal,
    startIndex,
    ship
  );

  if (valid && notTaken) {
    shipBlocks.forEach((shipBlock) => {
      shipBlock.classList.add(ship.name);
      shipBlock.classList.add("taken");
    });
  } else {
    if (user === "computer") addShipPiece("computer", ship, startId);
    if (user === "player") notDragged = true;
  }
}

ships.forEach((ship) => addShipPiece("computer", ship));

//draggable ships
let draggedShip;
const optionShips = Array.from(option.children);
optionShips.forEach((optionShip) =>
  optionShip.addEventListener("dragstart", dragStart)
);

const allPlayerBlocks = document.querySelectorAll("#player div");
allPlayerBlocks.forEach((playerBlock) => {
  playerBlock.addEventListener("dragover", dragOver);
  playerBlock.addEventListener("drop", dropShip);
});

function dragStart(e) {
  notDragged = false;
  draggedShip = e.target;
}

function dragOver(e) {
  e.preventDefault();
  const ship = ships[draggedShip.id];
  highlightArea(e.target.id, ship);
}

function dropShip(e) {
  const startId = e.target.id;
  const ship = ships[draggedShip.id];
  addShipPiece("player", ship, startId);
  if (!notDragged) {
    draggedShip.remove();
  }
}

//add highlight
function highlightArea(startIndex, ship) {
  const allBlocks = document.querySelectorAll("#player div");
  let isHorizontal = angle === 0;
  const { shipBlocks, valid, notTaken } = handleValidity(
    allBlocks,
    isHorizontal,
    startIndex,
    ship
  );

  if (valid && notTaken) {
    shipBlocks.forEach((shipBlock) => {
      shipBlock.classList.add("hover");
      setTimeout(() => shipBlock.classList.remove("hover"), 500);
    });
  }
}

let gameOver = false;
let playerTurn;

//start game
function startGame() {
  if (playerTurn === undefined) {
    if (option.children.length != 0) {
      info.textContent = "All ships must be placed before start";
      info.style.color = 'red'
    } else {
      const allBlocks = document.querySelectorAll("#computer div");
      allBlocks.forEach((block) =>
        block.addEventListener("click", handleClick)
      );
      playerTurn = true;
      turn.textContent = "Your turn";
      turn.style.color = 'green'
      info.textContent = "The war has begun";
      info.style.color = 'black'
      info.style.fontStyle = 'none'
    }
  }
}

startBtn.addEventListener("click", startGame);

let playerHits = [];
let computerHits = [];
const playerSunkShips = [];
const computerSunkShips = [];

function handleClick(e) {
  if (!gameOver) {
    if (e.target.classList.contains("taken")) {
      e.target.classList.add("boom");
      info.textContent = "Hit!";
      let classes = Array.from(e.target.classList);
      classes = classes.filter((className) => className !== "block");
      classes = classes.filter((className) => className !== "boom");
      classes = classes.filter((className) => className !== "taken");
      playerHits.push(...classes);
      checkScore("player", playerHits, playerSunkShips);
    }

    if (e.target.classList.contains("taken")) {
      info.textContent = "Oh! We struck them!";
      //add empty so we know we hit it already
      e.target.classList.add("boom");
    }
    playerTurn = false;
    const allBlocks = document.querySelectorAll("#copmputer div");
    //remove event listener from all items
    allBlocks.forEach((block) => block.replaceWith(block.cloneNode(true)));
    setTimeout(computerTurn, 3000);
  }
}
const allComputerBlocks = document.querySelectorAll("#computer div");
allComputerBlocks.forEach((computerBlock) => {
  computerBlock.addEventListener("click", clickBlock);
});

function clickBlock(e) {
  const block = e.target;
  if (!block.classList.contains("taken")) {
    block.classList.add("empty");
  }
}

//define computer playing
function computerTurn() {
  if (!gameOver) {
    turn.textContent = "Enemy's Turn!";
    info.textContent = "The enemy is afoot!";

    setTimeout(() => {
      let randomGo = Math.floor(Math.random() * width * width);
      const allBlocks = document.querySelectorAll("#player div");

      if (
        allBlocks[randomGo].classList.contains("taken") &&
        allBlocks[randomGo].classList.contains("boom")
      ) {
        computerTurn();
        return;
      } else if (
        allBlocks[randomGo].classList.contains("taken") &&
        !allBlocks[randomGo].classList.contains("boom")
      ) {
        allBlocks[randomGo].classList.add("boom");
        info.textContent = "The enemy hit us!";
        let classes = Array.from(allBlocks[randomGo].classList);
        classes = classes.filter((className) => className !== "block");
        classes = classes.filter((className) => className !== "boom");
        classes = classes.filter((className) => className !== "taken");
        computerHits.push(...classes);
        checkScore("computer", computerHits, computerSunkShips);
      } else {
        info.textContent = "They missed, Captain!";
        allBlocks[randomGo].classList.add("empty");
      }
    }, 3000);

    setTimeout(() => {
      playerTurn = true;
      turn.textContent = "Attack!";
      info.textContent = "Take your shot";
      const allBlocks = document.querySelectorAll("#computer div");
      allBlocks.forEach((block) =>
        block.addEventListener("click", handleClick)
      );
    }, 6000);
  }
}

//determine the score and what ships are hit
function checkScore(user, userHits, userSunkShips) {
  function checkShip(shipName, shipLength) {
    if (
      userHits.filter((storedShipName) => storedShipName === shipName)
        .length === shipLength
    ) {
      info.textContent = `you sunk the ${user}'s ${shipName}`;
      if (user === "player") {
        playerHits = userHits.filter(
          (storedShipName) => storedShipName !== shipName
        );
      }
      if (user === "computer") {
        playerHits = userHits.filter(
          (storedShipName) => storedShipName !== shipName
        );
      }
      userSunkShips.push(shipName);
    }
  }

  checkShip("destroyer", 2);
  checkShip("submarine", 3);
  checkShip("cruiser", 3);
  checkShip("battleship", 4);
  checkShip("carrier", 5);
  console.log("playerHits", playerHits);
  console.log("playerSunkShips", playerSunkShips);

  if (playerSunkShips.length === 5) {
    info.textContent = "You have defeated the enemy";
    gameOver = true;
  }
  if (computerSunkShips.length === 5) {
    info.textContent = "You have been defeated";
    gameOver = true;
  }
}