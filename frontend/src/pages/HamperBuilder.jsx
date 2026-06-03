import React, { useState, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { useNavigate } from 'react-router-dom';

const HamperBuilder = () => {
  const { subCategories } = useContext(ShopContext);
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    quantity: '',
    specificProducts: '',
    budgetType: 'per_product', // 'overall' or 'per_product'
    budgetAmount: '',
    selectedSubCategories: [],
    priceBracket: '',
  });

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSubCategory = (subCatName) => {
    setFormData(prev => {
      const isSelected = prev.selectedSubCategories.includes(subCatName);
      if (isSelected) {
        return { ...prev, selectedSubCategories: prev.selectedSubCategories.filter(name => name !== subCatName) };
      } else {
        if (prev.selectedSubCategories.length >= 5) {
          return prev; // Max 5 allowed
        }
        return { ...prev, selectedSubCategories: [...prev.selectedSubCategories, subCatName] };
      }
    });
  };

  const submitToWhatsApp = () => {
    const phoneNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "919004140139";
    let message = `*New Hamper/Kit Inquiry* 🎁\n\n`;
    message += `*Quantity:* ${formData.quantity}\n`;
    message += `*Specific Products:* ${formData.specificProducts || 'None specified'}\n`;
    message += `*Budget Type:* ${formData.budgetType === 'overall' ? 'Overall Budget' : 'Per Product Budget'}\n`;
    message += `*Budget Amount:* ₹${formData.budgetAmount}\n`;
    message += `*Selected Categories:* ${formData.selectedSubCategories.join(', ')}\n`;
    message += `*Price Bracket:* ${formData.priceBracket}\n\n`;
    message += `Please provide options matching this criteria.`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    navigate('/');
  };

  return (
    <div className="py-10 max-w-3xl mx-auto min-h-[70vh] px-4">
      {/* Progress Bar */}
      <div className="mb-8 bg-gray-200 h-2 rounded-full overflow-hidden">
        <div 
          className="bg-black h-full transition-all duration-300" 
          style={{ width: `${(step / 8) * 100}%` }}
        ></div>
      </div>

      <div className="bg-white border border-gray-200 p-8 rounded-xl shadow-sm min-h-[400px] flex flex-col">
        
        {/* Step 1: Intro */}
        {step === 1 && (
          <div className="text-center flex-1 flex flex-col justify-center items-center">
            <h1 className="text-3xl font-bold mb-4">Build Your Custom Hamper</h1>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Follow our simple wizard to curate the perfect gift hamper or kit for your employees, clients, or events.
            </p>
            <button onClick={handleNext} className="bg-black text-white px-10 py-3 font-medium hover:bg-gray-800 transition-colors">
              START BUILDING
            </button>
          </div>
        )}

        {/* Step 2: Quantity */}
        {step === 2 && (
          <div className="flex-1 flex flex-col">
            <h2 className="text-2xl font-semibold mb-6">How many hampers do you need?</h2>
            <input 
              type="number" 
              min="1"
              className="border border-gray-300 p-4 w-full text-xl outline-none focus:border-black"
              placeholder="e.g. 50"
              value={formData.quantity}
              onChange={(e) => updateFormData('quantity', e.target.value)}
            />
          </div>
        )}

        {/* Step 3: Specific Products */}
        {step === 3 && (
          <div className="flex-1 flex flex-col">
            <h2 className="text-2xl font-semibold mb-2">Any specific products in mind?</h2>
            <p className="text-gray-500 mb-6 text-sm">E.g., "I definitely want a diary and a pen." (Optional)</p>
            <textarea 
              className="border border-gray-300 p-4 w-full h-32 outline-none focus:border-black resize-none"
              placeholder="Tell us what you're looking for..."
              value={formData.specificProducts}
              onChange={(e) => updateFormData('specificProducts', e.target.value)}
            ></textarea>
          </div>
        )}

        {/* Step 4: Budget Type */}
        {step === 4 && (
          <div className="flex-1 flex flex-col">
            <h2 className="text-2xl font-semibold mb-6">How would you like to set your budget?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div 
                className={`border-2 p-6 cursor-pointer flex flex-col items-center justify-center text-center ${formData.budgetType === 'overall' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}
                onClick={() => updateFormData('budgetType', 'overall')}
              >
                <span className="text-xl font-medium mb-2">Overall Budget</span>
                <span className="text-sm text-gray-500">For the total order</span>
              </div>
              <div 
                className={`border-2 p-6 cursor-pointer flex flex-col items-center justify-center text-center ${formData.budgetType === 'per_product' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}
                onClick={() => updateFormData('budgetType', 'per_product')}
              >
                <span className="text-xl font-medium mb-2">Per Kit Budget</span>
                <span className="text-sm text-gray-500">For each individual hamper</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Budget Amount */}
        {step === 5 && (
          <div className="flex-1 flex flex-col">
            <h2 className="text-2xl font-semibold mb-6">What is your {formData.budgetType === 'overall' ? 'total' : 'per kit'} budget?</h2>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-500">₹</span>
              <input 
                type="number" 
                min="0"
                className="border border-gray-300 p-4 pl-10 w-full text-xl outline-none focus:border-black"
                placeholder="e.g. 5000"
                value={formData.budgetAmount}
                onChange={(e) => updateFormData('budgetAmount', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 6: Sub Categories */}
        {step === 6 && (
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-2xl font-semibold">Select up to 5 categories</h2>
              <span className="text-sm font-medium text-gray-500">{formData.selectedSubCategories.length}/5 Selected</span>
            </div>
            
            <div className="flex flex-wrap gap-3 overflow-y-auto max-h-[300px] pr-2">
              {subCategories.length > 0 ? subCategories.map(sub => {
                const isSelected = formData.selectedSubCategories.includes(sub.name);
                return (
                  <div 
                    key={sub._id}
                    onClick={() => toggleSubCategory(sub.name)}
                    className={`px-4 py-2 border rounded-full cursor-pointer transition-colors ${isSelected ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'}`}
                  >
                    {sub.name}
                  </div>
                );
              }) : (
                <p className="text-gray-500">Loading categories...</p>
              )}
            </div>
          </div>
        )}

        {/* Step 7: Price Bracket */}
        {step === 7 && (
          <div className="flex-1 flex flex-col">
            <h2 className="text-2xl font-semibold mb-6">Select a Price Bracket (Per Item)</h2>
            <div className="flex flex-col gap-3">
              {['₹50 - ₹500', '₹500 - ₹1000', '₹1000 - ₹1500', '₹1500+'].map(bracket => (
                <div 
                  key={bracket}
                  onClick={() => updateFormData('priceBracket', bracket)}
                  className={`border p-4 cursor-pointer text-lg ${formData.priceBracket === bracket ? 'border-black bg-gray-50 font-medium' : 'border-gray-200 hover:border-gray-400'}`}
                >
                  {bracket}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 8: Review & Submit */}
        {step === 8 && (
          <div className="flex-1 flex flex-col">
            <h2 className="text-2xl font-semibold mb-6">Review Your Request</h2>
            <div className="bg-gray-50 p-6 rounded-lg flex flex-col gap-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Quantity</span>
                <span className="font-medium">{formData.quantity} kits</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Budget</span>
                <span className="font-medium">₹{formData.budgetAmount} ({formData.budgetType === 'overall' ? 'Total' : 'Per Kit'})</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Price Bracket</span>
                <span className="font-medium">{formData.priceBracket}</span>
              </div>
              <div className="flex flex-col pb-2">
                <span className="text-gray-500 mb-1">Categories</span>
                <span className="font-medium">{formData.selectedSubCategories.join(', ') || 'None selected'}</span>
              </div>
              {formData.specificProducts && (
                <div className="flex flex-col pb-2">
                  <span className="text-gray-500 mb-1">Specific Needs</span>
                  <span className="font-medium italic">"{formData.specificProducts}"</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {step > 1 && (
          <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
            <button 
              onClick={handleBack}
              className="px-6 py-2 border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              BACK
            </button>
            
            {step < 8 ? (
              <button 
                onClick={handleNext}
                disabled={
                  (step === 2 && !formData.quantity) || 
                  (step === 5 && !formData.budgetAmount) ||
                  (step === 7 && !formData.priceBracket)
                }
                className="px-8 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                NEXT
              </button>
            ) : (
              <button 
                onClick={submitToWhatsApp}
                className="px-8 py-2 bg-green-500 text-white font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                </svg>
                SUBMIT INQUIRY
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HamperBuilder;
