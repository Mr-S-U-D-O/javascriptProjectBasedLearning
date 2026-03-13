const weatherApiKey = "c9074cdc56348f646c36b7e1fa6e361b";
const weatherApiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const forecastApiUrl = "https://api.openweathermap.org/data/2.5/forecast?units=metric&q=";

const searchBox = document.querySelector(".searchBarContainer input");
const searchBtn = document.querySelector(".searchBarContainer button");
const weatherIcon = document.querySelector(".weatherImageIcon");

async function checkWeather(city) {
  try {
    // Current Weather
    const response = await fetch(`${weatherApiUrl}${city}&appid=${weatherApiKey}`);
    if (!response.ok) throw new Error("City not found");
    const data = await response.json();

    console.log("Current Weather:", data);

    document.querySelector(".cityNameDisplay").innerHTML = data.name;
    document.querySelector(".tempTemperatureDisplay").innerHTML = Math.round(data.main.temp) + "°C";
    document.querySelector(".feelsLike").innerHTML = `Feels like ${Math.round(data.main.feels_like)}°C`;
    document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
    document.querySelector(".wind").innerHTML = Math.round(data.wind.speed * 3.6) + " km/h"; // Convert m/s to km/h
    document.querySelector(".pressure").innerHTML = data.main.pressure + " hPa";
    document.querySelector(".visibility").innerHTML = (data.visibility / 1000).toFixed(1) + " km";
    document.querySelector(".weatherDescription").innerHTML = data.weather[0].description;

    const formatTime = (timestamp) => {
      const date = new Date(timestamp * 1000);
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    };

    document.querySelector(".sunrise").innerHTML = formatTime(data.sys.sunrise);
    document.querySelector(".sunset").innerHTML = formatTime(data.sys.sunset);

    // Update main icon
    const condition = data.weather[0].main.toLowerCase();
    if (condition.includes("cloud")) weatherIcon.src = "images/clouds.png";
    else if (condition.includes("clear")) weatherIcon.src = "images/clear.png";
    else if (condition.includes("rain")) weatherIcon.src = "images/rain.png";
    else if (condition.includes("drizzle")) weatherIcon.src = "images/drizzle.png";
    else if (condition.includes("mist")) weatherIcon.src = "images/mist.png";
    else if (condition.includes("snow")) weatherIcon.src = "images/snow.png";

    // Forecast
    await getForecast(city);

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

async function getForecast(city) {
  const response = await fetch(`${forecastApiUrl}${city}&appid=${weatherApiKey}`);
  const data = await response.json();
  
  console.log("Forecast:", data);
  const forecastList = document.querySelector(".forecastList");
  forecastList.innerHTML = "";

  // Get one forecast per day (every 8th item since it's 3-hour intervals)
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

searchBtn.addEventListener("click", () => {
  if (searchBox.value) checkWeather(searchBox.value);
});

searchBox.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && searchBox.value) checkWeather(searchBox.value);
});

// Default city
checkWeather("London");
