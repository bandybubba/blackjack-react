import React, { useState } from 'react';
import "./Table.css";
import Card from "./Card";

export default function Table() {
    // Game states (updated as per previous section)
    const [gameStage, setGameStage] = useState("Bet");
    const [playerHands, setPlayerHands] = useState([[]]);  // multiple hands
    const [dealerHand, setDealerHand] = useState([]);
    const [activeHandIndex, setActiveHandIndex] = useState(0);
    const [deck, setDeck] = useState(createDeck());
    const [playerBalance, setPlayerBalance] = useState(1000);
    const [bets, setBets] = useState([0]);               // one bet per hand
    const [splitAllowed, setSplitAllowed] = useState(false);
    const [popupStatus, setPopupStatus] = useState(null); // Holds the current status (e.g., "blackjackPlayer", "youWin")
    const [isPopupVisible, setIsPopupVisible] = useState(false); // Controls popup visibility

    const showPopup = (status) => {
        setPopupStatus(status);
        setIsPopupVisible(true);
        setTimeout(() => {
            setIsPopupVisible(false);
        }, 3000);
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
        if (bets[0] === 0) {
            showPopup("Place a bet first!");
            return;
        }

        const newDeck = [...deck];
        const newPlayerHands = [[newDeck.pop(), newDeck.pop()]]; // Updated for multi-hand
        const newDealerHand = [
            newDeck.pop(),
            { rank: "", suit: "back", originalRank: newDeck[newDeck.length - 1].rank, originalSuit: newDeck[newDeck.length - 1].suit },
        ];

        setDeck(newDeck);
        setPlayerHands(newPlayerHands);
        setDealerHand(newDealerHand);
        setGameStage("PlayHand");
        setSplitAllowed(true);

        // Immediate blackjack check
        const playerHasBlackjack = calculateHandValue(newPlayerHands[0]) === 21;
        const dealerHasBlackjack = calculateHandValue([
            newDealerHand[0],
            { rank: newDealerHand[1].originalRank, suit: newDealerHand[1].originalSuit },
        ]) === 21;

        if (playerHasBlackjack || dealerHasBlackjack) {
            setGameStage("ConcludeHands");
            setDealerHand([
                newDealerHand[0],
                { rank: newDealerHand[1].originalRank, suit: newDealerHand[1].originalSuit },
            ]);

            if (playerHasBlackjack && dealerHasBlackjack) {
                showPopup("Push! Both have Blackjack!");
                // Refund the bet
                setPlayerBalance((prev) => prev + bets[0]);
                resetGame();
            } else if (playerHasBlackjack) {
                setPlayerBalance((prev) => prev + bets[0] * 2.5); // Blackjack pays 3:2
                showPopup("Blackjack! You win!");
            } else {
                showPopup("Dealer Blackjack! You lose.");
            }
            resetGame(); // Ends round immediately
        }
    };


    const handleSplit = () => {
        if (gameStage !== "PlayHand" || playerHands.length > 3) {
            return; // Max of 4 hands (3 splits)
        }

        const handToSplit = playerHands[activeHandIndex];
        if (
            handToSplit.length !== 2 ||
            !(
                handToSplit[0].rank === handToSplit[1].rank ||
                (
                    ["10", "j", "q", "k"].includes(handToSplit[0].rank) &&
                    ["10", "j", "q", "k"].includes(handToSplit[1].rank)
                )
            )
        ) {
            showPopup("Cards must be the same rank or both 10-value (10, J, Q, K) to split!");
            return;
        }

        if (playerBalance < bets[activeHandIndex]) {
            showPopup("Not enough balance to split!");
            return;
        }

        const newDeck = [...deck];
        const splitHands = [
            [handToSplit[0], newDeck.pop()],
            [handToSplit[1], newDeck.pop()]
        ];

        const updatedPlayerHands = [...playerHands];
        updatedPlayerHands.splice(activeHandIndex, 1, ...splitHands);

        const updatedBets = [...bets];
        const numericBet = updatedBets[activeHandIndex];

        updatedBets.splice(
            activeHandIndex,
            1,
            numericBet * 2
        );


        setDeck(newDeck);
        setPlayerHands(updatedPlayerHands);
        setBets(updatedBets);
        setPlayerBalance((prev) => prev - bets[activeHandIndex]);

        splitHands.forEach((hand, i) => {
            // Optional: Check if it's 21 just to inform the player,
            // but don't pay out or move on immediately:
            if (calculateHandValue(hand) === 21) {
                showPopup(`Hand ${activeHandIndex + i + 1} is 21!`);
                // No immediate payout or "moveToNextHand()"
            }
        });
    };



    const handleHit = () => {
        if (gameStage !== "PlayHand") return;

        const newDeck = [...deck];
        const hand = [...playerHands[activeHandIndex]];
        // to calculate each hand's score individually, we will need to calculate and store them individually.
        // lets make multiple hand variables, since there will always be more hands in a split
        // probably best to make it dynamic in the future, but we can just declare them all for now
        // let hand1;
        // let hand2;


        if (newDeck.length === 0) {
            updateStatus("Deck is empty! Reshuffling...");
            setDeck(createDeck());
            return;
        }

        hand.push(newDeck.pop());

        const updatedHands = [...playerHands];
        updatedHands[activeHandIndex] = hand;

        setDeck(newDeck);
        setPlayerHands(updatedHands);

        const handValue = calculateHandValue(hand);

        if (handValue === 21) {
            // Instead of showPopup, use updateStatus:
            updateStatus(`Hand ${activeHandIndex + 1} hits 21!`);
            moveToNextHand();
        } else if (handValue > 21) {
            // Instead of showPopup, use updateStatus:
            updateStatus(`Hand ${activeHandIndex + 1} busts!`);
            moveToNextHand();
        }
    };

    const moveToNextHand = () => {
        const handValue = calculateHandValue(playerHands[activeHandIndex]);

        if (handValue > 21) {
            // If the current hand busts, move to the next hand or end the round
            if (activeHandIndex < playerHands.length - 1) {
                setActiveHandIndex(activeHandIndex + 1);
            } else {
                setGameStage("ConcludeHands");
                resolveGame(dealerHand, playerHands);
            }
        } else if (activeHandIndex < playerHands.length - 1) {
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
            playerHands[activeHandIndex].length > 2 ||
            playerBalance < bets[activeHandIndex]
        ) {
            return; // Cannot double down in these cases
        }

        setPlayerBalance((prevBalance) => prevBalance - bets[activeHandIndex]);

        const updatedBets = [...bets];
        updatedBets[activeHandIndex] *= 2; // Double the bet for the active hand
        setBets(updatedBets);

        const newDeck = [...deck];
        const updatedHand = [...playerHands[activeHandIndex]];
        updatedHand.push(newDeck.pop());

        const updatedPlayerHand = [...playerHands];
        updatedPlayerHand[activeHandIndex] = updatedHand;

        setDeck(newDeck);
        setPlayerHands(updatedPlayerHand);
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

        resolveGame(newDealerHand, playerHands);
    };

    const resolveGame = (dealerHand, playerHands) => {
        const dealerValue = calculateHandValue(dealerHand);
        const playerResults = playerHands.map((hand) => {
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
                    newBalance += bets[i] * 2;
                } else if (result === "Push") {
                    newBalance += bets[i];
                }
            });
            return newBalance;
        });

        updateStatus(`Game Results: ${playerResults.join(", ")}`);
    };

    const handlePlaceBet = (amount) => {
        if (gameStage === "ConcludeHands") {
            // Perform the reset now, but keep the playerBalance as is
            // (since you already adjusted it after the last round)
            setGameStage("Bet");
            setPlayerHands([[]]);
            setDealerHand([]);
            setActiveHandIndex(0);
            setDeck(createDeck());
            setBets([0]);
            setSplitAllowed(false);
        }

        if (gameStage === "Bet") {
            const numericAmount = Number(amount); // Force to number
            if (playerBalance >= numericAmount) {
                setPlayerBalance((prevBalance) => prevBalance - numericAmount);
                setBets((prevBets) => {
                    const newBets = [...prevBets];
                    newBets[0] = Number(newBets[0]) + numericAmount;
                    return newBets;
                });
            } else {
                updateStatus("Not enough balance!");
            }
        }
    };

    const resetGame = () => {
        setGameStage("Bet");
        setPlayerHands([[]]); // Reset to one empty hand
        setDealerHand([]); // Reset dealer's hand
        setActiveHandIndex(0); // Reset active hand index
        setDeck(createDeck()); // Reshuffle the deck
        setBets([0]); // Reset bets array
        setSplitAllowed(false); // Disable splitting
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

    ////JSX CODE

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
                <div id="bet-display">{bets}</div>
                <div id="balance-display">{playerBalance}</div>
            </div>

            {/* Game Area */}
            <div id="game-area">
                

                {/* Player Hands */}
                {playerHands.map((hand, handIndex) => (
                    <div
                        key={handIndex}
                        id={`player-hand-container-${handIndex}`}
                        className={`player-hand-container ${handIndex === activeHandIndex ? 'active' : ''}`}
                        style={{
                            position: "absolute",
                            bottom:
                                handIndex === 0
                                    ? "220px"
                                    : `calc(220px - ${handIndex * 50}px)`, // Adjust vertical position dynamically
                            left: handIndex === 0 ? "50%" : handIndex === 1 ? "25%" : handIndex === 2 ? "75%" : "25%",
                            transform: "translateX(-50%)",
                            zIndex: handIndex,
                        }}
                    >
                        <div id={`player-hand-${handIndex}`}>
                            {hand.map((card, index) => (
                                <Card key={index} {...card} />
                            ))}
                        </div>
                        <div className={`player-score ${handIndex === activeHandIndex ? 'active' : ''}`}>
                            {calculateHandValue(hand)}
                        </div>
                    </div>
                ))}
                {/* Dealer Hand */}
                <div id="dealer-hand-container">
                    <div id="dealer-hand">
                        {dealerHand.map((card, index) => (
                            <Card key={index} {...card} />
                        ))}
                    </div>
                    <div id="dealer-score"> {/* Dealer score without text */}
                        {gameStage === "ConcludeHands" && calculateHandValue(dealerHand)}
                    </div>
                </div>
            </div>
            {/* Controls */}
            {/* Controls */}
            <div id="controls">
                {/* Betting Chip Buttons */}
                <div id="chip-container"> {/* Removed duplicate div */}
                    <img
                        id="chip-5"
                        className="chip"
                        src="public/assets/icons/CHIPS/Casino_Roulette_Chips_5.png"
                        onClick={() => handlePlaceBet(5)}
                    />
                    <img
                        id="chip-10"
                        className="chip"
                        src="public/assets/icons/CHIPS/Casino_Roulette_Chips_10.png"
                        onClick={() => handlePlaceBet(10)}
                    />
                    <img
                        id="chip-25"
                        className="chip"
                        src="public/assets/icons/CHIPS/Casino_Roulette_Chips_25.png"
                        onClick={() => handlePlaceBet(25)}
                    />
                    <img
                        id="chip-50"
                        className="chip"
                        src="public/assets/icons/CHIPS/Casino_Roulette_Chips_50.png"
                        onClick={() => handlePlaceBet(50)}
                    />
                    <img
                        id="chip-100"
                        className="chip"
                        src="public/assets/icons/CHIPS/Casino_Roulette_Chips_100.png"
                        onClick={() => handlePlaceBet(100)}
                    />
                </div>

                {/* Circle Buttons */}
                <div id="circle-button-container">
                    <img
                        id="clear-bet"
                        src="/public/assets/icons/INTERFACE/clear_bets_off.png"
                        alt="Clear Bet"
                        onClick={() => setBets([0])}
                    />
                    <img
                        id="deal"
                        src="/public/assets/icons/INTERFACE/deal_off.png"
                        alt="Deal"
                        onClick={dealCards}
                    />
                    <img
                        id="hit"
                        src="/public/assets/icons/INTERFACE/hit_button_off.png"
                        alt="Hit"
                        onClick={handleHit}
                        style={{ cursor: "pointer" }}
                    />

                    <img
                        id="stand"
                        src="/public/assets/icons/INTERFACE/stand_button_off.png"
                        alt="Stand"
                        onClick={moveToNextHand}
                    />
                    <img
                        id="double"
                        src="/public/assets/icons/INTERFACE/double_off.png"
                        alt="Double"
                        onClick={handleDoubleDown}
                    />
                    <img
                        id="split"
                        src="/public/assets/icons/INTERFACE/split_off.png"
                        alt="Split"
                        onClick={handleSplit}
                        style={{ cursor: splitAllowed ? "pointer" : "not-allowed", opacity: splitAllowed ? 1 : 0.5 }}
                    />

                </div>
            </div>
        </div>
    );

}
