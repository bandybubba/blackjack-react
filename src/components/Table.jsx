import React, { useState, useEffect } from "react";
import "./Table.css";
import Card from "./Card";

export default function Table() {
    // Game states
    const [gameStage, setGameStage] = useState("Bet"); // Stages: Bet, PlayHand, PlaySplitHand, ConcludeHands
    const [playerHands, setPlayerHands] = useState([[]]); // Player hands (can have multiple after a split)
    const [dealerHand, setDealerHand] = useState([]); // Dealer's hand
    const [currentHandIndex, setCurrentHandIndex] = useState(0); // Active hand index
    const [deck, setDeck] = useState(createDeck()); // Shuffled deck
    const [playerBalance, setPlayerBalance] = useState(1000); // Player's balance
    const [currentBet, setCurrentBet] = useState(0); // Current bet amount
    const [splitAllowed, setSplitAllowed] = useState(false); // Can the player split?

    // Function to create and shuffle a deck
    function createDeck() {
        const suits = ["hearts", "diamonds", "clubs", "spades"];
        const ranks = ["a", "2", "3", "4", "5", "6", "7", "8", "9", "10", "j", "q", "k"];
        let newDeck = [];
        suits.forEach((suit) => {
            ranks.forEach((rank) => {
                newDeck.push({ rank, suit });
            });
        });
        return shuffleDeck(newDeck);
    }

    // Shuffle the deck
    function shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    
   // Modify dealCards to store original card details
   const dealCards = () => {
    if (currentBet === 0) {
        alert("Place a bet first!");
        return;
    }

    const newDeck = [...deck];
    const newPlayerHand = [newDeck.pop(), newDeck.pop()];
    const newDealerHand = [
        newDeck.pop(),
        { rank: "", suit: "back", originalRank: newDeck[newDeck.length - 1].rank, originalSuit: newDeck[newDeck.length - 1].suit }, // Hide second card
    ];

    setDeck(newDeck);
    setPlayerHands([newPlayerHand]);
    setDealerHand(newDealerHand);
    setGameStage("PlayHand");

    // Ensure dealer's second card is hidden initially, store original details
    setDealerHand([
        { ...newDealerHand[0] },
        { rank: "", suit: "back", originalRank: newDealerHand[1].rank, originalSuit: newDealerHand[1].suit }
    ]);
};
    // <----- END BREAKPOINT 1 ----->

    // Function to handle splitting
    const handleSplit = () => {
        if (!splitAllowed || playerHands.length > 1) return; // Only split if allowed and no existing split
    
        const originalHand = playerHands[0];
        if (originalHand[0].rank !== originalHand[1].rank) {
            alert("Cards must be the same rank to split!");
            return;
        }
    
        if (playerBalance < currentBet) {
            alert("Not enough balance to split!");
            return;
        }
    
        const newDeck = [...deck];
        const splitHands = [
            [originalHand[0], newDeck.pop()], // First split hand
            [originalHand[1], newDeck.pop()], // Second split hand
        ];
    
        setDeck(newDeck);
        setPlayerHands(splitHands);
        setPlayerBalance((prev) => prev - currentBet); // Deduct an additional bet
        setCurrentHandIndex(0); // Reset to the first hand
        setSplitAllowed(false); // Prevent additional splits for this round
    };
    

    // Function to handle hitting
    const handleHit = () => {
        if (gameStage !== "PlayHand") return;
    
        const hand = [...playerHands[currentHandIndex]];
        const newDeck = [...deck];
        hand.push(newDeck.pop());
        const updatedHands = [...playerHands];
        updatedHands[currentHandIndex] = hand;
    
        setDeck(newDeck);
        setPlayerHands(updatedHands);
    
        if (calculateHandValue(hand) > 21) {
            alert(`Hand ${currentHandIndex + 1} busts!`);
            moveToNextHand(); // Automatically proceed to the next hand
        }
    };
    

    // <----- BREAKPOINT 2: Replace moveToNextHand and add playDealerTurn ----->
   // Function to handle moving to the next hand
   const moveToNextHand = () => {
    if (currentHandIndex < playerHands.length - 1) {
        setCurrentHandIndex(currentHandIndex + 1);
    } else {
        setGameStage("ConcludeHands"); // Transition to dealer’s turn
        playDealerTurn();
    }
};


const playDealerTurn = async () => {
    let newDealerHand = [...dealerHand];
    let newDeck = [...deck];

    const dealerHit = async () => {
        if (calculateHandValue(newDealerHand) < 17) {
            newDealerHand.push(newDeck.pop());
            setDealerHand(newDealerHand);
            setDeck(newDeck);

            // Introduce a delay for visual effect
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Recursively call dealerHit until the condition is no longer met
            dealerHit();
        } else {
            // Resolve the game after the dealer finishes hitting
            resolveGame(newDealerHand, playerHands);
        }
    };

    // Ensure the dealer's second card is revealed before hitting
    setDealerHand([{ ...dealerHand[0] }, { ...dealerHand[1], rank: dealerHand[1].originalRank, suit: dealerHand[1].originalSuit }]);

    // Wait for a moment to show the revealed card
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Start the recursive hitting process
    dealerHit();
};

    // <----- END BREAKPOINT 2 ----->

    const handlePlaceBet = (amount) => {
        if (playerBalance >= amount) {
            setPlayerBalance(playerBalance - amount); // Deduct from balance
            setCurrentBet(currentBet + amount); // Update the displayed bet
        } else {
            alert("Not enough balance!");
        }
    };

    // <----- BREAKPOINT 3: Replace resolveGame and add resetGame ----->
    const resolveGame = (dealerHand, playerHands) => {
        const dealerValue = calculateHandValue(dealerHand);
        let newPlayerBalance = playerBalance; // Start with the current balance
    
        const results = playerHands.map((hand) => {
            const playerValue = calculateHandValue(hand);
    
            if (playerValue > 21) {
                return "Bust"; // Player busted, no change to balance
            }
            if (dealerValue > 21) {
                newPlayerBalance += currentBet * 2; // Win: Add double the bet to winnings
                return "Win"; // Dealer busted, player wins
            }
            if (playerValue > dealerValue) {
                newPlayerBalance += currentBet * 2; // Win: Add double the bet to winnings
                return "Win"; // Player has higher value, player wins
            }
            if (playerValue < dealerValue) {
                return "Lose"; // Dealer has higher value, no change to balance
            }
            newPlayerBalance += currentBet; // Push: Refund the bet
            return "Push"; // Tie, refund the bet
        });
    
        setPlayerBalance(newPlayerBalance); // Update the player's balance
    
        console.log("Game Results:", results); // For testing
        alert(`Game Over! Results: ${results.join(", ")}. New Balance: ${newPlayerBalance}`);
        resetGame(); // Reset the game
    };
    
      const resetGame = () => {
          // Reset to initial values
          setGameStage("Bet");
          setPlayerHands([[]]);
          setDealerHand([]);
          setCurrentHandIndex(0);
          setDeck(createDeck());
          setCurrentBet(0);
          setSplitAllowed(false);
      };
    // <----- END BREAKPOINT 3 ----->

    // Function to calculate the hand value
    const calculateHandValue = (hand) => {
        let value = 0;
        let aces = 0;

        hand.forEach((card) => {
            if (card.rank === "a") {
                value += 11;
                aces++;
            } else if (["k", "q", "j"].includes(card.rank)) {
                value += 10;
            } else {
                value += parseInt(card.rank, 10);
            }
        });

        while (value > 21 && aces > 0) {
            value -= 10;
            aces--;
        }

        return value;
    };

    return (
        <div id="blackjack-container">
            {/* Backgrounds */}
            <div id="table-background"></div>
            <div id="table-overlay"></div>

            {/* Display Bet and Balance */}
            <div id="bet-and-balance">
                <div id="bet-display">{currentBet}</div>
                <div id="balance-display">{playerBalance}</div>
            </div>

            {/* Game Area */}
            <div id="game-area">
                {/* Dealer Hand */}
                <div id="dealer-hand-container">
                    <div id="dealer-hand">
                        {dealerHand.map((card, index) => (
                            <Card
                                key={index}
                                {...(index === 1 && gameStage !== "ConcludeHands"
                                    ? { rank: "", suit: "back" } // Show the back image for the second card
                                    : card)}
                            />
                        ))}
                    </div>
                </div>

                {/* Player Hands */}
                {playerHands.map((hand, handIndex) => (
                    <div
                        key={handIndex}
                        id="player-hand-container"
                        style={{
                            position: "absolute",
                            bottom: handIndex === 0 ? "220px" : "180px", // Adjust second hand if split
                            left: "50%",
                            transform: "translateX(-50%)",
                        }}
                    >
                        <div id="player-hand">
                            {hand.map((card, index) => (
                                <Card key={index} {...card} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div id="controls">
    {/* Betting Chip Buttons */}
    <div id="chip-container">
        <button id="chip-5" className="chip" onClick={() => handlePlaceBet(5)}></button>
        <button id="chip-10" className="chip" onClick={() => handlePlaceBet(10)}></button>
        <button id="chip-25" className="chip" onClick={() => handlePlaceBet(25)}></button>
        <button id="chip-50" className="chip" onClick={() => handlePlaceBet(50)}></button>
        <button id="chip-100" className="chip" onClick={() => handlePlaceBet(100)}></button>
    </div>

    {/* Circle Buttons */}
    <div id="circle-button-container">
        <img
            id="clear-bet"
            src="/src/assets/icons/INTERFACE/clear_bets_off.png"
            alt="Clear Bet"
            onClick={() => setCurrentBet(0)}
        />
        <img
            id="deal"
            src="/src/assets/icons/INTERFACE/deal_off.png"
            alt="Deal"
            onClick={dealCards}
        />
        <img
            id="hit"
            src="/src/assets/icons/INTERFACE/hit_button_off.png"
            alt="Hit"
            onClick={() => alert("Hit clicked!")}
        />
        <img
            id="stand"
            src="/src/assets/icons/INTERFACE/stand_button_off.png"
            alt="Stand"
            onClick={() => alert("Stand clicked!")}
        />
        <img
            id="double"
            src="/src/assets/icons/INTERFACE/double_off.png"
            alt="Double"
            onClick={() => alert("Double clicked!")}
        />
        <img
            id="split"
            src="/src/assets/icons/INTERFACE/split_off.png"
            alt="Split"
            onClick={() => alert("Split clicked!")}
        />
    </div>
</div>


        </div>
    );
}