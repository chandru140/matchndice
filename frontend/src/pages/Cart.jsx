import React , {useState , useEffect} from 'react'
import { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title'
import { assets } from '../assets/frontend_assets/assets'
import CartTotal from '../components/CartTotal'

const Cart = () => {

  const {products , currency,  cartItems , updateQuantity , navigate} = useContext(ShopContext)

  const [cartData , setCartData] = useState([])

  useEffect(() => {
  if(products.length > 0){

    const tempData = []
    for(const items in cartItems){
      for(const item in cartItems[items]){
        const cartItem = cartItems[items][item]
        
        // Handle both old format (number) and new format (object)
        if(typeof cartItem === 'number' && cartItem > 0){
          tempData.push({
            _id:items,
            cartKey:item,
            size:item,
            quantity:cartItem,
            customization: null
          })
        } else if(typeof cartItem === 'object' && cartItem.quantity > 0){
          tempData.push({
            _id:items,
            cartKey:item,
            size:cartItem.size,
            quantity:cartItem.quantity,
            customization: cartItem.customization
          })
        }
      }
    }
    setCartData(tempData)
  }

  }, [cartItems , products])

  return (
    <div>
      <div className='border-t pt-14'>
        <div className='text-2xl mb-3'>
          <Title text1={'YOUR'} text2={'CART'} />
        </div>

        <div>
          {
            cartData.map((item,index)=>{
                const productData = products.find((product)=>product._id === item._id);
                
                // Calculate price including customization
                let itemPrice = productData.price;
                if(productData.isCustomizable && item.customization && productData.customizationFields){
                  const customizationPrice = productData.customizationFields
                    .filter(field => item.customization[field.name])
                    .reduce((sum, field) => sum + (field.priceModifier || 0), 0);
                  itemPrice += customizationPrice;
                }
                
                return(
                  <div key={index} className='py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4 '>
                    <div className='flex items-start gap-6'>
                      <img className='w-16 sm:w-20' src={productData.image[0]} alt={productData.name} loading="lazy" />
                      <div>
                        <p className='text-xs sm:text-lg font-medium'>{productData.name}</p>
                        <div className='flex items-center gap-5 mt-2'>
                          <p>{currency}{itemPrice}</p>
                          <p className='px-2 sm:px-3 sm:py-1 border bg-slate-50'>{item.size}</p>
                        </div>
                        
                        {/* Display Customization Details */}
                        {item.customization && Object.keys(item.customization).length > 0 && (
                          <div className='mt-2 text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded'>
                            <p className='font-semibold mb-1'>Customization:</p>
                            {Object.entries(item.customization).map(([key, value]) => (
                              value && <p key={key} className='capitalize'>{key}: {value}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <input 
                      onChange={(e)=> e.target.value === ''|| e.target.value === '0' ? null : updateQuantity(item._id,item.cartKey,Number(e.target.value))} 
                      className='border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1' 
                      type="number" 
                      min={1} 
                      defaultValue={item.quantity} 
                    />
                    <img 
                      onClick={()=>updateQuantity(item._id , item.cartKey , 0)} 
                      className='w-4 mr-4 sm:w-5 cursor-pointer' 
                      src={assets.bin_icon} 
                      alt="" 
                    />
                  </div>
                )
            })
          }
        </div>
      </div>
      <div className='flex justify-end my-20'>
          <div className='w-full sm:w-[450px]'>
            <CartTotal/>
            <div className='w-full text-end'>
              <button onClick={()=>navigate('/place-order')} className='bg-black text-white my-8 py-3 px-6'>
                PROCEED TO CHECKOUT
              </button>
            </div>
          </div>
      </div>
    </div>
  )
}

export default Cart
