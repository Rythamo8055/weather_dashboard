// Using a placeholder API key. For full functionality, replace with a valid OpenWeatherMap API key.
// Demo API keys are occasionally rate limited
const API_KEY = 'bd5e378503939ddaee76f12ad7a97608'; // Replace with a real key!
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');

const weatherContent = document.getElementById('weather-content');
const emptyState = document.getElementById('empty-state');
const loadingState = document.getElementById('loading-state');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');

// Weather Info Elements
const cityName = document.getElementById('city-name');
const dateElement = document.getElementById('date');
const tempElement = document.getElementById('temp');
const weatherDesc = document.getElementById('weather-desc');
const weatherIcon = document.getElementById('w-icon');
const windSpeed = document.getElementById('wind-speed');
const humidity = document.getElementById('humidity');
const visibility = document.getElementById('visibility');
const pressure = document.getElementById('pressure');
const forecastContainer = document.getElementById('forecast-container');

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});
locationBtn.addEventListener('click', getCurrentLocation);

function handleSearch() {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeatherData(city);
    }
}

function showState(state) {
    weatherContent.classList.add('hidden');
    emptyState.classList.add('hidden');
    loadingState.classList.add('hidden');
    errorMessage.classList.add('hidden');

    switch (state) {
        case 'weather':
            weatherContent.classList.remove('hidden');
            break;
        case 'empty':
            emptyState.classList.remove('hidden');
            break;
        case 'loading':
            loadingState.classList.remove('hidden');
            break;
        case 'error':
            errorMessage.classList.remove('hidden');
            break;
    }
}

async function fetchWeatherData(city) {
    showState('loading');
    
    try {
        // Fetch Current Weather
        const currentRes = await fetch(`${API_BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`);
        if (!currentRes.ok) throw new Error('City not found');
        const currentData = await currentRes.json();

        // Fetch Forecast
        const forecastRes = await fetch(`${API_BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`);
        const forecastData = await forecastRes.json();

        updateUI(currentData, forecastData);
        showState('weather');
    } catch (error) {
        errorText.textContent = error.message === 'City not found' ? 'City not found. Please try again.' : 'An error occurred. Please try again or check your API key.';
        showState('error');
    }
}

async function fetchWeatherByLocation(lat, lon) {
    showState('loading');
    
    try {
        const currentRes = await fetch(`${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
        if (!currentRes.ok) throw new Error('Location data unavailable');
        const currentData = await currentRes.json();

        const forecastRes = await fetch(`${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
        const forecastData = await forecastRes.json();

        updateUI(currentData, forecastData);
        showState('weather');
        cityInput.value = currentData.name;
    } catch (error) {
        errorText.textContent = 'Could not fetch data for your location.';
        showState('error');
    }
}

function updateUI(current, forecast) {
    // Current Weather
    cityName.textContent = `${current.name}, ${current.sys.country}`;
    
    const now = new Date();
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    dateElement.textContent = now.toLocaleDateString('en-US', options);
    
    tempElement.textContent = Math.round(current.main.temp);
    weatherDesc.textContent = current.weather[0].description;
    weatherIcon.src = `https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png`;
    
    // Details
    windSpeed.textContent = `${Math.round(current.wind.speed * 3.6)} km/h`; // m/s to km/h
    humidity.textContent = `${current.main.humidity}%`;
    visibility.textContent = `${(current.visibility / 1000).toFixed(1)} km`;
    pressure.textContent = `${current.main.pressure} hPa`;

    // Forecast (Filter for 1 per day, ~12:00 PM)
    forecastContainer.innerHTML = '';
    const dailyForecasts = forecast.list.filter(item => item.dt_txt.includes('12:00:00'));
    
    // Fallback if current time is late, grab first 5 varying days
    const daysToShow = dailyForecasts.length >= 5 ? dailyForecasts.slice(0, 5) : forecast.list.filter((v,i,a)=>a.findIndex(t=>(new Date(t.dt*1000).getDay() === new Date(v.dt*1000).getDay()))===i).slice(1,6);

    daysToShow.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const temp = Math.round(day.main.temp);
        const icon = day.weather[0].icon;

        const forecastEl = document.createElement('div');
        forecastEl.className = 'forecast-item';
        forecastEl.innerHTML = `
            <div class="f-day">${dayName}</div>
            <img src="https://openweathermap.org/img/wn/${icon}.png" alt="forecast icon">
            <div class="f-temp">${temp}°C</div>
        `;
        forecastContainer.appendChild(forecastEl);
    });
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        showState('loading');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchWeatherByLocation(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                errorText.textContent = 'Location access denied or unavailable.';
                showState('error');
            }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}
