const readline = require("readline");
const readlineInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function ask(questionText) {
    return new Promise((resolve, reject) => {
        readlineInterface.question(questionText, resolve);
    });
}

//state machine; Per the "Create More Rooms" story: A limited number of other rooms it connects to; canChangeTo the code defines a set of rooms in the game, each with a canChangeTo property that lists the rooms that can be accessed from that room.
let rooms = {
    mainStreet: {
        canChangeTo: ["foyer"],
    },
    foyer: {
        canChangeTo: ["library", "pianoroom", "computerroom"],
    },
    library: {
        canChangeTo: ["pianoroom", "computerroom"],
    },
    pianoroom: {
        canChangeTo: ["library", "computerroom"],
    },
    computerroom: {
        canChangeTo: ["library", "pianoroom"],
    },
};

class Room {
    //class constructor for rooms in game
    constructor(name, description, inv, locked) {
        this.name = name;
        this.description = description;
        this.inv = inv;
    }
}

const mainStreet = new Room(
    "mainStreet",
    "You are standing on Main Street between Church and South Winooski. There is a door here. A keypad sits on the handle. On the door is a handwritten sign.",
    [],
);

const foyer = new Room(
    "foyer",
    "You are in a foyer. Or maybe it's an antechamber. Or a vestibule. Or an entryway. Or an atrium. Or a narthex. But let's forget all that fancy vocabulary, and just call it a foyer. Anyways, it's definitely not a mudroom. A copy of the local newspaper lies in a corner. NOTE: to pick up an item, use the take or pickup action action.",
    ["local newspaper", "map"],
);

const library = new Room(
    "library",
    "There's a desk in the center of the room with a locked drawer, but you realize you don't have a key. But there are other shelves you can search in the desk.",
    ["desk", "book", "note"],
);

const pianoroom = new Room(
    "pianoroom",
    "The Piano Room is a grand room with a beautiful piano in the center. There's also a portrait with a giant map of the city of Burlington hanging on the wall. But you notice something is off about the piano. Maybe you should search it....",
    ["piano", "key"],
);

const computerroom = new Room(
    "computerroom",
    "The Computer Lab is filled with computer screens and desks. One of the screens displays a message",
    ["message", "riddle"],
);

const secretroom = new Room(
    "secretroom",
    "The Secret Room is small and dark, with a locked door on the opposite side. You must search the room for any items that might help you get out of here",
    ["flashlight", "chest"],
);

const roomMap = { //Eli was kind enough to help with this during office hours on 04/20
    mainStreet,
    foyer,
    library,
    pianoroom,
    computerroom,
    secretroom,
};

class Item {
    //class constructor for rooms in game
    constructor(name, description, takeable) {
        this.name = name;
        this.description = description;
        this.takeable = takeable;
    }
}

const sign = new Item(
    "sign",
    "Welcome to the classroom! Come on up to the third floor.\nIf the door is locked, use the code 12345.",
    false
);

const newspaper = new Item(
    "newspaper",
    "A copy of the local newspaper, with articles and comics. After picking up the newspaper and starting to browse thorugh it, an object that looks like a map falls out of the newspaper",
    true
);

const map = new Item(
    "map",
    "A folded map showing a few areas a person can explore within the current building: a library, a piano room, and a computer room.\nTo enter a room, enter the word go and then if the room has two words (Ex. the piano room), use the two words together (Ex. pianoroom)",
    //set of instructions of how to appropriately enter a room
    true
);

const desk = new Item(
    "desk",
    "After searching the shelves, you find an old book with a note tucked inside",
    false
);

const note = new Item(
    "note",
    "The note reads: The key is in the piano room.",
    true
);

const piano = new Item(
    "piano",
    "After searching the piano, you find a key hidden inside",
    false
);

const key = new Item(
    "key",
    "A key that looks small enough to insert in a drawer of a nearby desk",
    true
);

const paper = new Item(
    "paper",
    "A piece of paper with 5 numbers written on it: 12468. It also advises to the next room on the map, the computer room.",
    true
);

const message = new Item(
    "message",
    "The message reads: To unlock the next room, solve the following riddle: What is always in front of you but can't be seen? HINT: the (6-lettered word)",
    false
);

const flashlight = new Item(
    "flashlight",
    "After shining the light around, they see a keypad on the wall next to the door. You notice a small inscription above the keypad: enter password (HINT: you picked up this password in the library)",
    true
);

const chest = new Item(
    "chest",
    "You lift up the door of the chest and you find a golden key inside!!!",
    false
);

const goldenkey = new Item(
    "goldenkey",
    "After picking up the golden key, you trigger a trap and the door slams shut behind you.\nThe room starts filling with gas\nYou look around to see if there is any way out of this room.\nIn the Far corner, you see a very vague simmer of light coming out of the wall. You start pushing against the wall, but nothing is budging.\n(HINT what else could you do to the wall to escape?)",
    //It is at this point that we are moving from the exploratory stage to the win/lose stage
    true
);

