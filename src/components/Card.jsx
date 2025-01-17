import React from "react";

export default function Card({ rank, suit, hidden }) {
    const cardImage = hidden
        ? "/src/assets/cards/card_back.png"
        : `/src/assets/cards/${rank}_of_${suit}.png`;

    return (
        <div className="card">
            <img src={cardImage} alt={hidden ? "Card Back" : `${rank} of ${suit}`} />
        </div>
    );
}
