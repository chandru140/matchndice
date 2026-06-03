import React, { useContext, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Link, useNavigate } from 'react-router-dom';

const CategoryDistribution = () => {
  const { categories, subCategories } = useContext(ShopContext);
  const [expandedCats, setExpandedCats] = useState({});
  const navigate = useNavigate();

  const toggleCategory = (categoryId) => {
    setExpandedCats(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Helper to get badges for categories (mock data to match design)
  const getCategoryBadge = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('core') || lower.includes('corporate')) return { text: 'Popular', color: 'bg-orange-500' };
    if (lower.includes('office')) return { text: 'Customizable', color: 'bg-blue-500' };
    if (lower.includes('apparel') || lower.includes('wearable')) return { text: 'Bulk Discount', color: 'bg-purple-500' };
    if (lower.includes('sustainable') || lower.includes('eco')) return { text: 'Eco-friendly', color: 'bg-green-500' };
    return null;
  };

  // Helper to get badges for subcategories
  const getSubCategoryBadge = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('welcome') || lower.includes('appreciation')) return { text: 'Low MOQ', color: 'text-orange-600 bg-orange-100' };
    if (lower.includes('festive') || lower.includes('event')) return { text: 'Bulk Discount', color: 'text-orange-600 bg-orange-100' };
    if (lower.includes('executive') || lower.includes('premium')) return { text: 'Customizable', color: 'text-orange-600 bg-orange-100' };
    return { text: 'Fast Customization', color: 'text-orange-600 bg-orange-100' }; // Default
  };

  // Icons mapping based on category names (using a simple emoji for now, can be replaced with SVGs)
  const getCategoryIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('corporate') || lower.includes('core')) return '🎁';
    if (lower.includes('office')) return '💼';
    if (lower.includes('apparel') || lower.includes('wearable')) return '👕';
    if (lower.includes('brand')) return '🎨';
    if (lower.includes('sustainable') || lower.includes('eco')) return '🌿';
    return '📦';
  };

  return (
    <div className="py-10 max-w-5xl mx-auto min-h-screen">
      <div className="text-2xl mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Corporate Gifting Categories</h1>
        <p className="text-gray-500 text-sm mt-2">Explore our premium curated gift solutions</p>
      </div>

      <div className="flex flex-col gap-4">
        {categories.map((cat, index) => {
          // Find subcategories belonging to this category
          const catSubCats = subCategories.filter(sub => {
            const parentId = sub.categoryId?._id || sub.categoryId;
            return parentId === cat._id;
          });

          const isExpanded = expandedCats[cat._id] !== undefined ? expandedCats[cat._id] : index === 0; // First one open by default
          const badge = getCategoryBadge(cat.name);

          return (
            <div key={cat._id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
              {/* Accordion Header */}
              <div 
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleCategory(cat._id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-2xl shadow-sm text-white">
                    {getCategoryIcon(cat.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-gray-800">{cat.name}</h2>
                      {badge && (
                        <span className={`${badge.color} text-white text-xs px-2.5 py-0.5 rounded-full font-medium`}>
                          {badge.text}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {catSubCats.length} options available
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-gray-500">
                  <span className="text-sm">{catSubCats.length} options</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Accordion Body */}
              <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100 border-t border-gray-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="p-6 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {catSubCats.length > 0 ? (
                      catSubCats.map(sub => {
                        const subBadge = getSubCategoryBadge(sub.name);
                        return (
                          <div 
                            key={sub._id} 
                            onClick={() => {
                              // Navigate to collections pre-filtered
                              // We'd need to update Collections to handle query params, or just pass state
                              navigate('/collection', { state: { subCategory: sub._id, category: cat._id }});
                            }}
                            className="bg-white p-5 rounded-lg border border-gray-200 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer group"
                          >
                            <h3 className="font-semibold text-gray-800 group-hover:text-orange-500 transition-colors">{sub.name}</h3>
                            <div className="flex justify-between items-end mt-6">
                              <p className="text-xs text-gray-500">MOQ: 50+ units</p>
                              {subBadge && (
                                <span className={`${subBadge.color} text-[10px] px-2 py-1 rounded font-medium`}>
                                  {subBadge.text}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500 py-4">No sub-categories available in this category.</p>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                    <Link to="/collection" className="text-orange-500 text-sm font-semibold hover:underline flex items-center gap-1">
                      View All Products 
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    <a 
                      href="https://wa.me/919004140139?text=Hello,%20I%20am%20interested%20in%20a%20bulk%20inquiry%20for%20corporate%20gifting." 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-[#1e293b] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors"
                    >
                      Bulk Inquiry
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryDistribution;
