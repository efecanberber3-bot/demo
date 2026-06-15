(() => {
  let auth, profile, students=[], logs=[], measurements=[], programs=[], selected=null;
  const $=id=>document.getElementById(id), today=()=>new Date().toISOString().slice(0,10), initials=n=>String(n||'?').split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
  const goalNames={fat_loss:'Yağ yakımı',muscle_gain:'Kas gelişimi',recomposition:'Rekompozisyon',performance:'Performans'};
  const genderNames={male:'Erkek',female:'Kadın',unspecified:'Belirtilmemiş'};

  function setupUI(){
    $('sidebar-toggle').addEventListener('click',()=> $('sidebar').classList.toggle('open')); $('logout-btn').addEventListener('click',Bercant.signOut); $('refresh-btn').addEventListener('click',load);
    document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('.modal').classList.remove('open')));
    $('student-modal').addEventListener('click',e=>{if(e.target===$('student-modal'))$('student-modal').classList.remove('open')});
    document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('[data-panel]').forEach(x=>x.classList.toggle('active',x.dataset.panel===b.dataset.tab));}));
    ['search-filter','gender-filter','goal-filter'].forEach(id=>$(id).addEventListener(id==='search-filter'?'input':'change',renderStudents));
    $('membership-form').addEventListener('submit',saveMembership); $('assignment-form').addEventListener('submit',assignProgram); $('message-form').addEventListener('submit',sendMessage);
    $('assignment-start').value=today(); const end=new Date();end.setDate(end.getDate()+56);$('assignment-end').value=end.toISOString().slice(0,10);
    if(Bercant.demoMode)$('demo-banner').classList.remove('hidden');
  }

  async function fetchAll(){
    if(Bercant.demoMode){students=Bercant.demo.read(Bercant.demo.keys.profiles).filter(x=>x.role==='student');logs=Bercant.demo.read(Bercant.demo.keys.logs);measurements=Bercant.demo.read(Bercant.demo.keys.measurements);programs=Bercant.demo.read(Bercant.demo.keys.programs);return;}
    const [p,l,m,pr]=await Promise.all([
      Bercant.client.from('profiles').select('*').eq('role','student').order('created_at',{ascending:false}),
      Bercant.client.from('daily_logs').select('*').order('log_date',{ascending:false}).limit(3000),
      Bercant.client.from('measurements').select('*').order('measured_at',{ascending:false}).limit(1000),
      Bercant.client.from('programs').select('*').eq('is_template',true).order('title')
    ]);[p,l,m,pr].forEach(r=>{if(r.error)throw r.error});students=p.data||[];logs=l.data||[];measurements=m.data||[];programs=pr.data||[];
  }

  function lastLog(userId){return logs.filter(x=>x.user_id===userId).sort((a,b)=>b.log_date.localeCompare(a.log_date))[0]||null}
  function lastMeasurement(userId){return measurements.filter(x=>x.user_id===userId).sort((a,b)=>b.measured_at.localeCompare(a.measured_at))[0]||null}
  function daysSince(date){if(!date)return 999;return Math.floor((new Date(`${today()}T12:00:00`)-new Date(`${date}T12:00:00`))/86400000)}
  function daysUntil(date){if(!date)return 999;return Math.ceil((new Date(`${date}T12:00:00`)-new Date(`${today()}T12:00:00`))/86400000)}

  function renderStats(){
    const active=students.filter(s=>s.active!==false&&(!s.membership_end||daysUntil(s.membership_end)>=0));const todays=new Set(logs.filter(l=>l.log_date===today()).map(l=>l.user_id));
    $('stat-active').textContent=active.length;$('stat-today').textContent=[...todays].filter(id=>active.some(s=>s.id===id)).length;$('stat-male').textContent=students.filter(s=>s.gender==='male').length;$('stat-female').textContent=students.filter(s=>s.gender==='female').length;$('stat-expiring').textContent=active.filter(s=>daysUntil(s.membership_end)>=0&&daysUntil(s.membership_end)<=14).length;
    const percent=active.length?Math.round([...todays].filter(id=>active.some(s=>s.id===id)).length/active.length*100):0;$('attendance-percent').textContent=`%${percent}`;$('attendance-progress').style.width=`${percent}%`;$('attendance-copy').textContent=`${active.length} aktif öğrenciden ${Math.round(active.length*percent/100)} tanesi bugün kayıt girdi.`;
    const counts={fat_loss:0,muscle_gain:0,recomposition:0,performance:0};students.forEach(s=>{if(counts[s.goal]!==undefined)counts[s.goal]++});const max=Math.max(1,...Object.values(counts));$('goal-distribution').innerHTML=Object.entries(counts).map(([k,v])=>`<div class="goal-row"><span>${goalNames[k]}</span><div class="progress-track"><div class="progress-fill" style="width:${v/max*100}%"></div></div><strong>${v}</strong></div>`).join('');
  }

  function renderStudents(){
    const q=$('search-filter').value.toLowerCase().trim(),g=$('gender-filter').value,goal=$('goal-filter').value;const list=students.filter(s=>(!q||`${s.full_name} ${s.email}`.toLowerCase().includes(q))&&(g==='all'||s.gender===g)&&(goal==='all'||s.goal===goal));$('student-count').textContent=`${list.length} öğrenci`;
    $('students-body').innerHTML=list.map(s=>{const last=lastLog(s.id),remaining=daysUntil(s.membership_end),active=s.active!==false&&remaining>=0;return `<tr><td><div class="student-cell"><div class="avatar ${s.gender==='female'?'female':''}">${initials(s.full_name)}</div><div><strong>${s.full_name||'İsimsiz'}</strong><div class="tiny muted">${s.email||''}</div></div></div></td><td><span class="badge ${s.gender==='female'?'purple':'neutral'}">${genderNames[s.gender]||'—'}</span></td><td>${goalNames[s.goal]||'—'}</td><td>${last?Bercant.formatDate(last.log_date,{day:'2-digit',month:'short'}):'<span class="muted">Yok</span>'}</td><td><span class="badge ${active?'':'danger'}">${active?(remaining===999?'Aktif':`${remaining} gün`):'Pasif'}</span></td><td><button class="btn btn-secondary btn-sm" data-student="${s.id}">İncele</button></td></tr>`}).join('')||'<tr><td colspan="6">Filtreye uygun öğrenci bulunamadı.</td></tr>';
    document.querySelectorAll('[data-student]').forEach(b=>b.addEventListener('click',()=>openStudent(b.dataset.student)));
  }

  function renderAlerts(){
    const alerts=[];students.forEach(s=>{const last=lastLog(s.id),measure=lastMeasurement(s.id),remain=daysUntil(s.membership_end);if(daysSince(last?.log_date)>=3)alerts.push({s,text:`${daysSince(last?.log_date)} gündür günlük kayıt yok`});if(daysSince(measure?.measured_at)>=14)alerts.push({s,text:'14+ gündür ölçüm yok'});if(remain>=0&&remain<=14)alerts.push({s,text:`Üyelik ${remain} gün içinde bitiyor`});});
    $('alert-count').textContent=alerts.length;$('alerts-list').innerHTML=alerts.slice(0,10).map(a=>`<button class="detail-row" style="width:100%;background:none;border:0;color:white;text-align:left;cursor:pointer" data-alert-student="${a.s.id}"><div><strong>${a.s.full_name}</strong><div class="tiny muted">${a.text}</div></div><span>→</span></button>`).join('')||'<div class="muted small">Uyarı bulunmuyor.</div>';document.querySelectorAll('[data-alert-student]').forEach(b=>b.addEventListener('click',()=>openStudent(b.dataset.alertStudent)));
  }

  function renderAll(){renderStats();renderStudents();renderAlerts();$('program-select').innerHTML=programs.map(p=>`<option value="${p.id}">${p.title}</option>`).join('')||'<option value="">Program yok</option>'}

  async function openStudent(id){selected=students.find(s=>s.id===id);if(!selected)return;const studentLogs=logs.filter(x=>x.user_id===id).sort((a,b)=>b.log_date.localeCompare(a.log_date)),studentMeasures=measurements.filter(x=>x.user_id===id).sort((a,b)=>b.measured_at.localeCompare(a.measured_at)),latest=studentMeasures[0];
    $('student-modal-title').textContent=selected.full_name||'Öğrenci';$('detail-email').textContent=selected.email||'';$('detail-gender').textContent=genderNames[selected.gender]||'Öğrenci';$('detail-gender').className=`badge ${selected.gender==='female'?'purple':''}`;
    $('detail-profile').innerHTML=[['Hedef',goalNames[selected.goal]||'—'],['Boy',selected.height_cm?`${selected.height_cm} cm`:'—'],['Hedef kilo',selected.target_weight?`${selected.target_weight} kg`:'—'],['Başlangıç',selected.membership_start?Bercant.formatDate(selected.membership_start,{day:'2-digit',month:'long',year:'numeric'}):'—']].map(x=>`<div class="detail-row"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('');
    $('detail-status').innerHTML=[['Son kilo',latest?`${latest.weight_kg} kg`:'—'],['Son günlük kayıt',studentLogs[0]?Bercant.formatDate(studentLogs[0].log_date,{day:'2-digit',month:'long'}):'—'],['Üyelik bitiş',selected.membership_end?Bercant.formatDate(selected.membership_end,{day:'2-digit',month:'long',year:'numeric'}):'—'],['Durum',selected.active!==false?'Aktif':'Pasif']].map(x=>`<div class="detail-row"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('');
    const weekKey=new Date();weekKey.setDate(weekKey.getDate()-6);const week=studentLogs.filter(x=>x.log_date>=weekKey.toISOString().slice(0,10)),avg=k=>week.length?Math.round(week.reduce((a,b)=>a+(+b[k]||0),0)/week.length):0;$('detail-workouts').textContent=week.filter(x=>x.workout_done).length;$('detail-protein').textContent=`${avg('protein_g')}g`;$('detail-sleep').textContent=`${(week.length?week.reduce((a,b)=>a+(+b.sleep_hours||0),0)/week.length:0).toFixed(1)}s`;$('detail-steps').textContent=avg('steps').toLocaleString('tr-TR');
    $('detail-records').innerHTML=studentLogs.slice(0,20).map(l=>`<tr><td>${Bercant.formatDate(l.log_date,{day:'2-digit',month:'short'})}</td><td>${l.workout_done?'✓ '+(l.split||'Antrenman'):'Dinlenme'}</td><td>${l.protein_g||0}g</td><td>${l.water_l||0}L</td><td>${l.sleep_hours||0}s</td><td>${(l.steps||0).toLocaleString('tr-TR')}</td></tr>`).join('')||'<tr><td colspan="6">Kayıt yok.</td></tr>';
    $('membership-start').value=selected.membership_start||'';$('membership-end').value=selected.membership_end||'';$('membership-active').value=String(selected.active!==false);$('student-modal').classList.add('open');
  }

  async function saveMembership(e){e.preventDefault();if(!selected)return;const changes={membership_start:$('membership-start').value||null,membership_end:$('membership-end').value||null,active:$('membership-active').value==='true'};try{if(Bercant.demoMode){let all=Bercant.demo.read(Bercant.demo.keys.profiles);const i=all.findIndex(x=>x.id===selected.id);all[i]={...all[i],...changes};Bercant.demo.write(Bercant.demo.keys.profiles,all);}else{const{error}=await Bercant.client.from('profiles').update(changes).eq('id',selected.id);if(error)throw error;}await load(false);Bercant.toast('Üyelik güncellendi.');}catch(err){Bercant.toast(err.message,'error')}}
  async function assignProgram(e){e.preventDefault();if(!selected||!$('program-select').value)return;try{if(Bercant.demoMode){let all=Bercant.demo.read(Bercant.demo.keys.assignments);all=all.map(x=>x.user_id===selected.id?{...x,active:false}:x);all.push({id:Bercant.demo.uid(),user_id:selected.id,program_id:$('program-select').value,assigned_by:profile.id,start_date:$('assignment-start').value,end_date:$('assignment-end').value,active:true});Bercant.demo.write(Bercant.demo.keys.assignments,all);}else{let r=await Bercant.client.from('program_assignments').update({active:false}).eq('user_id',selected.id).eq('active',true);if(r.error)throw r.error;r=await Bercant.client.from('program_assignments').insert({user_id:selected.id,program_id:$('program-select').value,assigned_by:profile.id,start_date:$('assignment-start').value,end_date:$('assignment-end').value,active:true});if(r.error)throw r.error;}Bercant.toast('Program atandı.');}catch(err){Bercant.toast(err.message,'error')}}
  async function sendMessage(e){e.preventDefault();if(!selected)return;const message=$('coach-message-input').value.trim();if(!message)return;try{if(Bercant.demoMode){const all=Bercant.demo.read(Bercant.demo.keys.messages);all.push({id:Bercant.demo.uid(),user_id:selected.id,coach_id:profile.id,message,created_at:new Date().toISOString(),read_at:null});Bercant.demo.write(Bercant.demo.keys.messages,all);}else{const{error}=await Bercant.client.from('coach_messages').insert({user_id:selected.id,coach_id:profile.id,message});if(error)throw error;}e.target.reset();Bercant.toast('Mesaj öğrenci paneline gönderildi.');}catch(err){Bercant.toast(err.message,'error')}}

  async function load(close=true){try{await fetchAll();renderAll();if(close)$('student-modal').classList.remove('open');}catch(err){Bercant.toast(`Veriler yüklenemedi: ${err.message}`,'error')}}
  async function init(){setupUI();auth=await Bercant.guard(['coach','admin']);if(!auth)return;profile=auth.profile;$('sidebar-name').textContent=profile.full_name||'Koç';$('sidebar-avatar').textContent=initials(profile.full_name);$('sidebar-role').textContent=profile.role==='admin'?'Yönetici':'Koç';await load();}
  init();
})();
