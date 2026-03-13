const weatherApiKey = "c9074cdc56348f646c36b7e1fa6e361b";
const weatherApiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const forecastApiUrl = "https://api.openweathermap.org/data/2.5/forecast?units=metric&q=";
const airPollutionUrl = "https://api.openweathermap.org/data/2.5/air_pollution?";

const searchBox = document.querySelector(".searchBarContainer input");
const searchBtn = document.querySelector(".searchBarContainer .searchBarBtn");
const locationBtn = document.querySelector(".locationBtn");
const weatherIcon = document.querySelector(".weatherImageIcon");

async function checkWeather(city, lat = null, lon = null) {
  try {
    let url = `${weatherApiUrl}${city}&appid=${weatherApiKey}`;
    if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?units=metric&lat=${lat}&lon=${lon}&appid=${weatherApiKey}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("Location not found");
    const data = await response.json();

    console.log("Weather Data:", data);

    document.querySelector(".cityNameDisplay").innerHTML = data.name;
    document.querySelector(".tempTemperatureDisplay").innerHTML = Math.round(data.main.temp) + "°C";
    document.querySelector(".feelsLike").innerHTML = `Feels like ${Math.round(data.main.feels_like)}°C`;
    document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
    document.querySelector(".wind").innerHTML = Math.round(data.wind.speed * 3.6) + " km/h";
    document.querySelector(".pressure").innerHTML = data.main.pressure + " hPa";
    document.querySelector(".clouds").innerHTML = data.clouds.all + "%";
    document.querySelector(".visibility").innerHTML = (data.visibility / 1000).toFixed(1) + " km";
    document.querySelector(".weatherDescription").innerHTML = data.weather[0].description;

    const formatTime = (timestamp) => {
      const date = new Date(timestamp * 1000);
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    };

    document.querySelector(".sunrise").innerHTML = formatTime(data.sys.sunrise);
    document.querySelector(".sunset").innerHTML = formatTime(data.sys.sunset);
    document.querySelector(".lastUpdated").innerHTML = `Last updated: ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    document.querySelector(".currentDate").innerHTML = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });

    // Update main icon
    const condition = data.weather[0].main.toLowerCase();
    if (condition.includes("cloud")) weatherIcon.src = "images/clouds.png";
    else if (condition.includes("clear")) weatherIcon.src = "images/clear.png";
    else if (condition.includes("rain")) weatherIcon.src = "images/rain.png";
    else if (condition.includes("drizzle")) weatherIcon.src = "images/drizzle.png";
    else if (condition.includes("mist")) weatherIcon.src = "images/mist.png";
    else if (condition.includes("snow")) weatherIcon.src = "images/snow.png";

    // Forecast
    await getForecast(city, lat, lon);

    // Air Quality
    await getAirQuality(data.coord.lat, data.coord.lon);

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

async function getForecast(city, lat = null, lon = null) {
  let url = `${forecastApiUrl}${city}&appid=${weatherApiKey}`;
  if (lat && lon) {
    url = `https://api.openweathermap.org/data/2.5/forecast?units=metric&lat=${lat}&lon=${lon}&appid=${weatherApiKey}`;
  }
  const response = await fetch(url);
  const data = await response.json();
  
  const forecastList = document.querySelector(".forecastList");
  forecastList.innerHTML = "";

  for (let i = 0; i < data.list.length; i += 8) {
    const dayData = data.list[i];
    const date = new Date(dayData.dt * 1000);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    
    const item = document.createElement("div");
    item.className = "forecastItem";
    item.innerHTML = `
      <span>${dayName}</span>
      <img src="https://openweathermap.org/img/wn/${dayData.weather[0].icon}.png" alt="icon" style="width:30px;">
      <span>${Math.round(dayData.main.temp)}°C</span>
    `;
    forecastList.appendChild(item);
  }
}

async function getAirQuality(lat, lon) {
  const response = await fetch(`${airPollutionUrl}lat=${lat}&lon=${lon}&appid=${weatherApiKey}`);
  const data = await response.json();
  const aqi = data.list[0].main.aqi;
  const aqiText = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
  document.querySelector(".airQuality").innerHTML = aqiText[aqi - 1];
}

searchBtn.addEventListener("click", () => {
  if (searchBox.value) checkWeather(searchBox.value);
});

searchBox.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && searchBox.value) checkWeather(searchBox.value);
});

locationBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      checkWeather(null, position.coords.latitude, position.coords.longitude);
    });
  }
});

// Default city
checkWeather("London");
