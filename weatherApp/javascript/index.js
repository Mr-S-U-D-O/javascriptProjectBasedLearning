const weatherApiKey = "c9074cdc56348f646c36b7e1fa6e361b";
const weatherApiUrl =
  "https://api.openweathermap.org/data/2.5/weather?units=metric&q=matatiele";

async function checkWeather() {
const response = await fetch(weatherApiUrl + `&appid=${weatherApiKey}`);
    var data = await response.json();

    console.log(data);
}
