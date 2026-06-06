import React from 'react'

const TypingIndicator = () => (
    <div className="dice-msg-row dice-msg-row--bot" aria-label="Dice is typing" role="status">
        <div className="dice-bubble dice-bubble--bot dice-typing">
            <span className="dice-dot" />
            <span className="dice-dot" />
            <span className="dice-dot" />
        </div>
    </div>
)

export default TypingIndicator
