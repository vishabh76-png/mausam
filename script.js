// Plain JavaScript: no build tool or API key is required.
const languages = [
  ['en', 'English', 'English'],
  ['hi', 'हिंदी', 'Hindi'], ['ta', 'தமிழ்', 'Tamil'],
  ['te', 'తెలుగు', 'Telugu'], ['bn', 'বাংলা', 'Bengali'],
  ['mr', 'मराठी', 'Marathi'], ['gu', 'ગુજરાતી', 'Gujarati'],
  ['kn', 'ಕನ್ನಡ', 'Kannada'], ['ml', 'മലയാളം', 'Malayalam'],
];
const profiles = [
  {id:'farmer', icon:'🌾', en:['Farmer','Crop advice, irrigation and rainfall forecasts'], hi:['किसान','फसल सलाह, सिंचाई और बारिश का पूर्वानुमान']},
  {id:'citizen', icon:'🏙️', en:['Citizen','Daily weather, alerts and safe updates'], hi:['आम नागरिक','दैनिक मौसम, अलर्ट और जरूरी अपडेट']},
  {id:'authority', icon:'🚨', en:['Disaster Authority','Emergency alerts, response and coordination'], hi:['आपदा प्राधिकरण','आपातकालीन अलर्ट, प्रतिक्रिया और समन्वय']}
];
// All incidents are fictional UI fixtures, never live operational data.
// The third card completes the screenshot's 3-incident count as a demo extension.
const incidents = [
  {id:'INC-2247',title:'Cyclone Alert',icon:'🌀',severity:'critical',badge:'Critical',place:'Odisha Coast — Puri, Bhubaneswar',people:'2.4M people affected',time:'Landfall in 18h',status:'Evacuation in progress',progress:68},
  {id:'INC-2248',title:'Flash Flood',icon:'🌊',severity:'high',badge:'High',place:'Bihar — Darbhanga, Sitamarhi',people:'840K people affected',time:'Active — 6h more',status:'Rescue ops active',progress:45},
  {id:'DEMO-003',title:'Rainfall Watch',icon:'🌧️',severity:'monitoring',badge:'Monitoring',place:'Sample district',people:'Demo monitoring area',time:'Illustrative forecast',status:'Monitoring in progress',progress:25}
];
let language = null;
let profile = null;
const $ = (selector) => document.querySelector(selector);

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(screen => { screen.hidden = screen.id !== id; });
  // Dashboard language remains English, matching the supplied dashboard.
  document.documentElement.lang = id === 'profile-screen' && language === 'hi' ? 'hi' : 'en';
  window.scrollTo(0,0);
  document.querySelector(`#${id} h1`).focus();
}

$('#languages').innerHTML = languages.map(([code,native,name]) => `
  <label class="language-option">
    <input class="choice-input" type="radio" name="language" value="${code}">
    <span class="choice"><span class="native" lang="${code}">${native}</span><span class="language-name">${name}</span></span>
  </label>`).join('');
$('#languages').addEventListener('change', event => {
  language = event.target.value;
  $('#next').disabled = false;
});

function renderProfiles() {
  const hindi = language === 'hi';
  $('#profile-title').textContent = hindi ? 'आप कौन हैं?' : 'Who are you?';
  $('#profile-subtitle').textContent = hindi ? 'हम आपका अनुभव व्यक्तिगत बनाएंगे' : 'Let’s personalise your experience';
  $('#profile-back').textContent = hindi ? '← वापस' : '← Back';
  $('#start').textContent = hindi ? 'शुरू करें' : 'Get started';
  $('#translation-note').hidden = ['hi','en'].includes(language);
  $('#profiles').innerHTML = profiles.map(item => {
    const [name, description] = item[hindi ? 'hi' : 'en'];
    return `<label class="profile-option">
      <input class="choice-input" type="radio" name="profile" value="${item.id}" ${profile === item.id ? 'checked' : ''}>
      <span class="choice"><span class="profile-icon" aria-hidden="true">${item.icon}</span><span class="profile-copy"><strong>${name}</strong><small>${description}</small></span></span>
    </label>`;
  }).join('');
  $('#start').disabled = !profile;
}
$('#next').addEventListener('click', () => {renderProfiles(); showScreen('profile-screen');});
$('#profiles').addEventListener('change', event => {profile = event.target.value; $('#start').disabled = false;});
$('#start').addEventListener('click', () => {
  if(profile === 'authority') { openAuthority(); }
  else {
    openWeather('profile-screen');
  }
});
document.querySelectorAll('[data-screen]').forEach(button => button.addEventListener('click', () => showScreen(button.dataset.screen)));

