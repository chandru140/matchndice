export const generateWhatsAppLink = (productData, currency, size, customization, customizationPrice) => {
    const phoneNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "919004140139";

    let message = `Hello Match n Dice Team 👋\n\n`;
    message += `I am interested in customizing the following product:\n\n`;
    message += `*Product Name*: ${productData.name}\n`;

    if (productData.category && productData.category.name) {
        message += `*Category*: ${productData.category.name}\n`;
    }

    message += `*Price*: ${currency}${productData.price}\n`;

    if (customizationPrice > 0) {
        message += `*Estimated Total*: ${currency}${productData.price + customizationPrice}\n`;
    }

    if (Object.keys(customization).length > 0) {
        message += `\n*Customization Details*:\n`;
        for (const [key, value] of Object.entries(customization)) {
            if (value) message += `- ${key}: ${value}\n`;
        }
    }

    message += `\nPlease guide me with customization options and delivery details.`;

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
};

export const redirectToWhatsApp = (link) => {
    window.open(link, '_blank');
};
