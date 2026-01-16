// Delivery destinations in Benin City with fixed delivery fees

export interface DeliveryDestination {
  name: string
  fee: number
}

export const DELIVERY_DESTINATIONS: DeliveryDestination[] = [
  { name: 'G.R.A, Benin City', fee: 1600 },
  { name: 'Third East Circular, Benin City', fee: 2000 },
  { name: 'Second East Circular, Benin City', fee: 2000 },
  { name: 'First East Circular, Benin City', fee: 2000 },
  { name: 'Airport Road, Benin City', fee: 2000 },
  { name: 'Ekewan Road, Benin City', fee: 2300 },
  { name: 'Ugbowo, Benin City', fee: 2700 },
  { name: 'Ikpoba Hill, Benin City', fee: 2300 },
  { name: 'Aduwawa, Benin City', fee: 3000 },
  { name: 'Ring Road, Benin City', fee: 2000 },
  { name: 'Siluko Road, Benin City', fee: 2000 },
  { name: 'New Lagos Road, Benin City', fee: 2000 },
]

/**
 * Get delivery fee for a selected destination
 */
export function getDeliveryFeeForDestination(destinationName: string): number {
  const destination = DELIVERY_DESTINATIONS.find(
    dest => dest.name.toLowerCase() === destinationName.toLowerCase()
  )
  return destination?.fee || 2000 // Default fee if not found
}

/**
 * Get all destinations sorted by fee (lowest first)
 */
export function getDestinationsSortedByFee(): DeliveryDestination[] {
  return [...DELIVERY_DESTINATIONS].sort((a, b) => a.fee - b.fee)
}

/**
 * Get destinations grouped by fee
 */
export function getDestinationsByFee(): Record<number, DeliveryDestination[]> {
  const grouped: Record<number, DeliveryDestination[]> = {}
  
  DELIVERY_DESTINATIONS.forEach(dest => {
    if (!grouped[dest.fee]) {
      grouped[dest.fee] = []
    }
    grouped[dest.fee].push(dest)
  })
  
  return grouped
}

