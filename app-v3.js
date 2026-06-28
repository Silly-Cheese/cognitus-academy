import './app-v2.js?v=7';

function academyPinStep(){
  const btn = document.getElementById('loginBtn');
  const pin = document.getElementById('loginPin');
  const user = document.getElementById('loginUsername');
  const did = document.getElementById('loginDiscordId');
  const note = document.getElementById('loginNotice');
  if (!btn || !pin || !user || !did || btn.dataset.pinStepReady) return;
  btn.dataset.pinStepReady = '1';
  const row = pin.closest('label');
  if (row) row.classList.add('hidden');
  btn.textContent = 'Continue';
  btn.addEventListener('click', function(event){
    if (row && row.classList.contains('hidden')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!user.value.trim() || !did.value.trim()) {
        if (note) note.innerHTML = '<div class="notice">Enter your Discord Username and Discord User ID first.</div>';
        return;
      }
      user.disabled = true;
      did.disabled = true;
      row.classList.remove('hidden');
      btn.textContent = 'Sign In / Create PIN';
      if (note) note.innerHTML = '<div class="notice"><b>Identity entered.</b><br>Now enter your 4-digit PIN.</div>';
      pin.focus();
    }
  }, true);
}
setInterval(academyPinStep, 500);
