import React, { useState } from 'react';
import "./Table.css";
import Card from "./Card"; 


export default function Table() {
    // Game states (updated as per previous section)
    const [gameStage, setGameStage] = useState("Bet");
    const [playerHand, setPlayerHand] = useState([]); 
    const [dealerHand, setDealerHand] = useState([]);
    const [activeHandIndex, setActiveHandIndex] = useState(0); 
    const [deck, setDeck] = useState(createDeck());
    const [playerBalance, setPlayerBalance] = useState(1000);
    const [currentBet, setCurrentBet] = useState(0);
    const [splitAllowed, setSplitAllowed] = useState(false);
    const [popupStatus, setPopupStatus] = useState(null); // Holds the current status (e.g., "blackjackPlayer", "youWin")
    const [isPopupVisible, setIsPopupVisible] = useState(false); // Controls popup visibility
    


    const showPopup = (status) => {
        setPopupStatus(status);
        setIsPopupVisible(true);
    
        setTimeout(() => {
            setIsPopupVisible(false);
        }, 3000); // Hide the popup after 3 seconds
    };

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

    function shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    const dealCards = () => {
        if (currentBet === 0) {
            alert("Place a bet first!");
            return;
        }

        const newDeck = [...deck];
        const newPlayerHand = [newDeck.pop(), newDeck.pop()];
        const newDealerHand = [
            newDeck.pop(),
            { rank: "", suit: "back", originalRank: newDeck[newDeck.length - 1].rank, originalSuit: newDeck[newDeck.length - 1].suit },
        ];

        setDeck(newDeck);
        setPlayerHand([newPlayerHand]); 
        setDealerHand(newDealerHand);
        setGameStage("PlayHand");
        setSplitAllowed(true); // Allow splitting after dealing the initial hands
    };

    const handleSplit = () => {
        if (gameStage !== "PlayHand" || playerHand.length > 3) {
            // You can only split up to 3 times (resulting in 4 hands)
            return;
        }
    
        const handToSplit = playerHand[activeHandIndex]; // Use activeHandIndex to get the current hand
        if (
            handToSplit.length !== 2 ||
            (handToSplit[0].rank !== handToSplit[1].rank &&
                !(
                    calculateHandValue([handToSplit[0]]) === 10 &&
                    calculateHandValue([handToSplit[1]]) === 10
                ))
        ) {
            alert(
                "Cards must be the same rank or both equal 10 to split and you can only split once per hand!"
            );
            return;
        }
    
        if (playerBalance < currentBet) {
            alert("Not enough balance to split!");
            return;
        }
    
        const newDeck = [...deck];
        const splitHands = [
            [handToSplit[0], newDeck.pop()],
            [handToSplit[1], newDeck.pop()],
        ];
    
        // Insert the split hands into the playerHand array at the current index
        const updatedPlayerHand = [...playerHand];
        updatedPlayerHand.splice(activeHandIndex, 1, ...splitHands);
    
        setDeck(newDeck);
        setPlayerHand(updatedPlayerHand);
        setPlayerBalance((prev) => prev - currentBet);
        // No need to reset activeHandIndex, it will continue with the first of the split hands
    };

    const handleHit = () => {
        if (gameStage !== "PlayHand") return;
    
        const hand = [...playerHand[activeHandIndex]];
        const newDeck = [...deck];
    
        if (newDeck.length === 0) {
            // Instead of alert, use updateStatus:
            updateStatus("Deck is empty! Reshuffling..."); 
            setDeck(createDeck());
            return;
        }
    
        hand.push(newDeck.pop());
    
        const updatedHands = [...playerHand];
        updatedHands[activeHandIndex] = hand;
    
        setDeck(newDeck);
        setPlayerHand(updatedHands);
    
        const handValue = calculateHandValue(hand);
    
        if (handValue === 21) {
            // Instead of alert, use updateStatus:
            updateStatus(`Hand ${activeHandIndex + 1} hits 21!`); 
            moveToNextHand();
        } else if (handValue > 21) {
            // Instead of alert, use updateStatus:
            updateStatus(`Hand ${activeHandIndex + 1} busts!`); 
            moveToNextHand();
        }
    };

    const moveToNextHand = () => {
        const handValue = calculateHandValue(playerHand[activeHandIndex]);
    
        if (handValue > 21) {
            // If the current hand busts, move to the next hand or end the round
            if (activeHandIndex < playerHand.length - 1) {
                setActiveHandIndex(activeHandIndex + 1);
            } else {
                setGameStage("ConcludeHands");
                resolveGame(dealerHand, playerHand);
            }
        } else if (activeHandIndex < playerHand.length - 1) {
            // Otherwise, move to the next hand if there are more hands to play
            setActiveHandIndex(activeHandIndex + 1);
        } else {
            // If all hands have been played, start the dealer's turn
            setGameStage("ConcludeHands");
            playDealerTurn();
        }
    };

    const handleDoubleDown = () => {
        if (
            gameStage !== "PlayHand" ||
            playerHand[activeHandIndex].length > 2 ||
            playerBalance < currentBet
        ) {
            return; // Cannot double down in these cases
        }
    
        setPlayerBalance((prevBalance) => prevBalance - currentBet);
        setCurrentBet((prevBet) => prevBet * 2);
    
        const newDeck = [...deck];
        const updatedHand = [...playerHand[activeHandIndex]];
        updatedHand.push(newDeck.pop());
    
        const updatedPlayerHand = [...playerHand];
        updatedPlayerHand[activeHandIndex] = updatedHand;
    
        setDeck(newDeck);
        setPlayerHand(updatedPlayerHand);
        moveToNextHand();
    };

    const playDealerTurn = async () => {
        let newDealerHand = [...dealerHand];
        let newDeck = [...deck];

        newDealerHand[1] = {
            rank: newDealerHand[1].originalRank,
            suit: newDealerHand[1].originalSuit,
        };
        setDealerHand(newDealerHand);

        await new Promise((resolve) => setTimeout(resolve, 1000)); 

        while (calculateHandValue(newDealerHand) < 17) {
            newDealerHand.push(newDeck.pop());
            setDealerHand([...newDealerHand]);
            setDeck(newDeck);

            await new Promise((resolve) => setTimeout(resolve, 1000)); 
        }

        resolveGame(newDealerHand, playerHand); // Use playerHand instead of playerHands
    };

    const resolveGame = (dealerHand, playerHand) => {
        const dealerValue = calculateHandValue(dealerHand);
        const playerResults = playerHand.map((hand) => {
            const playerValue = calculateHandValue(hand);
    
            if (playerValue > 21) {
                return "Bust";
            } else if (dealerValue > 21) {
                return "Win";
            } else if (playerValue > dealerValue) {
                return "Win";
            } else if (playerValue < dealerValue) {
                return "Lose";
            } else {
                return "Push";
            }
        });
    
        setPlayerBalance((prev) => {
            let newBalance = prev;
            playerResults.forEach((result, i) => {
                if (result === "Win") {
                    newBalance += currentBet * (i === 0 ? 2 : 1);
                } else if (result === "Lose") {
                    newBalance -= currentBet;
                }
            });
            return newBalance;
        });
    
        updateStatus(`Game Results: ${playerResults.join(", ")}`);
        resetGame();
    };

    const handlePlaceBet = (amount) => {
        if (gameStage === 'Bet') {
            if (playerBalance >= amount) {
                // Clear the hands and deck when a new bet is placed
                setPlayerHand([[]]);
                setDealerHand([]);
                setDeck(createDeck());
    
                setPlayerBalance((prevBalance) => prevBalance - amount);
                setCurrentBet((prevBet) => prevBet + amount);
            } else {
                updateStatus("Not enough balance!");
            }
        }
    };

    const resetGame = () => {
        setGameStage("Bet");
        //setPlayerHand([[]]); 
        //setDealerHand([]);
        //setActiveHandIndex(0); 
        //setDeck(createDeck());
        setCurrentBet(0);
        setSplitAllowed(false);
    };

    const updateStatus = (message) => {
        // You'll need to implement this function to display the message in your UI
        // For example, you could update a state variable that holds the message
        // and then display it in your JSX
        console.log(message); // Placeholder - replace with your actual implementation
    };

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
            {isPopupVisible && (
            <div id="popup">
                {popupStatus === "blackjackPlayer" && <div>Blackjack!</div>}
                {popupStatus === "youWin" && <div>You Win!</div>}
                {popupStatus === "dealerWins" && <div>Dealer Wins!</div>}
                {/* ... other popup messages ... */}
            </div>
        )}
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
                            <Card key={index} {...card} /> 
                        ))}
                    </div>
                </div>

                <div id="score-display">
                    <div id="player-score">
                        Player Score: {playerHand[activeHandIndex] && calculateHandValue(playerHand[activeHandIndex])}
                    </div>
                    <div id="dealer-score">
                        Dealer Score: {gameStage === "ConcludeHands" && calculateHandValue(dealerHand)}
                    </div>
                </div>

                {/* Player Hands */}
                {playerHand.map((hand, handIndex) => (
    <div
        key={handIndex}
        id={`player-hand-container-${handIndex}`}
        className={`player-hand-container ${handIndex === activeHandIndex ? 'active' : ''}`}
        style={{
            position: "absolute",
            bottom: "220px",
            left: handIndex === 0 ? "50%" : handIndex === 1 ? "25%" : handIndex === 2 ? "75%" : "50%",
            transform: "translateX(-50%)",
        }}
    >
        <div id={`player-hand-${handIndex}`}>
            {hand.map((card, index) => (
                <Card key={index} {...card} />
            ))}
            <div className={`player-score ${handIndex === activeHandIndex ? 'active' : ''}`}> {/* Add player score here */}
                {calculateHandValue(hand)} {/* Just display the score */}
            </div>
        </div>
    </div>
))}
            </div>

            {/* Controls */}
            {/* Controls */}
