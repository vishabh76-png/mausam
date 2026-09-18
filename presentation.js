// Presentation controls are independent of weather and operations data.
$('#restart-preview').addEventListener('click',()=>showScreen('language-screen'));
const fullscreenButton=$('#fullscreen-preview');
if(document.fullscreenEnabled && document.documentElement.requestFullscreen){
  fullscreenButton.hidden=false;
  fullscreenButton.addEventListener('click',async()=>{
    try{
      if(document.fullscreenElement)await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    }catch{ $('#presentation-status').textContent='Full screen is unavailable in this browser.'; }
  });
  document.addEventListener('fullscreenchange',()=>{fullscreenButton.textContent=document.fullscreenElement?'Exit full screen':'Full screen';});
}
