import { getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js';
import { getFirestore, doc, deleteDoc } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const academyApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const academyDb = getFirestore(academyApp);

window.deleteAcademyAssignment = async function(id){
  if(!id) return;
  if(!confirm('Delete this assignment?')) return;
  await deleteDoc(doc(academyDb, 'assignments', id));
  alert('Assignment deleted. Refresh the Assignment Center.');
};

window.deleteAcademyCourse = async function(id){
  if(!id) return;
  if(!confirm('Delete this course? Existing completions will remain, but the course record will be removed.')) return;
  await deleteDoc(doc(academyDb, 'courses', id));
  alert('Course deleted. Refresh the Course Builder or Course Library.');
};

function addDeleteButtons(){
  const title = document.getElementById('pageTitle')?.textContent || '';
  if(title === 'Assignment Center'){
    const table = document.querySelector('#view table');
    if(!table || table.dataset.deleteReady) return;
    table.dataset.deleteReady = '1';
    Array.from(table.querySelectorAll('tr')).slice(1).forEach(function(row){
      const edit = row.querySelector('button[onclick^="assignForm"]');
      if(!edit) return;
      const match = edit.getAttribute('onclick').match(/'([^']+)'/);
      if(!match) return;
      edit.insertAdjacentHTML('afterend', ' <button class="danger" onclick="deleteAcademyAssignment(\''+match[1]+'\')">Delete</button>');
    });
  }
  if(title === 'Course Builder'){
    const table = document.querySelector('#view table');
    if(!table || table.dataset.courseDeleteReady) return;
    table.dataset.courseDeleteReady = '1';
    Array.from(table.querySelectorAll('tr')).slice(1).forEach(function(row){
      const edit = row.querySelector('button[onclick^="courseForm"]');
      if(!edit) return;
      const match = edit.getAttribute('onclick').match(/'([^']+)'/);
      if(!match) return;
      edit.insertAdjacentHTML('afterend', ' <button class="danger" onclick="deleteAcademyCourse(\''+match[1]+'\')">Delete</button>');
    });
  }
}
setInterval(addDeleteButtons, 700);
