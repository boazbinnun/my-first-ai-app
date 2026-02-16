function getEl(id) {
  return document.getElementById(id);
}

function getCityFromInput() {
  const input = getEl('cityInput');
  return input ? input.value.trim() : '';
}

function setResultText(text, variant = '') {
  const result = getEl('result');
  if (!result) return;

  // Keep the existing styling conventions from `index.html`:
  // - `result placeholder`
  // - `result loading`
  // - `result error`
  result.className = `result ${variant}`.trim();
  result.textContent = text;
}

async function getLatLonForCity(city) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
  );
  const data = await res.json();

  if (!data.results || data.results.length === 0) {
    throw new Error('City not found');
  }

  const { latitude, longitude, name } = data.results[0];
  return { latitude, longitude, name };
}

async function getCurrentTemperature(latitude, longitude) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&timezone=auto`
  );
  const data = await res.json();

  const tempC = data?.current?.temperature_2m;
  if (typeof tempC !== 'number') {
    throw new Error('Temperature not available');
  }

  return tempC;
}

async function fetchCurrentTemperatureForCity(city) {
  // Requirement: wrap fetch work in try...catch.
  try {
    const { latitude, longitude, name } = await getLatLonForCity(city);
    const temperatureC = await getCurrentTemperature(latitude, longitude);
    return { city: name, temperatureC };
  } catch (err) {
    // Bubble up a generic failure so the UI can show a friendly message.
    throw err;
  }
}

async function onSearchClick() {
  const city = getCityFromInput();
  if (!city) return;

  setResultText('Loading...', 'loading');

  try {
    const { city: resolvedCity, temperatureC } =
      await fetchCurrentTemperatureForCity(city);

    setResultText(`Current temperature in ${resolvedCity}: ${Math.round(temperatureC)}°C`, '');
  } catch {
    setResultText('City not found or network error', 'error');
  }
}

function setupCitySearch() {
  const searchBtn = getEl('searchBtn');
  if (!searchBtn) return;

  searchBtn.addEventListener('click', onSearchClick);
}

setupCitySearch();
