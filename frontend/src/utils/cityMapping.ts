// City name to IATA/city code mapping
export const cityToCodeMap: { [key: string]: string } = {
  // United States - Major Cities
  'new york': 'NYC',
  'nyc': 'NYC',
  'newyork': 'NYC',
  'los angeles': 'LAX',
  'la': 'LAX',
  'losangeles': 'LAX',
  'chicago': 'CHI',
  'miami': 'MIA',
  'san francisco': 'SFO',
  'sanfrancisco': 'SFO',
  'boston': 'BOS',
  'washington': 'WAS',
  'seattle': 'SEA',
  'atlanta': 'ATL',
  'dallas': 'DFW',
  'houston': 'HOU',
  'philadelphia': 'PHL',
  'phoenix': 'PHX',
  'las vegas': 'LAS',
  'lasvegas': 'LAS',
  'vegas': 'LAS',
  'orlando': 'ORL',
  'denver': 'DEN',
  'san diego': 'SAN',
  'sandiego': 'SAN',
  'detroit': 'DTT',
  'minneapolis': 'MSP',
  'tampa': 'TPA',
  'austin': 'AUS',
  'nashville': 'BNA',
  'charlotte': 'CLT',
  'portland': 'PDX',
  'salt lake city': 'SLC',
  'saltlakecity': 'SLC',
  'new orleans': 'MSY',
  'neworleans': 'MSY',

  // Nigeria
  'lagos': 'LOS',
  'abuja': 'ABV',
  'kano': 'KAN',
  'port harcourt': 'PHC',
  'portharcourt': 'PHC',
  'ibadan': 'IBA',
  'benin city': 'BNI',
  'enugu': 'ENU',
  'kaduna': 'KAD',
  'warri': 'QRW',

  // United Kingdom
  'london': 'LON',
  'manchester': 'MAN',
  'birmingham': 'BHX',
  'edinburgh': 'EDI',
  'glasgow': 'GLA',
  'liverpool': 'LPL',
  'bristol': 'BRS',
  'leeds': 'LBA',
  'newcastle': 'NCL',
  'belfast': 'BFS',

  // France
  'paris': 'PAR',
  'marseille': 'MRS',
  'lyon': 'LYS',
  'nice': 'NCE',
  'toulouse': 'TLS',
  'nantes': 'NTE',
  'bordeaux': 'BOD',
  'strasbourg': 'SXB',

  // Germany
  'berlin': 'BER',
  'munich': 'MUC',
  'frankfurt': 'FRA',
  'hamburg': 'HAM',
  'cologne': 'CGN',
  'dusseldorf': 'DUS',
  'stuttgart': 'STR',
  'dortmund': 'DTM',
  'dresden': 'DRS',

  // Spain
  'madrid': 'MAD',
  'barcelona': 'BCN',
  'seville': 'SVQ',
  'valencia': 'VLC',
  'malaga': 'AGP',
  'bilbao': 'BIO',
  'alicante': 'ALC',
  'palma': 'PMI',

  // Italy
  'rome': 'ROM',
  'milan': 'MIL',
  'venice': 'VCE',
  'florence': 'FLR',
  'naples': 'NAP',
  'turin': 'TRN',
  'bologna': 'BLQ',
  'verona': 'VRN',
  'pisa': 'PSA',

  // UAE
  'dubai': 'DXB',
  'abu dhabi': 'AUH',
  'abudhabi': 'AUH',
  'sharjah': 'SHJ',

  // Asia - Major Cities
  'tokyo': 'TYO',
  'singapore': 'SIN',
  'hong kong': 'HKG',
  'hongkong': 'HKG',
  'beijing': 'BJS',
  'shanghai': 'SHA',
  'seoul': 'SEL',
  'bangkok': 'BKK',
  'kuala lumpur': 'KUL',
  'kualalumpur': 'KUL',
  'manila': 'MNL',
  'jakarta': 'JKT',
  'hanoi': 'HAN',
  'ho chi minh': 'SGN',
  'hochiminh': 'SGN',
  'taipei': 'TPE',
  'osaka': 'OSA',
  'kyoto': 'UKY',

  // India
  'mumbai': 'BOM',
  'delhi': 'DEL',
  'bangalore': 'BLR',
  'chennai': 'MAA',
  'kolkata': 'CCU',
  'hyderabad': 'HYD',
  'pune': 'PNQ',
  'ahmedabad': 'AMD',
  'jaipur': 'JAI',
  'goa': 'GOI',

  // Australia & New Zealand
  'sydney': 'SYD',
  'melbourne': 'MEL',
  'brisbane': 'BNE',
  'perth': 'PER',
  'adelaide': 'ADL',
  'auckland': 'AKL',
  'wellington': 'WLG',
  'christchurch': 'CHC',

  // Canada
  'toronto': 'YTO',
  'vancouver': 'YVR',
  'montreal': 'YMQ',
  'calgary': 'YYC',
  'ottawa': 'YOW',
  'edmonton': 'YEA',
  'winnipeg': 'YWG',
  'quebec': 'YQB',

  // Europe - Other
  'amsterdam': 'AMS',
  'brussels': 'BRU',
  'zurich': 'ZRH',
  'vienna': 'VIE',
  'istanbul': 'IST',
  'athens': 'ATH',
  'lisbon': 'LIS',
  'porto': 'OPO',
  'copenhagen': 'CPH',
  'stockholm': 'STO',
  'oslo': 'OSL',
  'helsinki': 'HEL',
  'dublin': 'DUB',
  'prague': 'PRG',
  'budapest': 'BUD',
  'warsaw': 'WAW',
  'krakow': 'KRK',
  'bucharest': 'BUH',
  'sofia': 'SOF',
  'moscow': 'MOW',
  'st petersburg': 'LED',
  'stpetersburg': 'LED',

  // Africa
  'cairo': 'CAI',
  'johannesburg': 'JNB',
  'cape town': 'CPT',
  'capetown': 'CPT',
  'nairobi': 'NBO',
  'accra': 'ACC',
  'casablanca': 'CAS',
  'marrakech': 'RAK',
  'tunis': 'TUN',
  'algiers': 'ALG',
  'dakar': 'DKR',
  'addis ababa': 'ADD',
  'addisababa': 'ADD',
  'dar es salaam': 'DAR',
  'daressalaam': 'DAR',
  'kampala': 'EBB',
  'kigali': 'KGL',

  // Middle East
  'doha': 'DOH',
  'riyadh': 'RUH',
  'jeddah': 'JED',
  'muscat': 'MCT',
  'kuwait': 'KWI',
  'beirut': 'BEY',
  'amman': 'AMM',
  'tel aviv': 'TLV',
  'telaviv': 'TLV',
  'jerusalem': 'JRS',

  // Latin America
  'mexico city': 'MEX',
  'mexicocity': 'MEX',
  'sao paulo': 'SAO',
  'saopaulo': 'SAO',
  'rio de janeiro': 'RIO',
  'riodejaneiro': 'RIO',
  'buenos aires': 'BUE',
  'buenosaires': 'BUE',
  'lima': 'LIM',
  'bogota': 'BOG',
  'santiago': 'SCL',
  'caracas': 'CCS',
  'quito': 'UIO',
  'havana': 'HAV',
  'panama city': 'PTY',
  'panamacity': 'PTY',
  'cancun': 'CUN',
  'guadalajara': 'GDL',
  'montevideo': 'MVD',

  // Caribbean
  'kingston': 'KIN',
  'montego bay': 'MBJ',
  'montegobay': 'MBJ',
  'nassau': 'NAS',
  'barbados': 'BGI',
  'port of spain': 'POS',
  'portofspain': 'POS',

  // China - Additional
  'guangzhou': 'CAN',
  'shenzhen': 'SZX',
  'chengdu': 'CTU',
  'xi an': 'XIY',
  'xian': 'XIY',
  'hangzhou': 'HGH',
  'nanjing': 'NKG',

  // Popular neighborhoods and landmarks (map to parent city)
  // Las Vegas
  'las vegas strip': 'LAS',
  'vegas strip': 'LAS',
  'strip las vegas': 'LAS',
  'downtown las vegas': 'LAS',

  // New York
  'manhattan': 'NYC',
  'times square': 'NYC',
  'brooklyn': 'NYC',
  'queens': 'NYC',
  'bronx': 'NYC',
  'central park': 'NYC',
  'wall street': 'NYC',
  'midtown': 'NYC',

  // London
  'westminster': 'LON',
  'piccadilly': 'LON',
  'covent garden': 'LON',
  'soho london': 'LON',
  'oxford street': 'LON',
  'canary wharf': 'LON',

  // Paris
  'champs elysees': 'PAR',
  'eiffel tower': 'PAR',
  'latin quarter': 'PAR',
  'montmartre': 'PAR',
  'marais': 'PAR',

  // Dubai
  'dubai marina': 'DXB',
  'downtown dubai': 'DXB',
  'jumeirah': 'DXB',
  'deira': 'DXB',
  'bur dubai': 'DXB',

  // Singapore
  'orchard road': 'SIN',
  'marina bay': 'SIN',
  'sentosa': 'SIN',
  'chinatown singapore': 'SIN',

  // Calgary
  'downtown calgary': 'YYC',
  'calgary downtown': 'YYC',
  'beltline calgary': 'YYC',
  'kensington calgary': 'YYC',
  '17th avenue calgary': 'YYC',
  'inglewood calgary': 'YYC',

  // Toronto
  'downtown toronto': 'YTO',
  'yorkville': 'YTO',
  'distillery district': 'YTO',
  'cn tower': 'YTO',

  // Los Angeles
  'hollywood': 'LAX',
  'beverly hills': 'LAX',
  'santa monica': 'LAX',
  'downtown la': 'LAX',
  'venice beach': 'LAX',
};

