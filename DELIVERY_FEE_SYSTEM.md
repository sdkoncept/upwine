# Delivery Fee Calculation System

## Overview

The Upwine platform now automatically calculates delivery fees based on the distance from the pickup location (24 Tony Anenih Avenue, G.R.A, Benin City) to the customer's delivery address.

## How It Works

### 1. Geocoding
- When a customer enters their delivery address, the system uses **Nominatim (OpenStreetMap)** geocoding service to convert the address into coordinates (latitude/longitude)
- This is a free service that doesn't require an API key
- The address is automatically appended with "Benin City, Nigeria" for better accuracy

### 2. Distance Calculation
- Uses the **Haversine formula** to calculate the straight-line distance between:
  - Pickup location: 24 Tony Anenih Avenue, G.R.A, Benin City
  - Delivery address coordinates
- Distance is calculated in kilometers

### 3. Fee Tiers

The delivery fee is determined by distance using these tiers:

| Distance Range | Delivery Fee |
|---------------|--------------|
| 0 - 3 km      | ₦800         |
| 3 - 6 km      | ₦900         |
| 6 - 10 km     | ₦1,000       |
| 10 - 15 km    | ₦1,100       |
| 15+ km        | ₦1,200       |

### 4. User Experience

1. **Order Page**: Shows estimated fee range (₦800 - ₦1,200)
2. **Checkout Page**: 
   - Customer enters delivery address
   - System automatically calculates fee (with 1-second debounce)
   - Shows calculated fee and distance
   - Updates order total in real-time

## Technical Implementation

### Files Created/Modified

1. **`lib/delivery.ts`** - Core delivery fee calculation logic
   - `geocodeAddress()` - Converts address to coordinates
   - `calculateDistance()` - Calculates distance using Haversine formula
   - `calculateDeliveryFee()` - Main function that ties everything together

2. **`app/api/delivery-fee/route.ts`** - API endpoint for fee calculation
   - Accepts delivery address
   - Returns fee, distance, and any errors

3. **`app/checkout/page.tsx`** - Updated to:
   - Automatically calculate fee when address is entered
   - Show loading state while calculating
   - Display calculated fee and distance
   - Handle errors gracefully

4. **`app/order/page.tsx`** - Updated to:
   - Remove manual fee input
   - Show estimated fee range
   - Indicate automatic calculation

## Error Handling

- If geocoding fails: Uses default fee of ₦1,000
- If address is unclear: Shows warning but still allows order
- Network errors: Falls back to default fee
- All errors are logged for debugging

## Future Enhancements

### Option 1: Google Maps Integration
For more accurate geocoding and driving distance:

```typescript
// In lib/delivery.ts, replace geocodeAddress with:
import { Client } from '@googlemaps/google-maps-services-js';

const client = new Client({});
const response = await client.geocode({
  params: {
    address: fullAddress,
    key: process.env.GOOGLE_MAPS_API_KEY,
  },
});
```

### Option 2: Custom Zone Mapping
Instead of distance, use predefined zones:

```typescript
const DELIVERY_ZONES = {
  'G.R.A': 800,
  'Ugbowo': 900,
  'Ikpoba Hill': 1000,
  // etc.
};
```

### Option 3: Driving Distance
Use Google Maps Distance Matrix API for actual driving distance instead of straight-line distance.

## Testing

To test the delivery fee calculation:

1. Enter a nearby address (e.g., "G.R.A, Benin City") - should show ₦800
2. Enter a far address (e.g., "Ugbowo, Benin City") - should show higher fee
3. Enter an invalid address - should show default fee with warning

## Configuration

To adjust fee tiers, edit `lib/delivery.ts`:

```typescript
const DELIVERY_FEE_TIERS = [
  { maxDistance: 3, fee: 800 },
  { maxDistance: 6, fee: 900 },
  // Modify these values as needed
];
```

To change pickup location coordinates, update:

```typescript
const PICKUP_COORDINATES = {
  lat: 6.3167, // Your actual coordinates
  lng: 5.6167
};
```

## Notes

- The system uses Nominatim which has rate limits (1 request per second recommended)
- Debouncing (1 second) prevents excessive API calls
- Distance is calculated as straight-line (as-the-crow-flies), not driving distance
- For production, consider caching frequently used addresses

