let currentPlan=null;
$('#open-planner').addEventListener('click',()=>{
 showScreen('planner-screen');$('#planner-place').textContent='Destination: '+weatherState.place.name;
 $('#planner-result').replaceChildren();$('#planner-status').textContent='';currentPlan=null;
});
function makePlan({title,arrival,travel,buffer,reminder,calendar},place,data,now=Date.now()){
 const target=new Date(arrival).getTime();travel=Number(travel);buffer=Number(buffer);reminder=Number(reminder);
 if(!Number.isFinite(target)||target<=now)throw new Error('Choose a future arrival time.');
 if(!Number.isFinite(travel)||travel<0||travel>1440||!Number.isFinite(buffer)||buffer<0||buffer>240)throw new Error('Enter valid travel and buffer times.');
 if(![15,30,60,1440].includes(reminder))throw new Error('Choose a reminder time.');
 const departure=target-(travel+buffer)*60000;if(departure<=now)throw new Error('The departure time is already past. Choose a later arrival or revise your travel time.');
 let weather='Forecast unavailable for this date. Check nearer departure.';
 if(data?.hourly?.time?.length){
  const index=data.hourly.time.findIndex(epoch=>epoch*1000>=target);
  if(index>=0&&data.hourly.time[index]*1000-target<=3600000){
   const temp=data.hourly.temperature_2m?.[index],rain=data.hourly.precipitation_probability?.[index],code=data.hourly.weather_code?.[index];
   weather=`Destination forecast near arrival: ${weatherDescription(code)[1]}, ${number(temp,'°C')}, precipitation probability ${number(rain,'%')}.`;
  }
 }
 return {title:title.trim(),arrival:target,departure,travel,buffer,reminder,calendar,place:{...place},weather,createdAt:now};
}
function calendarText(s){return String(s).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');}
function utcDate(ms){return new Date(ms).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');}
function foldCalendarLine(line){const encoder=new TextEncoder();let result='',part='',bytes=0;for(const char of line){const n=encoder.encode(char).length;if(bytes+n>73){result+=part+'\r\n ';part='';bytes=1;}part+=char;bytes+=n;}return result+part;}
function planDescription(p){return `Depart at ${new Date(p.departure).toLocaleString()}. Arrive by ${new Date(p.arrival).toLocaleString()}. Travel estimate ${p.travel} min + your buffer ${p.buffer} min. ${p.weather} Forecast snapshot; not an automatically updated alert. Reopen MAUSAM before leaving.`;}
function createCalendarFile(p){
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//MAUSAM//Planning//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:'+crypto.randomUUID()+'@mausam','DTSTAMP:'+utcDate(p.createdAt),'DTSTART:'+utcDate(p.departure),'DTEND:'+utcDate(Math.max(p.arrival,p.departure+60000)),'SUMMARY:'+calendarText('Leave for: '+p.title),'LOCATION:'+calendarText(p.place.name),'DESCRIPTION:'+calendarText(planDescription(p)),'BEGIN:VALARM','TRIGGER:-PT'+p.reminder+'M','ACTION:DISPLAY','DESCRIPTION:'+calendarText('Prepare to leave: '+p.title),'END:VALARM','END:VEVENT','END:VCALENDAR'];return lines.map(foldCalendarLine).join('\r\n')+'\r\n';
}
$('#trip-form').addEventListener('submit',event=>{
 event.preventDefault();$('#planner-result').replaceChildren();
 try{
  currentPlan=makePlan(Object.fromEntries(new FormData(event.target)),weatherState.place,weatherState.data);
  const p=currentPlan;
  $('#planner-status').textContent=p.departure-p.reminder*60000<Date.now()?'The selected advance reminder time has already passed. Choose a shorter reminder or later trip.':'Review your departure and save it to your calendar.';
  const card=document.createElement('article');card.className='authority-weather-card';card.innerHTML=`<p class="small">SUGGESTED DEPARTURE</p><h2>${escapeHTML(new Date(p.departure).toLocaleString())}</h2><p>${escapeHTML(p.title)} · ${escapeHTML(p.place.name)}</p><p>${escapeHTML(p.weather)}</p><p class="small">Travel ${p.travel} min + buffer ${p.buffer} min. No live traffic estimate.</p>`;
  const button=document.createElement('button');button.className='primary';button.textContent=p.calendar==='google'?'Open Google Calendar':'Download calendar reminder';
  button.addEventListener('click',()=>{
   if(p.calendar==='google'){
    const params=new URLSearchParams({action:'TEMPLATE',text:'Leave for: '+p.title,dates:utcDate(p.departure)+'/'+utcDate(Math.max(p.arrival,p.departure+60000)),details:planDescription(p)+` Set a notification ${p.reminder} minutes before this event.`,location:p.place.name});
    window.open('https://calendar.google.com/calendar/render?'+params,'_blank','noopener');
    $('#planner-status').textContent='In Google Calendar, set the notification time and press Save. MAUSAM cannot confirm that you saved it.';
   }else{
    const url=URL.createObjectURL(new Blob([createCalendarFile(p)],{type:'text/calendar;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='MAUSAM-plan.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
    $('#planner-status').textContent='Import the file into your calendar, then check that the reminder and app notifications are enabled.';
   }
  });card.append(button);const remind=document.createElement('button');remind.className='weather-link';remind.textContent='Remind me while MAUSAM is open';remind.onclick=()=>{if(!('Notification'in window)||Notification.permission!=='granted'){$('#planner-status').textContent='Enable browser notifications in My Preferences first.';return;}if(p.departure-p.reminder*60000<=Date.now()){$('#planner-status').textContent='This reminder time has passed. Choose a shorter reminder.';return;}rememberTrip(p);remind.disabled=true;$('#planner-status').textContent='Reminder saved on this device. Keep MAUSAM running, or save to your calendar for a reminder when it is closed.';};card.append(remind);
  const note=document.createElement('p');note.className='small muted';note.textContent='Calendar reminders are delivered by your calendar app after you save/import. They do not automatically change when weather changes. Reminder-app account sync is not connected.';card.append(note);$('#planner-result').append(card);
 }catch(error){$('#planner-status').textContent=error.message;}
});
