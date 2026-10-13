const NON_COUNTRY_REGIONS = new Set(["EU", "EZ", "UN", "QO", "ZZ"]);

let cachedCountries: string[] | null = null;

export function listCountries() {
  if (cachedCountries) return cachedCountries;
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  const countries: string[] = [];

  for (let first = 65; first <= 90; first += 1) {
    for (let second = 65; second <= 90; second += 1) {
      const code = String.fromCharCode(first, second);
      if (NON_COUNTRY_REGIONS.has(code)) continue;
      const name = names.of(code);
      if (name && name !== code) countries.push(name);
    }
  }

  cachedCountries = [...new Set(countries)].sort((left, right) => left.localeCompare(right));
  return cachedCountries;
}

export function canonicalCountry(value: string) {
  const match = listCountries().find(
    (country) => country.toLowerCase() === value.trim().toLowerCase()
  );
  if (!match) throw new Error("INVALID_COUNTRY");
  return match;
}
