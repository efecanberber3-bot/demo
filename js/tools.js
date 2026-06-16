(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const num = (id) => Number($(id)?.value);
  const round = (v, d = 0) => Number(v).toLocaleString("tr-TR", {maximumFractionDigits:d, minimumFractionDigits:d});
  const valid = (...values) => values.every(v => Number.isFinite(v) && v > 0);
  const show = (id, headline, body) => { $(id).innerHTML = `<strong>${headline}</strong>${body}`; $(id).classList.add("has-result"); };
  const error = (id, message="Lütfen geçerli değerler gir.") => show(id, "Kontrol et", `<p>${message}</p>`);
  const bmr = (sex, age, height, weight) => 10*weight + 6.25*height - 5*age + (sex === "male" ? 5 : -161);

  $("bmi-form")?.addEventListener("submit", e => {
    e.preventDefault(); const w=num("bmi-weight"), h=num("bmi-height")/100;
    if(!valid(w,h)) return error("bmi-result");
    const bmi=w/(h*h); let label="Obez", note="Sağlık profesyoneliyle kapsamlı değerlendirme düşün.";
    if(bmi<18.5){label="Zayıf";note="Kilo ve kas kazanımı açısından değerlendirme gerekebilir."}
    else if(bmi<25){label="Normal aralık";note="Vücut kompozisyonu için bel çevresi ve yağ oranını da izle."}
    else if(bmi<30){label="Fazla kilolu aralık";note="Kas kütlesi yüksek kişilerde VKİ yanıltıcı olabilir."}
    show("bmi-result", `${round(bmi,1)} VKİ · ${label}`, `<p>${note}</p><div class="result-meter"><span style="width:${Math.min(100, Math.max(8,(bmi/40)*100))}%"></span></div>`);
  });

  $("calorie-form")?.addEventListener("submit", e => {
    e.preventDefault(); const sex=$("cal-sex").value, age=num("cal-age"), h=num("cal-height"), w=num("cal-weight"), act=num("cal-activity"), adj=num("cal-goal");
    if(!valid(age,h,w,act)) return error("calorie-result");
    const base=bmr(sex,age,h,w), tdee=base*act, target=tdee+adj;
    show("calorie-result", `${round(target)} kcal hedef`, `<div class="result-stats"><span><small>BMR</small>${round(base)}</span><span><small>Koruma</small>${round(tdee)}</span><span><small>Hedef</small>${round(target)}</span></div><p>2–3 haftalık kilo ortalamasına göre 100–150 kcal ayarlama yap.</p>`);
  });

  $("tdee-form")?.addEventListener("submit", e => {
    e.preventDefault(); const sex=$("tdee-sex").value, age=num("tdee-age"), h=num("tdee-height"), w=num("tdee-weight"), act=num("tdee-activity");
    if(!valid(age,h,w,act)) return error("tdee-result");
    const base=bmr(sex,age,h,w), t=base*act;
    show("tdee-result", `${round(t)} kcal TDEE`, `<div class="result-stats"><span><small>Yağ yakımı</small>${round(t-500)}</span><span><small>Koruma</small>${round(t)}</span><span><small>Kas</small>${round(t+300)}</span></div><p>Aktivite seçimini gerçek günlük hareket düzeyine göre yap.</p>`);
  });

  $("macro-form")?.addEventListener("submit", e => {
    e.preventDefault(); const cal=num("macro-calories"), w=num("macro-weight"), mode=$("macro-mode").value;
    if(!valid(cal,w)) return error("macro-result");
    let protein, fat, carbs;
    if(mode === "high-protein"){ protein=w*2.2; fat=(cal*.25)/9; carbs=(cal-protein*4-fat*9)/4; }
    else if(mode === "low-carb"){ protein=w*2; carbs=(cal*.20)/4; fat=(cal-protein*4-carbs*4)/9; }
    else { protein=w*1.8; fat=(cal*.27)/9; carbs=(cal-protein*4-fat*9)/4; }
    if(carbs < 0 || fat < 0) return error("macro-result", "Kalori hedefi bu kilo ve dağılım için fazla düşük. Kalorini artır veya farklı dağılım seç.");
    show("macro-result", `${round(protein)}g protein`, `<div class="macro-bars"><div><span>Protein</span><b>${round(protein)}g</b></div><div><span>Karbonhidrat</span><b>${round(carbs)}g</b></div><div><span>Yağ</span><b>${round(fat)}g</b></div></div><p>Gramlar yaklaşık değerdir; toplam kaloriye yuvarlama farkı yansıyabilir.</p>`);
  });

  $("ideal-form")?.addEventListener("submit", e => {
    e.preventDefault(); const sex=$("ideal-sex").value, cm=num("ideal-height"); if(!valid(cm)) return error("ideal-result");
    const extra=cm/2.54-60;
    const vals = sex === "male" ? [50+2.3*extra,52+1.9*extra,56.2+1.41*extra,48+2.7*extra] : [45.5+2.3*extra,49+1.7*extra,53.1+1.36*extra,45.5+2.2*extra];
    const avg=vals.reduce((a,b)=>a+b,0)/vals.length, min=Math.min(...vals), max=Math.max(...vals);
    show("ideal-result", `${round(avg,1)} kg ortalama`, `<div class="result-stats"><span><small>Alt tahmin</small>${round(min,1)}</span><span><small>Ortalama</small>${round(avg,1)}</span><span><small>Üst tahmin</small>${round(max,1)}</span></div><p>Kas kütlesi ve kemik yapısı bu aralığı değiştirebilir.</p>`);
  });

  const hipField=$("hip-field"); $("fat-sex")?.addEventListener("change",()=>{ hipField?.classList.toggle("field-disabled", $("fat-sex").value!=="female"); });
  $("fat-form")?.addEventListener("submit", e => {
    e.preventDefault(); const sex=$("fat-sex").value, h=num("fat-height"), neck=num("fat-neck"), waist=num("fat-waist"), hip=num("fat-hip"), w=num("fat-weight");
    if(!valid(h,neck,waist,w)) return error("fat-result");
    let bf;
    if(sex==="female"){ if(!valid(hip) || waist+hip<=neck) return error("fat-result", "Kadın hesaplaması için kalça ölçüsü gereklidir."); bf=495/(1.29579-.35004*Math.log10(waist+hip-neck)+.221*Math.log10(h))-450; }
    else { if(waist<=neck) return error("fat-result", "Bel ölçüsü boyun ölçüsünden büyük olmalıdır."); bf=495/(1.0324-.19077*Math.log10(waist-neck)+.15456*Math.log10(h))-450; }
    bf=Math.max(2,Math.min(65,bf)); const lean=w*(1-bf/100); let cat;
    if(sex==="male") cat=bf<6?"Çok düşük":bf<14?"Atletik":bf<18?"Fitness":bf<25?"Ortalama":"Yüksek";
    else cat=bf<14?"Çok düşük":bf<21?"Atletik":bf<25?"Fitness":bf<32?"Ortalama":"Yüksek";
    show("fat-result", `%${round(bf,1)} · ${cat}`, `<div class="result-stats"><span><small>Yağ kütlesi</small>${round(w-lean,1)} kg</span><span><small>Yağsız kütle</small>${round(lean,1)} kg</span></div><p>Mezura yöntemi genellikle birkaç puan sapabilir; trendi aynı koşullarda izle.</p>`);
  });

  $("rm-form")?.addEventListener("submit", e => {
    e.preventDefault(); const w=num("rm-weight"), reps=num("rm-reps"); if(!valid(w,reps)||reps>15) return error("rm-result");
    const epley=w*(1+reps/30), brzycki=reps===1?w:w*(36/(37-reps)), avg=(epley+brzycki)/2;
    const rows=[95,90,85,80,75,70,65].map(p=>`<span><small>%${p}</small>${round(avg*p/100,1)} kg</span>`).join("");
    show("rm-result", `${round(avg,1)} kg tahmini 1RM`, `<div class="percentage-grid">${rows}</div><p>Gerçek maksimal deneme yerine güvenli yük planlaması için kullan.</p>`);
  });

  $("water-form")?.addEventListener("submit", e => {
    e.preventDefault(); const w=num("water-weight"), minutes=Number($("water-workout").value||0), climate=num("water-climate")||0; if(!valid(w)) return error("water-result");
    const ml=w*35+minutes*12+climate, liters=ml/1000;
    show("water-result", `${round(liters,1)} litre / gün`, `<div class="result-stats"><span><small>Temel</small>${round(w*35/1000,1)} L</span><span><small>Egzersiz ek</small>${round(minutes*12/1000,1)} L</span><span><small>Yaklaşık bardak</small>${Math.round(ml/250)}</span></div><p>Terleme, tuz alımı ve sağlık durumuna göre ihtiyaç değişebilir.</p>`);
  });

  $("heart-form")?.addEventListener("submit", e => {
    e.preventDefault(); const age=num("heart-age"), rest=Number($("heart-rest").value||0); if(!valid(age)) return error("heart-result");
    const max=208-.7*age, ranges=[[50,60,"Isınma"],[60,70,"Yağ kullanımı"],[70,80,"Aerobik"],[80,90,"Eşik"],[90,100,"Maksimum"]];
    const calc=(pct)=>rest>0?rest+(max-rest)*(pct/100):max*(pct/100);
    const html=ranges.map(([a,b,label],i)=>`<div class="zone-row"><i>Z${i+1}</i><span>${label}</span><b>${Math.round(calc(a))}–${Math.round(calc(b))}</b></div>`).join("");
    show("heart-result", `${Math.round(max)} bpm tahmini maksimum`, `<div class="zone-list">${html}</div><p>${rest>0?"Karvonen yöntemi kullanıldı.":"Maksimum nabız yüzdesi kullanıldı."}</p>`);
  });

  $("protein-form")?.addEventListener("submit", e => {
    e.preventDefault(); const w=num("protein-weight"), goal=$("protein-goal").value; if(!valid(w)) return error("protein-result");
    const map={general:[.8,1],active:[1.2,1.6],muscle:[1.6,2.2],"fat-loss":[1.8,2.4],endurance:[1.4,1.8]}, [lo,hi]=map[goal];
    show("protein-result", `${round(w*lo)}–${round(w*hi)} g / gün`, `<div class="result-stats"><span><small>Alt hedef</small>${round(w*lo)}g</span><span><small>Orta hedef</small>${round(w*(lo+hi)/2)}g</span><span><small>Üst hedef</small>${round(w*hi)}g</span></div><p>Günlük toplamı 3–5 öğüne dengeli dağıtmak pratik olabilir.</p>`);
  });

  $("rest-form")?.addEventListener("submit", e => {
    e.preventDefault(); const goal=$("rest-goal").value, type=$("rest-exercise").value, rpe=num("rest-rpe");
    const base={strength:type==="compound"?[180,300]:[120,180],hypertrophy:type==="compound"?[90,150]:[60,90],endurance:type==="compound"?[45,75]:[30,60],power:[180,300],circuit:[20,45]}[goal];
    let [lo,hi]=base; if(rpe>=9){lo+=30;hi+=45}else if(rpe<=7){lo=Math.max(20,lo-15);hi=Math.max(30,hi-15)};
    const format=s=>s>=120?`${round(s/60,1)} dk`:`${s} sn`;
    show("rest-result", `${format(lo)} – ${format(hi)}`, `<p>Bir sonraki sette teknik veya tekrar sayısı düşüyorsa üst sınıra yaklaş. İzolasyon hareketlerinde alt sınır çoğu zaman yeterlidir.</p>`);
  });

  const search=$("tool-search"), cards=[...document.querySelectorAll(".calculator-card")], count=$("tool-count");
  search?.addEventListener("input",()=>{const q=search.value.toLocaleLowerCase("tr").trim();let visible=0;cards.forEach(card=>{const showCard=!q||card.dataset.tool.toLocaleLowerCase("tr").includes(q)||card.textContent.toLocaleLowerCase("tr").includes(q);card.hidden=!showCard;if(showCard)visible++;});count.textContent=`${visible} araç`;});
})();