/**
 * Convert city name to IATA code
 * @param cityName - City name or address
 * @returns IATA city code (3 letters) or null if not in mapping
 */
export function getCityCode(cityName: string): string | null {
  if (!cityName) return null;

  // Clean and normalize the input
  const normalized = cityName.toLowerCase().trim();

  // If it's already a 3-letter code, check if it exists in our values
  if (/^[a-z]{3}$/i.test(normalized)) {
    const upperCode = normalized.toUpperCase();
    // Verify it's a known code in our mapping
    if (Object.values(cityToCodeMap).includes(upperCode)) {
      return upperCode;
    }
  }

  // Check direct mapping
  if (cityToCodeMap[normalized]) {
    return cityToCodeMap[normalized];
  }

  // Try to find partial match in the mapping (for cities like "downtown calgary")
  for (const [city, code] of Object.entries(cityToCodeMap)) {
    if (normalized.includes(city)) {
      return code;
    }
  }

  // Return null if city not found in mapping
  // This allows the caller to use address-based geocoding search
  return null;
}

/**
 * Get list of all cities for autocomplete (includes neighborhoods)
 * @returns Array of city objects with name and code
 */
export function getAllCities(): Array<{ name: string; code: string }> {
  const cities: Array<{ name: string; code: string }> = [];
  const seenNames = new Set<string>();

  for (const [cityName, code] of Object.entries(cityToCodeMap)) {
    // Skip short abbreviations (but allow duplicates of same code for neighborhoods)
    if (cityName.length < 3) continue;

    // Capitalize first letter of each word
    const displayName = cityName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Skip duplicate names (but allow multiple locations with same city code)
    if (seenNames.has(displayName.toLowerCase())) continue;

    cities.push({ name: displayName, code });
    seenNames.add(displayName.toLowerCase());
  }

  return cities.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Search cities by query string
 * @param query - Search query
 * @returns Filtered array of city objects
 */
export function searchCities(query: string): Array<{ name: string; code: string }> {
  if (!query || query.length < 1) return [];

  const normalized = query.toLowerCase().trim();
  const allCities = getAllCities();

  return allCities
    .filter(city =>
      city.name.toLowerCase().includes(normalized) ||
      city.code.toLowerCase().includes(normalized)
    )
    .slice(0, 10); // Limit to 10 results
}

/**
 * Ambiguous city names that exist in multiple locations
 * Maps base city name to array of options with context
 */
export const ambiguousCities: { [key: string]: Array<{ name: string; code: string; country: string; context: string }> } = {
  'paris': [
    { name: 'Paris', code: 'PAR', country: 'France', context: 'Paris, France (the capital)' },
    { name: 'Paris', code: 'PRX', country: 'USA', context: 'Paris, Texas, USA' },
  ],
  'london': [
    { name: 'London', code: 'LON', country: 'UK', context: 'London, United Kingdom (the capital)' },
    { name: 'London', code: 'YXU', country: 'Canada', context: 'London, Ontario, Canada' },
  ],
  'cambridge': [
    { name: 'Cambridge', code: 'CBG', country: 'UK', context: 'Cambridge, United Kingdom (university city)' },
    { name: 'Cambridge', code: 'BOS', country: 'USA', context: 'Cambridge, Massachusetts, USA (near Boston)' },
  ],
  'birmingham': [
    { name: 'Birmingham', code: 'BHX', country: 'UK', context: 'Birmingham, United Kingdom' },
    { name: 'Birmingham', code: 'BHM', country: 'USA', context: 'Birmingham, Alabama, USA' },
  ],
  'portland': [
    { name: 'Portland', code: 'PDX', country: 'USA', context: 'Portland, Oregon, USA' },
    { name: 'Portland', code: 'PWM', country: 'USA', context: 'Portland, Maine, USA' },
  ],
  'manchester': [
    { name: 'Manchester', code: 'MAN', country: 'UK', context: 'Manchester, United Kingdom' },
    { name: 'Manchester', code: 'MHT', country: 'USA', context: 'Manchester, New Hampshire, USA' },
  ],
  'newcastle': [
    { name: 'Newcastle', code: 'NCL', country: 'UK', context: 'Newcastle, United Kingdom' },
    { name: 'Newcastle', code: 'NTL', country: 'Australia', context: 'Newcastle, New South Wales, Australia' },
  ],
  'cairo': [
    { name: 'Cairo', code: 'CAI', country: 'Egypt', context: 'Cairo, Egypt (the capital)' },
    { name: 'Cairo', code: 'CIR', country: 'USA', context: 'Cairo, Illinois, USA' },
  ],
};

/**
 * Check if a city name is ambiguous (exists in multiple locations)
 * @param cityName - City name to check
 * @returns Array of disambiguation options or null if not ambiguous
 */
export function getAmbiguousCityOptions(cityName: string): Array<{ name: string; code: string; country: string; context: string }> | null {
  const normalized = cityName.toLowerCase().trim();
  return ambiguousCities[normalized] || null;
}

/**
 * Get city code with disambiguation support
 * Returns the most likely option based on context clues in the message
 * @param cityName - City name or address
 * @param contextMessage - Full user message for context clues
 * @returns Object with city code and whether disambiguation is needed
 */
export function getCityCodeWithContext(
  cityName: string,
  contextMessage?: string
): { code: string | null; needsDisambiguation: boolean; options?: Array<{ name: string; code: string; country: string; context: string }> } {
  if (!cityName) return { code: null, needsDisambiguation: false };

  const normalized = cityName.toLowerCase().trim();

  // Check if city is ambiguous
  const ambiguousOptions = getAmbiguousCityOptions(normalized);

  if (ambiguousOptions && contextMessage) {
    const lowerMessage = contextMessage.toLowerCase();

    // Look for country/region clues in the message
    const contextClues: { [key: string]: string[] } = {
      'UK': ['uk', 'united kingdom', 'britain', 'british', 'england', 'scotland', 'wales'],
      'USA': ['usa', 'us', 'united states', 'america', 'american', 'texas', 'alabama', 'oregon', 'maine', 'massachusetts', 'illinois'],
      'Canada': ['canada', 'canadian', 'ontario'],
      'France': ['france', 'french'],
      'Egypt': ['egypt', 'egyptian'],
      'Australia': ['australia', 'australian', 'nsw', 'new south wales'],
    };

    // Check for context clues
    for (const option of ambiguousOptions) {
      const countryKeywords = contextClues[option.country] || [];
      if (countryKeywords.some(keyword => lowerMessage.includes(keyword))) {
        // Found matching context clue
        return { code: option.code, needsDisambiguation: false };
      }
    }

    // No context clues found - need disambiguation
    return { code: null, needsDisambiguation: true, options: ambiguousOptions };
  }

  if (ambiguousOptions) {
    // Ambiguous but no context message - default to most popular (first option)
    // But flag that disambiguation would be better
    return { code: ambiguousOptions[0].code, needsDisambiguation: true, options: ambiguousOptions };
  }

  // Not ambiguous - use regular getCityCode
  const code = getCityCode(cityName);
  return { code, needsDisambiguation: false };
}
