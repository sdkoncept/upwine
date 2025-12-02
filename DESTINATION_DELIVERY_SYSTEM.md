# Destination-Based Delivery Fee System

## Overview

The Upwine platform now uses a dropdown list of predefined destinations in Benin City, each with a fixed delivery fee. This provides clarity and consistency for customers and eliminates the need for geocoding calculations.

## Delivery Destinations & Fees

| Destination | Delivery Fee |
|------------|--------------|
| G.R.A, Benin City | ₦800 |
| Third East Circular, Benin City | ₦1,200 |
| Second East Circular, Benin City | ₦1,200 |
| First East Circular, Benin City | ₦1,200 |
| Airport Road, Benin City | ₦1,200 |
| Ring Road, Benin City | ₦1,200 |
| Siluko Road, Benin City | ₦1,200 |
| New Lagos Road, Benin City | ₦1,200 |
| Ekewan Road, Benin City | ₦1,500 |
| Ikpoba Hill, Benin City | ₦1,500 |
| Ugbowo, Benin City | ₦1,900 |
| Aduwawa, Benin City | ₦2,200 |

**Fee Range:** ₦800 - ₦2,200

## How It Works

### Customer Flow

1. **Order Page**: Customer selects "Delivery" option
   - Shows estimated fee range: ₦800 - ₦2,200
   - Indicates fee is based on selected area

2. **Checkout Page**: 
   - Customer selects their area from dropdown
   - Dropdown shows destinations sorted by fee (lowest first)
   - Each option displays: "Area Name - ₦Fee"
   - Fee automatically updates when destination is selected
   - Optional field for additional address details (street number, landmarks, etc.)

3. **Order Confirmation**: 
   - Shows complete address (destination + details)
   - Displays final delivery fee

### Technical Implementation

**Files Created/Modified:**

1. **`lib/delivery-destinations.ts`** - Destination list and utilities
   - `DELIVERY_DESTINATIONS` - Array of all destinations with fees
   - `getDeliveryFeeForDestination()` - Get fee for a destination
   - `getDestinationsSortedByFee()` - Get destinations sorted by fee
   - `getDestinationsByFee()` - Group destinations by fee

2. **`app/checkout/page.tsx`** - Updated checkout form
   - Replaced address textarea with destination dropdown
   - Added optional "Additional Address Details" field
   - Automatic fee calculation on destination selection
   - Real-time order total updates

3. **`app/order/page.tsx`** - Updated order page
   - Updated delivery option description
   - Shows fee range: ₦800 - ₦2,200
   - Removed geocoding-based messaging

4. **`app/page.tsx`** - Updated homepage
   - Updated delivery info to reflect destination-based system

## Adding New Destinations

To add a new delivery destination:

1. Edit `lib/delivery-destinations.ts`
2. Add to `DELIVERY_DESTINATIONS` array:

```typescript
export const DELIVERY_DESTINATIONS: DeliveryDestination[] = [
  // ... existing destinations
  { name: 'New Area, Benin City', fee: 1500 },
]
```

3. The dropdown will automatically include the new destination

## Modifying Fees

To change a delivery fee:

1. Edit `lib/delivery-destinations.ts`
2. Update the fee value for the destination:

```typescript
{ name: 'G.R.A, Benin City', fee: 900 }, // Changed from 800
```

## Benefits

✅ **Clarity**: Customers see exact fee before ordering  
✅ **Consistency**: Same area always has same fee  
✅ **Simplicity**: No complex geocoding needed  
✅ **Speed**: Instant fee calculation  
✅ **Reliability**: No API dependencies or rate limits  
✅ **User-Friendly**: Dropdown is easier than typing address  

## Address Storage

When an order is placed:
- Full address = `{destination}, {address_details}`
- Example: "G.R.A, Benin City, 123 Main Street, Near Bank"

This ensures dispatch riders have complete information.

## Future Enhancements

Possible improvements:
- Group destinations by fee in dropdown (with headers)
- Add search/filter functionality for long lists
- Show estimated delivery time based on destination
- Add map preview of selected destination
- Allow admin to manage destinations via admin panel

