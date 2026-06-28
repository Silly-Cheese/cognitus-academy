const q = (prompt, options, answer) => ({ type: 'mc', prompt, options, answer });
const tf = (prompt, answer) => ({ type: 'tf', prompt, answer });
const c = (id, title, category, department, role, difficulty, estimatedMinutes, passingScore, certificateName, required, monthly, lessons, questions) => ({
  id, title, category, department, role, difficulty, estimatedMinutes, passingScore, certificateName, required, monthly,
  status: 'Active',
  lessons: lessons.map(([title, body]) => ({ title, body })),
  questions
});

export const departments = ['Executive','Management','Finance','Customer Support','Public Relations','Human Resources'];
export const roles = ['Owner','Executive','Board of Directors','Chief Human Resources Officer','Chief Finance Officer','Chief Public Relations Officer','Chief Customer Support Officer','Director Practicum','Division Lead','Division Co-Lead','Management Intern','FC Supervisor','Transfer Officer','Financial Auditor','CS Supervisor','Customer Support Officer','PR Supervisor','Event Coordinator','Partnership Coordinator','HR Supervisor','Discipline Officer','Case Officer','Hiring Officer','Onboarding Specialist','Employee'];

export const premadeCourses = [
  c('COURSE-ORIENTATION','Cognitus Orientation','Company','All','All','Beginner',25,80,'Certified Cognitus Employee',true,false,[
    ['Welcome to Cognitus Solutions','Cognitus Solutions operates through structure, professionalism, accountability, and trust. Every staff member represents Cognitus through words, decisions, and records. This course establishes the baseline expectation for all employees.'],
    ['Professional Identity','Your Discord username and Discord User ID verify your internal identity. Your Employee ID connects records across Cognitus systems. Do not share your security PIN.'],
    ['Core Expectations','Follow the chain of command, complete training on time, protect internal information, avoid favoritism, document major actions, and ask for clarification when policy is unclear.']
  ],[
    q('What is the purpose of Cognitus Academy?',['Payroll only','Training, certification, and compliance','Public advertising','Game moderation only'],'Training, certification, and compliance'),
    q('Which identifier connects records across Cognitus systems?',['PIN','Employee ID','Favorite color','Nickname'],'Employee ID'),
    tf('Employees should complete required training on time.','True')
  ]),
  c('COURSE-CONDUCT','Code of Conduct','Company','All','All','Beginner',30,85,'Code of Conduct Acknowledgement',true,false,[
    ['Conduct Standard','The conduct standard protects employees, applicants, customers, and the reputation of Cognitus Solutions. Staff are expected to remain respectful, honest, professional, and accountable while acting in any official capacity.'],
    ['Conflicts and Escalation','Misconduct, abuse of power, harassment, retaliation, fraud, or serious policy violations should be escalated to the correct supervisor, Human Resources, or Internal Affairs process.'],
    ['Documentation','Important actions should be documented. Decisions that affect another person should not exist only in memory or informal chat.']
  ],[
    q('Which issue should be escalated?',['A typo','A serious abuse of authority concern','A normal question','A harmless greeting'],'A serious abuse of authority concern'),
    tf('Major employment decisions should be documented.','True'),
    q('The expected conduct style is...',['Respectful and accountable','Aggressive','Secretive','Unrecorded'],'Respectful and accountable')
  ]),
  c('COURSE-DISCORD-PRO','Discord Professionalism','Company','All','All','Beginner',20,80,'Discord Professionalism Certificate',true,false,[
    ['Professional Communication','Discord is fast, but Cognitus communication should still be professional. Use complete thoughts, avoid drama, and remember that messages may become records.'],
    ['Public vs Internal Channels','Public channels should be polished. Internal channels may be more direct, but they still require respect and confidentiality.']
  ],[tf('Internal channels still require professionalism.','True'), q('Official channels should avoid...',['Clear updates','Respectful answers','Drama and disrespect','Proper documentation'],'Drama and disrespect')]),
  c('COURSE-PRIVACY','Confidentiality & Privacy','Compliance','All','All','Intermediate',30,90,'Confidentiality & Privacy Certification',true,false,[
    ['Protecting Information','Internal information includes employee records, applications, training results, finance records, case materials, and unreleased plans. Access does not equal permission to share.'],
    ['Minimum Necessary Access','Employees should only access information needed for their role. When unsure, ask a supervisor before viewing or sharing.']
  ],[q('Which is internal information?',['Published slogan','Private training records','Public website header','A public announcement'],'Private training records'), tf('Access automatically means you can share information anywhere.','False')]),
  c('COURSE-HR-BASICS','Human Resources Basics','Department','Human Resources','All','Beginner',35,85,'HR Basics Certificate',false,false,[
    ['Purpose of HR','Human Resources protects staffing quality, onboarding, documentation, discipline processes, and fairness. HR should be consistent, confidential, and record-focused.'],
    ['HR Records','HR records should be factual, clear, and useful. They should not be emotional, vague, or public.']
  ],[q('HR records should be...',['Factual and clear','Emotional and vague','Public','Deleted quickly'],'Factual and clear'), tf('HR should protect fairness and documentation.','True')]),
  c('COURSE-FINANCE-BASICS','Finance Basics','Department','Finance','All','Beginner',35,85,'Finance Basics Certificate',false,false,[
    ['Finance Purpose','Finance handles logs, payroll-related requests, transfers, audits, and financial integrity. The LMS does not store Payroll IDs or pay rates. Those belong in the Finance Portal.'],
    ['Approval Discipline','Financial actions should be recorded, traceable, and approved according to authority. Incomplete or unclear requests should be returned for correction.']
  ],[q('Where should Payroll IDs be stored?',['Cognitus Academy','Finance Portal','Public Discord','Nowhere'],'Finance Portal'), tf('Finance actions should be traceable.','True')]),
  c('COURSE-CS-BASICS','Customer Support Basics','Department','Customer Support','All','Beginner',30,80,'Customer Support Basics Certificate',false,false,[
    ['Support Standard','Customer Support should be patient, clear, and solution-focused. Representatives should acknowledge the concern, gather details, explain next steps, and escalate when appropriate.'],
    ['Tone','The correct support tone is calm, professional, and helpful even when the customer is frustrated.']
  ],[q('What is the best support tone?',['Calm and helpful','Sarcastic','Dismissive','Angry'],'Calm and helpful')]),
  c('COURSE-PR-BASICS','Public Relations Basics','Department','Public Relations','All','Beginner',30,80,'Public Relations Basics Certificate',false,false,[
    ['PR Purpose','Public Relations protects the public image of Cognitus, manages partnerships, supports events, and ensures external messages are accurate and professional.'],
    ['Partnership Conduct','Partnership work requires respect, clarity, documentation, and careful representation of Cognitus standards.']
  ],[tf('Public Relations staff represent Cognitus publicly.','True')]),
  c('COURSE-MANAGEMENT','Management Basics','Leadership','Management','All','Intermediate',40,85,'Management Basics Certificate',false,false,[
    ['Leading with Records','Managers should lead through clarity, fairness, and documentation. Managers should not rely on hidden expectations or inconsistent enforcement.'],
    ['Coaching and Accountability','Good management balances support with accountability. Employees should know what is expected, what they did well, and what needs improvement.']
  ],[q('Strong management requires...',['Clarity and fairness','Favoritism','No documentation','Confusion'],'Clarity and fairness')]),
  c('COURSE-LEADERSHIP-I','Leadership I','Leadership','All','Supervisor+','Intermediate',45,88,'Leadership I Certification',false,false,[
    ['Authority and Service','Leadership in Cognitus is not just access or title. Leadership means serving the organization, protecting standards, and making decisions that can be explained and reviewed.'],
    ['Promotion Readiness','Before promotion, staff should show training completion, good communication, reliable activity, and readiness for more responsibility.']
  ],[tf('Leadership authority should be explainable and reviewable.','True')]),
  c('CERT-HIRING-OFFICER','Hiring Officer Certification','Certification','Human Resources','Hiring Officer','Advanced',55,90,'Certified Hiring Officer',false,false,[
    ['Hiring Responsibility','Hiring Officers review applicants with fairness, consistency, and confidentiality. The goal is not just filling positions, but protecting the quality of Cognitus staff.'],
    ['Application Review','A strong review considers eligibility, completeness, communication quality, role fit, and possible red flags. Decisions should be documented with useful reasoning.'],
    ['Interview Standard','Interviews should be consistent, respectful, and focused on role requirements. Avoid irrelevant, overly personal, or unfair questions.']
  ],[q('A hiring decision should include...',['Useful documentation','No explanation','Personal bias','Only speed'],'Useful documentation'), tf('Hiring Officers should keep applicant information confidential.','True')]),
  c('CERT-FINANCIAL-AUDITOR','Financial Auditor Certification','Certification','Finance','Financial Auditor','Advanced',55,90,'Certified Financial Auditor',false,false,[
    ['Audit Purpose','Financial auditing checks whether records are complete, accurate, approved, and consistent with Cognitus policy.'],
    ['Finding Issues','Auditors should look for missing approvals, duplicate records, suspicious changes, math errors, unclear notes, and actions outside authority.'],
    ['Reporting','Audit reports should be factual, organized, and tied to evidence. Reports should include findings, impact, and recommended corrective actions.']
  ],[q('Which is a common audit issue?',['Missing approval','Clear records','Proper notes','Correct math'],'Missing approval'), tf('Audit reports should be evidence-based.','True')]),
  c('CERT-DISCIPLINE-OFFICER','Discipline Officer Certification','Certification','Human Resources','Discipline Officer','Advanced',55,90,'Certified Discipline Officer',false,false,[
    ['Purpose of Discipline','Discipline should correct behavior, protect standards, and document accountability. It should not be used for revenge, embarrassment, or favoritism.'],
    ['Progressive Discipline','Depending on severity, responses may include coaching, verbal warning, written warning, suspension, probation, termination recommendation, or referral to Internal Affairs.'],
    ['Due Process','Employees should be treated fairly. Serious action should be supported by facts, records, and a chance for appropriate review.']
  ],[q('Discipline should be used for...',['Correction and accountability','Revenge','Embarrassment','Favoritism'],'Correction and accountability'), tf('Serious discipline should be supported by records.','True')]),
  c('CERT-ONBOARDING-SPECIALIST','Onboarding Specialist Certification','Certification','Human Resources','Onboarding Specialist','Intermediate',45,88,'Certified Onboarding Specialist',false,false,[
    ['Onboarding Purpose','Onboarding helps new staff become confident, trained, and connected to the right expectations. It should be structured, welcoming, and documented.'],
    ['New Hire Checklist','Onboarding should verify identity information, department placement, assigned trainings, policy acknowledgements, supervisor assignment, and first tasks.']
  ],[q('Onboarding should assign...',['Required training','Random punishment','Unclear tasks','Public records'],'Required training')]),
  c('MONTHLY-COMPLIANCE','Monthly Compliance Refresher','Monthly','All','All','Beginner',15,80,'Monthly Compliance Completion',true,true,[
    ['Monthly Compliance Reminder','Every month, staff should review core expectations: protect internal information, document important actions, communicate professionally, and complete assignments on time.'],
    ['Scenario Practice','If a situation is unclear or sensitive, pause and escalate rather than guessing. Accurate escalation prevents larger problems.']
  ],[tf('Monthly trainings help keep staff aligned with standards.','True'), q('When a sensitive situation is unclear, you should...',['Guess','Escalate appropriately','Ignore it','Share it publicly'],'Escalate appropriately')])
];
