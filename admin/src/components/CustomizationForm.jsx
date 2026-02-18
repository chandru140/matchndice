import React from 'react'

const CustomizationForm = ({ isCustomizable, setIsCustomizable, customizationFields, setCustomizationFields }) => {

  const addCustomizationField = () => {
    setCustomizationFields([...customizationFields, {
      name: '',
      label: '',
      type: 'text',
      options: [],
      priceModifier: 0,
      maxLength: 50
    }])
  }

  const removeCustomizationField = (index) => {
    const newFields = customizationFields.filter((_, i) => i !== index)
    setCustomizationFields(newFields)
  }

  const updateCustomizationField = (index, field, value) => {
    const newFields = [...customizationFields]
    newFields[index][field] = value
    setCustomizationFields(newFields)
  }

  return (
    <div className='w-full border-t pt-4 mt-4'>
      <div className='flex gap-2 items-center mb-3'>
        <input
          onChange={() => setIsCustomizable(prev => !prev)}
          checked={isCustomizable}
          type="checkbox"
          id='isCustomizable'
        />
        <label className='cursor-pointer font-medium' htmlFor="isCustomizable">
          Make this product customizable
        </label>
      </div>

      {isCustomizable && (
        <div className='bg-gray-50 p-4 rounded-md'>
          <p className='font-medium mb-3'>Customization Options</p>

          {customizationFields.map((field, index) => (
            <div key={index} className='border bg-white p-3 mb-3 rounded'>
              <div className='flex justify-between items-center mb-2'>
                <p className='font-medium text-sm'>Field #{index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeCustomizationField(index)}
                  className='text-red-500 text-sm'
                >
                  Remove
                </button>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                <div>
                  <label className='text-xs text-gray-600'>Field Name (identifier)</label>
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateCustomizationField(index, 'name', e.target.value)}
                    placeholder="e.g., color, text"
                    className='w-full px-2 py-1 border rounded text-sm'
                  />
                </div>

                <div>
                  <label className='text-xs text-gray-600'>Label (display name)</label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateCustomizationField(index, 'label', e.target.value)}
                    placeholder="e.g., Choose Color"
                    className='w-full px-2 py-1 border rounded text-sm'
                  />
                </div>

                <div>
                  <label className='text-xs text-gray-600'>Input Type</label>
                  <select
                    value={field.type}
                    onChange={(e) => updateCustomizationField(index, 'type', e.target.value)}
                    className='w-full px-2 py-1 border rounded text-sm'
                  >
                    <option value="text">Text</option>
                    <option value="dropdown">Dropdown</option>
                    <option value="textarea">Textarea</option>
                    <option value="radio">Radio</option>
                    <option value="number">Number</option>
                  </select>
                </div>

                <div>
                  <label className='text-xs text-gray-600'>Price Modifier (₹)</label>
                  <input
                    type="number"
                    value={field.priceModifier}
                    onChange={(e) => updateCustomizationField(index, 'priceModifier', Number(e.target.value))}
                    placeholder="0"
                    className='w-full px-2 py-1 border rounded text-sm'
                  />
                </div>

                {(field.type === 'dropdown' || field.type === 'radio') && (
                  <div className='col-span-2'>
                    <label className='text-xs text-gray-600'>Options (comma separated)</label>
                    <input
                      type="text"
                      value={field.options.join(', ')}
                      onChange={(e) => updateCustomizationField(index, 'options', e.target.value.split(',').map(s => s.trim()))}
                      placeholder="Black, White, Red"
                      className='w-full px-2 py-1 border rounded text-sm'
                    />
                  </div>
                )}

                {(field.type === 'text' || field.type === 'textarea') && (
                  <div>
                    <label className='text-xs text-gray-600'>Max Length</label>
                    <input
                      type="number"
                      value={field.maxLength}
                      onChange={(e) => updateCustomizationField(index, 'maxLength', Number(e.target.value))}
                      placeholder="50"
                      className='w-full px-2 py-1 border rounded text-sm'
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addCustomizationField}
            className='bg-blue-500 text-white px-4 py-2 text-sm rounded'
          >
            + Add Customization Field
          </button>
        </div>
      )}
    </div>
  )
}

export default CustomizationForm
