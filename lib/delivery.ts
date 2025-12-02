// Delivery fee calculation based on distance from pickup location
// Pickup location: 24 Tony Anenih Avenue, G.R.A, Benin City

const PICKUP_ADDRESS = '24 Tony Anenih Avenue, G.R.A, Benin City, Nigeria';
const PICKUP_COORDINATES = {
  lat: 6.3167, // Approximate coordinates for G.R.A, Benin City
  lng: 5.6167
};

// Delivery fee tiers based on distance (in kilometers)
const DELIVERY_FEE_TIERS = [
  { maxDistance: 3, fee: 800 },   // 0-3km: ₦800
  { maxDistance: 6, fee: 900 },   // 3-6km: ₦900
  { maxDistance: 10, fee: 1000 }, // 6-10km: ₦1000
  { maxDistance: 15, fee: 1100 }, // 10-15km: ₦1100
  { maxDistance: Infinity, fee: 1200 } // 15km+: ₦1200
];

/**
 * Geocode an address using Nominatim (OpenStreetMap) - Free, no API key needed
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Add Benin City, Nigeria to the address for better results
    const fullAddress = `${address}, Benin City, Nigeria`;
    const encodedAddress = encodeURIComponent(fullAddress);
    
    // Use Nominatim geocoding service (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&countrycodes=ng`,
      {
        headers: {
          'User-Agent': 'Upwine Delivery Calculator' // Required by Nominatim
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate delivery fee based on delivery address
 */
export async function calculateDeliveryFee(deliveryAddress: string): Promise<{
  fee: number;
  distance: number | null;
  error?: string;
}> {
  try {
    // Geocode the delivery address
    const deliveryCoords = await geocodeAddress(deliveryAddress);
    
    if (!deliveryCoords) {
      // If geocoding fails, return default fee (middle range)
      return {
        fee: 1000,
        distance: null,
        error: 'Could not determine exact location. Using standard fee.'
      };
    }

    // Calculate distance from pickup location
    const distance = calculateDistance(
      PICKUP_COORDINATES.lat,
      PICKUP_COORDINATES.lng,
      deliveryCoords.lat,
      deliveryCoords.lng
    );

    // Determine fee based on distance
    let fee = DELIVERY_FEE_TIERS[DELIVERY_FEE_TIERS.length - 1].fee; // Default to max fee
    
    for (const tier of DELIVERY_FEE_TIERS) {
      if (distance <= tier.maxDistance) {
        fee = tier.fee;
        break;
      }
    }

    return {
      fee,
      distance: Math.round(distance * 10) / 10 // Round to 1 decimal place
    };
  } catch (error) {
    console.error('Delivery fee calculation error:', error);
    return {
      fee: 1000, // Default fee on error
      distance: null,
      error: 'Error calculating delivery fee'
    };
  }
}

/**
 * Get pickup coordinates (for map display if needed)
 */
export function getPickupCoordinates() {
  return PICKUP_COORDINATES;
}

/**
 * Get pickup address
 */
export function getPickupAddress() {
  return PICKUP_ADDRESS;
}

