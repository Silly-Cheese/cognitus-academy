function academySessionTools(){
  const btn = document.getElementById('loginBtn');
  if(!btn || document.getElementById('rememberSession')) return;
  btn.insertAdjacentHTML('beforebegin','<label class="field"><span><input id="rememberSession" type="checkbox" checked style="width:auto;margin-right:8px">Keep me signed in</span></label>');
}
setInterval(academySessionTools, 500);
