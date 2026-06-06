import React, { useContext } from 'react'
import { useChatbot } from '../../context/ChatbotContext'
import { ShopContext } from '../../context/ShopContext'
import { truncate } from '../../utils/chatUtils'

// ── Single product card in chat ────────────────────────────────────────────────
export const ProductCard = ({ product }) => {
    const { executeAction, sendMessage } = useChatbot()
    const shopCtx = useContext(ShopContext)
    const currency = shopCtx?.currency || '₹'

    if (!product) return null

    const handleAddToCart = () => {
        executeAction('add_to_cart', { productId: product._id || product.id })
    }

    const handleCustomize = () => {
        sendMessage(`I'd like to customize the ${product.name}`, 'text')
    }

    const handleViewProduct = () => {
        executeAction('view_product', { productId: product._id || product.id })
    }

    const imageUrl = Array.isArray(product.image) ? product.image[0] : product.image
    const inStock = (product.stock ?? 1) > 0

    return (
        <div className="dice-product-card">
            {/* Product Image */}
            <div className="dice-product-img-wrap" onClick={handleViewProduct} role="button" tabIndex={0}
                 onKeyDown={e => e.key === 'Enter' && handleViewProduct()}>
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={product.name}
                        className="dice-product-img"
                        loading="lazy"
                        onError={e => { e.target.style.display = 'none' }}
                    />
                ) : (
                    <div className="dice-product-img-placeholder">🎁</div>
                )}
                {!inStock && <span className="dice-oos-badge">Out of stock</span>}
            </div>

            {/* Product Info */}
            <div className="dice-product-info">
                <p className="dice-product-name" title={product.name}>
                    {truncate(product.name, 40)}
                </p>
                <p className="dice-product-price">{currency}{product.price?.toLocaleString('en-IN')}</p>
                {product.reason && (
                    <p className="dice-product-reason">"{truncate(product.reason, 55)}"</p>
                )}
            </div>

            {/* CTA Buttons */}
            <div className="dice-product-actions">
                {product.isCustomizable && (
                    <button className="dice-btn dice-btn--primary" onClick={handleCustomize} disabled={!inStock}>
                        ✏️ Customize
                    </button>
                )}
                <button className="dice-btn dice-btn--secondary" onClick={handleAddToCart} disabled={!inStock}>
                    🛒 Add to Cart
                </button>
            </div>
        </div>
    )
}

// ── Carousel of product cards ──────────────────────────────────────────────────
export const ProductCarousel = ({ productIds, allProducts = [] }) => {
    if (!productIds || productIds.length === 0) return null

    const cards = productIds.map(item => {
        const id = typeof item === 'string' ? item : item.id
        const reason = typeof item === 'object' ? item.reason : null
        const found = allProducts.find(p => (p._id?.toString() || p.id) === id)
        return found ? { ...found, reason } : null
    }).filter(Boolean)

    if (cards.length === 0) return null

    return (
        <div className="dice-carousel" role="list" aria-label="Recommended products">
            {cards.map((product, i) => (
                <div key={product._id || i} role="listitem">
                    <ProductCard product={product} />
                </div>
            ))}
        </div>
    )
}

export default ProductCard