<div id="controls">
    {/* Betting Chip Buttons */}
    <div id="chip-container"> {/* Removed duplicate div */}
        <img
            id="chip-5"
            className="chip"
            src="/Users/kyleguadagno/dev/blackjack-react/src/assets/icons/CHIPS/Casino_Roulette_Chips_5.png"
            onClick={() => handlePlaceBet(5)}
        />
        <img
            id="chip-10"
            className="chip"
            src="/Users/kyleguadagno/dev/blackjack-react/src/assets/icons/CHIPS/Casino_Roulette_Chips_10.png"
            onClick={() => handlePlaceBet(10)}
        />
        <img
            id="chip-25"
            className="chip"
            src="/Users/kyleguadagno/dev/blackjack-react/src/assets/icons/CHIPS/Casino_Roulette_Chips_25.png"
            onClick={() => handlePlaceBet(25)}
        />
        <img
            id="chip-50"
            className="chip"
            src="/Users/kyleguadagno/dev/blackjack-react/src/assets/icons/CHIPS/Casino_Roulette_Chips_50.png"
            onClick={() => handlePlaceBet(50)}
        />
        <img
            id="chip-100"
            className="chip"
            src="/Users/kyleguadagno/dev/blackjack-react/src/assets/icons/CHIPS/Casino_Roulette_Chips_100.png"
            onClick={() => handlePlaceBet(100)}
        />
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
            onClick={handleHit}
            style={{ cursor: "pointer" }}
        />

        <img
            id="stand"
            src="/src/assets/icons/INTERFACE/stand_button_off.png"
            alt="Stand"
            onClick={moveToNextHand}
        />
        <img
            id="double"
            src="/src/assets/icons/INTERFACE/double_off.png"
            alt="Double"
            onClick={handleDoubleDown}
        />
        <img
            id="split"
            src="/src/assets/icons/INTERFACE/split_off.png"
            alt="Split"
            onClick={handleSplit}
            style={{ cursor: splitAllowed ? "pointer" : "not-allowed", opacity: splitAllowed ? 1 : 0.5 }}
        />

    </div>
</div>
</div>
    );
    // ... (Rest of the code - we'll add this in the next sections) ...
}