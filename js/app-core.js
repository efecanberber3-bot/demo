(() => {
  "use strict";

  const cfg = window.BERCANT_CONFIG || {};
  const hasSupabaseConfig = /^https:\/\/.+\.supabase\.co$/.test(cfg.SUPABASE_URL || "") && (cfg.SUPABASE_ANON_KEY || "").length > 40;
  const demoMode = cfg.DEMO_MODE !== false || !hasSupabaseConfig;
  const client = !demoMode && window.supabase
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      })
    : null;

  const KEYS = {
    session: "bercant_demo_session",
    profiles: "bercant_demo_profiles",
    logs: "bercant_demo_logs",
    measurements: "bercant_demo_measurements",
    programs: "bercant_demo_programs",
    assignments: "bercant_demo_assignments",
    messages: "bercant_demo_messages",
    photos: "bercant_demo_photos"
  };

  const isoDate = (offset = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };

  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const read = (key, fallback = []) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  function seedDemo() {
    if (localStorage.getItem(KEYS.profiles)) return;

    const studentId = "demo-student-001";
    const femaleId = "demo-student-002";
    const adminId = "demo-admin-001";
    const programId = "program-hybrid-001";

    write(KEYS.profiles, [
      {
        id: studentId, email: "student@demo.com", full_name: "Efe Can", gender: "male", role: "student",
        goal: "recomposition", height_cm: 183, current_weight: 77.2, target_weight: 74,
        active: true, membership_start: isoDate(-35), membership_end: isoDate(55), coach_id: adminId,
        created_at: new Date().toISOString()
      },
      {
        id: femaleId, email: "ayse@demo.com", full_name: "Ayşe Demir", gender: "female", role: "student",
        goal: "fat_loss", height_cm: 168, current_weight: 64.4, target_weight: 59,
        active: true, membership_start: isoDate(-21), membership_end: isoDate(69), coach_id: adminId,
        created_at: new Date().toISOString()
      },
      {
        id: adminId, email: "admin@demo.com", full_name: "Berkant Yenel", gender: "male", role: "admin",
        goal: "performance", active: true, created_at: new Date().toISOString()
      }
    ]);

    const logs = [];
    const weights = [78.4, 78.1, 77.9, 77.8, 77.6, 77.4, 77.2];
    for (let i = -6; i <= 0; i++) {
      const index = i + 6;
      logs.push({
        id: uid(), user_id: studentId, log_date: isoDate(i), workout_done: i !== -3,
        split: ["Push", "Pull", "Legs", "Dinlenme", "Upper", "Lower", "Push"][index],
        total_sets: i === -3 ? 0 : 18 + (index % 3), main_lift: "Bench Press", main_lift_kg: 70 + index * .5,
        rpe: 7 + (index % 2), cardio_minutes: i === -3 ? 25 : 15, steps: 7600 + index * 430,
        calories: 2350, protein_g: 145 + index * 2, carbs_g: 250, fat_g: 68,
        water_l: 2.5 + (index % 3) * .25, sleep_hours: 6.8 + (index % 3) * .4,
        energy: 3 + (index % 3), mood: 4, pump: i === -3 ? 1 : 4,
        notes: index === 6 ? "Bugün form çok iyiydi." : "", created_at: new Date().toISOString()
      });
    }
    logs.push({
      id: uid(), user_id: femaleId, log_date: isoDate(0), workout_done: true, split: "Glute & Legs",
      total_sets: 20, main_lift: "Hip Thrust", main_lift_kg: 80, rpe: 8, cardio_minutes: 20,
      steps: 9100, calories: 1850, protein_g: 118, carbs_g: 190, fat_g: 55, water_l: 2.4,
      sleep_hours: 7.5, energy: 4, mood: 5, pump: 5, notes: "Yeni PR!", created_at: new Date().toISOString()
    });
    write(KEYS.logs, logs);

    write(KEYS.measurements, weights.map((weight, index) => ({
      id: uid(), user_id: studentId, measured_at: isoDate(index * -7), weight_kg: weight,
      waist_cm: 84 - index * .5, chest_cm: 102 + index * .2, hips_cm: 98, arm_cm: 36 + index * .1,
      thigh_cm: 58, body_fat_percent: 16.8 - index * .2, notes: "", created_at: new Date().toISOString()
    })).reverse());

    write(KEYS.programs, [{
      id: programId, title: "Hybrid Strength 8", description: "Kas gelişimi ve kondisyon odaklı 8 haftalık plan.",
      level: "intermediate", gender_target: "all", is_template: true, coach_id: adminId,
      days: [
        { title: "Push — Güç", exercises: [
          { name: "Incline Bench Press", sets: 4, reps: "6-8", rir: "1-2", rest_seconds: 120 },
          { name: "Machine Chest Press", sets: 3, reps: "8-10", rir: "1", rest_seconds: 90 },
          { name: "Lateral Raise", sets: 4, reps: "12-15", rir: "0-1", rest_seconds: 60 },
          { name: "Rope Pushdown", sets: 3, reps: "10-12", rir: "1", rest_seconds: 60 }
        ]},
        { title: "Pull — Yoğunluk", exercises: [
          { name: "Lat Pulldown", sets: 4, reps: "8-10", rir: "1", rest_seconds: 90 },
          { name: "Chest Supported Row", sets: 4, reps: "8-10", rir: "1", rest_seconds: 90 },
          { name: "Rear Delt Fly", sets: 3, reps: "12-15", rir: "0-1", rest_seconds: 60 },
          { name: "Cable Curl", sets: 3, reps: "10-12", rir: "1", rest_seconds: 60 }
        ]},
        { title: "Legs — Performans", exercises: [
          { name: "Hack Squat", sets: 4, reps: "6-8", rir: "1-2", rest_seconds: 150 },
          { name: "Romanian Deadlift", sets: 3, reps: "8-10", rir: "1", rest_seconds: 120 },
          { name: "Leg Extension", sets: 3, reps: "12-15", rir: "0-1", rest_seconds: 60 },
          { name: "Seated Leg Curl", sets: 3, reps: "10-12", rir: "1", rest_seconds: 60 }
        ]}
      ]
    }]);
    write(KEYS.assignments, [{ id: uid(), user_id: studentId, program_id: programId, assigned_by: adminId, start_date: isoDate(-14), end_date: isoDate(42), active: true }]);
    write(KEYS.messages, [{ id: uid(), user_id: studentId, coach_id: adminId, message: "Bu hafta ana liftlerde formu koruyarak küçük bir artış hedefliyoruz. Disiplinin çok iyi!", created_at: new Date().toISOString(), read_at: null }]);
    write(KEYS.photos, []);
  }

  seedDemo();

  async function signIn(email, password) {
    if (demoMode) {
      const profiles = read(KEYS.profiles);
      const profile = profiles.find(p => p.email.toLowerCase() === String(email).toLowerCase());
      const valid = (email === "student@demo.com" && password === "demo123") ||
        (email === "admin@demo.com" && password === "admin123") ||
        (email === "ayse@demo.com" && password === "demo123");
      if (!profile || !valid) throw new Error("Demo bilgileri hatalı.");
      const session = { user: { id: profile.id, email: profile.email }, profile };
      write(KEYS.session, session);
      return session;
    }
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.session;
  }


  function appBaseUrl() {
    // Demo, özel alan adı ve alt klasör yayınlarında daima mevcut dağıtıma dön.
    return new URL("./", location.href).href.replace(/\/$/, "");
  }

  function setupSidebar() {
    const sidebar = document.getElementById("sidebar");
    const toggle = document.getElementById("sidebar-toggle");
    const closeButton = document.getElementById("sidebar-close");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (!sidebar || !toggle) return null;

    const setOpen = open => {
      sidebar.classList.toggle("open", open);
      backdrop?.classList.toggle("open", open);
      document.body.classList.toggle("sidebar-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    const close = () => setOpen(false);
    toggle.addEventListener("click", () => setOpen(!sidebar.classList.contains("open")));
    closeButton?.addEventListener("click", close);
    backdrop?.addEventListener("click", close);
    sidebar.querySelectorAll("a.side-link, button.side-link").forEach(item => {
      item.addEventListener("click", () => {
        if (window.matchMedia("(max-width: 980px)").matches) close();
      });
    });
    window.addEventListener("keydown", event => { if (event.key === "Escape") close(); });
    window.addEventListener("resize", () => { if (window.innerWidth > 980) close(); }, { passive: true });
    return { open: () => setOpen(true), close };
  }

  async function signUp({ email, password, fullName, gender, goal }) {
    if (demoMode) throw new Error("Demo modunda yeni üyelik kapalıdır. Supabase bağlantısından sonra kullanılabilir.");
    const { data, error } = await client.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${appBaseUrl()}/dashboard.html`, data: { full_name: fullName, gender, goal } }
    });
    if (error) throw error;
    return data;
  }

  async function resetPassword(email) {
    if (demoMode) throw new Error("Demo modunda şifre sıfırlama e-postası gönderilmez.");
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${appBaseUrl()}/login.html?reset=1` });
    if (error) throw error;
  }

  async function updatePassword(password) {
    if (demoMode) throw new Error("Demo modunda parola değiştirilemez.");
    const { error } = await client.auth.updateUser({ password });
    if (error) throw error;
  }

  async function signOut() {
    if (demoMode) localStorage.removeItem(KEYS.session);
    else await client.auth.signOut();
    location.href = "login.html";
  }

  async function getSession() {
    if (demoMode) return read(KEYS.session, null);
    const { data } = await client.auth.getSession();
    return data.session;
  }

  async function getProfile(userId) {
    if (demoMode) return read(KEYS.profiles).find(p => p.id === userId) || null;
    const { data, error } = await client.from("profiles").select("*").eq("id", userId).single();
    if (error) throw error;
    return data;
  }

  async function guard(roles = []) {
    const session = await getSession();
    if (!session?.user) {
      location.replace(`login.html?next=${encodeURIComponent(location.pathname.split('/').pop() || 'dashboard.html')}`);
      return null;
    }
    const profile = session.profile || await getProfile(session.user.id);
    if (!profile || (roles.length && !roles.includes(profile.role))) {
      location.replace(profile?.role === "admin" || profile?.role === "coach" ? "admin.html" : "dashboard.html");
      return null;
    }
    return { session, profile };
  }

  const demo = {
    read, write, keys: KEYS, uid,
    reset() { Object.values(KEYS).forEach(k => localStorage.removeItem(k)); seedDemo(); }
  };

  function toast(message, type = "success") {
    let box = document.getElementById("toast-stack");
    if (!box) {
      box = document.createElement("div"); box.id = "toast-stack"; box.className = "toast-stack"; document.body.append(box);
    }
    const item = document.createElement("div"); item.className = `toast ${type}`; item.textContent = message; box.append(item);
    setTimeout(() => item.classList.add("show"), 10);
    setTimeout(() => { item.classList.remove("show"); setTimeout(() => item.remove(), 250); }, 3400);
  }

  function formatDate(value, options = { day: "2-digit", month: "short" }) {
    if (!value) return "—";
    return new Intl.DateTimeFormat("tr-TR", options).format(new Date(`${value}T12:00:00`));
  }

  function daysBetween(a, b) {
    const one = new Date(`${a}T12:00:00`), two = new Date(`${b}T12:00:00`);
    return Math.ceil((two - one) / 86400000);
  }

  window.Bercant = { cfg, client, demoMode, hasSupabaseConfig, signIn, signUp, resetPassword, updatePassword, signOut, getSession, getProfile, guard, demo, toast, formatDate, daysBetween, isoDate, appBaseUrl, setupSidebar };
})();