function renderIncidents() {
  $('#dashboard-content').innerHTML = incidents.map(item => `
    <article class="incident ${item.severity}">
      <div class="incident-heading"><span class="incident-icon" aria-hidden="true">${item.icon}</span><div><h2>${item.title}</h2><div class="id">${item.id}</div></div><span class="badge">${item.badge}</span></div>
      <div class="incident-info"><p>📍 ${item.place}</p><p>♟ ${item.people} · ◷ ${item.time}</p></div>
      <div class="progress-label"><strong>${item.status}</strong><span>${item.progress}%</span></div>
      <progress value="${item.progress}" max="100" aria-label="${item.title}: ${item.status}">${item.progress}%</progress>
      <div class="actions"><button data-action="map" data-incident="${item.id}">View Map</button><button class="order" data-action="orders" data-incident="${item.id}">Send Orders</button></div>
    </article>`).join('');
}
// Replace these explicit placeholders as each new feature is implemented.
const panelText = {
  Protocols:'Protocol documents have not been connected. Add your approved protocol content here.',
  Resources:'Resource inventories have not been connected. Add vehicles, equipment and supplies here.',
  Alerts:'Live alerts have not been connected. The Operations screen contains sample incidents only.',
  Teams:'No team directory is connected. Team assignments can be added here later.',
  Comms:'Messaging has not been connected. No messages can be sent from this prototype.'
};
function renderPanel(name) {
  if(name === 'Protocols') return renderProtocols();
  if(name === 'Resources') return renderResources();
  $('#dashboard-content').innerHTML = `<section class="empty-panel"><h2>${name}</h2><p>${panelText[name]}</p></section>`;
}
function renderDashboard(name) {
  document.querySelectorAll('[data-nav]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.nav === name)));
  $('.tabs').hidden = name !== 'Operations';
  if(name === 'Operations') {
    document.querySelectorAll('[data-tab]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tab === 'Incidents')));
    renderIncidents();
  } else renderPanel(name);
}
document.querySelectorAll('[data-nav]').forEach(button => button.addEventListener('click', () => renderDashboard(button.dataset.nav)));
document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-tab]').forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
  button.dataset.tab === 'Incidents' ? renderIncidents() : renderPanel(button.dataset.tab);
}));
$('#dashboard-content').addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if(!button) return;
  const incident = incidents.find(item => item.id === button.dataset.incident);
  $('#dialog-title').textContent = button.dataset.action === 'map' ? incident.title + ' — location' : 'Demo action only';
  $('#dialog-text').textContent = button.dataset.action === 'map'
    ? incident.place + '. An interactive map has not been connected yet.'
    : 'No orders were sent. This button is a UI demonstration. A real dispatch feature requires an authenticated backend and an authorised workflow.';
  $('#details').showModal();
});

// Screenshot-based operational content. This is demonstration material only.
const protocolGroups = [
  ['📋','Pre-Disaster (Now)','blue',[
    'Issue public evacuation notices via SMS & radio',
    'Pre-position rescue teams at staging areas',
    'Activate district emergency operations centers',
    'Check shelter capacity and supply stockpiles',
    'Brief medical teams on response protocols']],
  ['🚨','During Disaster','red',[
    'Deploy NDRF teams to high-risk zones',
    'Activate the verified helpline and coordinate with SDRF',
    'Open all designated relief shelters immediately',
    'Coordinate with Indian Coast Guard if coastal',
    'Maintain real-time communication with state HQ']],
  ['🏥','Post-Disaster','green',[
    'Conduct damage and needs assessment (DALA)',
    'Deploy health teams for disease surveillance',
    'Restore power and communication infrastructure',
    'Distribute relief kits and food to affected communities',
    'Document losses for compensation and DRF claims']]
];
function renderProtocols() {
  $('#dashboard-content').innerHTML = '<p class="section-note">Sample workflow from your design · Not an official operating procedure</p>' + protocolGroups.map(([icon,title,color,steps]) => `
    <article class="protocol-card ${color}"><h2><span>${icon}</span>${title}</h2><ol>${steps.map(step=>`<li>${step}</li>`).join('')}</ol></article>`).join('') + `
    <article class="contacts-card"><h2>☎ Emergency Contacts</h2><p class="small muted">Use the official directories below. Screenshot phone numbers have not been verified.</p>
    <a href="https://ndma.gov.in/" target="_blank" rel="noopener">NDMA <span>Official website ↗</span></a>
    <a href="https://ndrf.gov.in/contact-us" target="_blank" rel="noopener">NDRF <span>Contact directory ↗</span></a>
    <a href="https://mausam.imd.gov.in/" target="_blank" rel="noopener">IMD <span>Official website ↗</span></a>
    <a href="https://indiancoastguard.gov.in/" target="_blank" rel="noopener">Coast Guard <span>Official website ↗</span></a></article>`;
}
const resources = [
  ['👮','NDRF Teams',8,12,'#4698ff'],['🚤','Rescue Boats',218,340,'#49b78b'],
  ['🏕️','Relief Shelters',1650,2400,'#ffb21c'],['🏥','Medical Teams',54,85,'#9d7bed'],
  ['🚁','Helicopters',18,24,'#ee595f']
];
function renderResources() {
  $('#dashboard-content').innerHTML = `<article class="resource-summary"><p>Sample deployment overview</p><strong>73%</strong> <span>illustrative national reserve usage</span><p class="small">Design fixture · Not calculated from the categories below</p></article>` + resources.map(([icon,name,used,total,color])=>`
    <article class="resource-card" style="--resource-color:${color}"><h2><span>${icon} &nbsp; ${name}</span><span>${used}<small>/${total}</small></span></h2><progress value="${used}" max="${total}" aria-label="${name} deployed">${used}/${total}</progress><p>${used} deployed · ${total-used} available</p></article>`).join('');
}
