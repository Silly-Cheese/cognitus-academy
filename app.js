import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js';
import { getFirestore, collection, doc, getDocs, setDoc, addDoc, updateDoc, query, where, limit, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';
import { premadeCourses, departments, roles } from './courses.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const $ = id => document.getElementById(id);
const today = () => new Date().toISOString().slice(0, 10);
const uid = p => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
const esc = v => String(v ?? '').replace(/[&<>]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[s]));
const state = { user: null, route: 'dashboard', employees: [], courses: [], assignments: [], progress: [], certifications: [], attempts: [] };

async function digest(text){
  const data = new TextEncoder().encode(text);
  const result = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(result)].map(x => x.toString(16).padStart(2,'0')).join('');
}
function canAdmin(){ return ['Owner','Executive','Board of Directors'].includes(state.user?.role) || String(state.user?.role || '').startsWith('Chief'); }
function canManager(){ return canAdmin() || /Supervisor|Lead|Officer|Board|Executive|Owner|Chief/.test(state.user?.role || ''); }
function notify(message){ $('loginNotice').innerHTML = `<div class="notice">${message}</div>`; }
function pill(text, color=''){ return `<span class="pill ${color}">${esc(text)}</span>`; }

async function init(){
  try { await signInAnonymously(auth); } catch(e) { console.warn('Enable Anonymous Auth in Firebase if rules require sign-in.'); }
  await checkOwner();
  $('setupBtn').onclick = setupOwner;
  $('loginBtn').onclick = login;
  $('logoutBtn').onclick = () => location.reload();
}
async function checkOwner(){
  const snap = await getDocs(query(collection(db,'employees'), where('role','==','Owner'), limit(1)));
  const exists = !snap.empty;
  $('ownerSetup').classList.toggle('hidden', exists);
  $('normalLogin').classList.toggle('hidden', !exists);
}
async function setupOwner(){
  const pin = $('setupPin').value.trim();
  const discordId = $('setupDiscordId').value.trim();
  const username = $('setupUsername').value.trim();
  if(!discordId || !username || !/^[0-9]{4}$/.test(pin)) return notify('Enter Discord ID, username, and a 4-digit PIN.');
  await setDoc(doc(db,'employees','EMP-000001'), {
    displayName: $('setupDisplay').value.trim() || 'Christopher Shelley',
    discordUsername: username,
    discordId,
    department: 'Executive',
    role: 'Owner',
    supervisor: 'None',
    hireDate: today(),
    status: 'Active',
    permissionLevel: 'System Administrator',
    pinHash: await digest(pin),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await seedCourses();
  await audit('BOOTSTRAP','Owner created and premade courses seeded.');
  notify('Owner created. Sign in now.');
  await checkOwner();
}
async function seedCourses(){
  for (const course of premadeCourses) await setDoc(doc(db,'courses',course.id), {...course, updatedAt: serverTimestamp()}, {merge:true});
}
async function login(){
  const username = $('loginUsername').value.trim();
  const discordId = $('loginDiscordId').value.trim();
  const pin = $('loginPin').value.trim();
  const snap = await getDocs(query(collection(db,'employees'), where('discordId','==',discordId), limit(1)));
  if(snap.empty) return notify('No staff account found for that Discord ID.');
  const emp = {...snap.docs[0].data(), id: snap.docs[0].id};
  if(emp.discordUsername.toLowerCase() !== username.toLowerCase()) return notify('Discord username does not match this staff record.');
  if(emp.status !== 'Active' && emp.status !== 'Awaiting PIN Setup') return notify('This account is not active.');
  if(!emp.pinHash){
    if(!/^[0-9]{4}$/.test(pin)) return notify('First login: enter the 4-digit PIN you want to create.');
    const pinHash = await digest(pin);
    await updateDoc(doc(db,'employees',emp.id), { pinHash, status:'Active', updatedAt: serverTimestamp() });
    emp.pinHash = pinHash;
  } else if(emp.pinHash !== await digest(pin)) return notify('Incorrect PIN.');
  state.user = emp;
  $('loginScreen').classList.add('hidden');
  $('app').classList.remove('hidden');
  await loadAll(); renderShell(); render();
}
async function loadAll(){
  for (const key of ['employees','courses','assignments','progress','certifications','attempts']) {
    const snap = await getDocs(collection(db,key));
    state[key] = snap.docs.map(d => ({...d.data(), id:d.id}));
  }
}
async function audit(action, details){
  await addDoc(collection(db,'auditLogs'), { action, details, actor: state.user?.id || 'SYSTEM', actorName: state.user?.displayName || 'System', at: serverTimestamp() });
}
function renderShell(){
  $('profileName').textContent = state.user.displayName || state.user.discordUsername;
  $('profileRole').textContent = state.user.role;
  $('profileDept').textContent = state.user.department;
  const items = [['dashboard','Dashboard'],['training','My Training'],['library','Course Library'],['certs','My Certifications'],['monthly','Monthly Training']];
  if(canManager()) items.push(['reports','Reports']);
  if(canAdmin()) items.push(['admin','Administration'],['staff','Staff'],['builder','Course Builder'],['assign','Assignment Center']);
  $('nav').innerHTML = items.map(([id,label]) => `<button class="${state.route===id?'active':''}" data-route="${id}">${label}</button>`).join('');
  document.querySelectorAll('nav button').forEach(b => b.onclick = () => { state.route = b.dataset.route; renderShell(); render(); });
}
function setPage(title, sub='', actions=''){ $('pageTitle').textContent = title; $('pageSub').textContent = sub; $('pageActions').innerHTML = actions; }
function myAssignments(emp=state.user){ return state.assignments.filter(a => a.target === 'Everyone' || a.employeeId === emp.id || a.target === emp.department || a.target === emp.role); }
function completed(courseId, employeeId=state.user.id){ return state.progress.find(p => p.courseId === courseId && p.employeeId === employeeId); }
function render(){ ({dashboard,training,library,certs,monthly,reports,admin,staff,builder,assign}[state.route] || dashboard)(); }
function dashboard(){
  setPage('Dashboard','Your training command center.');
  const assignments = myAssignments();
  const done = assignments.filter(a => completed(a.courseId)).length;
  const overdue = assignments.filter(a => a.dueDate && a.dueDate < today() && !completed(a.courseId)).length;
  const certs = state.certifications.filter(c => c.employeeId === state.user.id && c.status !== 'Revoked');
  $('view').innerHTML = `<div class="grid g4"><div class="card"><div class="stat">${assignments.length}</div><b>Assigned</b></div><div class="card"><div class="stat">${done}</div><b>Complete</b></div><div class="card"><div class="stat">${certs.length}</div><b>Certificates</b></div><div class="card"><div class="stat">${overdue}</div><b>Overdue</b></div></div><div class="card" style="margin-top:16px"><h3>Overall Progress</h3><div class="progress"><span style="width:${assignments.length ? Math.round(done/assignments.length*100) : 0}%"></span></div></div><div class="grid g2" style="margin-top:16px"><div class="card"><h3>Continue Learning</h3>${assignments.slice(0,6).map(assignmentRow).join('') || '<p class="muted">No assignments yet.</p>'}</div><div class="card"><h3>Recent Certificates</h3>${certs.slice(0,6).map(c => `<p>${pill('Active','green')} <b>${esc(c.certificateName)}</b><br><span class="small">Issued ${esc(c.issueDate)}</span></p>`).join('') || '<p class="muted">No certificates yet.</p>'}</div></div>`;
}
function assignmentRow(a){ const course = state.courses.find(c => c.id === a.courseId) || {}; const done = completed(a.courseId); return `<div class="notice"><div class="row"><div><b>${esc(course.title || a.courseId)}</b><br><span class="small">Due ${esc(a.dueDate || 'No due date')} • ${esc(course.estimatedMinutes || '?')} min</span></div>${done ? pill('Complete','green') : `<button onclick="openCourse('${a.courseId}')">Open</button>`}</div></div>`; }
function courseCard(course, assigned=false){ if(!course) return ''; const done = completed(course.id); return `<div class="card"><div class="row"><span>${pill(course.category,'blue')} ${course.monthly ? pill('Monthly','gold') : ''}</span>${assigned ? (done ? pill('Complete','green') : pill('Assigned')) : ''}</div><h3>${esc(course.title)}</h3><p class="muted">${esc(course.department)} • ${esc(course.role)} • ${esc(course.difficulty)} • ${esc(course.estimatedMinutes)} min</p><div class="progress"><span style="width:${done ? 100 : 0}%"></span></div><br><button class="secondary" onclick="openCourse('${course.id}')">${done ? 'Review' : 'Open'}</button></div>`; }
function training(){ setPage('My Training','Required and assigned courses.'); $('view').innerHTML = `<div class="grid g2">${myAssignments().map(a => courseCard(state.courses.find(c => c.id === a.courseId), true)).join('') || '<div class="card">No training assigned yet.</div>'}</div>`; }
function library(){ setPage('Course Library','All active Cognitus Academy courses.'); $('view').innerHTML = `<div class="grid g3">${state.courses.filter(c => c.status !== 'Archived').map(c => courseCard(c)).join('')}</div>`; }
function certs(){ setPage('My Certifications','Certificates earned through Cognitus Academy.'); const rows = state.certifications.filter(c => c.employeeId === state.user.id); $('view').innerHTML = `<div class="card"><table class="table"><tr><th>Certificate</th><th>Course</th><th>Score</th><th>Issued</th><th>Status</th></tr>${rows.map(c => `<tr><td><b>${esc(c.certificateName)}</b><br><span class="small">${esc(c.id)}</span></td><td>${esc(c.courseTitle)}</td><td>${esc(c.score)}%</td><td>${esc(c.issueDate)}</td><td>${pill(c.status || 'Active', c.status === 'Revoked' ? 'red':'green')}</td></tr>`).join('') || '<tr><td colspan="5">No certifications yet.</td></tr>'}</table></div>`; }
function monthly(){ setPage('Monthly Training','Required recurring monthly training.'); const rows = state.courses.filter(c => c.monthly); $('view').innerHTML = `<div class="grid g2">${rows.map(c => courseCard(c)).join('') || '<div class="card">No monthly courses yet.</div>'}</div>`; }
function reports(){ if(!canManager()) return dashboard(); setPage('Reports','Training compliance by employee.'); const rows = state.employees.map(e => { const a = myAssignments(e); const done = a.filter(x => completed(x.courseId,e.id)).length; return {...e,total:a.length,done,pct:a.length?Math.round(done/a.length*100):0}; }); $('view').innerHTML = `<div class="card"><table class="table"><tr><th>Employee</th><th>Department</th><th>Role</th><th>Progress</th><th>Status</th></tr>${rows.map(r => `<tr><td><b>${esc(r.displayName)}</b><br><span class="small">${esc(r.id)}</span></td><td>${esc(r.department)}</td><td>${esc(r.role)}</td><td><div class="progress"><span style="width:${r.pct}%"></span></div><span class="small">${r.done}/${r.total}</span></td><td>${r.pct===100?pill('Complete','green'):pill('In Progress')}</td></tr>`).join('')}</table></div>`; }
function admin(){ if(!canAdmin()) return dashboard(); setPage('Administration','Owner and executive controls.'); $('view').innerHTML = `<div class="grid g3"><div class="card"><div class="stat">${state.employees.length}</div><b>Employees</b></div><div class="card"><div class="stat">${state.courses.length}</div><b>Courses</b></div><div class="card"><div class="stat">${state.certifications.length}</div><b>Certificates Issued</b></div></div><div class="grid g2" style="margin-top:16px"><button class="card" onclick="go('staff')"><h3>Staff Management</h3><p>Add staff and manage role placement.</p></button><button class="card" onclick="go('builder')"><h3>Course Builder</h3><p>Create lessons, exams, and certificates.</p></button><button class="card" onclick="go('assign')"><h3>Assignment Center</h3><p>Assign by employee, department, role, or everyone.</p></button><button class="card" onclick="seedAgain()"><h3>Seed Premade Courses</h3><p>Restore the premade Cognitus library.</p></button></div>`; }
function staff(){ if(!canAdmin()) return dashboard(); setPage('Staff','Create and manage LMS staff accounts.','<button onclick="staffForm()">Add Staff</button>'); $('view').innerHTML = `<div class="card"><table class="table"><tr><th>Employee</th><th>Discord</th><th>Department</th><th>Role</th><th>Status</th></tr>${state.employees.map(e => `<tr><td><b>${esc(e.displayName)}</b><br><span class="small">${esc(e.id)}</span></td><td>${esc(e.discordUsername)}<br><span class="small">${esc(e.discordId)}</span></td><td>${esc(e.department)}</td><td>${esc(e.role)}</td><td>${pill(e.status, e.status==='Active'?'green':'gold')}</td></tr>`).join('')}</table></div>`; }
function builder(){ if(!canAdmin()) return dashboard(); setPage('Course Builder','Create document-based training and certification courses.','<button onclick="courseForm()">New Course</button>'); $('view').innerHTML = `<div class="card"><table class="table"><tr><th>Course</th><th>Department</th><th>Role</th><th>Passing</th><th>Monthly</th><th></th></tr>${state.courses.map(c => `<tr><td><b>${esc(c.title)}</b><br><span class="small">${esc(c.id)}</span></td><td>${esc(c.department)}</td><td>${esc(c.role)}</td><td>${esc(c.passingScore)}%</td><td>${c.monthly?'Yes':'No'}</td><td><button class="secondary" onclick="courseForm('${c.id}')">Edit</button></td></tr>`).join('')}</table></div>`; }
function assign(){ if(!canAdmin()) return dashboard(); setPage('Assignment Center','Assign courses by employee, department, role, or everyone.','<button onclick="assignForm()">Assign Course</button>'); $('view').innerHTML = `<div class="card"><table class="table"><tr><th>Course</th><th>Target</th><th>Due</th><th>Required</th></tr>${state.assignments.map(a => { const course = state.courses.find(c => c.id === a.courseId) || {}; return `<tr><td>${esc(course.title || a.courseId)}</td><td>${esc(a.targetLabel || a.employeeId || a.target)}</td><td>${esc(a.dueDate || '')}</td><td>${a.required?'Yes':'No'}</td></tr>`; }).join('') || '<tr><td colspan="4">No assignments yet.</td></tr>'}</table></div>`; }
window.go = r => { state.route = r; renderShell(); render(); };
window.seedAgain = async () => { await seedCourses(); await audit('SEED','Premade course library seeded.'); await loadAll(); render(); };
window.staffForm = () => showModal(`<h2>Add Staff</h2><div class="grid g2"><label class="field">Display Name<input id="sfName"></label><label class="field">Employee ID<input id="sfId" value="${uid('EMP')}"></label><label class="field">Discord Username<input id="sfUser"></label><label class="field">Discord User ID<input id="sfDiscord"></label><label class="field">Department<select id="sfDept">${departments.map(d=>`<option>${d}</option>`).join('')}</select></label><label class="field">Role<select id="sfRole">${roles.map(r=>`<option>${r}</option>`).join('')}</select></label><label class="field">Supervisor<input id="sfSup"></label><label class="field">Hire Date<input id="sfHire" type="date" value="${today()}"></label></div><button onclick="saveStaff()">Create Staff</button> <button class="secondary" onclick="closeModal()">Cancel</button>`);
window.saveStaff = async () => { const id=$('sfId').value.trim(); if(!id || !$('sfUser').value.trim() || !$('sfDiscord').value.trim()) return alert('Employee ID, username, and Discord ID are required.'); await setDoc(doc(db,'employees',id), { displayName:$('sfName').value.trim(), discordUsername:$('sfUser').value.trim(), discordId:$('sfDiscord').value.trim(), department:$('sfDept').value, role:$('sfRole').value, supervisor:$('sfSup').value.trim(), hireDate:$('sfHire').value, status:'Awaiting PIN Setup', permissionLevel:'Employee', createdAt:serverTimestamp(), updatedAt:serverTimestamp() }); await audit('CREATE_STAFF',`Created ${id}`); closeModal(); await loadAll(); render(); };
window.courseForm = id => { const c = state.courses.find(x => x.id === id) || { id: uid('COURSE'), title:'', category:'Custom', department:'All', role:'All', difficulty:'Beginner', estimatedMinutes:30, passingScore:80, certificateName:'', required:false, monthly:false, lessons:[{title:'Lesson 1', body:''}], questions:[{type:'mc', prompt:'', options:['','','',''], answer:''}] }; showModal(`<h2>${id?'Edit':'New'} Course</h2><div class="grid g2"><label class="field">Course ID<input id="cfId" value="${esc(c.id)}" ${id?'readonly':''}></label><label class="field">Title<input id="cfTitle" value="${esc(c.title)}"></label><label class="field">Category<input id="cfCat" value="${esc(c.category)}"></label><label class="field">Department<select id="cfDept"><option>All</option>${departments.map(d=>`<option ${c.department===d?'selected':''}>${d}</option>`).join('')}</select></label><label class="field">Role<select id="cfRole"><option>All</option>${roles.map(r=>`<option ${c.role===r?'selected':''}>${r}</option>`).join('')}</select></label><label class="field">Difficulty<select id="cfDiff">${['Beginner','Intermediate','Advanced','Executive'].map(d=>`<option ${c.difficulty===d?'selected':''}>${d}</option>`).join('')}</select></label><label class="field">Estimated Minutes<input id="cfMin" type="number" value="${esc(c.estimatedMinutes)}"></label><label class="field">Passing Score<input id="cfPass" type="number" value="${esc(c.passingScore)}"></label><label class="field">Certificate Name<input id="cfCert" value="${esc(c.certificateName)}"></label><label class="field">Required<select id="cfReq"><option ${c.required?'selected':''}>Yes</option><option ${!c.required?'selected':''}>No</option></select></label><label class="field">Monthly<select id="cfMonthly"><option ${c.monthly?'selected':''}>Yes</option><option ${!c.monthly?'selected':''}>No</option></select></label></div><label class="field">Lessons JSON<textarea id="cfLessons">${esc(JSON.stringify(c.lessons || [], null, 2))}</textarea></label><label class="field">Questions JSON<textarea id="cfQuestions">${esc(JSON.stringify(c.questions || [], null, 2))}</textarea></label><button onclick="saveCourse()">Save Course</button> <button class="secondary" onclick="closeModal()">Cancel</button>`); };
window.saveCourse = async () => { let lessons, questions; try { lessons = JSON.parse($('cfLessons').value); questions = JSON.parse($('cfQuestions').value); } catch(e) { return alert('Lessons and questions must be valid JSON.'); } const id=$('cfId').value.trim(); await setDoc(doc(db,'courses',id), { title:$('cfTitle').value.trim(), category:$('cfCat').value.trim(), department:$('cfDept').value, role:$('cfRole').value, difficulty:$('cfDiff').value, estimatedMinutes:Number($('cfMin').value), passingScore:Number($('cfPass').value), certificateName:$('cfCert').value.trim(), required:$('cfReq').value==='Yes', monthly:$('cfMonthly').value==='Yes', lessons, questions, status:'Active', createdBy:state.user.id, updatedAt:serverTimestamp() }, {merge:true}); await audit('SAVE_COURSE',`Saved ${id}`); closeModal(); await loadAll(); render(); };
window.assignForm = () => { showModal(`<h2>Assign Course</h2><label class="field">Course<select id="afCourse">${state.courses.map(c=>`<option value="${c.id}">${esc(c.title)}</option>`).join('')}</select></label><label class="field">Assignment Type<select id="afType"><option>Everyone</option><option>Employee</option><option>Department</option><option>Role</option></select></label><label class="field">Target<select id="afTarget"></select></label><label class="field">Due Date<input id="afDue" type="date"></label><label class="field">Required<select id="afReq"><option>Yes</option><option>No</option></select></label><button onclick="saveAssign()">Assign</button> <button class="secondary" onclick="closeModal()">Cancel</button>`); const fill=()=>{ const t=$('afType').value; let opts=['Everyone']; if(t==='Employee') opts=state.employees.map(e=>`${e.id}|${e.displayName}`); if(t==='Department') opts=departments; if(t==='Role') opts=roles; $('afTarget').innerHTML = opts.map(o=>`<option>${esc(o)}</option>`).join(''); }; $('afType').onchange=fill; fill(); };
window.saveAssign = async () => { const type=$('afType').value, raw=$('afTarget').value; let target='Everyone', employeeId='', label='Everyone'; if(type==='Employee'){ employeeId=raw.split('|')[0]; label=raw.split('|')[1]; target='Employee'; } else if(type!=='Everyone'){ target=raw; label=raw; } await addDoc(collection(db,'assignments'), { courseId:$('afCourse').value, type, target, employeeId, targetLabel:label, dueDate:$('afDue').value, required:$('afReq').value==='Yes', assignedBy:state.user.id, assignedAt:serverTimestamp() }); await audit('ASSIGN_COURSE',`Assigned ${$('afCourse').value} to ${label}`); closeModal(); await loadAll(); render(); };
window.openCourse = id => { const course=state.courses.find(c=>c.id===id); if(!course) return; const lessons=(course.lessons||[]).map((l,i)=>`<div class="card"><h3>Lesson ${i+1}: ${esc(l.title)}</h3><div class="lesson">${esc(l.body)}</div></div>`).join(''); const questions=(course.questions||[]).map((q,i)=>`<div class="question"><b>${i+1}. ${esc(q.prompt)}</b>${(q.type==='tf'?['True','False']:(q.options||[])).map(o=>`<label class="answer"><input type="radio" name="q${i}" value="${esc(o)}"> ${esc(o)}</label>`).join('')}</div>`).join(''); showModal(`<h2>${esc(course.title)}</h2><p class="muted">${esc(course.department)} • ${esc(course.difficulty)} • Passing score ${esc(course.passingScore)}%</p>${lessons}<div class="card"><h3>Final Knowledge Check</h3>${questions}<label class="answer"><input id="ack" type="checkbox"> I certify I have read and understand this course material.</label><button onclick="submitCourse('${course.id}')">Submit Course</button> <button class="secondary" onclick="closeModal()">Close</button></div>`); };
window.submitCourse = async id => { const course=state.courses.find(c=>c.id===id); if(!$('ack').checked) return alert('You must acknowledge the course material.'); let correct=0, total=(course.questions||[]).length; (course.questions||[]).forEach((q,i)=>{ const chosen=document.querySelector(`input[name="q${i}"]:checked`)?.value; if(String(chosen).trim() === String(q.answer).trim()) correct++; }); const score = total ? Math.round(correct/total*100) : 100; const passed = score >= Number(course.passingScore || 80); await addDoc(collection(db,'attempts'), {employeeId:state.user.id, courseId:id, score, passed, correct, total, at:serverTimestamp()}); if(passed){ await setDoc(doc(db,'progress',`${state.user.id}_${id}`), {employeeId:state.user.id, courseId:id, courseTitle:course.title, completedAt:today(), score, status:'Complete'}, {merge:true}); const certId=uid('CERT'); await setDoc(doc(db,'certifications',certId), {employeeId:state.user.id, courseId:id, courseTitle:course.title, certificateName:course.certificateName || `${course.title} Completion`, score, issueDate:today(), status:'Active'}); await audit('COURSE_COMPLETE',`${state.user.id} completed ${id} with ${score}%`); alert(`Passed with ${score}%. Certificate issued.`); } else alert(`Score: ${score}%. Passing score is ${course.passingScore}%. Please review and try again.`); closeModal(); await loadAll(); render(); };
function showModal(html){ $('modalContent').innerHTML=html; $('modal').classList.remove('hidden'); }
window.closeModal = () => $('modal').classList.add('hidden');
init();
