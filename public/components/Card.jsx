import React from "react";

const Card = ({ rank, suit, hidden }) => {
    const cardImage = hidden
        ? "/src/assets/cards/card_back.png" // Path to the card back image
        : `/src/assets/cards/${rank}_of_${suit}.png`; // Path to the specific card image

    return (
        <img
            className="card"
            src={cardImage}
            alt={hidden ? "Card Back" : `${rank} of ${suit}`}
        />
    );
};

export default Card;
