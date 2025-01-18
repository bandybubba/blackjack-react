import React from "react";

const StatusPopup = ({ status, isVisible }) => {
    if (!isVisible) return null;

    const statusImages = {
        blackjackPlayer: "/public/assets/images/status/you_have_blackjack.png",
        blackjackDealer: "/public/assets/images/status/dealer_has_blackjack.png",
        youWin: "/public/assets/images/status/you_win.png",
        busted: "/public/assets/images/status/busted.png",
        dealerWins: "/public/assets/images/status/dealer_wins.png",
    };

    return (
        <div className="status-popup">
            <img src={statusImages[status]} alt={status} />
        </div>
    );
};

export default StatusPopup;
