import React, { useContext } from 'react'
import { renderMarkdown, getTimeLabel } from '../../utils/chatUtils'
import { ProductCarousel } from './ProductCard'
import WhatsAppHandoffCard from './WhatsAppHandoffCard'
import { ShopContext } from '../../context/ShopContext'
import { useChatbot } from '../../context/ChatbotContext'

// ── Customization summary card ────────────────────────────────────────────────
const CustomizationSummaryCard = ({ data }) => {
    const { executeAction, sessionId } = useChatbot()
    if (!data) return null
    const { productName, requirements = {}, userInfo = {} } = data

    return (
        <div className="dice-summary-card">
            <p className="dice-summary-title">📋 Your Customization Summary</p>
            <div className="dice-summary-grid">
                {productName     && <><span>Product</span><span>{productName}</span></>}
                {requirements.text      && <><span>Text/Engraving</span><span>"{requirements.text}"</span></>}
                {requirements.logo != null && <><span>Logo</span><span>{requirements.logo ? 'Yes' : 'No'}</span></>}
                {requirements.color     && <><span>Color</span><span>{requirements.color}</span></>}
                {requirements.quantity  && <><span>Quantity</span><span>{requirements.quantity} pieces</span></>}
                {requirements.deadline  && <><span>Deadline</span><span>{requirements.deadline}</span></>}
                {requirements.occasion  && <><span>Occasion</span><span>{requirements.occasion}</span></>}
                {userInfo.name          && <><span>Name</span><span>{userInfo.name}</span></>}
                {userInfo.phone         && <><span>Phone</span><span>{userInfo.phone}</span></>}
            </div>
            <button
                className="dice-wa-btn"
                style={{ marginTop: '12px' }}
                onClick={() => executeAction('open_whatsapp', { customizationData: data })}
            >
                <span>✅</span> Confirm & Connect on WhatsApp
            </button>
        </div>
    )
}

// ── Main message bubble ────────────────────────────────────────────────────────
const MessageBubble = ({ message }) => {
    const shopCtx = useContext(ShopContext)
    const { sessionId } = useChatbot()
    const products = shopCtx?.products || []
    const isBot = message.role === 'assistant'
    const isUser = message.role === 'user'

    return (
        <div className={`dice-msg-row ${isBot ? 'dice-msg-row--bot' : 'dice-msg-row--user'}`}>

            {/* Bot avatar dot */}
            {isBot && <div className="dice-msg-avatar">🎲</div>}

            <div className="dice-msg-content">
                {/* Image preview (user sent) */}
                {message.messageType === 'image' && message.imagePreview && (
                    <div className="dice-bubble dice-bubble--user">
                        <img
                            src={message.imagePreview}
                            alt="Shared image"
                            className="dice-img-preview"
                            style={{ maxWidth: '200px', maxHeight: '160px', borderRadius: '8px', objectFit: 'cover' }}
                        />
                    </div>
                )}

                {/* Text bubble */}
                {message.content && message.content !== '[Image]' && (
                    <div className={`dice-bubble ${isBot ? 'dice-bubble--bot' : 'dice-bubble--user'} ${message.isError ? 'dice-bubble--error' : ''}`}>
                        <div
                            className="dice-bubble-text"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                        />
                    </div>
                )}

                {/* Product carousel */}
                {isBot && message.products && message.products.length > 0 && (
                    <ProductCarousel productIds={message.products} allProducts={products} />
                )}

                {/* Customization summary */}
                {isBot && message.customizationSummary && (
                    <CustomizationSummaryCard data={message.customizationSummary} />
                )}

                {/* WhatsApp handoff card */}
                {isBot && message.whatsappHandoff && (
                    <WhatsAppHandoffCard
                        handoffData={message.whatsappHandoff}
                        customizationData={message.customizationSummary}
                        sessionId={sessionId}
                    />
                )}

                {/* Timestamp */}
                <p className={`dice-msg-time ${isUser ? 'dice-msg-time--user' : ''}`}>
                    {getTimeLabel(message.timestamp)}
                </p>
            </div>
        </div>
    )
}

export default MessageBubble
