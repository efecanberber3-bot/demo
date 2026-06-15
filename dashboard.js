(() => {
  let auth, profile, logs = [], measurements = [], program = null, messages = [];
  const $ = id => document.getElementById(id);
  const num = (id, fallback = 0) => { const v = parseFloat($(id).value); return Number.isFinite(v) ? v : fallback; };
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const initials = name => String(name || '?').split(/\s+/).slice(0,2).map(x => x[0]).join('').toUpperCase();
  const today = () => new Date().toISOString().slice(0,10);

  function setupUI() {
    document.querySelectorAll('[data-open]').forEach(btn => btn.addEventListener('click', () => $(btn.dataset.open)?.classList.add('open')));
    document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => btn.closest('.modal')?.classList.remove('open')));
    document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); }));
    $('sidebar-toggle').addEventListener('click', () => $('sidebar').classList.toggle('open'));
    $('logout-btn').addEventListener('click', Bercant.signOut);
    $('log-date').value = today(); $('measurement-date').value = today(); $('photo-date').value = today();
    if (Bercant.demoMode) $('demo-banner').classList.remove('hidden');
  }

  async function fetchData() {
    if (Bercant.demoMode) {
      logs = Bercant.demo.read(Bercant.demo.keys.logs).filter(x => x.user_id === profile.id).sort((a,b) => b.log_date.localeCompare(a.log_date));
      measurements = Bercant.demo.read(Bercant.demo.keys.measurements).filter(x => x.user_id === profile.id).sort((a,b) => a.measured_at.localeCompare(b.measured_at));
      messages = Bercant.demo.read(Bercant.demo.keys.messages).filter(x => x.user_id === profile.id).sort((a,b) => b.created_at.localeCompare(a.created_at));
      const assignment = Bercant.demo.read(Bercant.demo.keys.assignments).find(x => x.user_id === profile.id && x.active);
      program = assignment ? Bercant.demo.read(Bercant.demo.keys.programs).find(x => x.id === assignment.program_id) : null;
      return;
    }
    const uid = auth.session.user.id;
    const [logsRes, measurementsRes, messagesRes, assignmentRes] = await Promise.all([
      Bercant.client.from('daily_logs').select('*').eq('user_id', uid).order('log_date', { ascending:false }).limit(60),
      Bercant.client.from('measurements').select('*').eq('user_id', uid).order('measured_at', { ascending:true }).limit(52),
      Bercant.client.from('coach_messages').select('*').eq('user_id', uid).order('created_at', { ascending:false }).limit(10),
      Bercant.client.from('program_assignments').select('*,programs(*,program_days(*,exercises(*)))').eq('user_id', uid).eq('active', true).order('created_at',{ascending:false}).limit(1).maybeSingle()
    ]);
    [logsRes, measurementsRes, messagesRes, assignmentRes].forEach(r => { if (r.error) throw r.error; });
    logs = logsRes.data || []; measurements = measurementsRes.data || []; messages = messagesRes.data || [];
    program = assignmentRes.data?.programs || null;
    if (program?.program_days) program.days = program.program_days.sort((a,b)=>a.day_index-b.day_index).map(d => ({...d, exercises:(d.exercises||[]).sort((a,b)=>a.order_no-b.order_no)}));
  }

  function renderProfile() {
    const name = profile.full_name || 'Sporcu', avatar = initials(name);
    $('first-name').textContent = name.split(' ')[0]; $('sidebar-name').textContent = name; $('sidebar-avatar').textContent = avatar;
    $('sidebar-avatar').classList.toggle('female', profile.gender === 'female');
    $('sidebar-role').textContent = profile.role === 'student' ? 'Öğrenci' : profile.role;
    $('profile-name').value = name; $('profile-gender').value = profile.gender || 'unspecified'; $('profile-goal').value = profile.goal || 'recomposition';
    $('profile-height').value = profile.height_cm || ''; $('profile-target').value = profile.target_weight || '';
    const remaining = profile.membership_end ? Math.max(0, Bercant.daysBetween(today(), profile.membership_end)) : null;
    $('metric-days').textContent = remaining ?? '—';
    $('membership-copy').textContent = remaining === null ? 'Bugünkü hedeflerin seni bekliyor.' : remaining > 0 ? `Koçluk sürenin ${remaining} günü kaldı.` : 'Üyelik süren için koçunla iletişime geç.';
  }

  function calcStreak() {
    const set = new Set(logs.map(x => x.log_date)); let streak = 0; const d = new Date();
    for (;;) { const key = d.toISOString().slice(0,10); if (!set.has(key)) break; streak++; d.setDate(d.getDate()-1); }
    return streak;
  }

  function renderMetrics() {
    const latest = measurements.at(-1), first = measurements[0];
    $('metric-weight').textContent = latest?.weight_kg ?? profile.current_weight ?? '—';
    if (latest && first && latest.id !== first.id) {
      const diff = +(latest.weight_kg - first.weight_kg).toFixed(1); $('metric-weight-diff').textContent = `${diff > 0 ? '+' : ''}${diff} kg toplam değişim`; $('metric-weight-diff').className = `metric-sub ${diff <= 0 ? 'metric-down' : 'metric-up'}`;
      $('weight-trend-badge').textContent = `${diff > 0 ? '+' : ''}${diff} kg`;
    }
    const streak = calcStreak(); $('metric-streak').textContent = streak; $('streak-badge').textContent = `${streak} günlük seri`;
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate()-6); const weekKey = weekAgo.toISOString().slice(0,10);
    $('metric-workouts').textContent = logs.filter(x => x.log_date >= weekKey && x.workout_done).length;
  }

  function renderToday() {
    const log = logs.find(x => x.log_date === today()); const goals = { protein:160, water:3, steps:8000, sleep:8 };
    const vals = { workout: log?.workout_done ? 100 : 0, protein: clamp((log?.protein_g||0)/goals.protein*100,0,100), water:clamp((log?.water_l||0)/goals.water*100,0,100), steps:clamp((log?.steps||0)/goals.steps*100,0,100), sleep:clamp((log?.sleep_hours||0)/goals.sleep*100,0,100) };
    const percent = Math.round(Object.values(vals).reduce((a,b)=>a+b,0)/5);
    $('today-percent').textContent = `%${percent}`; $('today-copy').textContent = log ? 'Günün kaydı alındı' : 'Henüz kayıt girilmedi';
    ['workout','protein','water','steps','sleep'].forEach(k => $(`goal-${k}`).style.width = `${vals[k]}%`);
    $('goal-workout-text').textContent = log?.workout_done ? '✓' : '—'; $('goal-protein-text').textContent = `${log?.protein_g||0}g`; $('goal-water-text').textContent = `${log?.water_l||0}L`; $('goal-steps-text').textContent = log?.steps||0; $('goal-sleep-text').textContent = `${log?.sleep_hours||0}s`;
  }

  function renderStreak() {
    const map = new Map(logs.map(x => [x.log_date,x])); const names=['Paz','Pzt','Sal','Çar','Per','Cum','Cmt']; let html='';
    for (let i=-6;i<=0;i++) { const d=new Date(); d.setDate(d.getDate()+i); const key=d.toISOString().slice(0,10); const done=map.has(key); html += `<div class="streak-day ${done?'done':''}"><i>${done?'✓':d.getDate()}</i><span>${names[d.getDay()]}</span></div>`; }
    $('streak-row').innerHTML = html;
  }

  function renderChart() {
    const data = measurements.slice(-10); if (data.length < 2) return;
    const width=700,height=220,pad=28, vals=data.map(x=>+x.weight_kg), min=Math.min(...vals)-.5,max=Math.max(...vals)+.5, range=max-min||1;
    const pts=data.map((x,i)=>({x:pad+i*(width-pad*2)/(data.length-1),y:height-pad-(x.weight_kg-min)/range*(height-pad*2),v:x.weight_kg,d:x.measured_at}));
    const line=pts.map(p=>`${p.x},${p.y}`).join(' '); const area=`${pad},${height-pad} ${line} ${width-pad},${height-pad}`;
    const grid=[0,1,2,3].map(i=>{const y=pad+i*(height-pad*2)/3;return `<line x1="${pad}" y1="${y}" x2="${width-pad}" y2="${y}" class="chart-gridline"/>`}).join('');
    const dots=pts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="5" class="chart-dot"><title>${Bercant.formatDate(p.d)}: ${p.v} kg</title></circle>`).join('');
    $('weight-chart').innerHTML=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Kilo gelişim grafiği"><defs><linearGradient id="lineGradient"><stop stop-color="#b8ff36"/><stop offset="1" stop-color="#15f5c4"/></linearGradient><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#b8ff36" stop-opacity=".22"/><stop offset="1" stop-color="#b8ff36" stop-opacity="0"/></linearGradient></defs>${grid}<polygon points="${area}" class="chart-area"/><polyline points="${line}" class="chart-line"/>${dots}</svg>`;
  }

  function renderProgram() {
    if (!program) return;
    $('program-title').textContent = program.title; $('program-description').textContent = program.description || 'Kişiye özel program'; $('program-level').textContent = ({beginner:'Başlangıç',intermediate:'Orta',advanced:'İleri'}[program.level]||program.level||'Program');
    const days = program.days || program.program_days || [];
    $('program-days').innerHTML = days.map((d,i)=>`<details class="program-day" ${i===0?'open':''}><summary><span>${i+1}. Gün — ${d.title}</span><span class="badge neutral">${(d.exercises||[]).length} hareket</span></summary><div class="exercise-list"><div class="exercise-row exercise-head"><span>Hareket</span><span>Set</span><span>Tekrar</span><span>Dinlenme</span></div>${(d.exercises||[]).map(e=>`<div class="exercise-row"><span><strong>${e.name}</strong>${e.rir?`<div class="tiny muted">RIR ${e.rir}</div>`:''}</span><span>${e.sets}</span><span>${e.reps}</span><span>${e.rest_seconds||0} sn</span></div>`).join('')}</div></details>`).join('') || '<div class="muted small">Program günleri eklenmemiş.</div>';
  }

  function renderRecent() {
    $('recent-logs').innerHTML = logs.slice(0,5).map(l=>`<div class="detail-row"><div><strong>${Bercant.formatDate(l.log_date,{day:'2-digit',month:'long'})}</strong><div class="tiny muted">${l.split||'Günlük kayıt'} • ${l.workout_done?'Antrenman tamamlandı':'Dinlenme'}</div></div><span>${l.protein_g||0}g protein</span></div>`).join('') || '<div class="muted small">Kayıt bulunamadı.</div>';
    $('coach-message').textContent = messages[0]?.message || 'Henüz koç mesajı bulunmuyor.';
  }

  function renderAll() { renderProfile(); renderMetrics(); renderToday(); renderStreak(); renderChart(); renderProgram(); renderRecent(); }

  async function saveDaily(e) {
    e.preventDefault(); const payload = { user_id:profile.id, log_date:$('log-date').value, workout_done:$('workout-done').value==='true', split:$('split').value.trim()||null, total_sets:num('total-sets'), main_lift:$('main-lift').value.trim()||null, main_lift_kg:num('main-lift-kg',null), rpe:num('rpe',null), cardio_minutes:num('cardio',0), steps:num('steps',0), calories:num('calories',0), protein_g:num('protein',0), carbs_g:num('carbs',0), fat_g:num('fat',0), water_l:num('water',0), sleep_hours:num('sleep',0), energy:num('energy',null), mood:num('mood',null), pump:num('pump',null), notes:$('daily-notes').value.trim()||null };
    try {
      if (Bercant.demoMode) { let all=Bercant.demo.read(Bercant.demo.keys.logs); const idx=all.findIndex(x=>x.user_id===profile.id&&x.log_date===payload.log_date); const item={...payload,id:idx>=0?all[idx].id:Bercant.demo.uid(),created_at:new Date().toISOString()}; if(idx>=0) all[idx]=item; else all.push(item); Bercant.demo.write(Bercant.demo.keys.logs,all); }
      else { const {error}=await Bercant.client.from('daily_logs').upsert(payload,{onConflict:'user_id,log_date'}); if(error) throw error; }
      await fetchData(); renderAll(); $('daily-modal').classList.remove('open'); Bercant.toast('Günlük kayıt kaydedildi.');
    } catch(err){Bercant.toast(err.message,'error');}
  }

  async function saveMeasurement(e) {
    e.preventDefault(); const payload={user_id:profile.id,measured_at:$('measurement-date').value,weight_kg:num('weight-kg'),body_fat_percent:num('body-fat',null),waist_cm:num('waist-cm',null),chest_cm:num('chest-cm',null),hips_cm:num('hips-cm',null),arm_cm:num('arm-cm',null),thigh_cm:num('thigh-cm',null),notes:$('measurement-notes').value.trim()||null};
    try { if(Bercant.demoMode){let all=Bercant.demo.read(Bercant.demo.keys.measurements);const idx=all.findIndex(x=>x.user_id===profile.id&&x.measured_at===payload.measured_at);const item={...payload,id:idx>=0?all[idx].id:Bercant.demo.uid(),created_at:new Date().toISOString()};if(idx>=0)all[idx]=item;else all.push(item);Bercant.demo.write(Bercant.demo.keys.measurements,all);} else {const{error}=await Bercant.client.from('measurements').upsert(payload,{onConflict:'user_id,measured_at'});if(error)throw error;} await fetchData();renderAll();$('measurement-modal').classList.remove('open');Bercant.toast('Ölçüm kaydedildi.'); } catch(err){Bercant.toast(err.message,'error');}
  }

  async function saveProfile(e) {
    e.preventDefault(); const changes={full_name:$('profile-name').value.trim(),gender:$('profile-gender').value,goal:$('profile-goal').value,height_cm:num('profile-height',null),target_weight:num('profile-target',null)};
    try { if(Bercant.demoMode){let all=Bercant.demo.read(Bercant.demo.keys.profiles);const idx=all.findIndex(x=>x.id===profile.id);all[idx]={...all[idx],...changes};Bercant.demo.write(Bercant.demo.keys.profiles,all);profile=all[idx];const s=await Bercant.getSession();s.profile=profile;Bercant.demo.write(Bercant.demo.keys.session,s);} else {const{data,error}=await Bercant.client.from('profiles').update(changes).eq('id',profile.id).select().single();if(error)throw error;profile=data;} renderProfile();$('profile-modal').classList.remove('open');Bercant.toast('Profil güncellendi.'); } catch(err){Bercant.toast(err.message,'error');}
  }

  async function uploadPhoto(e) {
    e.preventDefault(); const file=$('progress-photo').files[0]; if(!file)return; if(file.size>5*1024*1024)return Bercant.toast('Dosya 5 MB altında olmalı.','error');
    try { if(Bercant.demoMode){const all=Bercant.demo.read(Bercant.demo.keys.photos);all.push({id:Bercant.demo.uid(),user_id:profile.id,photo_date:$('photo-date').value,view_type:$('photo-type').value,file_name:file.name,created_at:new Date().toISOString()});Bercant.demo.write(Bercant.demo.keys.photos,all);} else {const ext=file.name.split('.').pop().toLowerCase();const path=`${profile.id}/${$('photo-date').value}-${$('photo-type').value}-${crypto.randomUUID()}.${ext}`;const up=await Bercant.client.storage.from('progress-photos').upload(path,file,{contentType:file.type,upsert:false});if(up.error)throw up.error;const ins=await Bercant.client.from('progress_photos').insert({user_id:profile.id,photo_date:$('photo-date').value,view_type:$('photo-type').value,storage_path:path});if(ins.error)throw ins.error;} e.target.reset();$('photo-date').value=today();Bercant.toast('İlerleme fotoğrafı yüklendi.'); } catch(err){Bercant.toast(err.message,'error');}
  }

  async function init() {
    setupUI(); auth=await Bercant.guard(['student','coach','admin']); if(!auth)return; profile=auth.profile;
    try { await fetchData(); renderAll(); } catch(err){Bercant.toast(`Veriler yüklenemedi: ${err.message}`,'error');}
    $('daily-form').addEventListener('submit',saveDaily); $('measurement-form').addEventListener('submit',saveMeasurement); $('profile-form').addEventListener('submit',saveProfile); $('photo-form').addEventListener('submit',uploadPhoto);
  }
  init();
})();
