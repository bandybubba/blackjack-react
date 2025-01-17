import React from "react";

const StatusPopup = ({ status, isVisible }) => {
    if (!isVisible) return null;

    const statusImages = {
        blackjackPlayer: "/src/assets/images/status/you_have_blackjack.png",
        blackjackDealer: "/src/assets/images/status/dealer_has_blackjack.png",
        youWin: "/src/assets/images/status/you_win.png",
        busted: "/src/assets/images/status/busted.png",
        dealerWins: "/src/assets/images/status/dealer_wins.png",
    };

    return (
        <div className="status-popup">
            <img src={statusImages[status]} alt={status} />
        </div>
    );
};

export default StatusPopup;
