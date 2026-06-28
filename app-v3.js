import './app-v2.js?v=7';
import { getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js';
import { getFirestore, doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { premadeCourses } from './courses.js';

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

function academyCloseControl(){
  const modal = document.getElementById('modal');
  const box = document.querySelector('.modal-box');
  if (!modal || !box || modal.classList.contains('hidden') || box.querySelector('.modal-close')) return;
  const button = document.createElement('button');
  button.className = 'modal-close secondary';
  button.textContent = 'Close Course';
  button.addEventListener('click', function(){ modal.classList.add('hidden'); });
  box.prepend(button);
}
setInterval(academyCloseControl, 500);

function extraLessonText(courseTitle){
  return '\n\nPractical Standard\nThis lesson should be applied in actual Cognitus work, not treated as something to simply click through. Staff should be able to explain the standard, recognize when it applies, and use it consistently.\n\nOperational Example\nIf a staff member is asked to act quickly, the correct response is not to abandon structure. They should still verify authority, protect private information, document important actions, and ask for help when needed.\n\nCommon Mistake to Avoid\nThe most common mistake is assuming small decisions do not need standards. Repeated undocumented actions, unclear communication, or informal exceptions can eventually become major problems.\n\nCognitus Application\nFor '+courseTitle+', connect this lesson to your department, role, and supervisor expectations. If the lesson involves authority, know your limits. If it involves records, know what must be written down. If it involves people, remain fair and professional.\n\nReadiness Check\nBefore moving forward, answer: What is the standard? When does it apply? What should I do if I am unsure?';
}
window.seedAgain = async function(){
  try{
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    for (const c of premadeCourses) {
      const longCourse = Object.assign({}, c, {lessons:(c.lessons||[]).map(l => Object.assign({}, l, {body:(l.body||'') + extraLessonText(c.title)})), seededVersion:'v3-long-lessons', updatedAt:serverTimestamp()});
      await setDoc(doc(db, 'courses', c.id), longCourse, {merge:true});
    }
    alert('Premade courses updated with longer lessons.');
  } catch (e) {
    alert('Seed failed: ' + (e.message || e));
  }
};

function addEmployeeEditButtons(){
  if (document.getElementById('pageTitle')?.textContent !== 'Staff') return;
  const table = document.querySelector('#view table');
  if (!table || table.dataset.editButtons) return;
  table.dataset.editButtons = '1';
  const head = table.querySelector('tr');
  if (head) head.insertAdjacentHTML('beforeend','<th>Actions</th>');
  Array.from(table.querySelectorAll('tr')).slice(1).forEach(function(row){
    const id = row.querySelector('.small')?.textContent?.trim();
    if (id) row.insertAdjacentHTML('beforeend','<td><button class="secondary" onclick="openEmployeeEditPrompt(\''+id+'\')">Edit</button></td>');
  });
}
setInterval(addEmployeeEditButtons, 700);