const wall = new Item(
    "wall",
    "YES! You got out of the secret room, and you are back in the Foyer! But you quickly realize that the gas is starting to spread throughout the Foyer.\nYou try opening the same door that you came in at the start of your journey, but it's LOCKED!!!!!\nWhen you turn around, you notice a door on the far wall! Maybe that is your escape!\nYou try opening it, but it is locked! YOU NEED TO GET OUT FAST What can you do? NOTE: you only have three attempts to enter the correct action and item to escape!!",
    false
);

let itemLookup = { //starting on line 255, this helps with the "take" action and if something is takeable
    sign: sign,
    newspaper: newspaper,
    map: map,
    desk: desk,
    note: note,
    piano: piano,
    key: key,
    paper: paper,
    message: message,
    flashlight: flashlight,
    chest: chest,
    goldenkey: goldenkey,
    wall: wall,
};

const code = "12345"; //this is used at the start to help you enter the foyer

const riddle = "the future"; //this is for when you are in the computer room

const password = "12468"; //this will be used to unlock the door in the secret room

let currentRoom = mainStreet; //starting room

let actions = {
    read: ["read", "inspect"],
    open: ["open"],
    enter: ["enter", "input"],
    take: ["take", "pickup"],
    drop: ["drop"],
    go: ["go"],
    search: ["search"],
    insert: ["insert"],
    kick: ["kick"],
};

let inventory = [];

start();

