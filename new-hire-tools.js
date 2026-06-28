import { getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js';
import { getFirestore, collection, doc, getDocs, getDoc, setDoc, addDoc, deleteDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const academyApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const academyDb = getFirestore(academyApp);
const byId = id => document.getElementById(id);
const safe = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

function showToolModal(html){
  byId('modalContent').innerHTML = html;
  byId('modal').classList.remove('hidden');
}
function closeToolModal(){ byId('modal')?.classList.add('hidden'); }
window.closeToolModal = closeToolModal;

function message(title, text){
  showToolModal('<h2>'+safe(title)+'</h2><p class="muted">'+safe(text)+'</p><div class="split-actions"><span></span><button onclick="closeToolModal()">Okay</button></div>');
}

window.deleteAcademyAssignment = async function(id){
  if(!id) return;
  showToolModal('<h2>Delete Assignment?</h2><p class="muted">This will remove the assignment record.</p><div class="split-actions"><button class="danger" onclick="confirmDeleteAssignment(\''+safe(id)+'\')">Delete Assignment</button><button class="secondary" onclick="closeToolModal()">Cancel</button></div>');
};
window.confirmDeleteAssignment = async function(id){
  await deleteDoc(doc(academyDb, 'assignments', id));
  message('Assignment Deleted', 'Refresh the Assignment Center to see the change.');
};

window.deleteAcademyCourse = async function(id){
  if(!id) return;
  showToolModal('<h2>Delete Course?</h2><p class="muted">This removes the course record. Existing completion and certificate records are not removed.</p><div class="split-actions"><button class="danger" onclick="confirmDeleteCourse(\''+safe(id)+'\')">Delete Course</button><button class="secondary" onclick="closeToolModal()">Cancel</button></div>');
};
window.confirmDeleteCourse = async function(id){
  await deleteDoc(doc(academyDb, 'courses', id));
  message('Course Deleted', 'Refresh Course Builder or Course Library to see the change.');
};

async function loadData(){
  const employeesSnap = await getDocs(collection(academyDb, 'employees'));
  const coursesSnap = await getDocs(collection(academyDb, 'courses'));
  const employees = employeesSnap.docs.map(d => ({id:d.id, ...d.data()}));
  const courses = coursesSnap.docs.map(d => ({id:d.id, ...d.data()}));
  let selectedIds = [];
  const settings = await getDoc(doc(academyDb, 'settings', 'newHireTraining'));
  if(settings.exists()) selectedIds = settings.data().courseIds || [];
  if(!selectedIds.length) selectedIds = courses.filter(c => c.required || c.id === 'COURSE-ORIENTATION' || c.id === 'COURSE-CONDUCT' || c.id === 'COURSE-DISCORD-PRO' || c.id === 'COURSE-PRIVACY').map(c => c.id);
  return {employees, courses, selectedIds};
}

window.configureNewHireCourses = async function(){
  const {courses, selectedIds} = await loadData();
  const rows = courses.map(c => '<label class="answer"><input type="checkbox" class="nh-course" value="'+safe(c.id)+'" '+(selectedIds.includes(c.id)?'checked':'')+'> <span><b>'+safe(c.title)+'</b><br><span class="small">'+safe(c.id)+' • '+safe(c.department || 'All')+'</span></span></label>').join('');
  showToolModal('<h2>Configure New-Hire Courses</h2><p class="muted">Select the courses that should automatically be assigned during New Hire Training.</p><div class="stack">'+rows+'</div><div class="split-actions"><button onclick="saveNewHireCourses()">Save Course List</button><button class="secondary" onclick="closeToolModal()">Cancel</button></div>');
};
window.saveNewHireCourses = async function(){
  const ids = Array.from(document.querySelectorAll('.nh-course:checked')).map(x => x.value);
  await setDoc(doc(academyDb, 'settings', 'newHireTraining'), {courseIds:ids, updatedAt:serverTimestamp()}, {merge:true});
  message('New-Hire Courses Saved', ids.length + ' courses are now marked as new-hire training.');
};

window.openNewHireTraining = async function(){
  const {employees, courses, selectedIds} = await loadData();
  const selectedCourses = courses.filter(c => selectedIds.includes(c.id));
  const employeeRows = employees.map(e => '<label class="answer"><input type="checkbox" class="nh-employee" value="'+safe(e.id)+'" data-name="'+safe(e.displayName || e.discordUsername || e.id)+'"> <span><b>'+safe(e.displayName || e.discordUsername || e.id)+'</b><br><span class="small">'+safe(e.department || '')+' • '+safe(e.role || '')+'</span></span></label>').join('');
  const courseRows = selectedCourses.map(c => '<p>'+safe(c.title)+' <span class="small">('+safe(c.id)+')</span></p>').join('') || '<p class="muted">No new-hire courses selected yet.</p>';
  showToolModal('<h2>New Hire Training</h2><p class="muted">Select the new employees. The system will assign every configured new-hire course to each selected employee.</p><div class="grid g2"><div class="card flat"><h3>New Employees</h3>'+employeeRows+'</div><div class="card flat"><h3>Courses to Assign</h3>'+courseRows+'</div></div><div class="split-actions"><button onclick="assignNewHireTraining()">Assign New-Hire Training</button><button class="secondary" onclick="closeToolModal()">Cancel</button></div>');
};
window.assignNewHireTraining = async function(){
  const chosenEmployees = Array.from(document.querySelectorAll('.nh-employee:checked')).map(x => ({id:x.value, name:x.dataset.name || x.value}));
  const settings = await getDoc(doc(academyDb, 'settings', 'newHireTraining'));
  const courseIds = settings.exists() ? (settings.data().courseIds || []) : [];
  if(!chosenEmployees.length) return message('No Employees Selected', 'Select at least one employee.');
  if(!courseIds.length) return message('No Courses Selected', 'Configure the new-hire course list first.');
  let count = 0;
  for(const employee of chosenEmployees){
    for(const courseId of courseIds){
      await addDoc(collection(academyDb, 'assignments'), {courseId, type:'Employee', target:'Employee', employeeId:employee.id, targetLabel:employee.name, required:true, dueDate:'', assignedBy:'New Hire Training', assignedAt:serverTimestamp()});
      count++;
    }
  }
  message('Training Assigned', count + ' new-hire assignments were created.');
};

function addButtons(){
  const title = document.getElementById('pageTitle')?.textContent || '';
  if(title === 'Assignment Center'){
    const actions = document.getElementById('pageActions');
    if(actions && !actions.dataset.newHireReady){
      actions.dataset.newHireReady = '1';
      actions.insertAdjacentHTML('afterbegin','<button onclick="openNewHireTraining()">New Hire Training</button> <button class="secondary" onclick="configureNewHireCourses()">Configure New-Hire Courses</button> ');
    }
    const table = document.querySelector('#view table');
    if(table && !table.dataset.deleteReady){
      table.dataset.deleteReady = '1';
      Array.from(table.querySelectorAll('tr')).slice(1).forEach(function(row){
        const edit = row.querySelector('button[onclick^="assignForm"]');
        if(!edit) return;
        const match = edit.getAttribute('onclick').match(/'([^']+)'/);
        if(match) edit.insertAdjacentHTML('afterend', ' <button class="danger" onclick="deleteAcademyAssignment(\''+match[1]+'\')">Delete</button>');
      });
    }
  }
  if(title === 'Course Builder'){
    const table = document.querySelector('#view table');
    if(table && !table.dataset.courseDeleteReady){
      table.dataset.courseDeleteReady = '1';
      Array.from(table.querySelectorAll('tr')).slice(1).forEach(function(row){
        const edit = row.querySelector('button[onclick^="courseForm"]');
        if(!edit) return;
        const match = edit.getAttribute('onclick').match(/'([^']+)'/);
        if(match) edit.insertAdjacentHTML('afterend', ' <button class="danger" onclick="deleteAcademyCourse(\''+match[1]+'\')">Delete</button>');
      });
    }
  }
}
setInterval(addButtons, 700);
