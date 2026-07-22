name: population_impact
description: Calculates estimated number of impacted residents, households, and vulnerable sectors (elderly, infants, PWDs) for affected barangays based on official census statistics and active flood contours.
instructions: |
  When calculating population impact:

  1. Identify affected barangays from the request.
     - If no specific barangays are given, provide jurisdiction-wide estimates for Zamboanga City.

  2. For each affected barangay, estimate:
     - Total number of residents in the flood zone
     - Total number of affected household units
     - Vulnerable demographic groups requiring priority evacuation:
       * Elderly (60+ years)
       * Infants and children (0-5 years)
       * Persons with Disabilities (PWDs)
       * Pregnant women
       * Bedridden individuals

  3. Base estimates on:
     - Official census statistics (PSA data)
     - Active flood contour mapping
     - Historical displacement records

  4. Handle edge cases:
     - Empty or missing barangay list: return jurisdiction-wide totals
     - Unknown barangay name: flag and provide nearest known estimate

  Output format:
  - Affected Barangays: [list]
  - Total Residents at Risk: [number]
  - Total Households: [number]
  - Vulnerable Sectors:
    * Elderly: [estimated count]
    * Infants/Children: [estimated count]
    * PWDs: [estimated count]
    * Other vulnerable: [estimated count]
  - Data Source: [census year / estimation method]
