const weatherApiKey = "c9074cdc56348f646c36b7e1fa6e361b";
const weatherApiUrl =
  "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";

  const searchBox = document.querySelector(".searchBarContainer input");
  const searchBtn = document.querySelector(".searchBarContainer btn");

 

async function checkWeather(city) {
  const response = await fetch(weatherApiUrl + city + `&appid=${weatherApiKey}`);
  var data = await response.json();


  console.log(data);

  document.querySelector(".cityNameDisplay").innerHTML = data.name;
  document.querySelector(".tempTemperatureDisplay").innerHTML =
    Math.round(data.main.temp) + "°C";
  document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
  document.querySelector(".wind").innerHTML = data.wind.speed + "km/h";

  
}

searchBtn.addEventListener("click", () => {
  checkWeather(searchBox.value);
});
