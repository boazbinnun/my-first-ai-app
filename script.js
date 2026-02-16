// Gets city from input when button is clicked,
// fetches current temperature from Open-Meteo,
// and logs the result to the console.

async function fetchCurrentTemperatureForCity(city) {
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
  );
  const geoData = await geoRes.json();

  if (!geoData.results || geoData.results.length === 0) {
    throw new Error(`City not found: ${city}`);
  }

  const { latitude, longitude, name } = geoData.results[0];

  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&timezone=auto`
  );
  const weatherData = await weatherRes.json();

  const tempC = weatherData?.current?.temperature_2m;
  if (typeof tempC !== 'number') {
    throw new Error('Temperature not available for this location.');
  }

  return { city: name, temperatureC: tempC };
}

function setupCitySearchButton() {
  const cityInput = document.getElementById('cityInput');
  const searchBtn = document.getElementById('searchBtn');

  if (!cityInput || !searchBtn) return;

  async function onSearchClick() {
    const city = cityInput.value.trim();
    if (!city) return;

    try {
      const { city: resolvedCity, temperatureC } =
        await fetchCurrentTemperatureForCity(city);

      console.log(`Current temperature in ${resolvedCity}: ${temperatureC}°C`);
    } catch (err) {
      console.error('Weather lookup failed:', err);
    }
  }

  searchBtn.addEventListener('click', onSearchClick);
}

setupCitySearchButton();
