const KEY = "gymflow-v3";
    const LEGACY_KEYS = ["gymflow-v2", "gymflow-v1"];

    const muscles = ["Cardio","Chest","Back","Shoulders","Legs","Arms","Core"];
    const days = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"];
    const uid = () => "gf_" + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
    let state, selectedRoutineExercises = [], confirmCallback = null, elapsedInterval = null;
    let currentCalendarDate = new Date();


    // ==================== GYMFlow i18n ====================
    // UI translation layer: keeps workout/user data intact and only translates interface text.
    const I18N = {
      "GYMFlow": {id:"GYMFlow", en:"GYMFlow"},
      "Home": {id:"Beranda", en:"Home"},
      "Exercises": {id:"Latihan", en:"Exercises"},
      "Routines": {id:"Routine", en:"Routines"},
      "Workout": {id:"Workout", en:"Workout"},
      "Progress": {id:"Progres", en:"Progress"},
      "Reset data": {id:"Reset data", en:"Reset data"},
      "Data tersimpan di perangkat ini.": {id:"Data tersimpan di perangkat ini.", en:"Data is stored on this device."},
      "Offline": {id:"Offline", en:"Offline"},
      "SELAMAT PAGI,": {id:"SELAMAT PAGI,", en:"GOOD MORNING,"},
      "SELAMAT SIANG,": {id:"SELAMAT SIANG,", en:"GOOD AFTERNOON,"},
      "SELAMAT SORE,": {id:"SELAMAT SORE,", en:"GOOD EVENING,"},
      "SELAMAT MALAM,": {id:"SELAMAT MALAM,", en:"GOOD EVENING,"},
      "Pilih routine dan mulai saat kamu siap.": {id:"Pilih routine dan mulai saat kamu siap.", en:"Choose a routine and start when you're ready."},
      "Buat routine pertama untuk mulai mencatat progress.": {id:"Buat routine pertama untuk mulai mencatat progress.", en:"Create your first routine to start tracking progress."},
      "This Week": {id:"Minggu Ini", en:"This Week"},
      "Weekly target progress": {id:"Progres target mingguan", en:"Weekly target progress"},
      "Mulai Workout": {id:"Mulai Workout", en:"Start Workout"},
      "Sesi Aktif": {id:"Sesi Aktif", en:"Active Session"},
      "Belum ada sesi aktif.": {id:"Belum ada sesi aktif.", en:"No active session."},
      "Lanjutkan": {id:"Lanjutkan", en:"Resume"},
      "Routines": {id:"Routine", en:"Routines"},
      "Workout Planner": {id:"Perencana Workout", en:"Workout Planner"},
      "Atur program latihan mingguanmu, kelompokkan gerakan terbaik, dan capai target otot maksimal.": {id:"Atur program latihan mingguanmu, kelompokkan gerakan terbaik, dan capai target otot maksimal.", en:"Plan your weekly workouts, group your best movements, and maximize your training goals."},
      "Buat Routine Baru": {id:"Buat Routine Baru", en:"Create New Routine"},
      "Belum Ada Routine Latihan": {id:"Belum Ada Routine Latihan", en:"No Workout Routines Yet"},
      "Mulai rancang jadwal dan rangkaian gerakan latihan pertamamu sekarang.": {id:"Mulai rancang jadwal dan rangkaian gerakan latihan pertamamu sekarang.", en:"Start planning your first workout schedule and exercise sequence now."},
      "Buat Routine Sekarang": {id:"Buat Routine Sekarang", en:"Create Routine Now"},
      "Exercise Directory": {id:"Daftar Exercise", en:"Exercise Directory"},
      "Cari exercise bawaan atau tambahkan gerakan custom sesuai kebutuhan latihanmu.": {id:"Cari exercise bawaan atau tambahkan gerakan custom sesuai kebutuhan latihanmu.", en:"Browse built-in exercises or add custom movements for your training needs."},
      "Tambah Exercise": {id:"Tambah Exercise", en:"Add Exercise"},
      "Cari exercise": {id:"Cari exercise", en:"Search exercises"},
      "Semua target otot": {id:"Semua target otot", en:"All muscle targets"},
      "Cardio": {id:"Kardio", en:"Cardio"},
      "Chest": {id:"Dada", en:"Chest"},
      "Back": {id:"Punggung", en:"Back"},
      "Shoulders": {id:"Bahu", en:"Shoulders"},
      "Legs": {id:"Kaki", en:"Legs"},
      "Arms": {id:"Lengan", en:"Arms"},
      "Core": {id:"Core", en:"Core"},
      "Exercise Tidak Ditemukan": {id:"Exercise Tidak Ditemukan", en:"No Exercises Found"},
      "Coba ubah kata kunci pencarian atau tambahkan exercise custom baru.": {id:"Coba ubah kata kunci pencarian atau tambahkan exercise custom baru.", en:"Try changing your search or add a new custom exercise."},
      "Live Workout": {id:"Live Workout", en:"Live Workout"},
      "Mulai sesi berikutnya.": {id:"Mulai sesi berikutnya.", en:"Start your next session."},
      "Pilih routine untuk mencatat Set, Reps, dan Weight secara cepat.": {id:"Pilih routine untuk mencatat Set, Reps, dan Weight secara cepat.", en:"Choose a routine to quickly record sets, reps, and weight."},
      "Pilih Routine": {id:"Pilih Routine", en:"Choose Routine"},
      "Pilih routine...": {id:"Pilih routine...", en:"Choose routine..."},
      "Mulai Sesi": {id:"Mulai Sesi", en:"Start Session"},
      "+ Buat Routine Baru": {id:"+ Buat Routine Baru", en:"+ Create New Routine"},
      "Progress": {id:"Progres", en:"Progress"},
      "Akhiri workout": {id:"Akhiri workout", en:"End Workout"},
      "WAKTU ISTIRAHAT": {id:"WAKTU ISTIRAHAT", en:"REST TIMER"},
      "Jeda": {id:"Jeda", en:"Pause"},
      "Lanjut": {id:"Lanjut", en:"Resume"},
      "Lewati": {id:"Lewati", en:"Skip"},
      "Reset": {id:"Reset", en:"Reset"},
      "Catatan": {id:"Catatan", en:"Notes"},
      "Set": {id:"Set", en:"Set"},
      "Reps": {id:"Repetisi", en:"Reps"},
      "Weight (kg)": {id:"Berat (kg)", en:"Weight (kg)"},
      "Status": {id:"Status", en:"Status"},
      "Tambah Set": {id:"Tambah Set", en:"Add Set"},
      "← Sebelumnya": {id:"← Sebelumnya", en:"← Previous"},
      "Exercise berikutnya →": {id:"Exercise berikutnya →", en:"Next Exercise →"},
      "Selesai workout →": {id:"Selesai workout →", en:"Finish Workout →"},
      "Overview": {id:"Ringkasan", en:"Overview"},
      "Weight": {id:"Berat", en:"Weight"},
      "History": {id:"Riwayat", en:"History"},
      "Total Workouts": {id:"Total Workout", en:"Total Workouts"},
      "Total Calories": {id:"Total Kalori", en:"Total Calories"},
      "Total Time": {id:"Total Waktu", en:"Total Time"},
      "Avg Duration": {id:"Durasi Rata-rata", en:"Avg Duration"},
      "Workouts per Week": {id:"Workout per Minggu", en:"Workouts per Week"},
      "Calories per Workout": {id:"Kalori per Workout", en:"Calories per Workout"},
      "Current Weight": {id:"Berat Saat Ini", en:"Current Weight"},
      "Log Weight": {id:"Catat Berat", en:"Log Weight"},
      "Weight Trend": {id:"Tren Berat Badan", en:"Weight Trend"},
      "Log List": {id:"Daftar Catatan", en:"Log List"},
      "Log": {id:"Catat", en:"Log"},
      "Belum ada riwayat berat badan.": {id:"Belum ada riwayat berat badan.", en:"No weight history yet."},
      "Semua Riwayat": {id:"Semua Riwayat", en:"All History"},
      "Hari Ini": {id:"Hari Ini", en:"Today"},
      "Seminggu Terakhir": {id:"Seminggu Terakhir", en:"Last 7 Days"},
      "Belum ada history. Selesaikan workout untuk melihat progress di sini.": {id:"Belum ada riwayat. Selesaikan workout untuk melihat progres di sini.", en:"No history yet. Complete a workout to see your progress here."},
      "Catat Berat Badan": {id:"Catat Berat Badan", en:"Log Weight"},
      "Berat Badan (kg)": {id:"Berat Badan (kg)", en:"Weight (kg)"},
      "Tanggal": {id:"Tanggal", en:"Date"},
      "Batal": {id:"Batal", en:"Cancel"},
      "Simpan": {id:"Simpan", en:"Save"},
      "Profil & Target": {id:"Profil & Target", en:"Profile & Goals"},
      "Personal Data": {id:"Data Pribadi", en:"Personal Data"},
      "Name": {id:"Nama", en:"Name"},
      "Age": {id:"Usia", en:"Age"},
      "Height": {id:"Tinggi", en:"Height"},
      "Weight": {id:"Berat", en:"Weight"},
      "Weekly Target": {id:"Target Mingguan", en:"Weekly Target"},
      "How many workouts per week are you aiming for?": {id:"Berapa workout per minggu yang ingin kamu capai?", en:"How many workouts per week are you aiming for?"},
      "Save Profile": {id:"Simpan Profil", en:"Save Profile"},
      "Appearance": {id:"Tampilan", en:"Appearance"},
      "Dark Mode": {id:"Mode Gelap", en:"Dark Mode"},
      "Currently dark": {id:"Saat ini gelap", en:"Currently dark"},
      "Currently light": {id:"Saat ini terang", en:"Currently light"},
      "Data & Storage": {id:"Data & Penyimpanan", en:"Data & Storage"},
      "Workout sessions": {id:"Sesi workout", en:"Workout sessions"},
      "Weight entries": {id:"Catatan berat", en:"Weight entries"},
      "Custom exercises": {id:"Exercise custom", en:"Custom exercises"},
      "Storage": {id:"Penyimpanan", en:"Storage"},
      "Local device": {id:"Perangkat lokal", en:"Local device"},
      "Reset All Data": {id:"Reset Semua Data", en:"Reset All Data"},
      "All data is stored locally on your device. No account required. Your workouts, routines, and progress stay private.": {id:"Semua data disimpan secara lokal di perangkatmu. Tidak perlu akun. Workout, routine, dan progresmu tetap privat.", en:"All data is stored locally on your device. No account required. Your workouts, routines, and progress stay private."},
      "Routine Builder": {id:"Pembuat Routine", en:"Routine Builder"},
      "Rancang alur latihan dan pilih gerakan terbaikmu.": {id:"Rancang alur latihan dan pilih gerakan terbaikmu.", en:"Build your workout flow and choose your best movements."},
      "Nama Routine": {id:"Nama Routine", en:"Routine Name"},
      "Deskripsi Singkat": {id:"Deskripsi Singkat", en:"Short Description"},
      "(opsional)": {id:"(opsional)", en:"(optional)"},
      "Jadwal Hari Latihan": {id:"Jadwal Hari Latihan", en:"Workout Days"},
      "Daftar Exercise": {id:"Daftar Exercise", en:"Exercise List"},
      "Tambah dari Library": {id:"Tambah dari Library", en:"Add from Library"},
      "Simpan Routine": {id:"Simpan Routine", en:"Save Routine"},
      "Tambah Exercise Custom": {id:"Tambah Exercise Custom", en:"Add Custom Exercise"},
      "Nama exercise": {id:"Nama exercise", en:"Exercise name"},
      "Target otot": {id:"Target otot", en:"Target muscle"},
      "Pilih target otot": {id:"Pilih target otot", en:"Choose target muscle"},
      "Equipment": {id:"Peralatan", en:"Equipment"},
      "Konfirmasi tindakan": {id:"Konfirmasi tindakan", en:"Confirm action"},
      "Hapus": {id:"Hapus", en:"Delete"},
      "Edit Routine": {id:"Edit Routine", en:"Edit Routine"},
      "Selesai": {id:"Selesai", en:"Done"},
      "Tandai Selesai": {id:"Tandai Selesai", en:"Mark Complete"},
      "Language": {id:"Bahasa", en:"Language"},
      "Version 1.0.0": {id:"Versi 1.0.0", en:"Version 1.0.0"},
      "KALORI": {id:"KALORI", en:"CALORIES"}
    };

    const I18N_REVERSE = {};
    Object.entries(I18N).forEach(([key, pair]) => {
      I18N_REVERSE[pair.id] = key;
      I18N_REVERSE[pair.en] = key;
    });

    function currentLanguage(){ return state?.settings?.language === "en" ? "en" : "id"; }
    function tr(key){ return I18N[key]?.[currentLanguage()] ?? key; }

    function translateDynamicText(text){
      const lang = currentLanguage();
      const raw = String(text ?? "");
      if (I18N_REVERSE[raw]) return tr(I18N_REVERSE[raw]);

      let m;
      if ((m = raw.match(/^(\d+) workouts logged$/))) return lang === "en" ? `${m[1]} workouts logged` : `${m[1]} workout tercatat`;
      if ((m = raw.match(/^(\d+) workout tercatat$/))) return lang === "en" ? `${m[1]} workouts logged` : raw;
      if ((m = raw.match(/^(\d+)x\/week target$/))) return lang === "en" ? raw : `target ${m[1]}x/minggu`;
      if ((m = raw.match(/^target (\d+)x\/minggu$/))) return lang === "en" ? `${m[1]}x/week target` : raw;
      if ((m = raw.match(/^(.+) · (\d+) exercise siap dijalankan\.$/))) return lang === "en" ? `${m[1]} · ${m[2]} exercises ready.` : raw;
      if ((m = raw.match(/^(.+) · (\d+) exercises ready\.$/))) return lang === "en" ? raw : `${m[1]} · ${m[2]} exercise siap dijalankan.`;
      if ((m = raw.match(/^Sesi (.+) masih berjalan\.$/))) return lang === "en" ? `Session ${m[1]} is still active.` : raw;
      if ((m = raw.match(/^Session (.+) is still active\.$/))) return lang === "en" ? raw : `Sesi ${m[1]} masih berjalan.`;
      if (/^EXERCISE \d+ DARI \d+$/.test(raw)) return lang === "en" ? raw.replace(" DARI ", " OF ") : raw.replace("EXERCISE ", "LATIHAN ").replace(" DARI ", " DARI ");
      if (/^LATIHAN \d+ DARI \d+$/.test(raw)) return lang === "en" ? raw.replace("LATIHAN ", "EXERCISE ").replace(" DARI ", " OF ") : raw;
      if ((m = raw.match(/^(\d+) \/ (\d+) dipilih$/))) return lang === "en" ? `${m[1]} of ${m[2]} selected` : raw;
      if ((m = raw.match(/^(\d+) dipilih$/))) return lang === "en" ? `${m[1]} selected` : raw;
      if ((m = raw.match(/^Daftar Gerakan \((\d+)\)$/))) return lang === "en" ? `Exercise List (${m[1]})` : raw;
      if ((m = raw.match(/^Exercise List \((\d+)\)$/))) return lang === "en" ? raw : `Daftar Gerakan (${m[1]})`;
      if ((m = raw.match(/^\+(\d+) lainnya$/))) return lang === "en" ? `+${m[1]} more` : raw;
      if ((m = raw.match(/^\+(\d+) more$/))) return lang === "en" ? raw : `+${m[1]} lainnya`;
      if (/^\d+\/\d+ Set$/.test(raw)) return raw;
      if ((m = raw.match(/^Sebelumnya: (.+)$/))) return lang === "en" ? `Previous: ${m[1]}` : raw;
      if ((m = raw.match(/^Previous: (.+)$/))) return lang === "en" ? raw : `Sebelumnya: ${m[1]}`;
      if (raw === "Belum ada catatan performance sebelumnya.") return lang === "en" ? "No previous performance recorded." : raw;
      if (raw === "No previous performance recorded.") return lang === "en" ? raw : "Belum ada catatan performance sebelumnya.";
      if (raw === "Belum ada exercise") return lang === "en" ? "No exercises yet" : raw;
      if (raw === "No exercises yet") return lang === "en" ? raw : "Belum ada exercise";
      if (raw === "Belum ada hari dijadwalkan") return lang === "en" ? "No days scheduled" : raw;
      if (raw === "No days scheduled") return lang === "en" ? raw : "Belum ada hari dijadwalkan";
      if (raw === "Tidak ada deskripsi rutin.") return lang === "en" ? "No routine description." : raw;
      if (raw === "No routine description.") return lang === "en" ? raw : "Tidak ada deskripsi rutin.";
      if (raw === "Workout tersimpan. Membakar ±${caloriesBurned} kkal!") return raw;
      return raw;
    }

    function translateAttributes(root=document){
      const attrNames = ["placeholder","title","aria-label"];
      root.querySelectorAll?.("*").forEach(el => {
        attrNames.forEach(attr => {
          if (el.hasAttribute(attr)) {
            const v = el.getAttribute(attr);
            const key = I18N_REVERSE[v];
            if (key) el.setAttribute(attr, tr(key));
          }
        });
      });
    }

    function syncLanguageCustomSelect(){
      const wrapper = document.getElementById("language-custom-select");
      if (!wrapper) return;
      const lang = currentLanguage();
      const label = wrapper.querySelector(".selected-label");
      const options = wrapper.querySelectorAll(".custom-option");
      const labels = {
        id: "🇮🇩 Bahasa Indonesia",
        en: "🇬🇧 English"
      };
      if (label) label.textContent = labels[lang];
      options.forEach(option => {
        option.classList.toggle("selected", option.dataset.value === lang);
      });
    }

    function initLanguageCustomSelect(){
      initCustomSelect("language-custom-select", (val) => setLanguage(val));
      syncLanguageCustomSelect();
    }

    function applyLanguage(){
      if (!state?.settings) return;
      const lang = currentLanguage();
      document.documentElement.lang = lang;
      syncLanguageCustomSelect();

      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const nodes=[];
      let node;
      while ((node=walker.nextNode())) nodes.push(node);
      nodes.forEach(n => {
        if (!n.nodeValue.trim()) return;
        const parent = n.parentElement;
        if (!parent || ["SCRIPT","STYLE","INPUT","TEXTAREA","SELECT","OPTION"].includes(parent.tagName)) return;
        const translated = translateDynamicText(n.nodeValue.trim());
        if (translated !== n.nodeValue.trim()) {
          const leading = n.nodeValue.match(/^\s*/)?.[0] || "";
          const trailing = n.nodeValue.match(/\s*$/)?.[0] || "";
          n.nodeValue = leading + translated + trailing;
        }
      });
      translateAttributes(document);
      updateHeaderInitial();
    }

    function setLanguage(lang){
      state.settings.language = lang === "en" ? "en" : "id";
      save();
      syncLanguageCustomSelect();
      // Re-render dynamic sections so generated text follows the selected language.
      renderDashboard();
      renderRoutines();
      renderExercises();
      renderWorkout();
      renderHistory();
      renderProfileModal();
      applyLanguage();
      lucide.createIcons();
    }

    const seedExercises = [
      ["ex_treadmill","Treadmill","Cardio","Machine"],
      ["ex_cycling","Sepedahan (Cycling)","Cardio","Machine"],
      ["ex_chest_fly_machine","Chest Fly Machine","Chest","Machine"],
      ["ex_chest_press","Chest Press","Chest","Machine"],
      ["ex_bench","Bench Press","Chest","Barbell"],
      ["ex_incline","Incline Dumbbell Press","Chest","Dumbbell"],
      ["ex_sumo_squat","SumoSquat","Legs","Barbell"],
      ["ex_hip_abduction","Hip Abduction","Legs","Machine"],
      ["ex_squat","Back Squat","Legs","Barbell"],
      ["ex_rdl","Romanian Deadlift","Legs","Barbell"],
      ["ex_bulgarian","Bulgarian Split Squat","Legs","Dumbbell"],
      ["ex_leg_press","Leg Press","Legs","Machine"],
      ["ex_leg_ext","Leg Extension","Legs","Machine"],
      ["ex_leg_curl","Seated Leg Curl","Legs","Machine"],
      ["ex_row","Barbell Row","Back","Barbell"],
      ["ex_pullup","Lat Pulldown","Back","Cable"],
      ["ex_ohp","Overhead Press","Shoulders","Barbell"],
      ["ex_lateral","Lateral Raise","Shoulders","Dumbbell"],
      ["ex_curl","Bicep Curl","Arms","Dumbbell"],
      ["ex_pushdown","Tricep Pushdown","Arms","Cable"],
      ["ex_plank","Plank","Core","Bodyweight"],
      ["ex_chest_dip","Chest Dip","Chest","Bodyweight"],
      ["ex_cable_cross","Cable Crossover","Chest","Cable"],
      ["ex_decline_db","Decline Dumbbell Press","Chest","Dumbbell"],
      ["ex_tbar_row","T-Bar Row","Back","Barbell"],
      ["ex_seated_row","Seated Cable Row","Back","Cable"],
      ["ex_straight_pulldown","Straight-Arm Pulldown","Back","Cable"],
      ["ex_arnold_press","Arnold Press","Shoulders","Dumbbell"],
      ["ex_face_pull","Face Pull","Shoulders","Cable"],
      ["ex_front_raise","Front Raise","Shoulders","Dumbbell"],
      ["ex_hammer_curl","Hammer Curl","Dumbbell","Dumbbell"],
      ["ex_preacher_curl","Preacher Curl","Arms","Barbell"],
      ["ex_skull_crusher","Skull Crusher","Arms","Barbell"],
      ["ex_oh_tricep","Overhead Cable Triceps Extension","Arms","Cable"],
      ["ex_hanging_leg","Hanging Leg Raise","Core","Bodyweight"],
      ["ex_russian_twist","Russian Twist","Core","Bodyweight"],
      ["ex_ab_wheel","Ab Wheel Rollout","Core","Bodyweight"]
    ].map(([id,name,muscle,equipment]) => ({id,name,muscle,equipment,isCustom:false}));

    function seedState() {
      return {
        settings:{theme:"dark",restSeconds:90, weight:65, height:170, age:25, heightUnit:"cm", weightUnit:"kg", weeklyGoal:4, userName:"COYY", language:"id"},
        exercises:seedExercises,
        routines:[],
        activeSession:null,
        history:[],
        weightHistory:[]
      };
    }

    function loadState(){ 
      try { 
        let rawData = localStorage.getItem(KEY);
        let loaded = null;

        if (rawData) {
          loaded = JSON.parse(rawData);
        } else {
          for (let oldKey of LEGACY_KEYS) {
            let oldData = localStorage.getItem(oldKey);
            if (oldData) {
              try {
                loaded = JSON.parse(oldData);
                break;
              } catch(err) {}
            }
          }
        }

        if (!loaded) {
          loaded = seedState();
        }
        
        const existingCustoms = (loaded.exercises || []).filter(e => e.isCustom);
        loaded.exercises = [...seedExercises, ...existingCustoms];

        if(!loaded.settings) loaded.settings = {theme:"dark",restSeconds:90, weight:65, height:170, age:25, heightUnit:"cm", weightUnit:"kg", weeklyGoal:4, userName:"COYY", language:"id"};
        if(loaded.settings.weight === undefined) loaded.settings.weight = 65;
        if(loaded.settings.height === undefined) loaded.settings.height = 170;
        if(loaded.settings.age === undefined) loaded.settings.age = 25;
        if(loaded.settings.heightUnit === undefined) loaded.settings.heightUnit = "cm";
        if(loaded.settings.weightUnit === undefined) loaded.settings.weightUnit = "kg";
        if(loaded.settings.weeklyGoal === undefined) loaded.settings.weeklyGoal = 4;
        if(loaded.settings.userName === undefined) loaded.settings.userName = "COYY";
        if(loaded.settings.language !== "en" && loaded.settings.language !== "id") loaded.settings.language = "id";

        if(!loaded.weightHistory) {
          loaded.weightHistory = [];
        }

        if (loaded.history) {
          loaded.history = loaded.history.map(s => {
            if (s.caloriesBurned === undefined) {
              const durationMins = (s.duration || 0) / 60;
              const w = loaded.settings.weight || 65;
              s.caloriesBurned = Math.round(0.05 * w * durationMins);
            }
            return s;
          });
        }

        localStorage.setItem(KEY, JSON.stringify(loaded));
        return loaded;
      } catch(e){ return seedState(); } 
    }

    function save(){ localStorage.setItem(KEY,JSON.stringify(state)); }
    function esc(s){ return String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])); }
    function fmtKg(n){ return new Intl.NumberFormat("id-ID").format(Math.round(n||0))+" kg"; }
    function fmtKkal(n){ return new Intl.NumberFormat("id-ID").format(Math.round(n||0))+" kkal"; }
    function formatDuration(s){ s=Math.max(0,Math.floor(s||0)); return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0"); }
    function formatTimeDetailed(totalSeconds) {
      const hours = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      if (hours > 0) {
        return `${hours}h ${mins}m`;
      }
      return `${mins}m`;
    }
    function routineById(id){ return state.routines.find(r=>r.id===id); }
    function exerciseById(id){ return state.exercises.find(e=>e.id===id); }
    function toast(msg){ const el=document.getElementById("toast"); el.textContent=msg; el.classList.add("show"); clearTimeout(el._timer); el._timer=setTimeout(()=>el.classList.remove("show"),3200); }
    function openModal(id){ document.getElementById(id).classList.add("open"); }
    function closeModal(id){ document.getElementById(id).classList.remove("open"); }
    function showConfirm(title,message,actionText,cb){ document.getElementById("confirm-title").textContent=title; document.getElementById("confirm-message").textContent=message; document.getElementById("confirm-action").textContent=actionText; confirmCallback=cb; openModal("confirm-modal"); }

    function setHeightUnit(unit) {
      state.settings.heightUnit = unit;
      document.getElementById("height-unit-label").textContent = unit;
      document.getElementById("unit-cm").className = unit === 'cm' ? "flex-1 py-2 text-xs font-bold rounded-lg bg-[var(--surface)] text-[var(--text)] transition-all" : "flex-1 py-2 text-xs font-bold rounded-lg muted transition-all";
      document.getElementById("unit-ft").className = unit === 'ft' ? "flex-1 py-2 text-xs font-bold rounded-lg bg-[var(--surface)] text-[var(--text)] transition-all" : "flex-1 py-2 text-xs font-bold rounded-lg muted transition-all";
    }

    function setWeightUnit(unit) {
      state.settings.weightUnit = unit;
      document.getElementById("weight-unit-label").textContent = unit;
      document.getElementById("unit-kg").className = unit === 'kg' ? "flex-1 py-2 text-xs font-bold rounded-lg bg-[var(--surface)] text-[var(--text)] transition-all" : "flex-1 py-2 text-xs font-bold rounded-lg muted transition-all";
      document.getElementById("unit-lbs").className = unit === 'lbs' ? "flex-1 py-2 text-xs font-bold rounded-lg bg-[var(--surface)] text-[var(--text)] transition-all" : "flex-1 py-2 text-xs font-bold rounded-lg muted transition-all";
    }

    function toggleProfileDarkMode() {
      state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
      save();
      setTheme();
      renderProfileModal();
    }

    function updateHeaderInitial() {
      const name = (state && state.settings && state.settings.userName) ? state.settings.userName : "COYY";
      const profileBtn = document.getElementById("open-profile-btn");
      if (profileBtn) {
        profileBtn.textContent = name.charAt(0).toUpperCase();
      }
    }

    function renderProfileModal() {
      const name = state.settings.userName || "COYY";
      const totalWorkouts = state.history.length;
      const totalCals = state.history.reduce((acc, s) => acc + (s.caloriesBurned || 0), 0);

      document.getElementById("profile-avatar-initial").textContent = name.charAt(0).toUpperCase();
      document.getElementById("profile-header-name").textContent = name;
      document.getElementById("profile-header-stats").textContent = currentLanguage()==="en" ? `${totalWorkouts} workouts · ${new Intl.NumberFormat("id-ID").format(totalCals)} kcal` : `${totalWorkouts} workout · ${new Intl.NumberFormat("id-ID").format(totalCals)} kkal`;
      document.getElementById("profile-header-target-badge").textContent = currentLanguage()==="en" ? `${state.settings.weeklyGoal}x/week target` : `target ${state.settings.weeklyGoal}x/minggu`;

      document.getElementById("profile-name-input").value = name;
      document.getElementById("profile-age-input").value = state.settings.age || 25;
      document.getElementById("profile-tb").value = state.settings.height || 178;
      document.getElementById("profile-bb").value = state.settings.weight || 78;

      setHeightUnit(state.settings.heightUnit || "cm");
      setWeightUnit(state.settings.weightUnit || "kg");

      // Render weekly target pills interaktif
      document.querySelectorAll(".target-pill").forEach(p => {
        const val = parseInt(p.dataset.val);
        p.classList.toggle("active", val === state.settings.weeklyGoal);
      });

      // Dark mode status
      const isDark = state.settings.theme !== "light";
      document.getElementById("dark-mode-desc").textContent = isDark ? tr("Currently dark") : tr("Currently light");
      const thumb = document.getElementById("dark-mode-thumb");
      const toggleBtn = document.getElementById("profile-dark-toggle");
      if(isDark) {
        toggleBtn.style.background = "var(--lime)";
        thumb.style.transform = "translateX(24px)";
      } else {
        toggleBtn.style.background = "var(--line)";
        thumb.style.transform = "translateX(2px)";
      }
      
      updateHeaderInitial();

      // Storage stats
      document.getElementById("storage-sessions-count").textContent = state.history.length;
      document.getElementById("storage-weights-count").textContent = (state.weightHistory || []).length;
      document.getElementById("storage-routines-count").textContent = state.routines.length;
      document.getElementById("storage-customs-count").textContent = state.exercises.filter(e => e.isCustom).length;
    }

    function openProfileModalCustom() {
      renderProfileModal();
      openModal("profile-modal");
    }

    function triggerProfileReset() {
      showConfirm(currentLanguage()==="en" ? "Reset all data?" : "Reset semua data?",currentLanguage()==="en" ? "All routines, history, active sessions, and custom exercises on this device will be deleted." : "Semua routine, history, sesi aktif, dan exercise custom di perangkat ini akan dihapus.","Reset",()=>{
        state = seedState();
        save();
        setTheme();
        populateSelects();
        renderDashboard();
        renderRoutines();
        renderExercises();
        renderWorkout();
        renderHistory();
        renderWeightTab();
        updateHeaderInitial();
        closeModal("profile-modal");
        toast(currentLanguage()==="en" ? "Data reset successfully." : "Data berhasil direset.");
      });
    }

    function initCustomSelect(wrapperId, onSelectCb) {
      const wrapper = document.getElementById(wrapperId);
      if(!wrapper) return;
      const trigger = wrapper.querySelector('.custom-select-trigger');
      const label = trigger.querySelector('.selected-label');
      const optionsContainer = wrapper.querySelector('.custom-options');

      trigger.onclick = (e) => {
        e.stopPropagation();
        document.querySelectorAll('.custom-select-wrapper.open').forEach(w => {
          if(w !== wrapper) w.classList.remove('open');
        });
        wrapper.classList.toggle('open');
        trigger.setAttribute('aria-expanded', wrapper.classList.contains('open') ? 'true' : 'false');
      };

      optionsContainer.onclick = (e) => {
        const option = e.target.closest('.custom-option');
        if(!option) return;
        const val = option.dataset.value;
        const text = option.textContent;

        optionsContainer.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        label.textContent = text;
        wrapper.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');

        if(typeof onSelectCb === 'function') onSelectCb(val, text);
      };
    }

    // --- SWITCH PROGRESS TAB (Overview | Weight | History) ---
    function switchProgressTab(tabName) {
      const overviewContent = document.getElementById("progress-overview-content");
      const weightContent = document.getElementById("progress-weight-content");
      const historyContent = document.getElementById("progress-history-content");

      const overviewBtn = document.getElementById("tab-overview-btn");
      const weightBtn = document.getElementById("tab-weight-btn");
      const historyBtn = document.getElementById("tab-history-btn");

      // Hide all
      overviewContent.classList.add("hidden");
      weightContent.classList.add("hidden");
      historyContent.classList.add("hidden");

      // Reset button styles
      overviewBtn.className = "flex-1 py-2 text-xs font-bold text-center rounded-lg muted hover:text-[var(--text)] transition-all";
      weightBtn.className = "flex-1 py-2 text-xs font-bold text-center rounded-lg muted hover:text-[var(--text)] transition-all";
      historyBtn.className = "flex-1 py-2 text-xs font-bold text-center rounded-lg muted hover:text-[var(--text)] transition-all";

      if (tabName === "overview") {
        overviewContent.classList.remove("hidden");
        overviewBtn.className = "flex-1 py-2 text-xs font-bold text-center rounded-lg bg-[var(--surface)] text-[var(--text)] shadow-sm transition-all";
        renderOverviewCharts();
      } else if (tabName === "weight") {
        weightContent.classList.remove("hidden");
        weightBtn.className = "flex-1 py-2 text-xs font-bold text-center rounded-lg bg-[var(--surface)] text-[var(--text)] shadow-sm transition-all";
        renderWeightTab();
      } else if (tabName === "history") {
        historyContent.classList.remove("hidden");
        historyBtn.className = "flex-1 py-2 text-xs font-bold text-center rounded-lg bg-[var(--surface)] text-[var(--text)] shadow-sm transition-all";
        renderHistory();
      }
    }

    function openWeightModal() {
      document.getElementById("weight-input-val").value = state.settings.weight || 65;
      const today = new Date().toISOString().slice(0, 10);
      document.getElementById("weight-date-val").value = today;
      openModal("weight-modal");
    }

    function renderWeightTab() {
      const currentWeight = state.settings.weight || 65;
      document.getElementById("current-weight-display").textContent = currentWeight;

      const sortedWeight = [...(state.weightHistory || [])].sort((a,b) => new Date(b.date) - new Date(a.date));
      const logList = document.getElementById("weight-log-list");
      const emptyLog = document.getElementById("weight-log-empty");
      
      logList.innerHTML = "";
      emptyLog.classList.toggle("hidden", sortedWeight.length !== 0);

      if (sortedWeight.length === 0) {
        logList.innerHTML = `<div class="text-center py-6 muted text-xs italic">Belum ada riwayat berat badan. Klik "Log Weight" untuk mencatat.</div>`;
      } else {
        sortedWeight.forEach(item => {
          const div = document.createElement("div");
          div.className = "py-3 flex items-center justify-between";
          div.innerHTML = `
            <span class="muted text-sm">${esc(item.date)}</span>
            <strong class="text-sm font-extrabold">${item.weight} kg</strong>
          `;
          logList.appendChild(div);
        });
      }

      renderWeightChart();
      lucide.createIcons();
    }

    function renderWeightChart() {
      const area = document.getElementById("weight-chart-area");
      const history = [...(state.weightHistory || [])].sort((a,b) => new Date(a.date) - new Date(b.date));
      
      if(history.length === 0) {
        area.innerHTML = '<div class="h-full grid place-items-center muted text-sm text-center px-4">Belum ada data berat badan. Silakan catat melalui tombol Log Weight di atas.</div>';
        return;
      }

      const vals = history.map(h => h.weight);
      const max = Math.max(...vals), min = Math.min(...vals), range = max - min || 1;
      const w = 600, h = 170;

      const coords = history.map((p, i) => `${history.length === 1 ? w/2 : 25 + i * (w - 50) / (history.length - 1)},${h - 25 - (p.weight - min) / range * (h - 55)}`).join(" ");
      
      area.innerHTML = `
        <svg viewBox="0 0 ${w} ${h}" class="w-full h-full" role="img" aria-label="Grafik Berat Badan">
          <line x1="25" y1="${h-25}" x2="${w-25}" y2="${h-25}" stroke="var(--line)"/>
          <polyline fill="none" stroke="#bcf04a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" points="${coords}"/>
          ${history.map((p, i) => {
            const x = history.length === 1 ? w/2 : 25 + i * (w - 50) / (history.length - 1);
            const y = h - 25 - (p.weight - min) / range * (h - 55);
            return `<circle cx="${x}" cy="${y}" r="5" fill="#bcf04a"/><text x="${x}" y="${h-7}" text-anchor="middle" fill="var(--muted)" font-size="10">${p.date.slice(5)}</text>`;
          }).join("")}
        </svg>
      `;
    }

    // --- ROUTINE BUILDER DENGAN PENYESUAIAN CARDIO (MENIT & KM) ---
    function openRoutineBuilder(routineId = null) {
      const isEdit = routineId !== null;
      document.getElementById("routine-modal-title").textContent = isEdit ? "Edit Routine" : "Routine Builder";
      document.getElementById("routine-id").value = routineId || "";
      
      selectedRoutineExercises = [];
      
      if (isEdit) {
        const routine = routineById(routineId);
        if (routine) {
          document.getElementById("routine-name").value = routine.name;
          document.getElementById("routine-description").value = routine.description || "";
          
          selectedRoutineExercises = (routine.exercises || routine.exerciseIds.map(id => ({
            id: id,
            sets: [{ reps: 10, weight: 0 }, { reps: 10, weight: 0 }, { reps: 10, weight: 0 }]
          }))).map(item => {
            const ex = exerciseById(item.id || item);
            const isCardio = ex && ex.muscle === "Cardio";
            return {
              id: item.id || item,
              sets: item.sets && item.sets.length > 0 ? [...item.sets] : (isCardio ? [{ reps: 15, weight: 2 }] : [{ reps: 10, weight: 0 }])
            };
          });

          document.querySelectorAll("#day-picker .day-chip").forEach(chip => {
            chip.classList.toggle("active", routine.days.includes(chip.dataset.day));
          });
        }
      } else {
        document.getElementById("routine-name").value = "";
        document.getElementById("routine-description").value = "";
        document.querySelectorAll("#day-picker .day-chip").forEach(chip => chip.classList.remove("active"));
        document.getElementById("day-picker").innerHTML = days.map(d => `<button type="button" class="chip day-chip" data-day="${d}">${d}</button>`).join("");
      }
      
      renderBuilderSelectedExercises();
      renderBuilderLibrary();
      openModal("routine-modal");
    }

    function renderBuilderSelectedExercises() {
      const container = document.getElementById("builder-selected-exercises");
      const countLabel = document.getElementById("selected-count");
      container.innerHTML = "";
      countLabel.textContent = selectedRoutineExercises.length + " dipilih";

      if (selectedRoutineExercises.length === 0) {
        container.innerHTML = `<p class="muted text-xs italic text-center py-4">Belum ada exercise dipilih. Tambahkan dari library di bawah.</p>`;
        return;
      }

      selectedRoutineExercises.forEach((item, index) => {
        const ex = exerciseById(item.id);
        if (!ex) return;

        const isCardio = ex.muscle === "Cardio";
        const label1 = isCardio ? "Target Menit" : "Target Reps";
        const label2 = isCardio ? "Target KM" : "Target Weight (kg)";

        const div = document.createElement("div");
        div.className = "p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] mb-3";
        
        let setsHtml = "";
        item.sets.forEach((set, sIdx) => {
          setsHtml += `
            <div class="grid grid-cols-[30px_1fr_1fr_32px] gap-2 items-center mb-1.5">
              <span class="text-xs font-bold muted text-center">${sIdx + 1}</span>
              <input type="number" min="1" max="999" class="field !text-xs !py-1 !min-h-[32px] builder-set-reps" data-ex="${index}" data-set="${sIdx}" value="${set.reps || ''}" placeholder="${isCardio ? 'Menit' : 'Reps'}">
              <input type="number" step="0.1" min="0" max="999" class="field !text-xs !py-1 !min-h-[32px] builder-set-weight" data-ex="${index}" data-set="${sIdx}" value="${set.weight || ''}" placeholder="${isCardio ? 'KM' : 'Weight (kg)'}">
              <button type="button" class="icon-btn !w-8 !h-8 text-rose-400 hover:bg-rose-500/10" onclick="removeSetFromBuilder(${index}, ${sIdx})" title="Hapus Set">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          `;
        });

        div.innerHTML = `
          <div class="flex items-center justify-between mb-2">
            <div>
              <strong class="text-sm font-bold">${esc(ex.name)}</strong>
              <span class="ml-2 chip !py-0.5 !px-2 !text-[10px]">${esc(ex.muscle)}</span>
            </div>
            <div class="flex items-center gap-1">
              <button type="button" class="secondary-btn !px-2 !py-1 !text-xs" onclick="addSetToBuilder(${index})">+ Set</button>
              <button type="button" class="icon-btn !w-8 !h-8 text-rose-400 hover:bg-rose-500/10" onclick="removeExerciseFromBuilder(${index})" title="Hapus Exercise">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
          <div class="grid grid-cols-[30px_1fr_1fr_32px] gap-2 text-[10px] font-bold muted px-1 mb-1">
            <span class="text-center">Set</span>
            <span>${label1}</span>
            <span>${label2}</span>
            <span></span>
          </div>
          <div class="space-y-1">${setsHtml}</div>
        `;
        container.appendChild(div);
      });

      container.querySelectorAll(".builder-set-reps, .builder-set-weight").forEach(input => {
        input.oninput = (e) => {
          const exIdx = parseInt(e.target.dataset.ex);
          const setIdx = parseInt(e.target.dataset.set);
          const val = parseFloat(e.target.value) || 0;
          if (e.target.classList.contains("builder-set-reps")) {
            selectedRoutineExercises[exIdx].sets[setIdx].reps = val;
          } else {
            selectedRoutineExercises[exIdx].sets[setIdx].weight = val;
          }
        };
      });

      if(window.lucide) lucide.createIcons();
    }

    function renderBuilderLibrary() {
      const q = document.getElementById("builder-exercise-search").value.toLowerCase();
      const lib = document.getElementById("builder-library");
      const addedIds = selectedRoutineExercises.map(item => item.id);
      
      const filtered = state.exercises.filter(e => e.name.toLowerCase().includes(q) && !addedIds.includes(e.id));
      
      lib.innerHTML = filtered.map(e => `
        <div class="flex items-center justify-between p-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors">
          <div>
            <strong class="text-xs font-bold">${esc(e.name)}</strong>
            <span class="muted text-[10px] block">${esc(e.muscle)} · ${esc(e.equipment)}</span>
          </div>
          <button type="button" class="lime-btn !min-h-[32px] !py-1 !px-3 !text-xs" onclick="addExerciseToBuilder('${e.id}')">+ Tambah</button>
        </div>
      `).join("") || '<p class="muted text-xs italic text-center py-3">Exercise tidak ditemukan.</p>';
      if(window.lucide) lucide.createIcons();
    }
    

    function addExerciseToBuilder(id) {
      if (selectedRoutineExercises.some(item => item.id === id)) return;
      const ex = exerciseById(id);
      const isCardio = ex && ex.muscle === "Cardio";
      selectedRoutineExercises.push({
        id: id,
        sets: isCardio ? [
          { reps: 15, weight: 2 }
        ] : [
          { reps: 12, weight: 0 },
          { reps: 10, weight: 0 },
          { reps: 8, weight: 0 }
        ]
      });
      renderBuilderSelectedExercises();
      renderBuilderLibrary();
    }

    function removeExerciseFromBuilder(index) {
      selectedRoutineExercises.splice(index, 1);
      renderBuilderSelectedExercises();
      renderBuilderLibrary();
    }

    function addSetToBuilder(exIndex) {
      const lastSet = selectedRoutineExercises[exIndex].sets.slice(-1)[0] || { reps: 10, weight: 0 };
      selectedRoutineExercises[exIndex].sets.push({ reps: lastSet.reps, weight: lastSet.weight });
      renderBuilderSelectedExercises();
    }

    function removeSetFromBuilder(exIndex, setIndex) {
      if (selectedRoutineExercises[exIndex].sets.length <= 1) {
        toast(currentLanguage()==="en" ? "At least one set is required!" : "Minimal harus ada 1 set!");
        return;
      }
      selectedRoutineExercises[exIndex].sets.splice(setIndex, 1);
      renderBuilderSelectedExercises();
    }

    window.addEventListener('click', () => {
      document.querySelectorAll('.custom-select-wrapper.open').forEach(w => w.classList.remove('open'));
    });

    function setTheme(){
      document.body.classList.toggle("light",state.settings.theme==="light");
      document.documentElement.style.colorScheme=state.settings.theme==="light"?"light":"dark";
    }
    
    function navigate(tab){
      document.querySelectorAll(".tab").forEach(el=>el.classList.toggle("active",el.id===tab));
      document.querySelectorAll("[data-tab]").forEach(el=>el.classList.toggle("active",el.dataset.tab===tab));
      if(tab==="workout") renderWorkout(); 
      if(tab==="history") {
        renderHistory();
        renderOverviewMetrics();
      } 
      if(tab==="routines") renderRoutines();
    }
    
    function changeCalendarMonth(direction) {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
      renderCalendar();
    }

    function renderCalendar() {
      const year = currentCalendarDate.getFullYear();
      const month = currentCalendarDate.getMonth();
      
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      document.getElementById("calendar-month-title").textContent = `${monthNames[month]} ${year}`;

      const grid = document.getElementById("calendar-days-grid");
      grid.innerHTML = "";

      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      
      let startingDay = firstDayOfMonth.getDay() - 1;
      if (startingDay === -1) startingDay = 6; 

      const totalDays = lastDayOfMonth.getDate();
      const prevMonthLastDay = new Date(year, month, 0).getDate();

      const workoutDates = new Set(state.history.map(s => new Date(s.endedAt).toDateString()));

      let html = "";

      for (let i = startingDay - 1; i >= 0; i--) {
        const d = prevMonthLastDay - i;
        html += `<div class="py-2 text-[var(--muted)] opacity-40 text-xs">${d}</div>`;
      }

      const todayStr = new Date().toDateString();
      for (let day = 1; day <= totalDays; day++) {
        const thisDate = new Date(year, month, day);
        const dateStr = thisDate.toDateString();
        const hasWorkout = workoutDates.has(dateStr);
        const isToday = dateStr === todayStr;

        let ringClass = "";
        let bgStyle = "";
        if (hasWorkout) {
          ringClass = "border border-lime-400 bg-lime-400/15 font-bold text-lime-300 rounded-full";
        } else if (isToday) {
          bgStyle = "border border-[var(--lime)] rounded-full font-bold";
        }

        let fireIconHtml = hasWorkout ? `<i data-lucide="flame" class="w-3 h-3 text-amber-400 absolute -bottom-1"></i>` : "";

        html += `<div class="py-1.5 flex flex-col items-center justify-center relative"><span class="w-8 h-8 flex items-center justify-center text-xs ${ringClass} ${bgStyle}">${day}</span>${fireIconHtml}</div>`;
      }

      const totalCells = startingDay + totalDays;
      const nextDaysCount = totalCells <= 35 ? (35 - totalCells) : (42 - totalCells);
      for (let i = 1; i <= nextDaysCount; i++) {
        html += `<div class="py-2 text-[var(--muted)] opacity-30 text-xs">${i}</div>`;
      }

      grid.innerHTML = html;
      lucide.createIcons();
    }

    function renderWeeklyTargetCard() {
      const h = state.history;
      const now = new Date();
      
      // Cari hari Senin di minggu berjalan
      const currentDay = now.getDay();
      const distanceToMon = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + distanceToMon);
      monday.setHours(0,0,0,0);

      const workoutDates = new Set(
        h.map(s => new Date(s.endedAt).toDateString())
      );

      let weekCount = 0;
      const weekDates = [];

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = d.toDateString();
        const hasWorkout = workoutDates.has(dateStr);
        
        if (hasWorkout) weekCount++;
        
        weekDates.push({
          dateNum: d.getDate(),
          isToday: dateStr === now.toDateString(),
          hasWorkout: hasWorkout
        });
      }

      const goal = state.settings.weeklyGoal || 4;
      const percent = Math.min(100, Math.round((weekCount / goal) * 100));

      // Update Badge & Progress Bar
      const pill = document.getElementById("weekly-pill-count");
      if (pill) pill.textContent = `${weekCount}/${goal}`;

      const pctLabel = document.getElementById("weekly-progress-percent");
      if (pctLabel) pctLabel.textContent = `${percent}%`;

      const barFill = document.getElementById("weekly-progress-bar-fill");
      if (barFill) barFill.style.width = `${percent}%`;

      // Render Baris Hari (Mon - Sun)
      const daysBar = document.getElementById("weekly-days-bar");
      if (daysBar) {
        const dayNames = currentLanguage()==="en" ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
        daysBar.innerHTML = weekDates.map((item, idx) => {
          let circleStyle = "w-8 h-8 rounded-full flex items-center justify-center text-xs mx-auto font-medium text-[var(--muted)]";
          let indicatorStyle = "h-1 w-full rounded-full bg-[var(--line)] mb-2";

          if (item.hasWorkout) {
            circleStyle = "w-8 h-8 rounded-full flex items-center justify-center text-xs mx-auto font-extrabold bg-[var(--lime)] text-[#142009] shadow-sm";
            indicatorStyle = "h-1 w-full rounded-full bg-[var(--lime)] mb-2";
          } else if (item.isToday) {
            circleStyle = "w-8 h-8 rounded-full flex items-center justify-center text-xs mx-auto font-extrabold border-2 border-[var(--lime)] text-[var(--lime)]";
          }

          return `
            <div class="flex flex-col items-center">
              <span class="text-[11px] font-bold muted mb-1.5">${dayNames[idx]}</span>
              <div class="${indicatorStyle}"></div>
              <div class="${circleStyle}">${item.dateNum}</div>
            </div>
          `;
        }).join("");
      }
    }

    function renderDashboard(){
      const currentHour = new Date().getHours();
      let greetingKey = "SELAMAT MALAM,";
      if (currentHour >= 3 && currentHour < 11) {
        greetingKey = "SELAMAT PAGI,";
      } else if (currentHour >= 11 && currentHour < 15) {
        greetingKey = "SELAMAT SIANG,";
      } else if (currentHour >= 15 && currentHour < 18) {
        greetingKey = "SELAMAT SORE,";
      }
      const greeting = currentLanguage()==="en" ? tr(greetingKey) : tr(greetingKey).replace(/,$/,"");

      document.getElementById("siap-bergerak-label").innerHTML = `${greeting}, <span id="profile-name-display">${esc((state.settings.userName || "COYY").toUpperCase())}</span>`;
      
      updateHeaderInitial();
      renderCalendar();
      renderWeeklyTargetCard();

      const upcoming=state.routines[0];
      document.getElementById("next-workout-copy").textContent=upcoming ? (currentLanguage()==="en" ? `${upcoming.name} · ${upcoming.exerciseIds.length} exercises ready.` : `${upcoming.name} · ${upcoming.exerciseIds.length} exercise siap dijalankan.`) : tr("Buat routine pertama untuk mulai mencatat progress.");
      const active=state.activeSession, activeCopy=document.getElementById("active-session-copy"), resume=document.getElementById("resume-workout");
      activeCopy.textContent=active ? (currentLanguage()==="en" ? `Session ${routineById(active.routineId)?.name||"Workout"} is still active.` : `Sesi ${routineById(active.routineId)?.name||"Workout"} masih berjalan.`) : tr("Belum ada sesi aktif.");
      resume.classList.toggle("hidden",!active);
    }
    
    function renderRoutines(){
      const list=document.getElementById("routine-list"), empty=document.getElementById("routine-empty");
      list.innerHTML=""; 
      empty.classList.toggle("hidden", state.routines.length !== 0);
      
      state.routines.forEach(r => {
        const el = document.createElement("article"); 
        el.className = "panel p-6 flex flex-col justify-between transition-all duration-200 hover:border-[var(--lime)]/50 group";
        
        const previewExercises = r.exerciseIds.slice(0, 3).map(id => {
          const ex = exerciseById(id);
          return ex ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-2)] text-xs font-medium text-[var(--text)] border border-[var(--line)]"><i data-lucide="dumbbell" class="w-3 h-3 text-[var(--lime)]"></i>${esc(ex.name)}</span>` : "";
        }).join("");
        
        const remainingCount = r.exerciseIds.length > 3 ? `<span class="inline-flex items-center px-2 py-1 rounded-lg bg-[var(--surface-2)] text-xs font-medium muted">+${r.exerciseIds.length - 3} lainnya</span>` : "";

        el.innerHTML = `
          <div>
            <div class="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 class="font-extrabold text-xl tracking-tight group-hover:text-[var(--lime)] transition-colors">${esc(r.name)}</h3>
                <p class="muted text-sm mt-1 leading-relaxed">${esc(r.description || "Tidak ada deskripsi rutin.")}</p>
              </div>
              <button class="icon-btn edit-routine shrink-0 hover:bg-[var(--surface-2)] hover:border-[var(--lime)]/40 transition-colors" data-id="${r.id}" aria-label="Edit ${esc(r.name)}" title="Edit Routine">
                <i data-lucide="pencil" class="w-4 h-4"></i>
              </button>
            </div>
            
            <div class="flex flex-wrap gap-1.5 my-4">
              ${r.days.map(d => `<span class="px-2.5 py-1 rounded-md bg-[var(--lime)]/10 text-[var(--lime)] border border-[var(--lime)]/20 text-xs font-bold">${d}</span>`).join("")}
              ${!r.days.length ? `<span class="muted text-xs italic">Belum ada hari dijadwalkan</span>` : ""}
            </div>

            <div class="pt-3 border-t border-[var(--line)]">
              <p class="text-xs font-bold uppercase tracking-wider muted mb-2">Daftar Gerakan (${r.exerciseIds.length})</p>
              <div class="flex flex-wrap gap-1.5">
                ${previewExercises || `<span class="muted text-xs italic">Belum ada exercise</span>`}
                ${remainingCount}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2.5 mt-6 pt-4 border-t border-[var(--line)]">
            <button class="lime-btn px-4 flex-1 flex items-center justify-center gap-2 start-routine" data-id="${r.id}">
              <i data-lucide="play" class="w-4 h-4 fill-current"></i> Mulai Latihan
            </button>
            <button class="danger-btn px-3 flex items-center justify-center delete-routine hover:bg-rose-500/20 transition-colors" data-id="${r.id}" aria-label="Hapus ${esc(r.name)}" title="Hapus Routine">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        `;
        list.appendChild(el);
      });
      lucide.createIcons();
    }
    
    function renderExercises(){
      const q=document.getElementById("exercise-search").value.toLowerCase();
      const wrapper = document.getElementById("custom-muscle-filter");
      const m = wrapper.querySelector('.custom-option.selected')?.dataset.value || "";
      
      const filtered=state.exercises.filter(e=>(!m||e.muscle===m)&&(`${e.name} ${e.equipment} ${e.muscle}`).toLowerCase().includes(q));
      const list=document.getElementById("exercise-list"), empty=document.getElementById("exercise-empty"); 
      list.innerHTML=""; 
      empty.classList.toggle("hidden",filtered.length!==0);
      
      filtered.forEach(e=>{
        const el=document.createElement("article");
        el.className="panel p-5 flex flex-col justify-between transition-all duration-200 hover:border-[var(--lime)]/50 group";
        el.innerHTML=`
          <div>
            <div class="flex justify-between items-start gap-3">
              <div>
                <h3 class="font-extrabold text-base group-hover:text-[var(--lime)] transition-colors">${esc(e.name)}</h3>
                <p class="muted text-xs mt-1 flex items-center gap-1.5"><i data-lucide="wrench" class="w-3 h-3 text-[var(--lime)]"></i>${esc(e.equipment)}</p>
              </div>
              ${e.isCustom ? `<button class="icon-btn delete-exercise shrink-0 text-rose-400 bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20 transition-colors" data-id="${e.id}" aria-label="Hapus ${esc(e.name)}" title="Hapus Exercise"><i data-lucide="trash-2" class="w-4 h-4"></i></button>` : ""}
            </div>
          </div>
          <div class="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--line)]">
            <span class="chip text-xs font-bold text-[var(--lime)] bg-[var(--lime)]/10 border-[var(--lime)]/20">${esc(e.muscle)}</span>
            ${e.isCustom ? `<span class="chip text-xs font-bold text-amber-400 bg-amber-500/10 border-amber-500/20 ml-auto">Custom</span>` : ""}
          </div>
        `;
        list.appendChild(el);
      });
      lucide.createIcons();
    }
    
    function populateSelects(){
      const workoutOptsContainer = document.getElementById("workout-routine-options");
      if (state.routines.length === 0) {
        workoutOptsContainer.innerHTML = '<div class="custom-option selected" data-value="">(Belum ada routine, buat dulu yuk!)</div>';
        document.querySelector("#custom-workout-routine .selected-label").textContent = "(Belum ada routine, buat dulu yuk!)";
      } else {
        workoutOptsContainer.innerHTML = '<div class="custom-option selected" data-value="">Pilih routine...</div>';
        state.routines.forEach(r => {
          workoutOptsContainer.insertAdjacentHTML("beforeend", `<div class="custom-option" data-value="${r.id}">${esc(r.name)}</div>`);
        });
        document.querySelector("#custom-workout-routine .selected-label").textContent = "Pilih routine...";
      }

      initCustomSelect("custom-workout-routine");
    }

    // --- MULAI WORKOUT DENGAN PEMISAHAN CARDIO (MENIT & KM) & BEBAN ---
    function startWorkout(routineId) {
      const routine = routineById(routineId);
      if (!routine) return;

      const exercisesData = routine.exercises || routine.exerciseIds.map(id => {
        const ex = exerciseById(id);
        const isCardio = ex && ex.muscle === "Cardio";
        return {
          id: id,
          sets: isCardio ? [{ reps: 15, weight: 2 }] : [{ reps: 10, weight: 0 }, { reps: 10, weight: 0 }, { reps: 10, weight: 0 }]
        };
      });

      state.activeSession = {
        id: uid(),
        routineId: routine.id,
        startedAt: new Date().toISOString(),
        elapsedSeconds: 0,
        pausedSeconds: 0,
        currentExerciseIndex: 0,
        exercises: exercisesData.map(item => {
          const ex = exerciseById(item.id);
          const isCardio = ex && ex.muscle === "Cardio";
          return {
            exerciseId: item.id,
            notes: "",
            sets: item.sets.map(s => ({
              reps: s.reps || (isCardio ? 15 : 10),
              weight: s.weight || (isCardio ? 2 : 0),
              completedAt: null
            }))
          };
        })
      };

      save();
      renderDashboard();
      navigate("workout");
    }
    
    function currentExercise(){ return state.activeSession?.exercises[state.activeSession.currentExerciseIndex]; }
    
    function renderWorkout(){
      const active=state.activeSession;
      document.getElementById("workout-start-state").classList.toggle("hidden",!!active);
      document.getElementById("workout-live-state").classList.toggle("hidden",!active);
      if(!active){populateSelects();return;}
      
      const r=routineById(active.routineId), ex=currentExercise(), e=exerciseById(ex.exerciseId);
      const isCardio = e && e.muscle === "Cardio";

      document.getElementById("workout-routine-name").textContent=r?.name||"Workout";
      document.getElementById("exercise-position").textContent=currentLanguage()==="en" ? `EXERCISE ${active.currentExerciseIndex+1} OF ${active.exercises.length}` : `LATIHAN ${active.currentExerciseIndex+1} DARI ${active.exercises.length}`;
      document.getElementById("active-exercise-name").textContent=e?.name||"Exercise";
      document.getElementById("active-exercise-muscle").textContent=e?.muscle||"";
      
      document.getElementById("col-header-1").textContent = isCardio ? "Menit" : "Reps";
      document.getElementById("col-header-2").textContent = isCardio ? "KM" : "Weight (kg)";

      const previous=[...state.history].reverse().flatMap(s=>s.exercises).find(x=>x.exerciseId===e?.id&&x.sets.some(s=>s.completedAt));
      document.getElementById("previous-performance").textContent=previous ? (currentLanguage()==="en" ? "Previous: " : "Sebelumnya: ") + previous.sets.filter(s=>s.completedAt).map(s=>isCardio ? `${s.reps} min · ${s.weight} km` : `${s.reps}×${s.weight}kg`).join(" · ") : (currentLanguage()==="en" ? "No previous performance recorded." : "Belum ada catatan performance sebelumnya.");
      document.getElementById("exercise-notes").value=ex.notes||"";

      const list = document.getElementById("set-list");
      list.innerHTML = "";

      ex.sets.forEach((set, i) => {
        const row = document.createElement("div");
        row.className = "grid grid-cols-[44px_1fr_1fr_44px] gap-2 items-center border border-[var(--line)] rounded-xl p-2 " + (set.completedAt ? "set-done" : "");
        
        row.innerHTML = `
          <span class="text-center font-bold text-xs">${i + 1}</span>
          <input data-field="reps" data-index="${i}" inputmode="numeric" type="number" min="0" class="field !min-h-[40px] !text-xs workout-set-field" value="${esc(set.reps)}" ${set.completedAt ? "disabled" : ""}>
          <input data-field="weight" data-index="${i}" inputmode="decimal" type="number" min="0" step="0.1" class="field !min-h-[40px] !text-xs workout-set-field" value="${esc(set.weight)}" ${set.completedAt ? "disabled" : ""}>
          <button type="button" class="set-circle-btn complete-set ${set.completedAt ? "completed" : ""}" data-index="${i}" title="${set.completedAt ? "Selesai" : "Tandai Selesai"}">
            <i data-lucide="check" class="w-4 h-4 stroke-[2.5]"></i>
          </button>
        `;
        list.appendChild(row);
      });

      list.querySelectorAll(".workout-set-field").forEach(input => {
        input.oninput = (e) => {
          const idx = parseInt(e.target.dataset.index);
          const field = e.target.dataset.field;
          ex.sets[idx][field] = parseFloat(e.target.value) || 0;
          save();
        };
      });

      list.querySelectorAll(".complete-set").forEach(btn => {
        btn.onclick = (e) => {
          const idx = parseInt(e.currentTarget.dataset.index);
          const targetSet = ex.sets[idx];
          if (targetSet.completedAt) {
            targetSet.completedAt = null;
          } else {
            targetSet.completedAt = new Date().toISOString();
            active.restRemaining = state.settings.restSeconds || 90;
            active.restPaused = false;
          }
          save();
          renderWorkout();
        };
      });

      const all=active.exercises.flatMap(x=>x.sets), done=all.filter(s=>s.completedAt).length; 
      document.getElementById("workout-progress-label").textContent=done+"/"+all.length+" Set";
      document.getElementById("workout-progress-bar").style.width=(all.length?done/all.length*100:0)+"%";
      document.getElementById("previous-exercise").disabled=active.currentExerciseIndex===0; 
      document.getElementById("next-exercise").textContent=active.currentExerciseIndex===active.exercises.length-1 ? (currentLanguage()==="en" ? "Finish Workout →" : "Selesai workout →") : (currentLanguage()==="en" ? "Next Exercise →" : "Exercise berikutnya →");
      
      updateTimers(); 
      lucide.createIcons();
    }
    
    function elapsed(){
      const a=state.activeSession;
      if(!a)return 0;
      return Math.floor((Date.now()-new Date(a.startedAt).getTime())/1000)-(a.pausedSeconds||0);
    }
    
    function updateTimers(){
      if(!state.activeSession)return;
      document.getElementById("workout-elapsed").textContent=formatDuration(elapsed());
      const a=state.activeSession, card=document.getElementById("rest-timer-card");
      card.classList.toggle("hidden",!a.restRemaining);
      document.getElementById("rest-time").textContent=formatDuration(a.restRemaining);
      document.getElementById("rest-pause").textContent=a.restPaused ? (currentLanguage()==="en" ? "Resume" : "Lanjut") : (currentLanguage()==="en" ? "Pause" : "Jeda");
    }
    
    function tick(){
      const a=state.activeSession;
      if(!a)return; 
      if(a.restRemaining && !a.restPaused){
        a.restRemaining--;
        if(a.restRemaining<=0){
          a.restRemaining=0;
          a.restPaused=true;
          toast(currentLanguage()==="en" ? "Rest time is over. Ready for the next set!" : "Waktu istirahat selesai. Siap set berikutnya!");
        }
        save();
      }
      updateTimers();
    }
    
    function endWorkout(){
      const a=state.activeSession;
      if(!a)return;
      const totalSets=a.exercises.reduce((n,x)=>n+x.sets.filter(s=>s.completedAt).length,0);
      if(!totalSets){toast(currentLanguage()==="en" ? "Complete at least one set before ending the workout." : "Selesaikan minimal satu set sebelum mengakhiri workout.");return;}
      
      const durationSeconds = elapsed();
      const durationMinutes = durationSeconds / 60;
      const userWeight = state.settings.weight || 65;
      const caloriesBurned = Math.round(0.05 * userWeight * durationMinutes);

      const endedAt=new Date().toISOString();
      state.history.unshift({id:a.id,routineId:a.routineId,startedAt:a.startedAt,endedAt,duration:durationSeconds,exercises:a.exercises,caloriesBurned});
      state.activeSession=null;
      save();
      renderDashboard();
      navigate("history");
      toast(currentLanguage()==="en" ? `Workout saved. Burned ±${caloriesBurned} kcal!` : `Workout tersimpan. Membakar ±${caloriesBurned} kkal!`);
    }

    function renderOverviewMetrics(){
      let sessions = state.history;

      const totalCalories = sessions.reduce((n,s)=>n+(s.caloriesBurned||0),0);
      const totalSeconds = sessions.reduce((n,s)=>n+(s.duration||0),0);
      const avgSeconds = sessions.length > 0 ? Math.round(totalSeconds / sessions.length) : 0;

      document.getElementById("history-session-count").textContent = sessions.length;
      document.getElementById("history-calories").textContent = fmtKkal(totalCalories);
      document.getElementById("history-total-time").textContent = formatTimeDetailed(totalSeconds);
      document.getElementById("history-avg-duration").textContent = formatTimeDetailed(avgSeconds);
      document.getElementById("workouts-logged-count").textContent = currentLanguage()==="en" ? `${state.history.length} workouts logged` : `${state.history.length} workout tercatat`;
      
      renderOverviewCharts();
    }
    
    function renderHistory(){
      const activeTimeChip = document.querySelector(".history-time-chip.active");
      const timeFilter = activeTimeChip ? activeTimeChip.dataset.time : "all";

      let sessions = state.history;

      const now = new Date();
      const todayStr = now.toDateString();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      if (timeFilter === "today") {
        sessions = sessions.filter(s => new Date(s.endedAt).toDateString() === todayStr);
      } else if (timeFilter === "week") {
        sessions = sessions.filter(s => new Date(s.endedAt) >= oneWeekAgo);
      }

      document.getElementById("workouts-logged-count").textContent = currentLanguage()==="en" ? `${state.history.length} workouts logged` : `${state.history.length} workout tercatat`;
      
      const list=document.getElementById("history-list"),empty=document.getElementById("history-empty");
      list.innerHTML="";
      empty.classList.toggle("hidden",sessions.length!==0);
      
      sessions.forEach(s=>{
        const r=routineById(s.routineId);
        const calText = s.caloriesBurned ? `${s.caloriesBurned} kkal` : `0 kkal`;
        const setTotal = s.exercises.reduce((n,e)=>n+e.sets.filter(x=>x.completedAt).length,0);
        
        const dObj = new Date(s.endedAt);
        const dateStr = isNaN(dObj.getTime()) ? s.endedAt : dObj.toLocaleDateString("id-ID", {day: 'numeric', month: 'long', year: 'numeric'}) + " · " + formatDuration(s.duration);

        const el=document.createElement("article");
        el.className="panel p-4 flex items-center justify-between gap-4";
        el.innerHTML=`
          <div>
            <h3 class="font-extrabold text-base">${esc(r?.name||"Routine dihapus")}</h3>
            <p class="muted text-xs mt-0.5">${dateStr}</p>
            <div class="flex items-center gap-6 mt-3">
              <div><p class="muted text-[10px] font-bold uppercase tracking-wider">Set</p><strong class="text-sm">${setTotal}</strong></div>
              <div><p class="muted text-[10px] font-bold uppercase tracking-wider">Kalori</p><strong class="text-sm text-lime-300"><i data-lucide="flame" class="w-3 h-3 inline text-amber-400"></i> ${calText}</strong></div>
            </div>
          </div>
          <div>
            <button class="danger-btn px-3 py-2 delete-history-session" data-id="${s.id}" title="Hapus sesi ini"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
          </div>
        `;
        list.appendChild(el);
      });
      renderOverviewMetrics();
      lucide.createIcons();
    }
    
    function renderOverviewCharts() {
      renderWorkoutsPerWeekChart();
      renderCaloriesPerWorkoutChart();
    }

    function renderWorkoutsPerWeekChart() {
      const area = document.getElementById("workouts-per-week-chart");
      const history = state.history;

      if (history.length === 0) {
        area.innerHTML = `<div class="h-full grid place-items-center muted text-sm text-center px-4">${currentLanguage()==="en" ? "No workout history to display in the weekly chart." : "Belum ada riwayat workout untuk ditampilkan di grafik mingguan."}</div>`;
        return;
      }

      const weeksMap = {};
      history.forEach(s => {
        const d = new Date(s.endedAt);
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const monday = new Date(d);
        monday.setDate(d.getDate() + diff);
        monday.setHours(0, 0, 0, 0);
        const key = monday.toISOString().slice(0, 10);
        if (!weeksMap[key]) weeksMap[key] = { date: new Date(monday), count: 0 };
        weeksMap[key].count++;
      });

      const today = new Date();
      const currentDay = today.getDay();
      const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const currentMonday = new Date(today);
      currentMonday.setDate(today.getDate() + diffToMonday);
      currentMonday.setHours(0, 0, 0, 0);

      const sortedWeeks = [];
      for (let i = 4; i >= 0; i--) {
        const monday = new Date(currentMonday);
        monday.setDate(currentMonday.getDate() - (i * 7));
        const key = monday.toISOString().slice(0, 10);
        sortedWeeks.push({ date: monday, count: weeksMap[key]?.count || 0 });
      }

      const counts = sortedWeeks.map(w => w.count);
      const maxCount = Math.max(...counts, 4);
      const w = 600, h = 170, barWidth = 45;
      const gap = (w - 60 - (sortedWeeks.length * barWidth)) / (sortedWeeks.length - 1);
      const monthNamesShort = currentLanguage()==="en" ? ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] : ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];

      let svgContent = `<svg viewBox="0 0 ${w} ${h}" class="w-full h-full" role="img" aria-label="${currentLanguage()==="en" ? "Workouts per Week Chart" : "Grafik Workout per Minggu"}">
        <line x1="30" y1="${h-25}" x2="${w-30}" y2="${h-25}" stroke="var(--line)"/>
        <text x="20" y="25" fill="var(--muted)" font-size="10">${maxCount}</text>
        <text x="20" y="${(h-25)/2}" fill="var(--muted)" font-size="10">${Math.round(maxCount/2)}</text>
        <text x="20" y="${h-30}" fill="var(--muted)" font-size="10">0</text>`;

      sortedWeeks.forEach((item, i) => {
        const x = 40 + i * (barWidth + gap);
        const barHeight = item.count === 0 ? 0 : (item.count / maxCount) * (h - 55);
        const y = (h - 25) - barHeight;
        const label = `${item.date.getDate()} ${monthNamesShort[item.date.getMonth()]}`;
        svgContent += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="6" fill="#88F914"/>
          <text x="${x + barWidth/2}" y="${h-10}" text-anchor="middle" fill="var(--muted)" font-size="10">${label}</text>`;
      });
      svgContent += `</svg>`;
      area.innerHTML = svgContent;
    }

    function renderCaloriesPerWorkoutChart() {
      const area = document.getElementById("calories-per-workout-chart");
      const history = [...state.history].sort((a,b) => new Date(a.endedAt) - new Date(b.endedAt)).slice(-8);

      if(history.length === 0) {
        area.innerHTML = '<div class="h-full grid place-items-center muted text-sm text-center px-4">Belum ada data kalori workout.</div>';
        return;
      }

      const cals = history.map(s => s.caloriesBurned || 0);
      const maxCal = Math.max(...cals, 600);
      const minCal = 0;
      const w = 600, h = 170;

      const points = history.map((s, i) => {
        const x = history.length === 1 ? w/2 : 30 + i * (w - 60) / (history.length - 1);
        const y = (h - 25) - ((s.caloriesBurned || 0) - minCal) / (maxCal - minCal || 1) * (h - 50);
        return { x, y, cal: s.caloriesBurned || 0, date: new Date(s.endedAt) };
      });

      const coords = points.map(p => `${p.x},${p.y}`).join(" ");
      const firstX = points[0].x;
      const lastX = points[points.length - 1].x;
      const bottomY = h - 25;
      const areaCoords = `${firstX},${bottomY} ${coords} ${lastX},${bottomY}`;

      const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

      let svgContent = `
        <svg viewBox="0 0 ${w} ${h}" class="w-full h-full" role="img" aria-label="Grafik Calories per Workout">
          <defs>
            <linearGradient id="calGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#bcf04a" stop-opacity="0.35"/>
              <stop offset="100%" stop-color="#bcf04a" stop-opacity="0.0"/>
            </linearGradient>
          </defs>
          <line x1="30" y1="${h-25}" x2="${w-30}" y2="${h-25}" stroke="var(--line)"/>
          <text x="15" y="25" fill="var(--muted)" font-size="10">${maxCal}</text>
          <text x="15" y="${(h-25)/2}" fill="var(--muted)" font-size="10">${Math.round(maxCal/2)}</text>
          <text x="15" y="${h-30}" fill="var(--muted)" font-size="10">0</text>
          
          <polygon points="${areaCoords}" fill="url(#calGradient)"/>
          <polyline fill="none" stroke="#bcf04a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" points="${coords}"/>
      `;

      points.forEach(p => {
        const label = `${p.date.getDate()} ${monthNamesShort[p.date.getMonth()]}`;
        svgContent += `
          <circle cx="${p.x}" cy="${p.y}" r="4" fill="#bcf04a"/>
          <text x="${p.x}" y="${h-10}" text-anchor="middle" fill="var(--muted)" font-size="9">${label}</text>
        `;
      });

      svgContent += `</svg>`;
      area.innerHTML = svgContent;
    }

    function exportPDF() {
      if(state.history.length === 0) {
        toast("Belum ada data history latihan untuk didownload.");
        return;
      }
      toast("Sedang meracik file PDF...");
      const now = new Date();
      let sessionsToExport = [];
      const todayStr = now.toDateString();
      sessionsToExport = state.history.filter(s => new Date(s.endedAt).toDateString() === todayStr);
      let titleText = "Laporan Progress Harian";
      let subtitleText = `Tanggal: ${now.toLocaleDateString("id-ID", {dateStyle: 'full'})}`;

      if(sessionsToExport.length === 0) {
        sessionsToExport = [state.history[0]];
        subtitleText = `Sesi terakhir (${new Date(state.history[0].endedAt).toLocaleDateString("id-ID")})`;
      }

      const totalCalories = sessionsToExport.reduce((acc, s) => acc + (s.caloriesBurned || 0), 0);
      const totalSesi = sessionsToExport.length;

      let htmlContent = `
        <div id="pdf-render-container" style="font-family: 'DM Sans', sans-serif; color: #17221b; padding: 32px; background: #ffffff; width: 100%; box-sizing: border-box; position: relative; min-height: 1000px;">
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.5; z-index: 0; pointer-events: none; text-align: center;">
            <img src="logo_newwm.jpg" alt="Watermark Logo" style="width: 380px; height: 380px; object-fit: contain; filter: grayscale(100%);">
          </div>
          <div style="position: relative; z-index: 1;">
            <div style="border-bottom: 3px solid #bcf04a; padding-bottom: 18px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                  <div style="width: 32px; height: 32px; background: #111923; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    <img src="new_logoprofile.png" alt="Logo" style="width: 100%; height: 100%; object-fit: cover;">
                  </div>
                  <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #111923; letter-spacing: -0.02em;">GYMFlow REPORT</h1>
                </div>
                <p style="margin: 0; font-size: 13px; color: #647469; font-weight: 600;">${titleText}</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0; font-size: 11px; color: #647469; font-weight: 500;">${subtitleText}</p>
                <p style="margin: 3px 0 0 0; font-size: 11px; color: #17221b;">Nama: <strong>${esc(state.settings.userName)}</strong> &bull; Berat: <strong>${state.settings.weight} ${state.settings.weightUnit}</strong></p>
              </div>
            </div>

            <div style="display: flex; gap: 14px; margin-bottom: 24px;">
              <div style="flex: 1; background: #f8faf8; padding: 14px 18px; border-radius: 12px; border: 1px solid #d6e0d7; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
                <span style="font-size: 10px; color: #647469; font-weight: 700; display: block; letter-spacing: 0.05em;">TOTAL SESI</span>
                <strong style="font-size: 20px; color: #17221b; display: block; margin-top: 2px;">${totalSesi} Sesi</strong>
              </div>
              <div style="flex: 1; background: #f8faf8; padding: 14px 18px; border-radius: 12px; border: 1px solid #d6e0d7; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
                <span style="font-size: 10px; color: #647469; font-weight: 700; display: block; letter-spacing: 0.05em;">KALORI TERBAKAR</span>
                <strong style="font-size: 20px; color: #17221b; display: block; margin-top: 2px;">${fmtKkal(totalCalories)}</strong>
              </div>
            </div>

            <h3 style="font-size: 14px; font-weight: 800; margin-bottom: 12px; color: #111923; text-transform: uppercase; letter-spacing: 0.03em;">Rincian Sesi Latihan</h3>
      `;

      sessionsToExport.forEach((s, idx) => {
        const rName = routineById(s.routineId)?.name || "Custom Workout";
        const dObj = new Date(s.endedAt);
        const dateStr = isNaN(dObj.getTime()) ? s.endedAt : dObj.toLocaleDateString("id-ID", {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'});
        
        htmlContent += `
          <div style="margin-bottom: 14px; background: #ffffff; border: 1px solid #d6e0d7; border-radius: 12px; padding: 14px 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #edf2ed; padding-bottom: 8px;">
              <div>
                <strong style="font-size: 13px; color: #111923;">#${idx + 1} &bull; ${esc(rName)}</strong>
                <span style="font-size: 11px; color: #647469; margin-left: 10px;">(±${s.caloriesBurned || 0} kkal)</span>
              </div>
              <span style="font-size: 11px; color: #647469; background: #f0f4f0; padding: 3px 8px; border-radius: 6px;">${dateStr} (${formatDuration(s.duration)})</span>
            </div>
        `;

        s.exercises.forEach(ex => {
          const exObj = exerciseById(ex.exerciseId);
          const isCardio = exObj && exObj.muscle === "Cardio";
          const completedSets = ex.sets.filter(st => st.completedAt);
          if(completedSets.length > 0) {
            htmlContent += `
              <div style="font-size: 12px; margin-top: 6px; padding: 6px 10px; background: #fbfcfb; border-radius: 8px; border-left: 3px solid #bcf04a; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 700; color: #17221b;">${esc(exObj?.name || "Exercise")}</span>
                <span style="color: #4a5568; font-weight: 500;">${completedSets.map(st => isCardio ? `${st.reps} mnt · ${st.weight} km` : `${st.reps} reps × ${st.weight} kg`).join(" &nbsp;|&nbsp; ")}</span>
              </div>
            `;
          }
        });
        htmlContent += `</div>`;
      });

      htmlContent += `
            <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 14px;">
              Dokumen ini digenerate secara otomatis oleh sistem GYMFlow Tracker &copy; 2026
            </div>
          </div>
        </div>
      `;

      const wrapper = document.createElement("div");
      wrapper.style.position = "absolute";
      wrapper.style.left = "-9999px";
      wrapper.style.top = "0";
      wrapper.style.width = "794px";
      wrapper.innerHTML = htmlContent;
      document.body.appendChild(wrapper);

      const opt = {
        margin:       10,
        filename:     `GYMFlow-Progress-${now.toISOString().slice(0,10)}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      setTimeout(() => {
        html2pdf().from(wrapper.firstElementChild).set(opt).save().then(() => {
          wrapper.remove();
          toast("PDF berhasil didownload!");
        }).catch(err => {
          wrapper.remove();
          toast("Gagal mendownload PDF.");
          console.error(err);
        });
      }, 100);
    }

    state=loadState();
    setTheme();

    document.addEventListener("click", (e) => {
      document.querySelectorAll(".custom-select-wrapper.open").forEach(wrapper => {
        if (!wrapper.contains(e.target)) {
          wrapper.classList.remove("open");
          const trigger = wrapper.querySelector(".custom-select-trigger");
          if (trigger) trigger.setAttribute("aria-expanded", "false");
        }
      });
    });

    document.addEventListener("DOMContentLoaded",()=>{
      setTimeout(() => {
        const splash = document.getElementById("splash-screen");
        if(splash) {
          splash.classList.add("fade-out");
          setTimeout(() => splash.remove(), 600);
        }
      }, 2500);

      populateSelects();
      
      initCustomSelect("custom-muscle-filter", () => renderExercises());
      initCustomSelect("custom-exercise-muscle-select", (val) => {
        document.getElementById("custom-exercise-muscle-select").dataset.value = val;
      });

      renderDashboard();renderRoutines();renderExercises();renderWorkout();renderHistory();
      initLanguageCustomSelect();
      applyLanguage();
      lucide.createIcons();

      const i18nObserver = new MutationObserver(() => {
        clearTimeout(window.__gymflowI18nTimer);
        window.__gymflowI18nTimer = setTimeout(() => applyLanguage(), 0);
      });
      i18nObserver.observe(document.getElementById("app") || document.body, {childList:true, subtree:true});

      elapsedInterval=setInterval(tick,1000);
      
      const handleTabNavigation = (targetTab) => {
        navigate(targetTab);
        document.querySelectorAll(".mobile-nav-btn").forEach(btn => {
          btn.classList.toggle("active", btn.dataset.tab === targetTab);
        });
      };

      document.querySelectorAll("[data-tab]").forEach(b => {
        b.addEventListener("click", () => handleTabNavigation(b.dataset.tab));
      });
      
      const triggerReset = () => {
        showConfirm(currentLanguage()==="en" ? "Reset data?" : "Reset data?",currentLanguage()==="en" ? "All routines, history, active sessions, and custom exercises on this device will be deleted." : "Semua routine, history, sesi aktif, dan exercise custom di perangkat ini akan dihapus.","Reset",()=>{
          state=seedState();
          save();
          setTheme();
          populateSelects();
          renderDashboard();
          renderRoutines();
          renderExercises();
          renderWorkout();
          renderHistory();
          renderWeightTab();
          updateHeaderInitial();
          toast(currentLanguage()==="en" ? "Data reset successfully." : "Data berhasil direset.");
        });
      };

      document.getElementById("desktop-reset").onclick = triggerReset;
      document.getElementById("open-profile-btn").onclick = openProfileModalCustom;
      document.getElementById("export-pdf-daily").onclick = () => exportPDF();

      document.querySelectorAll(".target-pill").forEach(pill => {
        pill.onclick = (e) => {
          const val = parseInt(e.currentTarget.dataset.val);
          state.settings.weeklyGoal = val;
          renderProfileModal();
        };
      });

      document.getElementById("profile-form").onsubmit = e => {
        e.preventDefault();
        const nameVal = document.getElementById("profile-name-input").value.trim();
        const ageVal = parseInt(document.getElementById("profile-age-input").value);
        const heightVal = parseFloat(document.getElementById("profile-tb").value);
        const weightVal = parseFloat(document.getElementById("profile-bb").value);

        if(!nameVal) {
          toast(currentLanguage()==="en" ? "Name is required!" : "Nama wajib diisi!");
          return;
        }

        state.settings.userName = nameVal;
        if(!isNaN(ageVal)) state.settings.age = ageVal;
        if(!isNaN(heightVal)) state.settings.height = heightVal;
        if(!isNaN(weightVal)) {
          state.settings.weight = weightVal;
        }

        save();
        closeModal("profile-modal");
        renderDashboard();
        updateHeaderInitial();
        toast(currentLanguage()==="en" ? "Profile saved successfully!" : "Profil berhasil disimpan!");
      };

      document.getElementById("weight-form").onsubmit = e => {
        e.preventDefault();
        const wVal = parseFloat(document.getElementById("weight-input-val").value);
        const dVal = document.getElementById("weight-date-val").value;
        if(isNaN(wVal) || !dVal) {
          toast(currentLanguage()==="en" ? "Please enter a valid weight and date." : "Mohon masukkan berat dan tanggal yang valid.");
          return;
        }
        
        state.settings.weight = wVal;
        if(!state.weightHistory) state.weightHistory = [];
        
        const existingIdx = state.weightHistory.findIndex(item => item.date === dVal);
        if(existingIdx !== -1) {
          state.weightHistory[existingIdx].weight = wVal;
        } else {
          state.weightHistory.push({date: dVal, weight: wVal});
        }

        save();
        closeModal("weight-modal");
        renderWeightTab();
        renderDashboard();
        toast(currentLanguage()==="en" ? "Weight logged successfully!" : "Berat badan berhasil dicatat!");
      };

      document.getElementById("dashboard-start").onclick=()=>handleTabNavigation("workout");
      document.getElementById("resume-workout").onclick=()=>handleTabNavigation("workout");
      document.getElementById("open-routine-builder").onclick=()=>openRoutineBuilder();
      document.getElementById("open-exercise-builder").onclick=()=>openModal("exercise-modal");
      document.querySelectorAll(".close-modal").forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
      document.getElementById("confirm-cancel").onclick=()=>closeModal("confirm-modal");
      document.getElementById("confirm-action").onclick=()=>{closeModal("confirm-modal");if(confirmCallback)confirmCallback();};
      document.getElementById("exercise-search").oninput=renderExercises;
      document.getElementById("builder-exercise-search").oninput=renderBuilderLibrary;

      document.getElementById("routine-list").onclick=e=>{
        const b=e.target.closest("button");
        if(!b)return;
        const id=b.dataset.id;
        if(b.classList.contains("start-routine")) startWorkout(id);
        if(b.classList.contains("edit-routine")) openRoutineBuilder(id);
        if(b.classList.contains("delete-routine")) {
          showConfirm("Hapus routine?","Routine ini akan dihapus, tetapi history workout lama tetap disimpan.","Hapus",()=>{
            state.routines=state.routines.filter(r=>r.id!==id);
            save();
            populateSelects();
            renderRoutines();
            renderDashboard();
            toast(currentLanguage()==="en" ? "Routine deleted." : "Routine dihapus.");
          });
        }
      };

      document.getElementById("start-workout-button").onclick = () => {
        const selectedRoutineVal = document.querySelector("#custom-workout-routine .custom-option.selected")?.dataset.value;
        if (!selectedRoutineVal) {
          toast(currentLanguage()==="en" ? "Please choose a routine first!" : "Pilih routine terlebih dahulu!");
          return;
        }
        startWorkout(selectedRoutineVal);
      };

      document.getElementById("end-workout-button").onclick = endWorkout;
      
      document.getElementById("previous-exercise").onclick = () => {
        if(state.activeSession && state.activeSession.currentExerciseIndex > 0) {
          state.activeSession.currentExerciseIndex--;
          save();
          renderWorkout();
        }
      };

      document.getElementById("next-exercise").onclick = () => {
        if(state.activeSession) {
          if(state.activeSession.currentExerciseIndex < state.activeSession.exercises.length - 1) {
            state.activeSession.currentExerciseIndex++;
            save();
            renderWorkout();
          } else {
            endWorkout();
          }
        }
      };

      document.getElementById("add-set-button").onclick = () => {
        const ex = currentExercise();
        if(ex) {
          const lastSet = ex.sets.slice(-1)[0] || { reps: 15, weight: 2 };
          ex.sets.push({ reps: lastSet.reps, weight: lastSet.weight, completedAt: null });
          save();
          renderWorkout();
        }
      };

      document.getElementById("exercise-notes").oninput = (e) => {
        const ex = currentExercise();
        if(ex) {
          ex.notes = e.target.value;
          save();
        }
      };

      document.getElementById("rest-pause").onclick = () => {
        if(state.activeSession) {
          state.activeSession.restPaused = !state.activeSession.restPaused;
          save();
          updateTimers();
        }
      };

      document.getElementById("rest-skip").onclick = () => {
        if(state.activeSession) {
          state.activeSession.restRemaining = 0;
          state.activeSession.restPaused = true;
          save();
          updateTimers();
        }
      };

      document.getElementById("rest-reset").onclick = () => {
        if(state.activeSession) {
          state.activeSession.restRemaining = state.settings.restSeconds || 90;
          state.activeSession.restPaused = false;
          save();
          updateTimers();
        }
      };
      
      document.getElementById("history-list").onclick=e=>{
        const b=e.target.closest(".delete-history-session");
        if(!b) return;
        const sessionId=b.dataset.id;
        showConfirm("Hapus riwayat sesi ini?", "Data sesi latihan ini akan dihapus permanen.", "Hapus", () => {
          state.history = state.history.filter(s => s.id !== sessionId);
          save();
          renderHistory();
          renderDashboard();
          toast(currentLanguage()==="en" ? "Workout session deleted." : "Sesi latihan berhasil dihapus.");
        });
      };

      document.querySelectorAll(".history-time-chip").forEach(chip => {
        chip.onclick = (e) => {
          document.querySelectorAll(".history-time-chip").forEach(c => c.classList.remove("active"));
          e.currentTarget.classList.add("active");
          renderHistory();
        };
      });

      document.getElementById("exercise-list").onclick=e=>{
        const b=e.target.closest("button");
        if(!b) return;
        const id=b.dataset.id;
        if(b.classList.contains("delete-exercise")) {
          showConfirm("Hapus exercise custom?", "Exercise ini akan dihapus dari daftar.", "Hapus", () => {
            state.exercises=state.exercises.filter(x=>x.id!==id);
            save();
            renderExercises();
            populateSelects();
            toast(currentLanguage()==="en" ? "Exercise deleted." : "Exercise berhasil dihapus.");
          });
        }
      };

      document.getElementById("exercise-form").onsubmit=e=>{
        e.preventDefault();
        const name=document.getElementById("custom-exercise-name").value.trim();
        const muscle=document.querySelector("#custom-exercise-muscle-select .custom-option.selected")?.dataset.value;
        const equipment=document.getElementById("custom-exercise-equipment").value.trim();
        if(!name||!muscle||!equipment){toast(currentLanguage()==="en" ? "Please complete all exercise fields." : "Mohon lengkapi semua field exercise.");return;}
        state.exercises.push({id:uid(),name,muscle,equipment,isCustom:true});
        save();
        renderExercises();
        populateSelects();
        closeModal("exercise-modal");
        document.getElementById("exercise-form").reset();
        toast(currentLanguage()==="en" ? "Custom exercise added successfully." : "Exercise custom berhasil ditambahkan.");
      };

      document.getElementById("day-picker").onclick=e=>{
        const b=e.target.closest("button");
        if(!b)return;
        b.classList.toggle("active");
      };
      
      document.getElementById("routine-form").onsubmit = (e) => {
        e.preventDefault();
        const id = document.getElementById("routine-id").value;
        const name = document.getElementById("routine-name").value.trim();
        const description = document.getElementById("routine-description").value.trim();
        const daysSelected = Array.from(document.querySelectorAll("#day-picker .day-chip.active")).map(c => c.dataset.day);

        if (!name) {
          toast(currentLanguage()==="en" ? "Routine name is required!" : "Nama routine wajib diisi!");
          return;
        }
        if (selectedRoutineExercises.length === 0) {
          toast(currentLanguage()==="en" ? "Select at least 1 exercise!" : "Pilih minimal 1 exercise!");
          return;
        }

        const routineData = {
          id: id || uid(),
          name,
          description,
          days: daysSelected,
          exerciseIds: selectedRoutineExercises.map(item => item.id),
          exercises: selectedRoutineExercises
        };

        if (id) {
          const idx = state.routines.findIndex(r => r.id === id);
          if (idx !== -1) state.routines[idx] = routineData;
        } else {
          state.routines.push(routineData);
        }

        save();
        closeModal("routine-modal");
        renderRoutines();
        renderDashboard();
        toast(currentLanguage()==="en" ? "Routine saved successfully!" : "Routine berhasil disimpan!");
      };
    });
