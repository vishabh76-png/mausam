// Live weather integration. No secret keys; public Open-Meteo endpoints.
// Refreshing requests the latest available MODEL data, not a sensor stream.
const weatherState = {place:{name:'Hisar, Haryana, India',latitude:29.1492,longitude:75.7217},data:null,fetched:0,unit:'C',returnTo:'profile-screen',request:0,controller:null,busy:false};
const escapeHTML = value => String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const validNumber = value => typeof value === 'number' && Number.isFinite(value);
function number(value,suffix='',digits=0){return validNumber(value) ? value.toFixed(digits)+suffix : '—';}
function temperature(value){return number(validNumber(value) ? (weatherState.unit==='F' ? value*9/5+32 : value) : null,'°');}
function weatherDescription(code,isDay=1){
  if(code===0)return [isDay ? '☀️':'🌙',isDay ? 'Clear sky':'Clear night'];
  if([1,2].includes(code))return ['🌤️','Partly cloudy'];
  if(code===3)return ['☁️','Overcast'];
  if([45,48].includes(code))return ['🌫️','Fog'];
  if([51,53,55,56,57].includes(code))return ['🌦️','Drizzle'];
  if([61,63,65,66,67,80,81,82].includes(code))return ['🌧️','Rain'];
  if([71,73,75,77,85,86].includes(code))return ['🌨️','Snow'];
  if([95,96,99].includes(code))return ['⛈️','Thunderstorm'];
  return ['🌡️','Conditions unavailable'];
}
function statusWeather(message,type=''){ $('#weather-status').textContent=message;$('#weather-status').className='weather-status '+type; }
async function fetchJSON(url,signal){
  const response=await fetch(url,{signal});
  if(!response.ok)throw new Error(response.status===429 ? 'Too many requests. Please try again later.' : 'Weather service unavailable. Please retry.');
  return response.json();
}
function openWeather(returnTo){
  weatherState.returnTo=returnTo;
  showScreen('weather-screen');
  if(weatherState.data)renderWeather();
  if(!weatherState.data || Date.now()-weatherState.fetched>600000)loadWeather(weatherState.place);
}
$('#open-weather').addEventListener('click',()=>openWeather('dashboard-screen'));
$('#weather-back').addEventListener('click',()=>showScreen(weatherState.returnTo));
async function loadWeather(place){
  if(!validNumber(place.latitude)||!validNumber(place.longitude))return;
  const id=++weatherState.request;
  weatherState.controller?.abort();
  const controller=new AbortController();weatherState.controller=controller;weatherState.busy=true;
  const timer=setTimeout(()=>controller.abort(),15000);
  statusWeather('Updating '+place.name+'…','loading');$('#refresh-weather').disabled=true;
  const params=new URLSearchParams({latitude:place.latitude,longitude:place.longitude,
    current:'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
    hourly:'temperature_2m,precipitation_probability,weather_code,is_day',
    daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum',
    timezone:'auto',forecast_days:'16',wind_speed_unit:'kmh',temperature_unit:'celsius',precipitation_unit:'mm',timeformat:'unixtime'});
  try{
    const data=await fetchJSON('https://api.open-meteo.com/v1/forecast?'+params,controller.signal);
    if(id!==weatherState.request)return;
    if(!data.current || !validNumber(data.current.temperature_2m)||!validNumber(data.current.time)||!Array.isArray(data.daily?.time)||!Array.isArray(data.hourly?.time))throw new Error('Weather service returned incomplete data. Please retry.');
    // Check the time zone before rendering. Epoch timestamps avoid browser/location time-zone confusion.
    new Intl.DateTimeFormat('en',{timeZone:data.timezone}).format();
    weatherState.data=data;weatherState.place={...place};weatherState.fetched=Date.now();
    loadAuthorityWeather();
    $('#weather-screen').dataset.stale='false';renderWeather();
    statusWeather('Updated '+new Date(weatherState.fetched).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+' · Auto-refresh on');
  }catch(error){
    if(id!==weatherState.request)return;
    $('#weather-screen').dataset.stale=String(Boolean(weatherState.data));
    statusWeather((weatherState.data ? 'Showing previous data for '+weatherState.place.name+'. ' : '') + (error.name==='AbortError' ? 'Request timed out. Tap Refresh to retry.' : error instanceof TypeError ? 'Could not connect. Check your internet and try again.' : error.message),'error');
  }finally{clearTimeout(timer);if(id===weatherState.request){weatherState.busy=false;$('#refresh-weather').disabled=false;}}
}
function renderWeather(){
  const d=weatherState.data;if(!d)return;
  const c=d.current;const [icon,description]=weatherDescription(c.weather_code,c.is_day);
  const time=(epoch,options)=>new Intl.DateTimeFormat('en-IN',{timeZone:d.timezone,...options}).format(new Date(epoch*1000));
  const hours=d.hourly.time.map((epoch,i)=>({epoch,i})).filter(item=>item.epoch>=c.time).slice(0,12);
  $('#weather-content').innerHTML=`<article class="weather-hero"><p class="small">${profile==='farmer' ? 'FARM WEATHER':'CURRENT CONDITIONS'}</p><h2>${escapeHTML(weatherState.place.name)}</h2><span class="weather-symbol" aria-hidden="true">${icon}</span><p class="temperature">${temperature(c.temperature_2m)}<span style="font-size:22px;letter-spacing:0">${weatherState.unit}</span></p><p class="condition">${description}</p><p class="small">Feels like ${temperature(c.apparent_temperature)} · H ${temperature(d.daily.temperature_2m_max?.[0])} / L ${temperature(d.daily.temperature_2m_min?.[0])}</p><p class="small">Data time: ${escapeHTML(time(c.time,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}))} · ${escapeHTML(d.timezone)}</p></article>
+    <div class="weather-metrics"><div class="metric"><span>💧 Humidity</span><strong>${number(c.relative_humidity_2m,'%')}</strong></div><div class="metric"><span>💨 Wind</span><strong>${number(c.wind_speed_10m,' km/h')}</strong></div><div class="metric"><span>🌧 Precipitation · current interval</span><strong>${number(c.precipitation,' mm',1)}</strong></div><div class="metric"><span>☂ Rain chance · today’s maximum</span><strong>${number(d.daily.precipitation_probability_max?.[0],'%')}</strong></div></div>
+    <h2 class="weather-section-title">Next 12 hours</h2><div class="hourly-strip">${hours.map(({epoch,i})=>`<div class="hour-card"><span>${escapeHTML(time(epoch,{hour:'2-digit',hour12:false}))}:00</span><span class="hour-icon">${weatherDescription(d.hourly.weather_code?.[i],d.hourly.is_day?.[i])[0]}</span><strong>${temperature(d.hourly.temperature_2m?.[i])}</strong><span>${number(d.hourly.precipitation_probability?.[i],'%')}</span></div>`).join('')}</div>
+    <h2 class="weather-section-title">${profile==='farmer'?'16-day crop-planning outlook':'7-day forecast'}</h2>${profile==='farmer'?'<p class="small muted">Use the later days as a planning outlook. Forecasts become less certain further ahead; check again before field work.</p>':''}<div class="forecast-list">${d.daily.time.slice(0,profile==='farmer'?16:7).map((epoch,i)=>`<div class="forecast-day"><strong>${i===0?'Today':escapeHTML(time(epoch,{weekday:'short'}))}</strong><span aria-label="${weatherDescription(d.daily.weather_code?.[i])[1]}">${weatherDescription(d.daily.weather_code?.[i])[0]}</span><span class="muted">${number(d.daily.precipitation_probability_max?.[i],'%')}${profile==='farmer'?`<br>${number(d.daily.precipitation_sum?.[i],' mm',1)}`:''}</span><span>${temperature(d.daily.temperature_2m_max?.[i])} <span class="muted">${temperature(d.daily.temperature_2m_min?.[i])}</span></span></div>`).join('')}</div>
+    ${profile==='farmer'?`<div class="metric" style="margin-top:16px"><span>Today’s forecast precipitation</span><strong>${number(d.daily.precipitation_sum?.[0],' mm',1)}</strong><p class="small muted">Forecast context for planning. Crop-specific recommendations are not connected.</p></div>`:''}`.replace(/^\+/gm,'');
}
$('#refresh-weather').addEventListener('click',()=>loadWeather(weatherState.place));
$('#unit-toggle').addEventListener('click',()=>{weatherState.unit=weatherState.unit==='C'?'F':'C';$('#unit-toggle').textContent=weatherState.unit==='C'?'°C / °F':'°F / °C';$('#unit-toggle').setAttribute('aria-label','Switch to '+(weatherState.unit==='C'?'Fahrenheit':'Celsius'));renderWeather();loadAuthorityWeather();});
let searchId=0;let searchController;
$('#city-form').addEventListener('submit',async event=>{
  event.preventDefault();const query=$('#city-input').value.trim();if(query.length<2)return;
  const id=++searchId;searchController?.abort();searchController=new AbortController();const controller=searchController;const timer=setTimeout(()=>controller.abort(),12000);
  $('#city-results').replaceChildren();statusWeather('Finding cities…','loading');
  try{
    const data=await fetchJSON('https://geocoding-api.open-meteo.com/v1/search?'+new URLSearchParams({name:query,count:'5',language:'en',format:'json'}),controller.signal);
    if(id!==searchId)return;
    const places=(data.results||[]).filter(p=>validNumber(p.latitude)&&validNumber(p.longitude));
    if(!places.length){statusWeather('No matching city. Try another spelling.','error');return;}
    statusWeather('Choose the correct city below.');
    for(const p of places){const button=document.createElement('button');button.type='button';const name=[p.name,p.admin1,p.country].filter(Boolean).join(', ');button.textContent=name;button.addEventListener('click',()=>{++searchId;$('#city-results').replaceChildren();$('#city-input').value='';loadWeather({name,latitude:p.latitude,longitude:p.longitude});});$('#city-results').append(button);}
  }catch(error){if(id===searchId)statusWeather('City search failed. Check your connection and try again.','error');}finally{clearTimeout(timer);}
});
$('#locate').addEventListener('click',()=>{
  if(!navigator.geolocation){statusWeather('Location is unavailable in this browser. Search for a city instead.','error');return;}
  if(!window.isSecureContext){statusWeather('Location requires localhost or HTTPS. Use the included local server or search by city.','error');return;}
  $('#locate').disabled=true;statusWeather('Waiting for location permission…','loading');
  navigator.geolocation.getCurrentPosition(position=>{
    $('#locate').disabled=false;
    const {latitude,longitude}=position.coords;
    loadWeather({name:'My location ('+latitude.toFixed(2)+', '+longitude.toFixed(2)+')',latitude,longitude});
  },error=>{$('#locate').disabled=false;statusWeather(error.code===1?'Location permission denied. Search for a city instead.':'Could not locate you. Try again or search for a city.','error');},{timeout:12000,maximumAge:300000,enableHighAccuracy:false});
});
setInterval(()=>{if(!document.hidden&&!$('#weather-screen').hidden&&!weatherState.busy&&Date.now()-weatherState.fetched>=600000)loadWeather(weatherState.place);},60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!$('#weather-screen').hidden&&!weatherState.busy&&Date.now()-weatherState.fetched>=600000)loadWeather(weatherState.place);});
window.addEventListener('offline',()=>{if(!$('#weather-screen').hidden){$('#weather-screen').dataset.stale='true';statusWeather('You are offline. Any displayed weather is previously fetched data.','error');}});
window.addEventListener('online',()=>{if(!$('#weather-screen').hidden)loadWeather(weatherState.place);});