async function start() {
    const welcomeMessage = `${currentRoom.description}\n>_ `;
    let answer = await ask(welcomeMessage);
    while (answer !== "exit") { //true start of the code, where it is everythng but inputting exit in the await ask
        const input = answer.trim().toLowerCase().split(" ");
        const action = input[0];
        const noun = input[1];
        if (actions.read.includes(action)) {  //"read" action
            if (noun === "sign" && currentRoom === roomMap.mainStreet) { //you can only "read sign" if you're on mainStreet
            console.log(sign.description);
        } else if (noun === "message" && currentRoom === roomMap.computerroom) { //you can only "read message" in the computerroom
            console.log(message.description);
            let guess = await ask("Solve Riddle: ");
            if (guess === riddle) {
                console.log(
                    "The computer screen reads: Correct! Near the computer screens, the walls start shifting to the right, revealing a secret room! HINT: just like the previous rooms you've entered prior to this one, enter go and then the name of the room you'd like to enter"
                );
            }
        }
        } else if (action === "open") { //"open" action
            if (noun === "door" && currentRoom === roomMap.mainStreet) { //you can only "open door" if you're on mainStreet
                console.log("The door is locked. There is a keypad on the door handle.");
            } else if (noun === "chest" && currentRoom === roomMap.secretroom) { //you can only "open chest" if you are in the secret room
                console.log(chest.description);
            }
        } else if (action === "enter" && noun === "code" && currentRoom === roomMap.mainStreet) { //this is when you need to enter a code to get into the Foyer (normally i would have both enter's in one code block, but i wanted to add the extra await ask for this assignment), plus you can only do this in mainStreet
            let guess = await ask("Enter the code: ");
            if (guess === code) {
                console.log(
                    "Success! The door opens.\nYou enter the foyer and the door shuts behind you."
                );
                currentRoom = foyer;
                console.log(currentRoom.description);
            } else {
                console.log("Bzzzzt! The door is still locked.");
            }
        } else if (action === "enter" && noun === "password" && currentRoom === roomMap.secretroom) { //this is for when you need to enter a password in the secret room
            let guess = await ask("Enter the password: ");
            if (guess === password) {
                console.log("Success! The door unlocks, revealing a treasure chest!\nNOTE: This chest is not locked.");
            }
        } else if (actions.take.includes(action)) {//"take" action and to let us know if something is takeable
            const item = itemLookup[noun];
            if (item && item.takeable) {
                if (inventory.includes(item)) { //if the player already has an item in their inventory, they can't pick it up again. Else the item will be pushed to their inventory
                    console.log(`You already have the ${item.name}.`);
                } else if (!currentRoom.inv.includes(item)) { //this rule establishes that if you try to take an item that is not in the inventory of the appropriate room, then the message will be printed that you can't
                    console.log(`You cannot pick up the ${item.name}.`)
                } else {
                    inventory.push(item);
                    console.log(`You picked up the ${item.name}.`); //lets us know that an item has been added to our inventory
                    if (item.name === "newspaper" && currentRoom === roomMap.foyer) {
                        console.log(item.description);
                    } else if (item.name === "map" && currentRoom === roomMap.foyer) {
                        console.log(item.description);
                        console.log(
                            "Which room would you like to go to?" 
                        );
                    } else if (item.name === "note" && currentRoom === roomMap.library) { //you can only "take note" in the library
                        console.log(item.description);
                    } else if (item.name === "key" && currentRoom === roomMap.pianoroom) { //you can only "take key" in the paino room
                        console.log(item.description);
                    } else if (item.name === "paper" && currentRoom === roomMap.library) { //you can only "take paper" in the library
                        console.log(item.description);
                    } else if (item.name === "flashlight" && currentRoom === roomMap.secretroom) { //you can only "take flashlight" in the secret room
                        console.log(item.description);
                    } else if (item.name === "goldenkey" && currentRoom === roomMap.secretroom) { //you can only "take goldenkey" in the library
                        console.log(item.description);
                    } 
                }
            } else if (item && !item.takeable) { //if the item is not takeable
                console.log(
                    `That would be selfish. How will other students find their way?` //"immovable objects" story
                );
            } else {
                console.log(`I don't see a ${noun} here.`);
            }
        } else if (actions.drop.includes(action)) { //dropping an item
            const itemIndex = inventory.findIndex((item) => item.name === noun);
            if (itemIndex >= 0) {
                const item = inventory.splice(itemIndex, 1)[0];
                currentRoom.inv.push(item);
                console.log(`You dropped the ${item.name}.`);
            } else {
                console.log(`You are not carrying a ${noun}.`);
            }
        } else if (action === "i" || action === "inventory") { //"inventory" story
            if (inventory.length === 0) {
                console.log("You are not carrying anything.");
            } else {
                console.log(
                    `You are carrying: ${inventory
                        .map((item) => item.name)
                        .join(", ")}.`
                );
            }
        } else if (action === "go") { //"go" is the action where you can enter a room, and I only want to use the "go" action if the player is in select rooms. 
            const room = rooms[currentRoom.name];
            const destinationRoom = noun;
            if (
                currentRoom.name === "foyer" ||
                currentRoom.name === "library" ||
                currentRoom.name === "pianoroom" ||
                currentRoom.name === "computerroom"
            ) {
                if (noun === "library") {
                    currentRoom = roomMap.library;
                    console.log("You have entered the library.");
                    console.log(currentRoom.description);
                } else if (noun === "pianoroom") {
                    currentRoom = roomMap.pianoroom;
                    console.log("You have entered the piano room.");
                    console.log(currentRoom.description);
                } else if (noun === "computerroom") {
                    currentRoom = roomMap.computerroom;
                    console.log("You have entered the computer room.");
                    console.log(currentRoom.description);
                } else if (
                    noun === "secretroom" &&
                    currentRoom.name === "secretroom"
                ) {
                    console.log("You are already in the secret room.");
                    console.log(currentRoom.description);
                } else if (
                    noun === "secretroom" && currentRoom.name === "computerroom" //I set it so that the secretroom can only be accessed from the computer room
                ) {
                    currentRoom = roomMap.secretroom;
                    console.log("You have entered the secret room.");
                    console.log(currentRoom.description);
                } else {
                    console.log("I don't understand that.");
                }
            }
        } else if (action === "search") {//"search" action
            const room = rooms[currentRoom.name];
            const destinationRoom = noun;
            if (noun === "desk" && currentRoom === roomMap.library) { //you can only "search desk" in the library
                console.log(desk.description);
            } else if (noun === "piano" && currentRoom === roomMap.pianoroom) { //you can only "search piano" in the piano room
                console.log(piano.description);
            } else if (noun === "secretroom" && currentRoom === roomMap.secretroom) { //obviously, you can only "search secretroom"
                console.log(
                    "Upon searching the room, you come across a flashlight."
                );
            }
        } else if (action === "insert") { //"insert" action
            if (noun === "key" && currentRoom === roomMap.library) { //you can only "insert key" in the library
            console.log("The drawer opens, revealing a piece of paper with text written on it.");
            } else if (noun === "goldenkey" && currentRoom === roomMap.secretroom) { //doing this ends the game; you can only "insert goldenkey" if you are in the secretroom
                console.log("The door opens and you escapes just in time!\nYou turn around to see the building explode behind you, realizing that you narrowly avoided a deadly trap.\nVictorious, you walk away with the golden key in hand, having successfully completed your Zork adventure.");
                process.exit();
            }
        } else if (action === "kick" && noun === "wall" && currentRoom === roomMap.secretroom) { //"kick" action, and there is only one instance to use this action
            console.log(wall.description);
        } else if (rooms[currentRoom.name].canChangeTo.includes(noun)) {
            currentRoom = roomMap[noun]; // make sure to grok this (Eli wrote this during 04/20 office hours live share)
            console.log(currentRoom.description);
        } else {
            console.log(`I don't understand '${answer}'.`);
        }
        answer = await ask(">_ ");
    }
    console.log("Thanks for playing!");
    process.exit();
}
