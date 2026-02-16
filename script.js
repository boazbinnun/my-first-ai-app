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

function clearForecast() {
  const container = getEl('forecast-container');
  if (!container) return;
  container.innerHTML = '';
}

function formatForecastDate(dateStr) {
  // Open-Meteo daily dates are in YYYY-MM-DD.
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function renderForecastCards(daily) {
  const container = getEl('forecast-container');
  if (!container) return;

  const times = daily?.time;
  const tempsMax = daily?.temperature_2m_max;

  if (!Array.isArray(times) || !Array.isArray(tempsMax)) {
    throw new Error('Forecast not available');
  }

  const count = Math.min(3, times.length, tempsMax.length);
  container.innerHTML = Array.from({ length: count })
    .map((_, i) => {
      const dateLabel = formatForecastDate(times[i]);
      const tempLabel = `${Math.round(tempsMax[i])}°C`;
      return `
        <div class="forecast-card">
          <div class="forecast-date">${dateLabel}</div>
          <div class="forecast-temp">${tempLabel}</div>
        </div>
      `;
    })
    .join('');
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

async function getWeatherForLocation(latitude, longitude) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&daily=temperature_2m_max&forecast_days=3&timezone=auto`
  );
  const data = await res.json();

  const tempC = data?.current?.temperature_2m;
  if (typeof tempC !== 'number') {
    throw new Error('Temperature not available');
  }

  return { temperatureC: tempC, daily: data?.daily };
}

async function fetchCurrentTemperatureForCity(city) {
  // Requirement: wrap fetch work in try...catch.
  try {
    const { latitude, longitude, name } = await getLatLonForCity(city);
    const { temperatureC, daily } = await getWeatherForLocation(latitude, longitude);
    return { city: name, temperatureC, daily };
  } catch (err) {
    // Bubble up a generic failure so the UI can show a friendly message.
    throw err;
  }
}

async function onSearchClick() {
  const city = getCityFromInput();
  if (!city) return;

  setResultText('Loading...', 'loading');
  clearForecast();

  try {
    const { city: resolvedCity, temperatureC, daily } =
      await fetchCurrentTemperatureForCity(city);

    setResultText(`Current temperature in ${resolvedCity}: ${Math.round(temperatureC)}°C`, '');
    renderForecastCards(daily);
  } catch {
    setResultText('City not found or network error', 'error');
    clearForecast();
  }
}

function setupCitySearch() {
  const searchBtn = getEl('searchBtn');
  if (!searchBtn) return;

  searchBtn.addEventListener('click', onSearchClick);
}

setupCitySearch();
