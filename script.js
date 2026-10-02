const KEY = "gymflow-v3";
    const LEGACY_KEYS = ["gymflow-v2", "gymflow-v1"];

    const muscles = ["Cardio","Chest","Back","Shoulders","Legs","Arms","Core"];
    const days = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"];
    const uid = () => "gf_" + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
    let state, selectedRoutineExercises = [], confirmCallback = null, elapsedInterval = null;
    let currentCalendarDate = new Date();
    let routineFilter = "all";
    let selectedAnalyticsMuscle = "chest";
    let analyticsPeriod = "30d";


    // ==================== GYMFlow i18n ====================
    // UI translation layer: keeps workout/user data intact and only translates interface text.
    const I18N = {
      "GYMFlow": {id:"GYMFlow", en:"GYMFlow"},
      "Home": {id:"Beranda", en:"Home"},
      "Exercises": {id:"Latihan", en:"Exercises"},
      "Routines": {id:"Routine", en:"Routines"},
      "Workout": {id:"Workout", en:"Workout"},
      "Progress": {id:"Progres", en:"Progress"},
      "Statistics": {id:"Statistik", en:"Statistics"},
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
      "Create Routine": {id:"Buat Routine", en:"Create Routine"},
      "Your personalized workout plans": {id:"Rencana workout personalmu", en:"Your personalized workout plans"},
      "All": {id:"Semua", en:"All"},
      "My Routines": {id:"Routine Saya", en:"My Routines"},
      "Templates": {id:"Template", en:"Templates"},
      "Upper Body": {id:"Upper Body", en:"Upper Body"},
      "Lower Body": {id:"Lower Body", en:"Lower Body"},
      "Full Body": {id:"Full Body", en:"Full Body"},
      "No routines yet": {id:"Belum ada routine", en:"No routines yet"},
      "Create your first workout plan and keep your weekly training easy to follow.": {id:"Buat rencana workout pertamamu dan jaga latihan mingguan tetap mudah diikuti.", en:"Create your first workout plan and keep your weekly training easy to follow."},
      "Workout planner": {id:"Perencana workout", en:"Workout planner"},
      "Beginner": {id:"Pemula", en:"Beginner"},
      "Intermediate": {id:"Menengah", en:"Intermediate"},
      "Advanced": {id:"Lanjutan", en:"Advanced"},
      "No routines match this filter yet.": {id:"Belum ada routine yang cocok dengan filter ini.", en:"No routines match this filter yet."},
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
      "Berat Badan (kg)": {id:"Berat (kg)", en:"Weight (kg)"},
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

    function setProfileTheme(theme) {
      const nextTheme = theme === "light" ? "light" : "dark";
      state.settings.theme = nextTheme;
      save();
      setTheme();
      renderProfileModal();
      if (window.lucide) lucide.createIcons();
    }

    function toggleProfileDarkMode() {
      setProfileTheme(state.settings.theme === "dark" ? "light" : "dark");
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

      // Refined theme controls
      const isDark = state.settings.theme !== "light";
      document.getElementById("dark-mode-desc").textContent = isDark ? tr("Currently dark") : tr("Currently light");
      const darkOption = document.getElementById("theme-dark-option");
      const lightOption = document.getElementById("theme-light-option");
      if(darkOption && lightOption){
        darkOption.classList.toggle("active", isDark);
        lightOption.classList.toggle("active", !isDark);
        darkOption.setAttribute("aria-pressed", String(isDark));
        lightOption.setAttribute("aria-pressed", String(!isDark));
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

    // --- SWITCH PROGRESS TAB (Overview | Weight | History | Statistics) ---
    function switchProgressTab(tabName) {
      const contents = {
        overview: document.getElementById("progress-overview-content"),
        weight: document.getElementById("progress-weight-content"),
        history: document.getElementById("progress-history-content"),
        statistics: document.getElementById("progress-statistics-content")
      };

      const buttons = {
        overview: document.getElementById("tab-overview-btn"),
        weight: document.getElementById("tab-weight-btn"),
        history: document.getElementById("tab-history-btn"),
        statistics: document.getElementById("tab-statistics-btn")
      };

      Object.values(contents).forEach(el => el?.classList.add("hidden"));

      const baseClass = "flex-1 py-2 text-xs font-bold text-center rounded-lg muted hover:text-[var(--text)] transition-all";
      const activeClass = "flex-1 py-2 text-xs font-bold text-center rounded-lg bg-[var(--surface)] text-[var(--text)] shadow-sm transition-all";
      Object.values(buttons).forEach(btn => { if (btn) btn.className = baseClass; });

      const activeContent = contents[tabName] || contents.overview;
      const activeButton = buttons[tabName] || buttons.overview;
      activeContent?.classList.remove("hidden");
      if (activeButton) activeButton.className = activeClass;

      if (tabName === "overview") {
        renderOverviewMetrics();
        setTimeout(gfRefreshProgressMotion, 30);
      } else if (tabName === "weight") {
        renderWeightTab();
      } else if (tabName === "history") {
        renderHistory();
      } else if (tabName === "statistics") {
        renderStatisticsAnalytics();
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
      const light = state.settings.theme === "light";
      document.body.classList.toggle("light", light);
      document.documentElement.style.colorScheme = light ? "light" : "dark";
      let meta = document.querySelector('meta[name="theme-color"]');
      if(!meta){
        meta = document.createElement("meta");
        meta.name = "theme-color";
        document.head.appendChild(meta);
      }
      meta.content = light ? "#f4f7f4" : "#080d0a";
      document.body.dataset.theme = light ? "light" : "dark";
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
    
    function getRoutineMeta(r){
      const exerciseIds = Array.isArray(r.exerciseIds) ? r.exerciseIds : [];
      const exerciseItems = (r.exercises || []).map(item => item?.id || item).filter(Boolean);
      const ids = exerciseItems.length ? exerciseItems : exerciseIds;
      const exercises = ids.map(exerciseById).filter(Boolean);
      const musclesUsed = [...new Set(exercises.map(ex => ex.muscle).filter(Boolean))];
      const upperMuscles = ["Chest","Back","Shoulders","Arms"];
      const hasUpper = musclesUsed.some(m => upperMuscles.includes(m));
      const hasLower = musclesUsed.includes("Legs");
      const hasCore = musclesUsed.includes("Core");
      let focus = "Full Body";
      if (hasUpper && hasLower) focus = "Full Body";
      else if (hasLower) focus = "Lower Body";
      else if (hasUpper) focus = "Upper Body";
      else if (hasCore) focus = "Core";
      else if (musclesUsed.includes("Cardio")) focus = "Cardio";
      else if (musclesUsed[0]) focus = musclesUsed[0];

      let totalSets = 0;
      if(Array.isArray(r.exercises)){
        r.exercises.forEach(item => { totalSets += Array.isArray(item?.sets) && item.sets.length ? item.sets.length : 1; });
      } else {
        totalSets = Math.max(exerciseIds.length * 3, exerciseIds.length);
      }
      const estimatedMinutes = Math.max(10, Math.round(((exerciseIds.length * 2.5) + (totalSets * 2.4)) / 5) * 5);
      let difficultyKey = "Intermediate";
      if(totalSets <= 6 && exerciseIds.length <= 3) difficultyKey = "Beginner";
      if(totalSets >= 13 || exerciseIds.length >= 7) difficultyKey = "Advanced";

      return { focus, totalSets, estimatedMinutes, difficultyKey };
    }

    function routineMatchesFilter(r, filter){
      if(filter === "templates") return false;
      if(filter === "all" || filter === "mine") return true;
      const meta = getRoutineMeta(r);
      if(filter === "upper") return meta.focus === "Upper Body";
      if(filter === "lower") return meta.focus === "Lower Body";
      if(filter === "full") return meta.focus === "Full Body";
      return true;
    }

    function captureRoutineCardRects(){
      const list = document.getElementById("routine-list");
      if(!list) return new Map();
      return new Map(Array.from(list.children).map(card => [card.dataset.routineId, card.getBoundingClientRect()]));
    }

    function animateRoutineReflow(previousRects){
      const list = document.getElementById("routine-list");
      if(!list || !previousRects?.size) return;
      requestAnimationFrame(() => {
        Array.from(list.children).forEach(card => {
          const previous = previousRects.get(card.dataset.routineId);
          if(!previous) return;
          const next = card.getBoundingClientRect();
          const dx = previous.left - next.left;
          const dy = previous.top - next.top;
          if(Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
          card.animate(
            [
              { transform: `translate3d(${dx}px, ${dy}px, 0)` },
              { transform: "translate3d(0, 0, 0)" }
            ],
            { duration: 250, easing: "cubic-bezier(.22,.8,.24,1)" }
          );
        });
      });
    }

    function reorderRoutineByIndex(routineId, delta){
      const fromIndex = state.routines.findIndex(r => r.id === routineId);
      if(fromIndex < 0) return;
      const toIndex = fromIndex + delta;
      if(toIndex < 0 || toIndex >= state.routines.length) return;

      const previousRects = captureRoutineCardRects();
      const [item] = state.routines.splice(fromIndex, 1);
      state.routines.splice(toIndex, 0, item);
      save();
      populateSelects();
      renderRoutines();
      animateRoutineReflow(previousRects);
    }

    function reorderRoutineBefore(draggedId, targetId, placeAfter = false){
      const fromIndex = state.routines.findIndex(r => r.id === draggedId);
      const targetIndexRaw = state.routines.findIndex(r => r.id === targetId);
      if(fromIndex < 0 || targetIndexRaw < 0 || fromIndex === targetIndexRaw) return;

      const previousRects = captureRoutineCardRects();
      const [item] = state.routines.splice(fromIndex, 1);
      let targetIndex = state.routines.findIndex(r => r.id === targetId);
      if(placeAfter) targetIndex += 1;
      state.routines.splice(targetIndex, 0, item);
      save();
      populateSelects();
      renderRoutines();
      animateRoutineReflow(previousRects);
    }

    function clearRoutineDragUI(){
      const list = document.getElementById("routine-list");
      if(!list) return;
      list.querySelectorAll(".gf-routine-card.is-dragging, .gf-routine-card.is-drop-target").forEach(card => {
        card.classList.remove("is-dragging", "is-drop-target");
        card.removeAttribute("aria-grabbed");
      });
    }

    function initRoutineReordering(){
      const list = document.getElementById("routine-list");
      if(!list || list.dataset.reorderInit === "1") return;
      list.dataset.reorderInit = "1";

      const dragState = {
        id: null,
        pointerId: null,
        timer: null,
        active: false,
        sourceCard: null,
        targetId: null,
        startX: 0,
        startY: 0
      };

      const cancelLongPress = () => {
        if(dragState.timer){
          clearTimeout(dragState.timer);
          dragState.timer = null;
        }
      };

      const getCardAtPoint = (x, y) => {
        const element = document.elementFromPoint(x, y);
        const card = element?.closest?.(".gf-routine-card");
        return card && list.contains(card) ? card : null;
      };

      const beginPointerDrag = (card, event) => {
        if(dragState.active) return;
        dragState.active = true;
        dragState.id = card.dataset.routineId;
        dragState.sourceCard = card;
        dragState.targetId = null;
        card.classList.add("is-dragging");
        card.setAttribute("aria-grabbed", "true");
        try { card.setPointerCapture(event.pointerId); } catch {}
      };

      list.addEventListener("pointerdown", event => {
        if(event.pointerType === "mouse" && event.button !== 0) return;
        if(event.target.closest("button, a, input, textarea, select")) return;
        const card = event.target.closest(".gf-routine-card");
        if(!card) return;

        dragState.pointerId = event.pointerId;
        dragState.startX = event.clientX;
        dragState.startY = event.clientY;
        cancelLongPress();
        dragState.timer = setTimeout(() => beginPointerDrag(card, event), 360);
      });

      list.addEventListener("pointermove", event => {
        if(dragState.pointerId !== event.pointerId) return;
        const moved = Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY);
        if(!dragState.active && moved > 8){
          cancelLongPress();
          return;
        }
        if(!dragState.active) return;

        event.preventDefault();
        const targetCard = getCardAtPoint(event.clientX, event.clientY);
        list.querySelectorAll(".gf-routine-card.is-drop-target").forEach(card => card.classList.remove("is-drop-target"));

        if(targetCard && targetCard !== dragState.sourceCard){
          dragState.targetId = targetCard.dataset.routineId;
          targetCard.classList.add("is-drop-target");
          const rect = targetCard.getBoundingClientRect();
          const placeAfter = event.clientY > rect.top + rect.height / 2;
          targetCard.dataset.dropPlace = placeAfter ? "after" : "before";
        } else {
          dragState.targetId = null;
        }
      }, {passive:false});

      const finishPointerDrag = event => {
        if(dragState.pointerId !== event.pointerId) return;
        cancelLongPress();

        if(dragState.active){
          event.preventDefault();
          const sourceId = dragState.id;
          const targetId = dragState.targetId;
          const target = targetId ? list.querySelector(`.gf-routine-card[data-routine-id="${CSS.escape(targetId)}"]`) : null;
          const placeAfter = target?.dataset.dropPlace === "after";
          clearRoutineDragUI();
          dragState.active = false;
          dragState.sourceCard = null;
          dragState.targetId = null;
          dragState.id = null;
          dragState.pointerId = null;
          if(targetId) reorderRoutineBefore(sourceId, targetId, placeAfter);
          return;
        }

        dragState.pointerId = null;
      };

      list.addEventListener("pointerup", finishPointerDrag);
      list.addEventListener("pointercancel", finishPointerDrag);
      list.addEventListener("pointerleave", () => {
        if(!dragState.active) cancelLongPress();
      });

      list.addEventListener("dragstart", event => {
        const card = event.target.closest?.(".gf-routine-card");
        if(!card || event.target.closest("button, a, input, textarea, select")) return event.preventDefault();
        event.preventDefault();
      });
    }

    function renderRoutines(){
      const list=document.getElementById("routine-list"), empty=document.getElementById("routine-empty");
      if(!list || !empty) return;

      const filteredRoutines = state.routines.filter(r => routineMatchesFilter(r, routineFilter));
      list.innerHTML="";

      const routineCount = document.getElementById("routine-list-count");
      if (routineCount) {
        const count = filteredRoutines.length;
        routineCount.textContent = currentLanguage()==="en"
          ? `${count} ${count === 1 ? "routine" : "routines"}`
          : `${count} routine${count === 1 ? "" : ""}`;
      }

      document.querySelectorAll(".gf-routine-filter").forEach(btn => {
        const active = btn.dataset.routineFilter === routineFilter;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-selected", String(active));
      });

      empty.classList.toggle("hidden", filteredRoutines.length !== 0);
      const emptyTitle = empty.querySelector("h3");
      const emptyCopy = empty.querySelector("p");
      const emptyButton = empty.querySelector(".gf-routines-empty-cta");
      const noMatch = filteredRoutines.length === 0 && state.routines.length > 0;
      if(emptyTitle) emptyTitle.textContent = noMatch ? tr("No routines yet") : tr("No routines yet");
      if(emptyCopy) emptyCopy.textContent = noMatch ? tr("No routines match this filter yet.") : tr("Create your first workout plan and keep your weekly training easy to follow.");
      if(emptyButton) emptyButton.textContent = tr("Create Routine");

      filteredRoutines.forEach(r => {
        const meta = getRoutineMeta(r);
        const el = document.createElement("article");
        el.className = "gf-routine-card group";
        const routineStateIndex = state.routines.findIndex(item => item.id === r.id);
        const isFirstRoutine = routineStateIndex <= 0;
        const isLastRoutine = routineStateIndex === state.routines.length - 1;
        el.dataset.routineId = r.id;
        el.dataset.routineIndex = String(routineStateIndex);
        el.setAttribute("aria-label", `${esc(r.name)} routine`);
        el.setAttribute("data-reorderable", "true");
        const daysHTML = r.days?.length
          ? r.days.slice(0,5).map(d => `<span>${esc(d)}</span>`).join("")
          : `<span class="gf-routine-day-muted">${currentLanguage()==="en" ? "Flexible" : "Fleksibel"}</span>`;

        const exerciseText = currentLanguage()==="en"
          ? `${r.exerciseIds.length} ${r.exerciseIds.length === 1 ? "exercise" : "exercises"}`
          : `${r.exerciseIds.length} exercise`;
        const durationText = currentLanguage()==="en" ? `${meta.estimatedMinutes} min` : `${meta.estimatedMinutes} mnt`;
        const metaLabels = {
          focus: meta.focus === "Upper Body" || meta.focus === "Lower Body" || meta.focus === "Full Body" || meta.focus === "Core" || meta.focus === "Cardio" ? tr(meta.focus) : esc(meta.focus),
          difficulty: tr(meta.difficultyKey)
        };

        el.innerHTML = `
          <div class="gf-routine-card-topline"></div>
          <div class="gf-routine-card-head">
            <div class="gf-routine-card-title-wrap">
              <h3>${esc(r.name)}</h3>
              <p>${esc(r.description || (currentLanguage()==="en" ? "Ready for your next session." : "Siap untuk sesi latihan berikutnya."))}</p>
            </div>
            <div class="gf-routine-card-actions">
              <button class="gf-routine-icon-btn order-routine move-up" type="button" data-id="${r.id}" data-move="up" aria-label="${currentLanguage()==="en" ? "Move up" : "Pindah ke atas"} ${esc(r.name)}" title="${currentLanguage()==="en" ? "Move Up" : "Pindah ke Atas"}" ${isFirstRoutine ? "disabled" : ""}>
                <i data-lucide="chevron-up"></i>
              </button>
              <button class="gf-routine-icon-btn order-routine move-down" type="button" data-id="${r.id}" data-move="down" aria-label="${currentLanguage()==="en" ? "Move down" : "Pindah ke bawah"} ${esc(r.name)}" title="${currentLanguage()==="en" ? "Move Down" : "Pindah ke Bawah"}" ${isLastRoutine ? "disabled" : ""}>
                <i data-lucide="chevron-down"></i>
              </button>
              <button class="gf-routine-icon-btn edit-routine" type="button" data-id="${r.id}" aria-label="Edit ${esc(r.name)}" title="Edit Routine">
                <i data-lucide="pencil"></i>
              </button>
              <button class="gf-routine-icon-btn delete-routine danger" type="button" data-id="${r.id}" aria-label="${currentLanguage()==="en" ? "Delete" : "Hapus"} ${esc(r.name)}" title="${currentLanguage()==="en" ? "Delete Routine" : "Hapus Routine"}">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>

          <div class="gf-routine-focus-row">
            <span class="gf-routine-focus-pill"><i data-lucide="target"></i>${metaLabels.focus}</span>
            <div class="gf-routine-days">${daysHTML}</div>
          </div>

          <div class="gf-routine-stats">
            <div><strong>${exerciseText}</strong><span>${currentLanguage()==="en" ? "volume" : "gerakan"}</span></div>
            <div><strong>${durationText}</strong><span>${currentLanguage()==="en" ? "estimated" : "perkiraan"}</span></div>
            <div><strong>${metaLabels.difficulty}</strong><span>${currentLanguage()==="en" ? "difficulty" : "tingkat"}</span></div>
          </div>

          <button class="gf-routine-play start-routine" type="button" data-id="${r.id}">
            <span>${currentLanguage()==="en" ? "Start Workout" : "Mulai Workout"}</span>
            <span class="gf-routine-play-icon"><i data-lucide="arrow-up-right"></i></span>
          </button>
        `;
        list.appendChild(el);
      });
      lucide.createIcons();
    }
    
    
    function exerciseIconSvg(name="", muscle="", equipment=""){
      const text = `${name} ${muscle} ${equipment}`.toLowerCase();
      let kind = "generic";
      if (/treadmill|running|lari/.test(text)) kind = "treadmill";
      else if (/cycling|bike|seped/.test(text)) kind = "bike";
      else if (/bench|chest press|incline|floor press|fly/.test(text)) kind = "press";
      else if (/row|upright row|bent over/.test(text)) kind = "row";
      else if (/lat pulldown|pulldown|pull up|chin up/.test(text)) kind = "pull";
      else if (/curl|bicep/.test(text)) kind = "curl";
      else if (/shoulder|lateral raise|front raise|overhead press|shrug/.test(text)) kind = "raise";
      else if (/squat|leg press/.test(text)) kind = "squat";
      else if (/deadlift|rdl|romanian/.test(text)) kind = "deadlift";
      else if (/lunge|split squat/.test(text)) kind = "lunge";
      else if (/tricep|pushdown|skull crusher|extension/.test(text)) kind = "tricep";
      else if (/calf/.test(text)) kind = "calf";
      else if (/plank|crunch|sit up|sit-up|leg raise|ab/.test(text)) kind = "core";

      const S = '#92a6b4', A = '#88F914', D = '#2b3943';
      const line = (x1,y1,x2,y2,sw=5, color=S)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
      const circle = (cx,cy,r=5,fill=S)=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
      const rect = (x,y,w,h,rx=4,fill=D,stroke='none',sw=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;

      let art = `
        ${circle(42,20,7)}
        ${line(42,28,42,48,6)}
        ${line(42,34,29,43,5)}
        ${line(42,34,55,43,5)}
        ${line(42,48,34,67,5)}
        ${line(42,48,50,67,5)}
      `;

      if(kind==="treadmill"){
        art += `${rect(67,44,12,4,2,A)}${line(72,48,84,66,4,A)}${line(84,66,66,66,4,A)}${line(66,66,58,52,4,S)}${line(58,52,72,52,4,S)}`;
      } else if(kind==="bike"){
        art += `${circle(62,57,10,"none")}${circle(91,57,10,"none")}${line(62,57,76,45,3,A)}${line(76,45,91,57,3,A)}${line(76,45,62,57,3,A)}${line(76,45,82,35,3,S)}${line(82,35,88,35,3,S)}${line(76,45,72,52,3,S)}`;
      } else if(kind==="press"){
        art += `${line(34,43,26,30,4,S)}${line(50,43,58,30,4,S)}${line(25,29,59,29,4,A)}${line(27,25,23,25,3,A)}${line(57,25,61,25,3,A)}${rect(63,22,4,41,2,S)}${rect(65,20,15,4,2,A)}${rect(65,61,18,4,2,A)}`;
      } else if(kind==="row"){
        art += `${line(35,44,54,58,5,S)}${line(54,58,76,48,4,A)}${line(76,48,90,48,3,S)}${line(54,58,82,62,3,D)}${circle(91,48,3,A)}`;
      } else if(kind==="pull"){
        art += `${rect(70,17,4,48,2,S)}${line(55,24,88,24,4,A)}${line(55,24,42,39,4,A)}${line(88,24,62,39,4,A)}${line(41,39,33,50,4,S)}${line(62,39,68,50,4,S)}`;
      } else if(kind==="curl"){
        art += `${line(36,44,57,53,5,S)}${line(57,53,65,43,5,S)}${line(65,43,77,43,4,A)}${line(65,43,61,33,5,S)}${line(61,33,70,29,4,A)}${circle(73,29,3,A)}`;
      } else if(kind==="raise"){
        art += `${line(32,46,20,33,4,A)}${line(52,46,64,33,4,A)}${circle(17,30,3,A)}${circle(67,30,3,A)}`;
      } else if(kind==="squat"){
        art += `${line(30,46,23,56,5,S)}${line(23,56,34,67,5,S)}${line(50,46,58,56,5,S)}${line(58,56,49,67,5,S)}${line(34,67,23,72,4,S)}${line(49,67,60,72,4,S)}${line(20,28,64,28,4,A)}${rect(15,24,5,8,2,A)}${rect(64,24,5,8,2,A)}`;
      } else if(kind==="deadlift"){
        art += `${line(35,45,52,57,5,S)}${line(52,57,66,52,5,S)}${line(66,52,80,62,4,S)}${line(80,62,95,62,4,A)}${line(80,62,85,48,4,S)}${circle(98,62,3,A)}`;
      } else if(kind==="lunge"){
        art += `${line(36,48,27,62,5,S)}${line(27,62,17,69,5,S)}${line(48,48,58,62,5,S)}${line(58,62,72,69,5,S)}${line(48,40,66,34,4,A)}${circle(69,33,3,A)}`;
      } else if(kind==="tricep"){
        art += `${rect(72,18,4,44,2,S)}${line(56,27,88,27,4,A)}${line(56,27,41,40,4,A)}${line(88,27,58,46,4,A)}${line(41,40,34,54,4,S)}${line(58,46,51,59,4,S)}`;
      } else if(kind==="calf"){
        art += `${line(34,48,38,64,5,S)}${line(38,64,33,72,5,S)}${line(50,48,46,64,5,S)}${line(46,64,51,72,5,S)}${rect(58,62,18,5,2,A)}`;
      } else if(kind==="core"){
        art = `${circle(26,29,7)}${line(31,35,49,45,6)}${line(49,45,67,56,5)}${line(67,56,78,56,4)}${line(42,41,31,55,5)}${line(31,55,19,55,4)}${rect(52,17,18,4,2,A)}${line(61,21,61,44,3,A)}`;
      } else {
        art += `${line(35,44,58,37,5,S)}${line(58,37,70,27,4,A)}${line(58,37,70,47,4,A)}${circle(74,27,3,A)}${circle(74,47,3,A)}`;
      }

      return `<svg viewBox="0 0 110 82" class="gf-exercise-art" aria-hidden="true">
        <defs><linearGradient id="exArtBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="rgba(136,249,20,.10)"/><stop offset="100%" stop-color="rgba(70,86,98,.12)"/></linearGradient></defs>
        <rect x="2" y="2" width="106" height="78" rx="12" fill="url(#exArtBg)" stroke="rgba(136,249,20,.18)"/>
        ${art}
      </svg>`;
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
        el.className="panel exercise-directory-card group";
        el.innerHTML=`
          <div class="exercise-directory-inner">
            <div class="exercise-directory-heading">
              <h3 class="exercise-directory-title group-hover:text-[var(--lime)] transition-colors">${esc(e.name)}</h3>
              ${e.isCustom ? `<button class="icon-btn delete-exercise exercise-delete-btn text-rose-400 bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20 transition-colors !w-9 !h-9" data-id="${e.id}" aria-label="Hapus ${esc(e.name)}" title="Hapus Exercise"><i data-lucide="trash-2" class="w-4 h-4"></i></button>` : ""}
            </div>
            <p class="exercise-directory-equipment"><i data-lucide="wrench" class="exercise-wrench-icon"></i>${esc(e.equipment || "—")}</p>
            <div class="exercise-directory-divider"></div>
            <div class="exercise-directory-footer">
              <span class="exercise-directory-chip">${esc(e.muscle)}</span>
              ${e.isCustom ? `<span class="exercise-directory-chip exercise-custom-chip">Custom</span>` : ""}
            </div>
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
      if(!totalSets){
        toast(currentLanguage()==="en" ? "Complete at least one set before ending the workout." : "Selesaikan minimal satu set sebelum mengakhiri workout.");
        return;
      }

      const durationSeconds = elapsed();
      const durationMinutes = durationSeconds / 60;
      const userWeight = state.settings.weight || 65;
      const caloriesBurned = Math.round(0.05 * userWeight * durationMinutes);
      const endedAt = new Date().toISOString();

      const summary = calculateSessionMetrics(a, state.history);
      const historyEntry = {
        id:a.id,
        routineId:a.routineId,
        startedAt:a.startedAt,
        endedAt,
        duration:durationSeconds,
        exercises:a.exercises,
        caloriesBurned,
        stats: {
          totalSets: summary.totalSets,
          totalReps: summary.totalReps,
          totalVolume: summary.totalVolume,
          totalExercises: summary.totalExercises,
          muscleGroups: summary.muscleGroups,
          personalRecords: summary.personalRecords
        }
      };

      state.history.unshift(historyEntry);
      state.activeSession=null;
      save();

      renderDashboard();
      renderHistory();
      navigate("history");
      renderStatisticsAnalytics();

      toast(currentLanguage()==="en"
        ? `Workout saved. Burned ±${caloriesBurned} kcal!`
        : `Workout tersimpan. Membakar ±${caloriesBurned} kkal!`);

      setTimeout(() => openWorkoutSummary(historyEntry), 140);
    }

    function renderOverviewMetrics(){
      const sessions = Array.isArray(state.history) ? state.history : [];
      const totalCalories = sessions.reduce((n,s)=>n+(Number(s.caloriesBurned)||0),0);
      const totalSeconds = sessions.reduce((n,s)=>n+(Number(s.duration)||0),0);
      const avgSeconds = sessions.length ? Math.round(totalSeconds / sessions.length) : 0;

      const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
      };

      const loggedCopy = currentLanguage()==="en"
        ? `${sessions.length} workouts logged`
        : `${sessions.length} workout tercatat`;
      setText("workouts-logged-count", loggedCopy);
      setText("progress-workouts-logged-copy", loggedCopy);
      setText("history-session-count", sessions.length);
      setText("history-calories", fmtKkal(totalCalories));
      setText("history-total-time", formatTimeDetailed(totalSeconds));
      setText("history-avg-duration", formatTimeDetailed(avgSeconds));
      renderProgressPulse(sessions);

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
      renderVolumeTrendChart();
    }

    function renderProgressPulse(sessions) {
      const safe = Array.isArray(sessions) ? sessions : [];
      const thisWeekEl = document.getElementById("progress-this-week");
      const streakEl = document.getElementById("progress-current-streak");
      if (!thisWeekEl || !streakEl) return;

      const now = new Date();
      const day = now.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + mondayOffset);
      monday.setHours(0, 0, 0, 0);
      const weekCount = safe.filter(s => {
        const d = new Date(s.endedAt);
        return !Number.isNaN(d.getTime()) && d >= monday;
      }).length;

      const uniqueDays = [...new Set(safe
        .map(s => { const d = new Date(s.endedAt); return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); })
        .filter(Boolean))].sort((a,b)=>b-a);

      let streak = 0;
      if (uniqueDays.length) {
        const latest = new Date(uniqueDays[0]);
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const gap = Math.round((todayMidnight - latest) / 86400000);
        if (gap <= 1) {
          streak = 1;
          for (let i=1;i<uniqueDays.length;i++) {
            const diff = Math.round((uniqueDays[i-1] - uniqueDays[i]) / 86400000);
            if (diff === 1) streak++; else break;
          }
        }
      }

      thisWeekEl.textContent = weekCount;
      streakEl.textContent = streak;
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

    function renderVolumeTrendChart() {
      const area = document.getElementById("volume-trend-chart");
      if (!area) return;
      const history = [...state.history].sort((a,b)=>new Date(a.endedAt)-new Date(b.endedAt)).slice(-8);
      if (!history.length) {
        area.innerHTML = `<div class="gf-chart-empty">Belum ada data volume workout.</div>`;
        return;
      }

      const getVolume = (s) => {
        if (s.stats?.totalVolume != null) return Number(s.stats.totalVolume)||0;
        return (s.exercises||[]).reduce((sum, ex) => {
          const info = analyticsExerciseInfo(ex.exerciseId, ex.name);
          return sum + (ex.sets||[]).filter(x=>x.completedAt).reduce((n,x)=>{
            if (info.muscle === "Cardio") return n;
            return n + (Number(x.reps)||0) * (Number(x.weight)||0);
          },0);
        },0);
      };

      const values = history.map(getVolume);
      const max = Math.max(1,...values);
      const w=720,h=220,padX=34,padY=26;
      const plotW=w-padX*2, plotH=h-padY-34;
      const step=history.length===1 ? 0 : plotW/(history.length-1);
      const points=values.map((v,i)=>{
        const x=padX + step*i;
        const y=(h-34) - (v/max)*plotH;
        return {x,y,v,date:new Date(history[i].endedAt)};
      });
      const coords=points.map(p=>`${p.x},${p.y}`).join(" ");
      const areaPoints=`${padX},${h-34} ${coords} ${padX+step*(history.length-1)},${h-34}`;
      const monthNames=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

      area.innerHTML=`
        <svg viewBox="0 0 ${w} ${h}" class="gf-premium-chart" role="img" aria-label="Volume trend">
          <defs>
            <linearGradient id="gfVolumeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#88F914" stop-opacity="0.26"/>
              <stop offset="100%" stop-color="#88F914" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <line x1="${padX}" y1="${h-34}" x2="${w-padX}" y2="${h-34}" stroke="var(--line)"/>
          <line x1="${padX}" y1="${padY+plotH*0.5}" x2="${w-padX}" y2="${padY+plotH*0.5}" stroke="var(--line)" stroke-dasharray="4 5" opacity=".65"/>
          <polygon points="${areaPoints}" fill="url(#gfVolumeFill)"/>
          <polyline points="${coords}" fill="none" stroke="#88F914" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          ${points.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#0c100d" stroke="#88F914" stroke-width="2.5"><title>${analyticsFormatVolume(p.v)}</title></circle>`).join("")}
          ${points.map(p=>`<text x="${p.x}" y="${h-10}" text-anchor="middle" fill="var(--muted)" font-size="10">${p.date.getDate()} ${monthNames[p.date.getMonth()]}</text>`).join("")}
          <text x="${padX}" y="${padY-6}" fill="var(--muted)" font-size="10">${analyticsFormatVolume(max)}</text>
        </svg>`;
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


    /* ==================== WORKOUT STATISTICS & BODY VISUAL ==================== */
    const ANALYTICS_MUSCLES = [
      "chest","shoulders","biceps","triceps","back","abs","glutes","quads","hamstrings","calves"
    ];
    const ANALYTICS_LABELS = {
      chest:"Chest", shoulders:"Shoulders", biceps:"Biceps", triceps:"Triceps",
      back:"Back", abs:"Abs", glutes:"Glutes", quads:"Quads", hamstrings:"Hamstrings", calves:"Calves"
    };
    const ANALYTICS_PERIOD_LABELS = { "7d":"7 hari", "30d":"30 hari", "90d":"3 bulan", "1y":"1 tahun", "all":"All time" };

    function analyticsPeriodLabel() {
      return currentLanguage()==="en"
        ? ({ "7d":"7 days", "30d":"30 days", "90d":"3 months", "1y":"1 year", "all":"All time" }[analyticsPeriod] || "30 days")
        : (ANALYTICS_PERIOD_LABELS[analyticsPeriod] || "30 hari");
    }

    function getFilteredAnalyticsHistory(period=analyticsPeriod) {
      const history = Array.isArray(state.history) ? state.history : [];
      if (period === "all") return [...history];

      const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
      const cutoff = Date.now() - days * 86400000;
      return history.filter(s => new Date(s.endedAt || s.startedAt || 0).getTime() >= cutoff);
    }

    function analyticsExerciseInfo(exerciseId, fallbackName="Exercise") {
      const found = exerciseById(exerciseId);
      return found || { id:exerciseId, name:fallbackName, muscle:"Core", equipment:"" };
    }

    function deriveAnalyticsMuscles(exercise) {
      const text = `${exercise?.name || ""} ${exercise?.muscle || ""}`.toLowerCase();
      const muscle = String(exercise?.muscle || "").toLowerCase();

      if (muscle === "cardio" || /treadmill|cycling|running|jog|elliptical|stair/.test(text)) return [];
      if (muscle === "chest" || /bench press|chest press|chest fly|push up|push-up|pec deck|cable fly|incline press|decline press/.test(text)) return ["chest"];
      if (muscle === "back" || /lat pulldown|pull up|pull-up|chin up|row|deadlift|pullover|face pull/.test(text)) return ["back"];
      if (muscle === "shoulders" || /shoulder press|lateral raise|front raise|rear delt|arnold press|upright row|overhead press/.test(text)) return ["shoulders"];
      if (muscle === "arms" || /bicep|curl/.test(text)) return text.includes("tricep") || /pushdown|skull crusher|triceps/.test(text) ? ["triceps"] : ["biceps"];
      if (muscle === "legs" || /squat|leg press|leg extension|leg curl|lunge|split squat|calf raise|hip thrust|glute|hamstring|romanian deadlift|rdl/.test(text)) {
        if (/calf/.test(text)) return ["calves"];
        if (/hip thrust|glute|kickback|abductor/.test(text)) return ["glutes"];
        if (/leg curl|hamstring|rdl|romanian deadlift/.test(text)) return ["hamstrings"];
        if (/squat|leg press|leg extension|lunge|split squat/.test(text)) return ["quads","glutes"];
        return ["quads"];
      }
      if (muscle === "core" || /crunch|sit up|sit-up|plank|ab wheel|russian twist|leg raise|abs|oblique/.test(text)) return ["abs"];
      return [];
    }

    function buildAnalyticsModel(period=analyticsPeriod) {
      const sessions = getFilteredAnalyticsHistory(period);
      const muscleMap = {};
      ANALYTICS_MUSCLES.forEach(key => muscleMap[key] = { key, sets:0, workouts:new Set(), volume:0, reps:0 });

      const exerciseMap = new Map();
      let totalSets=0, totalReps=0, totalVolume=0, totalDuration=0;
      const prs = [];
      const previousMaxByExercise = new Map();

      // Build all-time prior max load for PR detection.
      [...(state.history || [])].sort((a,b)=>new Date(a.endedAt||0)-new Date(b.endedAt||0)).forEach(session => {
        (session.exercises || []).forEach(ex => {
          const info = analyticsExerciseInfo(ex.exerciseId, ex.name);
          const maxWeight = Math.max(0, ...(ex.sets || []).filter(s=>s.completedAt).map(s=>Number(s.weight)||0));
          const prev = previousMaxByExercise.get(info.id) || 0;
          if (maxWeight > prev) previousMaxByExercise.set(info.id, maxWeight);
        });
      });

      sessions.forEach(session => {
        totalDuration += Number(session.duration) || 0;
        const sessionSeenExercises = new Set();

        (session.exercises || []).forEach(ex => {
          const info = analyticsExerciseInfo(ex.exerciseId, ex.name);
          const completedSets = (ex.sets || []).filter(s => s.completedAt);
          if (!completedSets.length) return;

          sessionSeenExercises.add(info.id);
          const currentMaxWeight = Math.max(0, ...completedSets.map(s => Number(s.weight)||0));
          const reps = completedSets.reduce((n,s)=>n+(Number(s.reps)||0),0);
          const volume = completedSets.reduce((n,s)=>{
            const weight = Number(s.weight)||0;
            const r = Number(s.reps)||0;
            return n + (info.muscle === "Cardio" ? 0 : weight * r);
          },0);

          totalSets += completedSets.length;
          totalReps += reps;
          totalVolume += volume;

          if (!exerciseMap.has(info.id)) exerciseMap.set(info.id, {
            id:info.id, name:info.name || "Exercise", muscle:info.muscle || "Core",
            sessions:new Set(), sets:0, reps:0, volume:0, maxWeight:0
          });
          const exStat = exerciseMap.get(info.id);
          exStat.sessions.add(session.id);
          exStat.sets += completedSets.length;
          exStat.reps += reps;
          exStat.volume += volume;
          exStat.maxWeight = Math.max(exStat.maxWeight, currentMaxWeight);

          deriveAnalyticsMuscles(info).forEach(mKey=>{
            const target = muscleMap[mKey];
            if (!target) return;
            target.sets += completedSets.length;
            target.reps += reps;
            target.volume += volume;
            target.workouts.add(session.id);
          });

          // PRs only when this session is the first/all-time best load for an exercise.
          const allTimePreviousSessions = (state.history || []).filter(s=>s.id !== session.id && new Date(s.endedAt||0) < new Date(session.endedAt||0));
          const prevMax = Math.max(0, ...allTimePreviousSessions.flatMap(s => (s.exercises || []).filter(x=>x.exerciseId===info.id).flatMap(x => (x.sets || []).filter(y=>y.completedAt).map(y=>Number(y.weight)||0))));
          if (currentMaxWeight > 0 && currentMaxWeight > prevMax) {
            prs.push({
              exerciseId: info.id,
              name: info.name || "Exercise",
              weight: currentMaxWeight,
              date: session.endedAt,
              sessionId: session.id
            });
          }
        });

        if (sessionSeenExercises.size) {
          // no-op: session exists for workout count
        }
      });

      const muscleStats = Object.values(muscleMap).map(m=>({
        ...m, workouts:m.workouts.size
      }));
      muscleStats.sort((a,b)=>b.sets-a.sets || b.volume-a.volume);

      const exerciseStats = [...exerciseMap.values()].map(e=>({
        ...e, sessions:e.sessions.size
      })).sort((a,b)=>b.sessions-a.sessions || b.sets-a.sets || b.volume-a.volume);

      // De-duplicate PRs to the latest record for each exercise.
      const latestPrMap = new Map();
      prs.sort((a,b)=>new Date(b.date)-new Date(a.date)).forEach(pr=>{
        if (!latestPrMap.has(pr.exerciseId)) latestPrMap.set(pr.exerciseId, pr);
      });

      const uniqueExercises = exerciseStats.length;

      return {
        sessions, totalWorkouts:sessions.length, totalExercises:uniqueExercises, totalSets,
        totalReps, totalVolume, totalDuration, muscleStats, exerciseStats,
        topMuscle:muscleStats[0] || null,
        personalRecords:[...latestPrMap.values()].slice(0,8)
      };
    }

    function analyticsStatNumber(n) {
      return new Intl.NumberFormat("id-ID", { maximumFractionDigits:1 }).format(Number(n)||0);
    }

    function analyticsFormatVolume(n) {
      return `${analyticsStatNumber(n)} kg`;
    }

    function analyticsSvgBody(side="front") {
      const isFront = side === "front";
      const body = isFront ? `
        <!-- muscular front silhouette -->
        <g class="gf-anatomy-silhouette" fill="url(#gfBodyBase-${side})">
          <circle cx="120" cy="24" r="17"/>
          <path d="M108 42 C112 38 116 37 120 37 C124 37 128 38 132 42 L131 56 C127 60 113 60 109 56 Z"/>
          <path d="M96 56 C102 50 110 48 120 51 C130 48 138 50 144 56
                   C151 62 154 77 153 91 C152 111 146 130 137 148
                   C132 157 127 162 120 164 C113 162 108 157 103 148
                   C94 130 88 111 87 91 C86 77 89 62 96 56 Z"/>
          <path d="M94 58 C85 58 78 64 74 76 L68 117 C67 124 71 131 78 132
                   C84 132 89 127 89 120 L95 92 Z"/>
          <path d="M146 58 C155 58 162 64 166 76 L172 117 C173 124 169 131 162 132
                   C156 132 151 127 151 120 L145 92 Z"/>
          <path d="M101 151 C107 147 114 148 119 152 L118 199 C114 205 108 207 102 203 L97 177 Z"/>
          <path d="M121 152 C126 148 133 147 139 151 L143 177 L138 203 C132 207 126 205 122 199 Z"/>
          <path d="M98 199 C104 195 112 197 118 202 L116 286 C112 298 104 301 95 294 Z"/>
          <path d="M122 202 C128 197 136 195 142 199 L145 294 C136 301 128 298 124 286 Z"/>
          <path d="M95 288 C103 284 111 287 116 292 L113 374 C108 381 99 381 94 373 Z"/>
          <path d="M124 292 C129 287 137 284 145 288 L146 373 C141 381 132 381 127 374 Z"/>
          <path d="M91 372 C99 368 108 369 114 374 L116 384 C108 388 98 387 90 382 Z"/>
          <path d="M126 374 C132 369 141 368 149 372 L150 382 C142 387 132 388 124 384 Z"/>
        </g>

        <g class="gf-anatomy-contours">
          <path d="M95 62 Q106 52 120 59 Q107 69 100 88 Q94 77 95 62Z" class="gf-muscle-region" data-muscle="shoulders"/>
          <path d="M145 62 Q134 52 120 59 Q133 69 140 88 Q146 77 145 62Z" class="gf-muscle-region" data-muscle="shoulders"/>
          <path d="M99 68 Q109 57 120 62 L120 104 Q109 110 98 101 Q94 84 99 68Z" class="gf-muscle-region" data-muscle="chest"/>
          <path d="M141 68 Q131 57 120 62 L120 104 Q131 110 142 101 Q146 84 141 68Z" class="gf-muscle-region" data-muscle="chest"/>
          <path d="M90 68 Q97 60 102 69 L99 112 Q95 119 88 113 Q87 91 90 68Z" class="gf-muscle-region" data-muscle="biceps"/>
          <path d="M150 68 Q143 60 138 69 L141 112 Q145 119 152 113 Q153 91 150 68Z" class="gf-muscle-region" data-muscle="biceps"/>
          <path d="M80 75 Q86 64 91 70 L89 114 Q85 120 78 113 Q76 94 80 75Z" class="gf-muscle-region" data-muscle="triceps"/>
          <path d="M160 75 Q154 64 149 70 L151 114 Q155 120 162 113 Q164 94 160 75Z" class="gf-muscle-region" data-muscle="triceps"/>
          <path d="M105 104 Q112 99 120 103 L120 148 Q112 153 104 147 Z" class="gf-muscle-region" data-muscle="abs"/>
          <path d="M135 104 Q128 99 120 103 L120 148 Q128 153 136 147 Z" class="gf-muscle-region" data-muscle="abs"/>
          <path d="M103 153 Q111 149 119 153 L117 203 Q110 208 103 202 Z" class="gf-muscle-region" data-muscle="quads"/>
          <path d="M121 153 Q129 149 138 153 L137 202 Q130 208 122 203 Z" class="gf-muscle-region" data-muscle="quads"/>
          <path d="M98 201 Q108 195 117 202 L115 286 Q108 299 98 291 Z" class="gf-muscle-region" data-muscle="quads"/>
          <path d="M123 202 Q132 195 142 201 L141 291 Q132 299 125 286 Z" class="gf-muscle-region" data-muscle="quads"/>
          <path d="M97 289 Q106 285 115 292 L113 374 Q107 380 98 374 Z" class="gf-muscle-region" data-muscle="calves"/>
          <path d="M125 292 Q134 285 143 289 L142 374 Q133 380 127 374 Z" class="gf-muscle-region" data-muscle="calves"/>
        </g>

        <g class="gf-anatomy-lines" aria-hidden="true">
          <path d="M120 64 L120 154"/>
          <path d="M102 107 Q111 112 117 110"/>
          <path d="M138 107 Q129 112 123 110"/>
          <path d="M106 158 Q120 165 134 158"/>
          <path d="M104 215 Q111 220 116 216"/>
          <path d="M124 216 Q129 220 136 215"/>
          <path d="M102 297 Q109 301 114 297"/>
          <path d="M126 297 Q131 301 138 297"/>
        </g>` : `
        <!-- muscular back silhouette -->
        <g class="gf-anatomy-silhouette" fill="url(#gfBodyBase-${side})">
          <circle cx="120" cy="24" r="17"/>
          <path d="M108 42 C112 38 116 37 120 37 C124 37 128 38 132 42 L131 56 C127 60 113 60 109 56 Z"/>
          <path d="M96 56 C102 50 110 48 120 51 C130 48 138 50 144 56
                   C151 63 154 78 153 92 C152 113 146 131 137 149
                   C131 158 126 163 120 165 C114 163 109 158 103 149
                   C94 131 88 113 87 92 C86 78 89 63 96 56 Z"/>
          <path d="M94 58 C85 58 78 64 74 76 L68 117 C67 124 71 131 78 132
                   C84 132 89 127 89 120 L95 92 Z"/>
          <path d="M146 58 C155 58 162 64 166 76 L172 117 C173 124 169 131 162 132
                   C156 132 151 127 151 120 L145 92 Z"/>
          <path d="M101 150 C108 145 114 149 120 154 C126 149 132 145 139 150 L143 182
                   C136 191 129 197 120 199 C111 197 104 191 97 182 Z"/>
          <path d="M98 195 C105 191 112 195 118 200 L116 286 C112 298 104 301 95 294 Z"/>
          <path d="M122 200 C128 195 135 191 142 195 L145 294 C136 301 128 298 124 286 Z"/>
          <path d="M95 288 C103 284 111 287 116 292 L113 374 C108 381 99 381 94 373 Z"/>
          <path d="M124 292 C129 287 137 284 145 288 L146 373 C141 381 132 381 127 374 Z"/>
          <path d="M91 372 C99 368 108 369 114 374 L116 384 C108 388 98 387 90 382 Z"/>
          <path d="M126 374 C132 369 141 368 149 372 L150 382 C142 387 132 388 124 384 Z"/>
        </g>

        <g class="gf-anatomy-contours">
          <path d="M95 62 Q106 52 120 59 Q107 69 100 88 Q94 77 95 62Z" class="gf-muscle-region" data-muscle="shoulders"/>
          <path d="M145 62 Q134 52 120 59 Q133 69 140 88 Q146 77 145 62Z" class="gf-muscle-region" data-muscle="shoulders"/>
          <path d="M99 67 Q110 56 120 62 Q130 56 141 67 L139 119 Q130 137 120 141 Q110 137 101 119 Z" class="gf-muscle-region" data-muscle="back"/>
          <path d="M90 69 Q97 61 102 69 L99 111 Q95 118 88 112 Q87 91 90 69Z" class="gf-muscle-region" data-muscle="triceps"/>
          <path d="M150 69 Q143 61 138 69 L141 111 Q145 118 152 112 Q153 91 150 69Z" class="gf-muscle-region" data-muscle="triceps"/>
          <path d="M80 75 Q86 64 91 70 L89 114 Q85 120 78 113 Q76 94 80 75Z" class="gf-muscle-region" data-muscle="biceps"/>
          <path d="M160 75 Q154 64 149 70 L151 114 Q155 120 162 113 Q164 94 160 75Z" class="gf-muscle-region" data-muscle="biceps"/>
          <path d="M103 145 Q111 139 120 146 Q129 139 137 145 L136 177 Q128 186 120 188 Q112 186 104 177 Z" class="gf-muscle-region" data-muscle="glutes"/>
          <path d="M100 176 Q109 170 118 177 L116 286 Q111 298 102 291 Z" class="gf-muscle-region" data-muscle="hamstrings"/>
          <path d="M122 177 Q131 170 140 176 L141 291 Q132 298 124 286 Z" class="gf-muscle-region" data-muscle="hamstrings"/>
          <path d="M97 289 Q106 285 115 292 L113 374 Q107 380 98 374 Z" class="gf-muscle-region" data-muscle="calves"/>
          <path d="M125 292 Q134 285 143 289 L142 374 Q133 380 127 374 Z" class="gf-muscle-region" data-muscle="calves"/>
        </g>

        <g class="gf-anatomy-lines" aria-hidden="true">
          <path d="M120 60 L120 142"/>
          <path d="M101 75 Q120 91 139 75"/>
          <path d="M103 117 Q120 128 137 117"/>
          <path d="M104 151 Q120 160 136 151"/>
          <path d="M104 218 Q111 222 116 218"/>
          <path d="M124 218 Q129 222 136 217"/>
          <path d="M102 297 Q109 301 114 297"/>
          <path d="M126 297 Q131 301 138 297"/>
        </g>`;

      return `<svg viewBox="0 0 240 400" class="gf-body-svg-canvas gf-muscular-canvas" role="img" aria-label="${isFront ? "Front muscular body muscle map" : "Back muscular body muscle map"}">
        <defs>
          <linearGradient id="gfBodyBase-${side}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#5e7788"/>
            <stop offset="45%" stop-color="#3e5665"/>
            <stop offset="100%" stop-color="#1a242d"/>
          </linearGradient>
        </defs>
        ${body}
      </svg>`;
    }

    function applyBodyHeatmap(model) {
      const maxSets = Math.max(1, ...model.muscleStats.map(m=>m.sets));
      const setMap = Object.fromEntries(model.muscleStats.map(m=>[m.key, m.sets]));
      document.querySelectorAll(".gf-muscle-region").forEach(el=>{
        const key = el.dataset.muscle;
        const sets = setMap[key] || 0;
        const ratio = sets / maxSets;
        const intensity = sets === 0 ? 0 : 0.16 + ratio * 0.78;
        el.style.fill = `rgba(136,249,20,${intensity})`;
        el.classList.toggle("selected", key === selectedAnalyticsMuscle);
        el.setAttribute("tabindex","0");
        el.setAttribute("role","button");
        el.setAttribute("aria-label", ANALYTICS_LABELS[key] || key);
        el.dataset.sets = sets;
      });
    }

    function selectAnalyticsMuscle(muscleKey) {
      selectedAnalyticsMuscle = muscleKey;
      const model = buildAnalyticsModel(analyticsPeriod);
      applyBodyHeatmap(model);

      const stat = model.muscleStats.find(m=>m.key===muscleKey) || {sets:0,workouts:0,volume:0};
      const maxSets = Math.max(1,...model.muscleStats.map(m=>m.sets));
      const ratio = stat.sets / maxSets;
      const intensity = stat.sets === 0 ? "No training" : ratio >= .66 ? "High" : ratio >= .33 ? "Moderate" : "Light";

      const selectedName = document.getElementById("selected-muscle-name");
      const selectedSets = document.getElementById("selected-muscle-sets");
      const selectedWorkouts = document.getElementById("selected-muscle-workouts");
      const selectedVolume = document.getElementById("selected-muscle-volume");
      const selectedIntensity = document.getElementById("selected-muscle-intensity");
      if (selectedName) selectedName.textContent = ANALYTICS_LABELS[muscleKey] || muscleKey;
      if (selectedSets) selectedSets.textContent = analyticsStatNumber(stat.sets);
      if (selectedWorkouts) selectedWorkouts.textContent = analyticsStatNumber(stat.workouts);
      if (selectedVolume) selectedVolume.textContent = analyticsFormatVolume(stat.volume);
      if (selectedIntensity) selectedIntensity.textContent = intensity;

      const related = model.exerciseStats.filter(e=>deriveAnalyticsMuscles(e).includes(muscleKey)).slice(0,5);
      const breakdown = document.getElementById("muscle-breakdown-list");
      if (!breakdown) return;
      breakdown.innerHTML = related.length ? related.map(e=>`
        <button type="button" class="gf-breakdown-row" data-muscle-exercise="${esc(e.id)}">
          <span>
            <strong>${esc(e.name)}</strong>
            <small>${e.sessions} ${currentLanguage()==="en" ? "workouts" : "workout"} · ${e.sets} ${currentLanguage()==="en" ? "sets" : "set"}</small>
          </span>
          <span class="gf-breakdown-value">${analyticsFormatVolume(e.volume)}</span>
        </button>
      `).join("") : `<div class="gf-empty-mini">${currentLanguage()==="en" ? "No completed sets for this muscle in the selected period." : "Belum ada completed set untuk muscle ini pada periode yang dipilih."}</div>`;
      lucide.createIcons();
    }

    function renderMuscleDistribution(model) {
      if (!document.getElementById("muscle-distribution-chart")) return;
      const area = document.getElementById("muscle-distribution-chart");
      const stats = model.muscleStats.filter(m=>m.sets>0).slice(0,8);
      if (!stats.length) {
        area.innerHTML = `<div class="gf-empty-mini">${currentLanguage()==="en" ? "Complete a workout to build your muscle distribution." : "Selesaikan workout untuk mulai membangun distribusi muscle."}</div>`;
        return;
      }
      const maxSets = Math.max(1, ...stats.map(s=>s.sets));
      area.innerHTML = stats.map(s=>`
        <button type="button" class="gf-muscle-bar ${s.key===selectedAnalyticsMuscle ? "active" : ""}" data-muscle-select="${s.key}">
          <span class="gf-muscle-bar-top"><span>${ANALYTICS_LABELS[s.key]}</span><b>${s.sets}</b></span>
          <span class="gf-muscle-bar-track"><i style="width:${Math.max(3,(s.sets/maxSets)*100)}%"></i></span>
        </button>
      `).join("");
    }

    function renderTrainingLoad(model) {
      if (!document.getElementById("training-load-chart")) return;
      const area = document.getElementById("training-load-chart");
      const sessions = [...model.sessions].sort((a,b)=>new Date(a.endedAt)-new Date(b.endedAt)).slice(-8);
      if (!sessions.length) {
        area.innerHTML = `<div class="gf-empty-mini">${currentLanguage()==="en" ? "No training load yet." : "Belum ada training load."}</div>`;
        return;
      }
      const volumes = sessions.map(s=>{
        if (s.stats?.totalVolume != null) return Number(s.stats.totalVolume)||0;
        return (s.exercises||[]).reduce((n,ex)=>{
          const info=analyticsExerciseInfo(ex.exerciseId,ex.name);
          return n + (ex.sets||[]).filter(x=>x.completedAt).reduce((sn,x)=>sn + (info.muscle==="Cardio" ? 0 : (Number(x.reps)||0)*(Number(x.weight)||0)),0);
        },0);
      });
      const max = Math.max(1,...volumes);
      area.innerHTML = `
        <div class="gf-load-chart-inner">
          ${sessions.map((s,i)=>{
            const h = Math.max(8,(volumes[i]/max)*100);
            const d = new Date(s.endedAt);
            return `<div class="gf-load-col" title="${analyticsFormatVolume(volumes[i])}">
              <span class="gf-load-value">${analyticsStatNumber(volumes[i])}</span>
              <i style="height:${h}%"></i>
              <small>${d.toLocaleDateString(currentLanguage()==="en"?"en-US":"id-ID",{day:"numeric",month:"short"})}</small>
            </div>`;
          }).join("")}
        </div>`;
    }

    function renderMainExercises(model) {
      const list = document.getElementById("main-exercises-list");
      const stats = model.exerciseStats.slice(0,7);
      if (!stats.length) {
        list.innerHTML = `<div class="gf-empty-mini">${currentLanguage()==="en" ? "No exercises logged for this period." : "Belum ada exercise pada periode ini."}</div>`;
        return;
      }
      list.innerHTML = stats.map((e,i)=>`
        <div class="gf-exercise-row">
          <span class="gf-rank">${i+1}</span>
          <div class="gf-exercise-row-main">
            <strong>${esc(e.name)}</strong>
            <span>${e.sessions} ${currentLanguage()==="en" ? "workouts" : "workout"} · ${e.sets} ${currentLanguage()==="en" ? "sets" : "set"} · ${analyticsFormatVolume(e.volume)}</span>
          </div>
          <span class="gf-pr-mini">${e.maxWeight>0 ? analyticsStatNumber(e.maxWeight)+" kg" : "—"}</span>
        </div>
      `).join("");
    }

    function renderPersonalRecords(model) {
      if (!document.getElementById("personal-records-list")) return;
      const list = document.getElementById("personal-records-list");
      const prs = model.personalRecords;
      document.getElementById("stat-pr-count").textContent = `${prs.length} PR`;
      if (!prs.length) {
        list.innerHTML = `<div class="gf-empty-mini">${currentLanguage()==="en" ? "Personal records will appear when you beat an earlier best load." : "Personal record akan muncul saat kamu melewati beban terbaik sebelumnya."}</div>`;
        return;
      }
      list.innerHTML = prs.map(pr=>`
        <div class="gf-pr-row">
          <span class="gf-pr-star">★</span>
          <div>
            <strong>${esc(pr.name)}</strong>
            <span>${new Date(pr.date).toLocaleDateString(currentLanguage()==="en"?"en-US":"id-ID",{day:"numeric",month:"short",year:"numeric"})}</span>
          </div>
          <b>${analyticsStatNumber(pr.weight)} kg</b>
        </div>
      `).join("");
    }

    function syncStatisticsPeriodSelect() {
      const wrapper = document.getElementById("statistics-period-select");
      const hidden = document.getElementById("statistics-period");
      if (!wrapper || !hidden) return;
      const option = wrapper.querySelector(`.custom-option[data-value="${analyticsPeriod}"]`);
      const label = wrapper.querySelector(".selected-label");
      wrapper.querySelectorAll(".custom-option").forEach(opt => opt.classList.toggle("selected", opt.dataset.value === analyticsPeriod));
      if (option && label) label.textContent = option.textContent;
      hidden.value = analyticsPeriod;
    }

    function renderStatisticsAnalytics() {
      if (!document.getElementById("progress-statistics-content")) return;
      const model = buildAnalyticsModel(analyticsPeriod);
      const periodLabel = analyticsPeriodLabel();
      const avgVolume = model.totalWorkouts ? model.totalVolume / model.totalWorkouts : 0;

      syncStatisticsPeriodSelect();
      document.getElementById("statistics-data-label").textContent = periodLabel;
      document.getElementById("stat-total-workouts").textContent = analyticsStatNumber(model.totalWorkouts);
      document.getElementById("stat-total-sets").textContent = analyticsStatNumber(model.totalSets);
      document.getElementById("stat-total-volume").textContent = analyticsFormatVolume(model.totalVolume);
      document.getElementById("stat-pr-count").textContent = analyticsStatNumber(model.personalRecords.length);
      document.getElementById("stat-top-muscle").textContent = model.topMuscle ? `${ANALYTICS_LABELS[model.topMuscle.key]} · ${model.topMuscle.sets} sets` : "—";
      document.getElementById("stat-avg-volume").textContent = analyticsFormatVolume(avgVolume);
      document.getElementById("stat-top-exercise").textContent = model.exerciseStats[0]?.name || "—";

      renderMainExercises(model);
      lucide.createIcons();
    }

    function calculateSessionMetrics(session, previousHistory=[]) {
      const summary = {
        totalSets:0,totalReps:0,totalVolume:0,totalExercises:0,
        duration:Number(session?.duration)||0,muscleGroups:[],personalRecords:[],
        exercises:[]
      };
      const previousMaxByExercise = new Map();

      previousHistory.forEach(h=>{
        (h.exercises||[]).forEach(ex=>{
          const maxW = Math.max(0,...(ex.sets||[]).filter(s=>s.completedAt).map(s=>Number(s.weight)||0));
          if(maxW>0) previousMaxByExercise.set(ex.exerciseId, Math.max(previousMaxByExercise.get(ex.exerciseId)||0,maxW));
        });
      });

      const muscleSet = new Set();
      (session?.exercises||[]).forEach(ex=>{
        const info = analyticsExerciseInfo(ex.exerciseId, ex.name);
        const completed = (ex.sets||[]).filter(s=>s.completedAt);
        if(!completed.length) return;
        summary.totalExercises++;
        const reps = completed.reduce((n,s)=>n+(Number(s.reps)||0),0);
        const volume = completed.reduce((n,s)=>n + (info.muscle==="Cardio" ? 0 : (Number(s.reps)||0)*(Number(s.weight)||0)),0);
        const best = Math.max(0,...completed.map(s=>Number(s.weight)||0));

        summary.totalSets += completed.length;
        summary.totalReps += reps;
        summary.totalVolume += volume;
        const groups = deriveAnalyticsMuscles(info);
        groups.forEach(g=>muscleSet.add(g));

        if(best > 0 && best > (previousMaxByExercise.get(info.id)||0)) {
          summary.personalRecords.push({name:info.name,weight:best,exerciseId:info.id});
        }

        summary.exercises.push({
          name:info.name,
          sets:completed.length,
          reps,
          volume,
          bestWeight:best
        });
      });
      summary.muscleGroups=[...muscleSet];
      return summary;
    }

    function buildWorkoutSummaryHTML(historyEntry) {
      const model = calculateSessionMetrics(historyEntry, state.history.filter(s=>s.id!==historyEntry.id));
      const routineName = routineById(historyEntry.routineId)?.name || "Workout";
      const date = new Date(historyEntry.endedAt || Date.now());
      const muscles = model.muscleGroups.map(k=>ANALYTICS_LABELS[k]).join(" · ") || "—";
      return `
        <div class="gf-summary-hero">
          <div>
            <span class="gf-eyebrow">WORKOUT COMPLETE</span>
            <h2 class="gf-summary-title">${esc(routineName)}</h2>
            <p class="muted text-xs mt-1">${date.toLocaleDateString(currentLanguage()==="en"?"en-US":"id-ID",{dateStyle:"full"})}</p>
          </div>
          <span class="gf-summary-check"><i data-lucide="check"></i></span>
        </div>
        <div class="gf-summary-metrics">
          <div><span>Duration</span><b>${formatTimeDetailed(historyEntry.duration||0)}</b></div>
          <div><span>Volume</span><b>${analyticsFormatVolume(model.totalVolume)}</b></div>
          <div><span>Sets</span><b>${model.totalSets}</b></div>
          <div><span>Exercises</span><b>${model.totalExercises}</b></div>
          <div><span>PR</span><b>${model.personalRecords.length}</b></div>
        </div>
        <div class="gf-summary-block">
          <span class="gf-eyebrow">MUSCLE GROUPS</span>
          <div class="gf-summary-tags">${muscles.split(" · ").filter(Boolean).map(m=>`<span>${esc(m)}</span>`).join("") || "<span>—</span>"}</div>
        </div>
        <div class="gf-summary-block">
          <span class="gf-eyebrow">EXERCISES</span>
          <div class="gf-summary-exercises">
            ${model.exercises.map(e=>`<div><span>${esc(e.name)}</span><b>${e.sets} sets</b></div>`).join("") || `<div class="muted text-sm">—</div>`}
          </div>
        </div>
      `;
    }

    function ensureAnalyticsModals() {
      if (document.getElementById("workout-summary-modal")) return;

      document.body.insertAdjacentHTML("beforeend", `
        <div id="workout-summary-modal" class="modal-layer gf-analytics-modal" role="dialog" aria-modal="true" aria-labelledby="workout-summary-title">
          <div class="modal gf-summary-modal">
            <div class="flex justify-between gap-3 items-center mb-4">
              <div>
                <span class="gf-eyebrow">SUMMARY</span>
                <h2 id="workout-summary-title" class="font-extrabold text-xl">Workout Summary</h2>
              </div>
              <button type="button" class="icon-btn" data-gf-close="workout-summary-modal" aria-label="Tutup summary"><i data-lucide="x"></i></button>
            </div>
            <div id="workout-summary-content"></div>
            <div class="flex flex-col sm:flex-row gap-2 mt-5">
              <button id="summary-export-btn" class="lime-btn flex-1"><i data-lucide="download" class="w-4 h-4 inline mr-1"></i> Export Summary</button>
              <button type="button" class="secondary-btn flex-1" data-gf-close="workout-summary-modal">Done</button>
            </div>
          </div>
        </div>

        <div id="analytics-export-modal" class="modal-layer gf-analytics-modal" role="dialog" aria-modal="true" aria-labelledby="analytics-export-title">
          <div class="modal gf-export-modal">
            <div class="flex justify-between gap-3 items-center mb-4">
              <div>
                <span class="gf-eyebrow">EXPORT / SHARE</span>
                <h2 id="analytics-export-title" class="font-extrabold text-xl">Export Preview</h2>
              </div>
              <button type="button" class="icon-btn" data-gf-close="analytics-export-modal" aria-label="Tutup export"><i data-lucide="x"></i></button>
            </div>
            <div class="gf-export-controls-grid mb-4">
              <div class="gf-export-select-group">
                <label class="gf-form-label" for="export-report-type">Report</label>
                <div id="export-report-type" class="custom-select-wrapper gf-export-select">
                  <div class="field custom-select-trigger gf-export-select-trigger" tabindex="0" role="button" aria-haspopup="listbox" aria-expanded="false">
                    <span class="selected-label">Full Report</span>
                    <i data-lucide="chevron-down" class="gf-export-select-chevron" aria-hidden="true"></i>
                  </div>
                  <div class="custom-options" role="listbox">
                    <div class="custom-option" data-value="daily" role="option">Workout Hari Ini</div>
                    <div class="custom-option" data-value="summary" role="option">Workout Summary</div>
                    <div class="custom-option" data-value="body" role="option">Muscle Statistics</div>
                    <div class="custom-option" data-value="load" role="option">Training Load / Volume</div>
                    <div class="custom-option selected" data-value="full" role="option">Full Report</div>
                  </div>
                </div>
              </div>
              <div class="gf-export-select-group">
                <label class="gf-form-label" for="export-format">Format</label>
                <div id="export-format" class="custom-select-wrapper gf-export-select">
                  <div class="field custom-select-trigger gf-export-select-trigger" tabindex="0" role="button" aria-haspopup="listbox" aria-expanded="false">
                    <span class="selected-label">PDF</span>
                    <i data-lucide="chevron-down" class="gf-export-select-chevron" aria-hidden="true"></i>
                  </div>
                  <div class="custom-options" role="listbox">
                    <div class="custom-option" data-value="png" role="option">PNG <span class="gf-export-option-note">Transparent</span></div>
                    <div class="custom-option" data-value="jpg" role="option">JPG <span class="gf-export-option-note">Solid background</span></div>
                    <div class="custom-option selected" data-value="pdf" role="option">PDF <span class="gf-export-option-note">A4 report</span></div>
                  </div>
                </div>
              </div>
              <div class="gf-export-select-group">
                <label class="gf-form-label" for="export-size">Size</label>
                <div id="export-size" class="custom-select-wrapper gf-export-select">
                  <div class="field custom-select-trigger gf-export-select-trigger" tabindex="0" role="button" aria-haspopup="listbox" aria-expanded="false">
                    <span class="selected-label">Auto</span>
                    <i data-lucide="chevron-down" class="gf-export-select-chevron" aria-hidden="true"></i>
                  </div>
                  <div class="custom-options" role="listbox">
                    <div class="custom-option selected" data-value="auto" role="option">Auto <span class="gf-export-option-note">Fit report</span></div>
                    <div class="custom-option" data-value="square" role="option">Social Square <span class="gf-export-option-note">1080×1080</span></div>
                    <div class="custom-option" data-value="portrait" role="option">Social Portrait <span class="gf-export-option-note">1080×1350</span></div>
                    <div class="custom-option" data-value="story" role="option">Story <span class="gf-export-option-note">1080×1920</span></div>
                  </div>
                </div>
              </div>
            </div>
            <div id="analytics-export-preview" class="gf-export-preview"></div>
            <div class="flex flex-col sm:flex-row gap-2 mt-4">
              <button id="analytics-export-download" class="lime-btn flex-1"><i data-lucide="download" class="w-4 h-4 inline mr-1"></i> Download</button>
              <button id="analytics-export-share" class="secondary-btn flex-1"><i data-lucide="share-2" class="w-4 h-4 inline mr-1"></i> Share</button>
            </div>
          </div>
        </div>

        <div id="photo-workout-export-modal" class="modal-layer gf-photo-export-layer" role="dialog" aria-modal="true" aria-labelledby="photo-workout-export-title">
          <div class="modal gf-photo-export-modal">
            <div class="gf-photo-export-header">
              <div>
                <span class="gf-eyebrow">PHOTO WORKOUT EXPORT</span>
                <h2 id="photo-workout-export-title" class="font-extrabold text-xl tracking-tight">Share your workout</h2>
                <p id="gf-photo-export-subtitle" class="gf-photo-export-subtitle">Fullscreen · data dari GYMFlow</p>
              </div>
              <button type="button" class="icon-btn" data-gf-close="photo-workout-export-modal" aria-label="Tutup photo export"><i data-lucide="x"></i></button>
            </div>

            <div class="gf-photo-export-layout">
              <div class="gf-photo-export-stage-wrap">
                <div id="gf-photo-export-preview" class="gf-photo-export-preview">
                  <canvas id="gf-photo-export-canvas" width="1920" height="1080" aria-label="Preview workout export fullscreen"></canvas>
                  <div id="gf-photo-export-empty" class="gf-photo-export-empty">
                    <i data-lucide="image-plus"></i>
                    <strong>Upload a workout photo</strong>
                    <span>Portrait, landscape, atau square. Foto tidak akan diubah rasio aslinya.</span>
                    <button id="gf-photo-export-empty-upload" type="button" class="lime-btn px-4">Choose Photo</button>
                  </div>
                </div>
                <div class="gf-photo-export-stage-meta">
                  <span id="gf-photo-export-size-meta">Fullscreen · 1920 × 1080 px</span>
                  <span id="gf-photo-export-live-meta">Classic · JPG</span>
                </div>
              </div>

              <div class="gf-photo-export-controls">
                <input id="gf-photo-export-file" type="file" accept="image/jpeg,image/png,image/webp,image/*" hidden>

                <section class="gf-photo-control-group">
                  <div class="gf-photo-control-head"><span>Photo</span><span class="muted text-xs">position & zoom</span></div>
                  <div class="flex gap-2">
                    <button id="gf-photo-export-upload" type="button" class="secondary-btn flex-1"><i data-lucide="upload" class="w-4 h-4 inline mr-1"></i> Import Photo</button>
                    <button id="gf-photo-export-reset" type="button" class="secondary-btn" title="Reset photo"><i data-lucide="scan"></i></button>
                  </div>
                  <div class="gf-photo-zoom-row">
                    <button id="gf-photo-export-zoom-out" type="button" class="icon-btn !w-10 !h-10" aria-label="Zoom out"><i data-lucide="minus"></i></button>
                    <input id="gf-photo-export-zoom" type="range" min="1" max="2.2" step="0.01" value="1" aria-label="Photo zoom">
                    <button id="gf-photo-export-zoom-in" type="button" class="icon-btn !w-10 !h-10" aria-label="Zoom in"><i data-lucide="plus"></i></button>
                  </div>
                  <small id="gf-photo-export-zoom-label" class="muted text-xs">Zoom 100%</small>
                </section>

                <section class="gf-photo-control-group">
                  <div class="gf-photo-control-head"><span>Template</span><span class="muted text-xs">overlay layout</span></div>
                  <div id="gf-photo-export-templates" class="gf-photo-template-grid">
                    <button type="button" class="gf-photo-template active" data-template="classic"><strong>Classic</strong><span>Balanced stats</span></button>
                    <button type="button" class="gf-photo-template" data-template="minimal"><strong>Minimal</strong><span>Clean & bold</span></button>
                    <button type="button" class="gf-photo-template" data-template="performance"><strong>Performance</strong><span>Load & PR</span></button>
                    <button type="button" class="gf-photo-template" data-template="full"><strong>Full Stats</strong><span>More data</span></button>
                  </div>
                </section>

                <section class="gf-photo-control-group">
                  <div class="gf-photo-control-head"><span>Canvas</span><span id="gf-photo-size-helper" class="muted text-xs">auto device aspect</span></div>
                  <div class="gf-photo-size-mode-grid">
                    <button type="button" class="gf-photo-size-mode active" data-size-mode="fullscreen"><strong>Fullscreen</strong><span>Match your device</span></button>
                    <button type="button" class="gf-photo-size-mode" data-size-mode="custom"><strong>Custom Size</strong><span>Choose pixels</span></button>
                  </div>

                  <div id="gf-photo-custom-size-panel" class="gf-photo-custom-size-panel hidden">
                    <div class="gf-photo-preset-grid">
                      <button type="button" class="gf-photo-preset active" data-preset="square"><strong>Square</strong><span>1080×1080</span></button>
                      <button type="button" class="gf-photo-preset" data-preset="portrait"><strong>Portrait</strong><span>1080×1350</span></button>
                      <button type="button" class="gf-photo-preset" data-preset="story"><strong>Story</strong><span>1080×1920</span></button>
                      <button type="button" class="gf-photo-preset" data-preset="landscape"><strong>Landscape</strong><span>1920×1080</span></button>
                      <button type="button" class="gf-photo-preset" data-preset="custom"><strong>Custom</strong><span>Set your own size</span></button>
                    </div>

                    <div class="gf-photo-dimensions-grid">
                      <label><span>Width</span><input id="gf-photo-export-width" type="number" min="320" max="8192" step="1" value="1080" inputmode="numeric"></label>
                      <span class="gf-photo-dimensions-x">×</span>
                      <label><span>Height</span><input id="gf-photo-export-height" type="number" min="320" max="8192" step="1" value="1080" inputmode="numeric"></label>
                    </div>
                    <div class="gf-photo-ratio-note">Aspect ratio <strong id="gf-photo-export-ratio">1:1</strong></div>
                  </div>
                </section>

                <section class="gf-photo-control-group">
                  <div class="gf-photo-control-head"><span>Format</span><span id="gf-photo-format-helper" class="muted text-xs">image export</span></div>
                  <div class="gf-photo-format-grid">
                    <button type="button" class="gf-photo-format active" data-format="jpg"><strong>JPG</strong><span>Photo background</span></button>
                    <button type="button" class="gf-photo-format" data-format="png"><strong>PNG</strong><span>Alpha supported</span></button>
                  </div>
                  <label class="gf-photo-transparent-row">
                    <input id="gf-photo-export-transparent" type="checkbox">
                    <span>Transparent PNG (hide photo background)</span>
                  </label>
                </section>

                <div class="gf-photo-export-actions">
                  <button id="gf-photo-export-download" type="button" class="lime-btn flex-1"><i data-lucide="download" class="w-4 h-4 inline mr-1"></i> Download</button>
                  <button id="gf-photo-export-share" type="button" class="secondary-btn flex-1"><i data-lucide="share-2" class="w-4 h-4 inline mr-1"></i> Share</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `);

      document.querySelectorAll("[data-gf-close]").forEach(btn=>{
        btn.addEventListener("click",()=>closeModal(btn.dataset.gfClose));
      });
      document.getElementById("statistics-export-btn")?.addEventListener("click",()=>openPhotoWorkoutExportModal());
      document.getElementById("summary-export-btn").addEventListener("click",()=>{
        const entry = window.__gfLastWorkoutSummary;
        openExportModal("summary", entry);
      });
      initCustomSelect("export-report-type", () => renderExportPreview());
      initCustomSelect("export-format", () => renderExportPreview());
      initCustomSelect("export-size", () => renderExportPreview());
      syncExportCustomSelects();
      document.getElementById("analytics-export-download").addEventListener("click",downloadAnalyticsExport);
      document.getElementById("analytics-export-share").addEventListener("click",shareAnalyticsExport);
      initPhotoWorkoutExport();
      lucide.createIcons();
    }

    function openWorkoutSummary(historyEntry) {
      ensureAnalyticsModals();
      window.__gfLastWorkoutSummary = historyEntry;
      document.getElementById("workout-summary-content").innerHTML = buildWorkoutSummaryHTML(historyEntry);
      lucide.createIcons();
      openModal("workout-summary-modal");
    }

    function getTodaySession() {
      const today = new Date().toDateString();
      return state.history.find(s=>new Date(s.endedAt).toDateString()===today) || null;
    }

    function getLatestSession() {
      return state.history[0] || null;
    }

function buildExportBrandMark(size = 38) {
  const s = Number(size) || 38;

  return `
    <img
      class="gf-export-logo-mark"
      src="new_logoprofile.png"
      alt="GYMFlow"
      width="${s}"
      height="${s}"
    >
  `;
}

    function buildExportCard(type, specificSession=null) {
      const model = buildAnalyticsModel(analyticsPeriod);
      const session = type === "summary" && specificSession ? specificSession : (type === "daily" ? getTodaySession() : getLatestSession());
      const titleMap = {
        daily:"Workout Hari Ini", summary:"Workout Summary", body:"Muscle Statistics",
        load:"Training Load / Volume", full:"GYMFlow Full Report"
      };
      const title = titleMap[type] || "GYMFlow Report";
      const userName = state.settings.userName || "GYMFlow User";
      const exportDate = new Date().toLocaleDateString(
        currentLanguage()==="en" ? "en-US" : "id-ID",
        { dateStyle:"medium" }
      );

      let bodyHtml = "";

      if ((type==="daily" || type==="summary") && session) {
        const sm = calculateSessionMetrics(session, state.history.filter(s=>s.id!==session.id));
        bodyHtml = `
          <section class="gf-export-section gf-export-feature-card">
            <div class="gf-export-section-head">
              <div>
                <span class="gf-eyebrow">WORKOUT OVERVIEW</span>
                <h2 class="gf-export-section-title">${esc(title)}</h2>
              </div>
              <span class="gf-export-period">${exportDate}</span>
            </div>

            <div class="gf-export-kpis">
              <div><small>Duration</small><b>${formatTimeDetailed(session.duration||0)}</b><span class="gf-export-kpi-icon">◷</span></div>
              <div><small>Volume</small><b>${analyticsFormatVolume(sm.totalVolume)}</b><span class="gf-export-kpi-icon">↗</span></div>
              <div><small>Sets</small><b>${sm.totalSets}</b><span class="gf-export-kpi-icon">◫</span></div>
              <div><small>Exercises</small><b>${sm.totalExercises}</b><span class="gf-export-kpi-icon">✦</span></div>
              <div><small>Personal Records</small><b>${sm.personalRecords.length}</b><span class="gf-export-kpi-icon">★</span></div>
            </div>

            <div class="gf-export-two-col">
              <div class="gf-export-subcard">
                <span class="gf-eyebrow">MUSCLE GROUPS</span>
                <div class="gf-export-tags">
                  ${sm.muscleGroups.map(k=>`<span>${esc(ANALYTICS_LABELS[k])}</span>`).join("") || "<span>—</span>"}
                </div>
              </div>
              <div class="gf-export-subcard">
                <span class="gf-eyebrow">WORKOUT DATE</span>
                <strong class="gf-export-date-value">${new Date(session.endedAt||Date.now()).toLocaleDateString(currentLanguage()==="en"?"en-US":"id-ID",{dateStyle:"long"})}</strong>
              </div>
            </div>

            <div class="gf-export-section-inner">
              <div class="gf-export-section-head">
                <span class="gf-eyebrow">EXERCISES</span>
                <span class="gf-export-meta">${sm.totalExercises} exercise</span>
              </div>
              <div class="gf-export-list">
                ${sm.exercises.map(e=>`<div><span>${esc(e.name)}</span><b>${e.sets} sets · ${e.reps} reps · ${analyticsFormatVolume(e.volume)}</b></div>`).join("") || "<div>—</div>"}
              </div>
            </div>
          </section>`;
      } else if (type==="daily" || type==="summary") {
        bodyHtml = `
          <section class="gf-export-empty-card">
            <span class="gf-eyebrow">WORKOUT OVERVIEW</span>
            <strong>Belum ada workout untuk report ini.</strong>
            <p>Selesaikan workout terlebih dahulu agar ringkasan dapat diekspor.</p>
          </section>`;
      }

      if (type==="body" || type==="full") {
        const topMuscles = model.muscleStats.filter(m=>m.sets>0).slice(0,8);
        bodyHtml += `
          <section class="gf-export-section gf-export-feature-card">
            <div class="gf-export-section-head">
              <div>
                <span class="gf-eyebrow">MUSCLE ANALYTICS</span>
                <h2 class="gf-export-section-title">Muscle Statistics</h2>
              </div>
              <span class="gf-export-period">${analyticsPeriodLabel()}</span>
            </div>

            <div class="gf-export-list gf-export-ranked-list">
              ${topMuscles.map((m,idx)=>`
                <div>
                  <span><i class="gf-export-rank">${idx+1}</i>${esc(ANALYTICS_LABELS[m.key])}</span>
                  <b>${m.sets} sets · ${m.workouts} workouts · ${analyticsFormatVolume(m.volume)}</b>
                </div>
              `).join("") || "<div>No muscle data</div>"}
            </div>
          </section>`;
      }

      if (type==="load" || type==="full") {
        const sessions = [...model.sessions].sort((a,b)=>new Date(a.endedAt)-new Date(b.endedAt)).slice(-8);
        bodyHtml += `
          <section class="gf-export-section gf-export-feature-card">
            <div class="gf-export-section-head">
              <div>
                <span class="gf-eyebrow">TRAINING LOAD</span>
                <h2 class="gf-export-section-title">Training Load & Volume</h2>
              </div>
              <span class="gf-export-period">${analyticsPeriodLabel()}</span>
            </div>

            <div class="gf-export-kpis gf-export-kpis-5">
              <div><small>Total volume</small><b>${analyticsFormatVolume(model.totalVolume)}</b></div>
              <div><small>Total sets</small><b>${analyticsStatNumber(model.totalSets)}</b></div>
              <div><small>Total reps</small><b>${analyticsStatNumber(model.totalReps)}</b></div>
              <div><small>Workouts</small><b>${analyticsStatNumber(model.totalWorkouts)}</b></div>
              <div><small>Total duration</small><b>${formatTimeDetailed(model.totalDuration)}</b></div>
            </div>

            <div class="gf-export-section-inner">
              <div class="gf-export-section-head">
                <span class="gf-eyebrow">RECENT SESSIONS</span>
                <span class="gf-export-meta">${sessions.length} sessions</span>
              </div>
              <div class="gf-export-list">
                ${sessions.map(s=>{
                  const sm=calculateSessionMetrics(s,[]);
                  const d=new Date(s.endedAt);
                  return `<div><span>${d.toLocaleDateString(currentLanguage()==="en"?"en-US":"id-ID",{day:"numeric",month:"short",year:"numeric"})}</span><b>${analyticsFormatVolume(sm.totalVolume)}</b></div>`;
                }).join("") || "<div>No training load data</div>"}
              </div>
            </div>
          </section>`;
      }

      if (type==="full") {
        bodyHtml += `
          <section class="gf-export-section gf-export-feature-card">
            <div class="gf-export-section-head">
              <div>
                <span class="gf-eyebrow">PERSONAL RECORDS</span>
                <h2 class="gf-export-section-title">Latest Personal Records</h2>
              </div>
              <span class="gf-export-period">${model.personalRecords.length} PR</span>
            </div>
            <div class="gf-export-list">
              ${model.personalRecords.map(pr=>`<div><span>${esc(pr.name)}</span><b>${analyticsStatNumber(pr.weight)} kg</b></div>`).join("") || "<div>No PR data</div>"}
            </div>
          </section>`;
      }

      return `
        <div class="gf-export-canvas" data-export-type="${type}">
          <header class="gf-export-header">
            <div class="gf-export-brand-lockup">
              ${buildExportBrandMark(44)}
              <div>
                <span class="gf-export-brand">GYMFlow</span>
                <span class="gf-export-tagline">YOUR FITNESS JOURNEY</span>
              </div>
            </div>
            <div class="gf-export-header-meta">
              <span class="gf-export-meta-label">EXPORT DATE</span>
              <strong>${exportDate}</strong>
              <span class="gf-export-user">${esc(userName)}</span>
            </div>
          </header>

          <div class="gf-export-intro">
            <span class="gf-eyebrow">GYMFLOW REPORT</span>
            <h1>${esc(title)}</h1>
            <p>${analyticsPeriodLabel()} <span>•</span> Performance summary generated from your workout data.</p>
          </div>

          ${bodyHtml || `<div class="gf-export-empty-card"><strong>Belum ada data untuk report ini.</strong></div>`}

          <footer class="gf-export-footer">
            <div class="gf-export-footer-brand">
              ${buildExportBrandMark(24)}
              <span>GYMFlow</span>
            </div>
            <span>Your Fitness Journey · ${exportDate}</span>
          </footer>
        </div>`;
    }


    function getCustomSelectValue(wrapperId, fallback="") {
      const wrapper = document.getElementById(wrapperId);
      if (!wrapper) return fallback;
      return wrapper.querySelector(".custom-option.selected")?.dataset.value || fallback;
    }

    function setCustomSelectValue(wrapperId, value) {
      const wrapper = document.getElementById(wrapperId);
      if (!wrapper) return;
      const options = wrapper.querySelectorAll(".custom-option");
      let selected = null;
      options.forEach(option => {
        const isSelected = option.dataset.value === value;
        option.classList.toggle("selected", isSelected);
        if (isSelected) selected = option;
      });
      if (selected) {
        const label = wrapper.querySelector(".selected-label");
        if (label) label.textContent = selected.childNodes[0]?.textContent?.trim() || selected.textContent.trim();
      }
      const trigger = wrapper.querySelector(".custom-select-trigger");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
      wrapper.classList.remove("open");
    }

    function syncExportCustomSelects() {
      const type = document.getElementById("export-report-type");
      const format = document.getElementById("export-format");
      const size = document.getElementById("export-size");
      if (!type || !format || !size) return;
      setCustomSelectValue("export-report-type", type.querySelector(".custom-option.selected")?.dataset.value || "full");
      setCustomSelectValue("export-format", format.querySelector(".custom-option.selected")?.dataset.value || "pdf");
      setCustomSelectValue("export-size", size.querySelector(".custom-option.selected")?.dataset.value || "auto");
    }

    function openExportModal(type="full", session=null) {
      ensureAnalyticsModals();
      setCustomSelectValue("export-report-type", type);
      setCustomSelectValue("export-format", "pdf");
      setCustomSelectValue("export-size", "auto");
      window.__gfExportSession = session || null;
      renderExportPreview();
      openModal("analytics-export-modal");
    }

    function renderExportPreview() {
      const type = getCustomSelectValue("export-report-type", "full");
      const format = getCustomSelectValue("export-format", "pdf");
      const preview = document.getElementById("analytics-export-preview");
      if (!preview) return;
      preview.classList.toggle("gf-export-preview-transparent", format === "png");
      preview.innerHTML = buildExportCard(type, window.__gfExportSession || null);
    }

    function getExportFilename(type, ext) {
      const date = new Date().toISOString().slice(0,10);
      return `GYMFlow-${type}-${date}.${ext}`;
    }

    
    async function buildCaptureNode(exportFormat="pdf") {
      const preview = document.querySelector("#analytics-export-preview .gf-export-canvas");
      if (!preview) throw new Error("Preview tidak tersedia.");

      const clone = preview.cloneNode(true);
      const size = getCustomSelectValue("export-size", "auto");
      const map = {
        square:[1080,1080],
        portrait:[1080,1350],
        story:[1080,1920]
      };
      const [w,h] = map[size] || [860, null];

      // Render in a stable off-screen layer. Avoid position:fixed/viewport
      // because html2canvas may capture a blank/partial canvas in that case.
      clone.style.width = `${w}px`;
      clone.style.maxWidth = "none";
      clone.style.minHeight = h ? `${h}px` : "0";
      clone.style.height = "auto";
      clone.style.position = "fixed";
      clone.style.left = "0";
      clone.style.top = "0";
      clone.style.zIndex = "-2";
      clone.style.pointerEvents = "none";
      clone.style.visibility = "visible";
      clone.style.opacity = "1";
      clone.style.transform = "none";
      clone.style.overflow = "visible";
      clone.style.boxSizing = "border-box";
      clone.classList.add("gf-export-capture");
      if (exportFormat === "png") clone.classList.add("gf-export-transparent");

      document.body.appendChild(clone);

      // Wait for layout, fonts and images before rasterizing.
      if (document.fonts?.ready) {
        try { await document.fonts.ready; } catch (_) {}
      }
      const images = [...clone.querySelectorAll("img")];
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.addEventListener("load", resolve, {once:true});
          img.addEventListener("error", resolve, {once:true});
        });
      }));
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));

      return clone;
    }

    async function renderExportCanvas(target) {
      if (typeof html2canvas !== "function") throw new Error("PNG/PDF engine belum tersedia.");
      const width = Math.ceil(target.scrollWidth || target.offsetWidth || 860);
      const height = Math.ceil(target.scrollHeight || target.offsetHeight || 1200);
      if (!width || !height) throw new Error("Konten export kosong.");

      return html2canvas(target, {
        scale: Math.min(2, Math.max(1.5, window.devicePixelRatio || 1)),
        width,
        height,
        backgroundColor:target.classList.contains("gf-export-transparent") ? null : "#ffffff",
        useCORS:true,
        foreignObjectRendering:false,
        allowTaint:false,
        logging:false,
        scrollX:0,
        scrollY:0,
        windowWidth:width,
        windowHeight:height
      });
    }

    async function canvasToPdfBlob(canvas) {
      const jspdfApi = window.jspdf?.jsPDF;
      if (!jspdfApi) throw new Error("PDF engine belum tersedia.");

      const pdf = new jspdfApi("p", "mm", "a4");
      const pageW = 210;
      const pageH = 297;
      const margin = 8;
      const usableW = pageW - margin * 2;
      const usableH = pageH - margin * 2;
      const imageH = canvas.height * usableW / canvas.width;
      const slicePx = Math.max(1, Math.floor(canvas.height * usableH / imageH));

      let offsetY = 0;
      let pageIndex = 0;
      while (offsetY < canvas.height) {
        const currentH = Math.min(slicePx, canvas.height - offsetY);
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = currentH;
        const ctx = slice.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(
          canvas,
          0, offsetY, canvas.width, currentH,
          0, 0, slice.width, slice.height
        );

        const data = slice.toDataURL("image/jpeg", 0.95);
        const renderedH = currentH * usableW / slice.width;
        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(data, "JPEG", margin, margin, usableW, renderedH, undefined, "FAST");
        offsetY += currentH;
        pageIndex++;
      }

      return pdf.output("blob");
    }

    function triggerBlobDownload(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }

    async function downloadAnalyticsExport() {
      let target = null;
      try {
        const type = getCustomSelectValue("export-report-type", "full");
        const format = getCustomSelectValue("export-format", "pdf");
        target = await buildCaptureNode(format);
        const canvas = await renderExportCanvas(target);

        if (format === "pdf") {
          const blob = await canvasToPdfBlob(canvas);
          triggerBlobDownload(blob, getExportFilename(type, "pdf"));
        } else {
          const mime = format === "jpg" ? "image/jpeg" : "image/png";
          const ext = format === "jpg" ? "jpg" : "png";
          let exportCanvas = canvas;
          if (format === "jpg") {
            const opaque = document.createElement("canvas");
            opaque.width = canvas.width;
            opaque.height = canvas.height;
            const ctx = opaque.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, opaque.width, opaque.height);
            ctx.drawImage(canvas, 0, 0);
            exportCanvas = opaque;
          }
          const blob = await new Promise((resolve, reject) => {
            exportCanvas.toBlob(b => b ? resolve(b) : reject(new Error("Gagal membuat file gambar.")), mime, 0.95);
          });
          triggerBlobDownload(blob, getExportFilename(type, ext));
        }

        toast(currentLanguage()==="en" ? "Export ready." : "Export berhasil dibuat.");
      } catch(err) {
        console.error("[GYMFlow Export]", err);
        toast(err.message || "Export gagal.");
      } finally {
        if (target?.isConnected) target.remove();
      }
    }

    async function shareAnalyticsExport() {
      let target = null;
      try {
        if (!navigator.share) {
          toast(currentLanguage()==="en" ? "Share is not supported. Use Download instead." : "Share tidak didukung browser ini. Gunakan Download.");
          return;
        }

        const type = getCustomSelectValue("export-report-type", "full");
        const format = getCustomSelectValue("export-format", "pdf") === "pdf" ? "pdf" : "png";
        target = await buildCaptureNode(format);
        const canvas = await renderExportCanvas(target);

        let blob, mime, ext;
        if (format === "pdf") {
          blob = await canvasToPdfBlob(canvas);
          mime = "application/pdf";
          ext = "pdf";
        } else {
          blob = await new Promise((resolve, reject) => {
            canvas.toBlob(b => b ? resolve(b) : reject(new Error("Gagal membuat file gambar.")), "image/png", 0.95);
          });
          mime = "image/png";
          ext = "png";
        }

        const file = new File([blob], getExportFilename(type, ext), {type:mime});
        if (navigator.canShare && navigator.canShare({files:[file]})) {
          await navigator.share({
            title:`GYMFlow ${type}`,
            text:"GYMFlow workout report",
            files:[file]
          });
        } else {
          toast(currentLanguage()==="en" ? "File sharing is not available on this device." : "Share file tidak tersedia di perangkat ini.");
        }
      } catch(err) {
        console.error("[GYMFlow Share]", err);
        toast(err.message || "Share gagal.");
      } finally {
        if (target?.isConnected) target.remove();
      }
    }


    /* ===== GYMFlow Photo Workout Export =====
       1080x1080 canvas-first renderer: the exact same canvas drives preview,
       download and share, so what the user sees is what gets exported. */
    function photoExportFormatNumber(n){
      const v = Number(n) || 0;
      const sign = v < 0 ? "-" : "";
      const a = Math.abs(v);
      if (a >= 1000000) return sign + (a/1000000).toFixed(a >= 10000000 ? 0 : 1).replace(/\.0$/,'') + "m";
      if (a >= 1000) return sign + (a/1000).toFixed(a >= 100000 ? 0 : 1).replace(/\.0$/,'') + "k";
      return sign + new Intl.NumberFormat("en-US", {maximumFractionDigits:0}).format(a);
    }

    function photoExportPeriodTitle(session=null){
      if (session?.endedAt) {
        return new Date(session.endedAt).toLocaleDateString("en-US", {month:"long", year:"numeric"});
      }
      const now = new Date();
      const map = {"7d":"LAST 7 DAYS","30d":now.toLocaleDateString("en-US",{month:"long",year:"numeric"}),"90d":"LAST 3 MONTHS","1y":"LAST 12 MONTHS","all":"ALL TIME"};
      return map[analyticsPeriod] || now.toLocaleDateString("en-US",{month:"long",year:"numeric"});
    }

    function getPhotoWorkoutData(sessionOverride=null){
      if (sessionOverride) {
        const m = calculateSessionMetrics(sessionOverride, (state.history || []).filter(s=>s.id!==sessionOverride.id));
        return {
          period: photoExportPeriodTitle(sessionOverride),
          workouts: 1,
          duration: Number(sessionOverride.duration)||0,
          volume: m.totalVolume,
          sets: m.totalSets,
          exercises: m.totalExercises,
          prs: m.personalRecords.length,
          topMuscle: m.muscleGroups?.[0] ? (ANALYTICS_LABELS[m.muscleGroups[0]] || m.muscleGroups[0]) : "—",
          muscleGroups: (m.muscleGroups || []).map(k => ANALYTICS_LABELS[k] || k),
          routineName: routineById(sessionOverride.routineId)?.name || "Workout"
        };
      }

      const model = buildAnalyticsModel(analyticsPeriod);
      return {
        period: photoExportPeriodTitle(),
        workouts: model.totalWorkouts,
        duration: model.totalDuration,
        volume: model.totalVolume,
        sets: model.totalSets,
        exercises: model.totalExercises,
        prs: model.personalRecords.length,
        topMuscle: model.topMuscle ? (ANALYTICS_LABELS[model.topMuscle.key] || model.topMuscle.key) : "—",
        muscleGroups: model.muscleStats.filter(m=>m.sets>0).slice(0,4).map(m => ANALYTICS_LABELS[m.key] || m.key),
        routineName: ""
      };
    }

    function gfCanvasText(ctx, text, x, y, size, weight=800, color="#ffffff", align="left", maxWidth=null){
      ctx.save();
      ctx.font = `${weight} ${size}px "DM Sans", Arial, sans-serif`;
      ctx.textAlign = align;
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = color;
      ctx.shadowColor = "rgba(0,0,0,.48)";
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 3;
      const value = String(text ?? "");
      if (maxWidth) ctx.fillText(value, x, y, maxWidth);
      else ctx.fillText(value, x, y);
      ctx.restore();
    }

    function gfCanvasLabel(ctx, label, x, y, align="left", scale=1){
      const labelScale = Math.max(.72, scale || 1);
      const text = String(label).toUpperCase();
      ctx.save();
      ctx.font = `800 ${22*labelScale}px "DM Sans", Arial, sans-serif`;
      ctx.textAlign = align;
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "rgba(255,255,255,.84)";
      ctx.shadowColor = "rgba(0,0,0,.6)";
      ctx.shadowBlur = 10*labelScale;
      ctx.fillText(text, x, y);
      const textWidth = ctx.measureText(text).width;
      ctx.restore();
      const w = Math.min(54*labelScale, Math.max(30*labelScale, textWidth * .26));
      ctx.save();
      ctx.fillStyle = "#88F914";
      ctx.fillRect(align === "right" ? x - w : x, y + 12*labelScale, w, 4*labelScale);
      ctx.restore();
    }

    function gfCanvasMetric(ctx, x, y, label, value, side="left", valueSize=62){
      const align = side === "right" ? "right" : "left";
      gfCanvasLabel(ctx, label, x, y, align);
      gfCanvasText(ctx, value, x, y + 72, valueSize, 900, "#ffffff", align, 470);
    }

    function gfCanvasBrand(ctx, x, y, username, logoImage=null, scale=1){
      const mark = 38*scale;
      if (logoImage?.complete && logoImage.naturalWidth) {
        ctx.save();
        ctx.drawImage(logoImage,x,y-mark*.86,mark,mark);
        ctx.restore();
      } else {
        ctx.save();
        ctx.fillStyle = "#88F914";
        ctx.fillRect(x,y-mark*.74,32*scale,32*scale);
        ctx.fillStyle = "#0a0f0b";
        ctx.font = `900 ${20*scale}px Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("G",x+16*scale,y-mark*.38);
        ctx.restore();
      }
      gfCanvasText(ctx,"GYMFlow",x+48*scale,y-4*scale,25*scale,900,"#ffffff","left");
      gfCanvasText(ctx,username ? `@${username.replace(/^@+/,"")}` : "@gymflow",x+48*scale,y+24*scale,18*scale,700,"rgba(255,255,255,.72)","left");
    }

    function getPhotoExportFullscreenSize(){
      const vv = window.visualViewport;
      const viewportW = Number(vv?.width || window.innerWidth || 16);
      const viewportH = Number(vv?.height || window.innerHeight || 9);
      const ratio = Math.max(0.35, Math.min(3.2, viewportW / Math.max(1, viewportH)));
      const longEdge = 1920;
      let width, height;
      if (ratio >= 1) {
        width = longEdge;
        height = Math.max(540, Math.round(longEdge / ratio));
      } else {
        height = longEdge;
        width = Math.max(540, Math.round(longEdge * ratio));
      }
      return {width, height};
    }

    function getPhotoExportSize(){
      const editor = window.__gfPhotoExportEditor;
      if (!editor) return {width:1920,height:1080};
      if (editor.sizeMode === "custom") return {width:editor.width,height:editor.height};
      return getPhotoExportFullscreenSize();
    }

    function clampPhotoDimension(v, fallback=1080){
      return Math.max(320, Math.min(8192, Math.round(Number(v) || fallback)));
    }

    function photoExportAspectRatio(width,height){
      const w = Math.max(1, Math.round(Number(width)||1));
      const h = Math.max(1, Math.round(Number(height)||1));
      const gcd = (a,b) => b ? gcd(b, a % b) : a;
      const g = gcd(w,h);
      return `${Math.round(w/g)}:${Math.round(h/g)}`;
    }

    function syncPhotoExportSizeFromInputs(preset=null){
      const editor = window.__gfPhotoExportEditor;
      if (!editor) return;
      const presets = {square:[1080,1080],portrait:[1080,1350],story:[1080,1920],landscape:[1920,1080]};
      if (preset && presets[preset]) {
        [editor.width, editor.height] = presets[preset];
        editor.preset = preset;
      } else {
        editor.width = clampPhotoDimension(document.getElementById("gf-photo-export-width")?.value, editor.width || 1080);
        editor.height = clampPhotoDimension(document.getElementById("gf-photo-export-height")?.value, editor.height || 1080);
        editor.preset = "custom";
      }
      updatePhotoWorkoutControls();
    }

    function setPhotoExportSizeMode(mode){
      const editor = window.__gfPhotoExportEditor;
      if (!editor) return;
      if (mode === "custom" && editor.sizeMode !== "custom") {
        editor.width = 1080;
        editor.height = 1080;
        editor.preset = "square";
      }
      editor.sizeMode = mode === "custom" ? "custom" : "fullscreen";
      updatePhotoWorkoutControls();
    }

    function getPhotoCanvasLayout(W,H){
      const s = Math.min(W,H) / 1080;
      return {s,left:W*.0666667,right:W*.9333333,headerY:H*.0759,titleY:H*.1185,row1:H*.255,row2:H*.47,row3:H*.68,row4:H*.83,footerY:H*.931};
    }

    function gfCanvasMetricResponsive(ctx, layout, x, y, label, value, side="left", valueSize=62, maxWidth=null){
      const align = side === "right" ? "right" : "left";
      gfCanvasLabel(ctx,label,x,y,align,layout.s);
      gfCanvasText(ctx,value,x,y+72*layout.s,valueSize*layout.s,900,"#ffffff",align,maxWidth || .43*Math.max(x,1));
    }

    function drawPhotoWorkoutCanvas(){
      const editor = window.__gfPhotoExportEditor;
      const canvas = document.getElementById("gf-photo-export-canvas");
      if (!editor || !canvas) return;
      const {width:W,height:H} = getPhotoExportSize();
      if (canvas.width !== W) canvas.width=W;
      if (canvas.height !== H) canvas.height=H;
      canvas.style.aspectRatio=`${W}/${H}`;
      canvas.setAttribute("aria-label",`Preview workout export ${W} by ${H}`);
      const ctx=canvas.getContext("2d",{alpha:true});
      if(!ctx) return;
      ctx.clearRect(0,0,W,H);
      const transparent=editor.format==="png"&&editor.transparent;
      if(!transparent){
        if(editor.image){
          const img=editor.image;
          const fitScale=Math.max(W/img.naturalWidth,H/img.naturalHeight);
          const scale=fitScale*editor.zoom;
          const drawW=img.naturalWidth*scale, drawH=img.naturalHeight*scale;
          ctx.save();
          ctx.translate(W/2+editor.offsetX*W,H/2+editor.offsetY*H);
          ctx.drawImage(img,-drawW/2,-drawH/2,drawW,drawH);
          ctx.restore();
        }else{ctx.fillStyle="#090d13";ctx.fillRect(0,0,W,H);}
        const leftFade=ctx.createLinearGradient(0,0,W*.76,0);leftFade.addColorStop(0,"rgba(0,0,0,.76)");leftFade.addColorStop(.42,"rgba(0,0,0,.31)");leftFade.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=leftFade;ctx.fillRect(0,0,W,H);
        const bottomFade=ctx.createLinearGradient(0,H*.58,0,H);bottomFade.addColorStop(0,"rgba(0,0,0,0)");bottomFade.addColorStop(1,"rgba(0,0,0,.78)");ctx.fillStyle=bottomFade;ctx.fillRect(0,H*.48,W,H*.52);
        const vignette=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.34,W/2,H/2,Math.min(W,H)*.72);vignette.addColorStop(0,"rgba(0,0,0,0)");vignette.addColorStop(1,"rgba(0,0,0,.34)");ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);
      }
      const data=getPhotoWorkoutData(editor.sessionOverride), username=state.settings.userName||"GYMFlow User", template=editor.template, layout=getPhotoCanvasLayout(W,H), s=layout.s;
      const tallCanvas = H / Math.max(1,W) > 1.15;
      const compactUnit = Math.min(W,H);
      const compactRows = tallCanvas ? {
        row1: compactUnit * .30,
        row2: compactUnit * .52,
        row3: compactUnit * .70,
        row4: compactUnit * .84
      } : {
        row1: layout.row1,
        row2: layout.row2,
        row3: layout.row3,
        row4: layout.row4
      };
      gfCanvasText(ctx,data.period,layout.left,layout.headerY,Math.max(18,27*s),600,"rgba(255,255,255,.78)","left");
      gfCanvasText(ctx,template==="performance"?"PERFORMANCE":"WORKOUTS",layout.left,layout.titleY,Math.max(13,18*s),900,"#88F914","left");
      gfCanvasText(ctx,`@${username.replace(/^@+/,"")}`,layout.right,layout.headerY,Math.max(14,19*s),700,"rgba(255,255,255,.82)","right");
      if(template==="minimal"){
        gfCanvasLabel(ctx,"WORKOUTS",layout.left,layout.row1,"left",s);gfCanvasText(ctx,String(data.workouts),layout.left,layout.row1+170*s,188*s,900,"#ffffff","left");
        gfCanvasLabel(ctx,"TOTAL DURATION",layout.left,layout.row2-20*s,"left",s);gfCanvasText(ctx,formatTimeDetailed(data.duration),layout.left,layout.row2+52*s,54*s,850,"#ffffff","left");
        gfCanvasLabel(ctx,"VOLUME",layout.left,layout.row3-30*s,"left",s);gfCanvasText(ctx,photoExportFormatNumber(data.volume)+" kg",layout.left,layout.row3+42*s,60*s,900,"#ffffff","left");
        gfCanvasMetricResponsive(ctx,layout,layout.right,layout.row3-30*s,"SETS",String(data.sets),"right",60,.3*W);gfCanvasMetricResponsive(ctx,layout,layout.right,layout.row4-35*s,"PRs",String(data.prs),"right",54,.3*W);
      }else if(template==="performance"){
        const perfRow1 = compactRows.row1, perfRow2 = compactRows.row2, perfRow3 = compactRows.row3, perfRow4 = compactRows.row4;
        gfCanvasLabel(ctx,"VOLUME",layout.left,perfRow1,"left",s);gfCanvasText(ctx,photoExportFormatNumber(data.volume)+" kg",layout.left,perfRow1+130*s,118*s,900,"#ffffff","left",.7*W);gfCanvasText(ctx,"TOTAL TRAINING LOAD",layout.left,perfRow1+172*s,18*s,800,"rgba(255,255,255,.70)","left");
        gfCanvasMetricResponsive(ctx,layout,layout.left,perfRow2-10*s,"DURATION",formatTimeDetailed(data.duration),"left",60,.38*W);gfCanvasMetricResponsive(ctx,layout,layout.right,perfRow2-10*s,"SETS",String(data.sets),"right",60,.3*W);
        gfCanvasMetricResponsive(ctx,layout,layout.left,perfRow3-10*s,"PERSONAL RECORDS",String(data.prs),"left",60,.4*W);gfCanvasMetricResponsive(ctx,layout,layout.right,perfRow3-10*s,"EXERCISES",String(data.exercises),"right",60,.3*W);
        if(data.topMuscle&&data.topMuscle!=="—")gfCanvasText(ctx,`TOP MUSCLE · ${data.topMuscle.toUpperCase()}`,layout.left,perfRow4,20*s,800,"#88F914","left",.8*W);
      }else if(template==="full"){
        const fullRow1 = compactRows.row1, fullRow2 = compactRows.row2, fullRow3 = compactRows.row3, fullRow4 = compactRows.row4;
        gfCanvasLabel(ctx,"WORKOUTS",layout.left,fullRow1,"left",s);gfCanvasText(ctx,String(data.workouts),layout.left,fullRow1+72*s,86*s,900,"#ffffff","left");
        gfCanvasLabel(ctx,"DURATION",W*.53,fullRow1,"left",s);gfCanvasText(ctx,formatTimeDetailed(data.duration),W*.53,fullRow1+72*s,72*s,900,"#ffffff","left",.4*W);
        gfCanvasLabel(ctx,"VOLUME",layout.left,fullRow2,"left",s);gfCanvasText(ctx,photoExportFormatNumber(data.volume)+" kg",layout.left,fullRow2+72*s,74*s,900,"#ffffff","left",.43*W);
        gfCanvasLabel(ctx,"SETS",W*.53,fullRow2,"left",s);gfCanvasText(ctx,String(data.sets),W*.53,fullRow2+72*s,74*s,900,"#ffffff","left");
        gfCanvasLabel(ctx,"EXERCISES",layout.left,fullRow3,"left",s);gfCanvasText(ctx,String(data.exercises),layout.left,fullRow3+68*s,66*s,900,"#ffffff","left");
        gfCanvasLabel(ctx,"PERSONAL RECORDS",W*.53,fullRow3,"left",s);gfCanvasText(ctx,String(data.prs),W*.53,fullRow3+68*s,66*s,900,"#ffffff","left");
        if(data.topMuscle&&data.topMuscle!=="—")gfCanvasText(ctx,`TOP MUSCLE · ${data.topMuscle.toUpperCase()}`,layout.left,fullRow4,20*s,800,"#88F914","left",.8*W);
        if(data.muscleGroups?.length)gfCanvasText(ctx,data.muscleGroups.join("  ·  ").toUpperCase(),layout.left,fullRow4+34*s,19*s,700,"rgba(255,255,255,.72)","left",.86*W);
      }else{
        // CLASSIC — match the reference: clean 2×2 stat grid, large values,
        // generous spacing, and no extra dashboard-style stat blocks.
        // CLASSIC uses a compact reference-style 2-column grid.
        // Horizontal positions follow the reference composition (~18% / ~53%),
        // while vertical spacing is capped from canvas height so tall fullscreen
        // exports do not stretch the stats apart.
        const statScale = Math.min(1.18, Math.max(.72, layout.s));
        const statLeft = W * .177;
        const statRight = W * .529;
        // Keep the 2×2 block compact on tall/fullscreen canvases. Its vertical
        // rhythm follows the short edge (same visual density as the reference),
        // instead of expanding with the full portrait height.
        const classicRow1 = compactRows.row1;
        const classicRow2 = compactRows.row2;

        function drawClassicReferenceStat(label, value, x, y, align="left", valueSize=72){
          ctx.save();
          ctx.font = `600 ${Math.max(16, 21*statScale)}px "DM Sans", Arial, sans-serif`;
          ctx.textAlign = align;
          ctx.textBaseline = "alphabetic";
          ctx.fillStyle = "rgba(255,255,255,.88)";
          ctx.shadowColor = "rgba(0,0,0,.58)";
          ctx.shadowBlur = 9*statScale;
          ctx.shadowOffsetY = 2;
          ctx.fillText(label, x, y);
          ctx.restore();

          gfCanvasText(
            ctx,
            value,
            x,
            y + 63*statScale,
            Math.max(42, valueSize*statScale),
            900,
            "#ffffff",
            align,
            .43*W
          );
        }

        drawClassicReferenceStat("Workouts", String(data.workouts), statLeft, classicRow1, "left", 76);
        drawClassicReferenceStat("Duration", formatTimeDetailed(data.duration), statRight, classicRow1, "left", 61);
        drawClassicReferenceStat("Volume", photoExportFormatNumber(data.volume)+" kg", statLeft, classicRow2, "left", 63);
        drawClassicReferenceStat("Sets", String(data.sets), statRight, classicRow2, "left", 63);
      }
      gfCanvasBrand(ctx,layout.left,layout.footerY,username,editor.logoImage,s);gfCanvasText(ctx,"YOUR FITNESS JOURNEY",layout.right,layout.footerY+8*s,15*s,800,"rgba(255,255,255,.55)","right",.35*W);
    }

    function updatePhotoWorkoutControls(){
      const editor=window.__gfPhotoExportEditor;if(!editor)return;
      const {width,height}=getPhotoExportSize();
      document.querySelectorAll(".gf-photo-template").forEach(btn=>btn.classList.toggle("active",btn.dataset.template===editor.template));
      document.querySelectorAll(".gf-photo-format").forEach(btn=>btn.classList.toggle("active",btn.dataset.format===editor.format));
      document.querySelectorAll(".gf-photo-size-mode").forEach(btn=>btn.classList.toggle("active",btn.dataset.sizeMode===editor.sizeMode));
      document.querySelectorAll(".gf-photo-preset").forEach(btn=>btn.classList.toggle("active",editor.sizeMode==="custom"&&btn.dataset.preset===editor.preset));
      document.getElementById("gf-photo-custom-size-panel")?.classList.toggle("hidden",editor.sizeMode!=="custom");
      const helper=document.getElementById("gf-photo-size-helper");if(helper)helper.textContent=editor.sizeMode==="fullscreen"?"auto device aspect":"custom canvas";
      const wi=document.getElementById("gf-photo-export-width"),hi=document.getElementById("gf-photo-export-height");if(wi)wi.value=String(editor.width);if(hi)hi.value=String(editor.height);
      const ratio=document.getElementById("gf-photo-export-ratio");if(ratio)ratio.textContent=photoExportAspectRatio(width,height);
      const transparent=document.getElementById("gf-photo-export-transparent");if(transparent){transparent.disabled=editor.format!=="png";transparent.closest("label")?.classList.toggle("is-disabled",editor.format!=="png");transparent.checked=editor.transparent;}
      const zoom=document.getElementById("gf-photo-export-zoom"),zoomLabel=document.getElementById("gf-photo-export-zoom-label");if(zoom)zoom.value=String(editor.zoom);if(zoomLabel)zoomLabel.textContent=`Zoom ${Math.round(editor.zoom*100)}%`;
      const subtitle=document.getElementById("gf-photo-export-subtitle");if(subtitle)subtitle.textContent=`${editor.sizeMode==="fullscreen"?"Fullscreen":`${width}×${height}`} · data dari GYMFlow`;
      const stageMeta=document.getElementById("gf-photo-export-size-meta");if(stageMeta)stageMeta.textContent=editor.sizeMode==="fullscreen"?`Fullscreen · ${width} × ${height} px`:`${width} × ${height} px`;
      const meta=document.getElementById("gf-photo-export-live-meta");if(meta)meta.textContent=`${editor.template==="classic"?"Classic":editor.template==="minimal"?"Minimal":editor.template==="performance"?"Performance":"Full Stats"} · ${editor.format.toUpperCase()}${editor.format==="png"&&editor.transparent?" · Transparent":""}`;
      const fh=document.getElementById("gf-photo-format-helper");if(fh)fh.textContent=editor.format==="png"?"PNG with alpha":"JPG photo background";
      document.getElementById("gf-photo-export-preview")?.classList.toggle("is-transparent",editor.format==="png"&&editor.transparent);
      document.getElementById("gf-photo-export-empty")?.classList.toggle("hidden",!!editor.image);
      document.querySelectorAll("#gf-photo-export-download,#gf-photo-export-share").forEach(btn=>btn.disabled=!editor.image);
      drawPhotoWorkoutCanvas();
    }

    function loadPhotoWorkoutImage(file){
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast(currentLanguage()==="en" ? "Please choose an image file." : "Pilih file gambar.");
        return;
      }
      const editor = window.__gfPhotoExportEditor;
      if (!editor) return;
      if (editor.objectUrl) URL.revokeObjectURL(editor.objectUrl);
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        editor.image = img;
        editor.objectUrl = objectUrl;
        editor.offsetX = 0;
        editor.offsetY = 0;
        editor.zoom = 1;
        updatePhotoWorkoutControls();
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        toast(currentLanguage()==="en" ? "Image could not be loaded." : "Foto tidak bisa dimuat.");
      };
      img.src = objectUrl;
    }

    function setPhotoWorkoutZoom(next){
      const editor = window.__gfPhotoExportEditor;
      if (!editor) return;
      editor.zoom = Math.min(2.2, Math.max(1, Number(next)||1));
      updatePhotoWorkoutControls();
    }

    function initPhotoWorkoutExport(){
      if (window.__gfPhotoExportEditor) return;
      // Photo Workout Export opens with the compact 1080×1080 square preset by default.
      // Fullscreen remains available as an explicit user choice.
      window.__gfPhotoExportEditor = {
        template:"classic",
        format:"jpg",
        transparent:false,
        zoom:1,
        offsetX:0,
        offsetY:0,
        image:null,
        objectUrl:null,
        sessionOverride:null,
        logoImage:null,
        dragging:false,
        lastPointer:null,
        sizeMode:"custom",
        width:1080,
        height:1080,
        preset:"square"
      };

      const logo = new Image();
      logo.onload = () => { window.__gfPhotoExportEditor.logoImage = logo; drawPhotoWorkoutCanvas(); };
      logo.src = "new_logoprofile.png";

      const file = document.getElementById("gf-photo-export-file");
      const upload = document.getElementById("gf-photo-export-upload");
      const emptyUpload = document.getElementById("gf-photo-export-empty-upload");
      upload?.addEventListener("click",()=>file?.click());
      emptyUpload?.addEventListener("click",()=>file?.click());
      file?.addEventListener("change",e=>loadPhotoWorkoutImage(e.target.files?.[0]));

      document.querySelectorAll(".gf-photo-template").forEach(btn=>btn.addEventListener("click",()=>{
        window.__gfPhotoExportEditor.template = btn.dataset.template || "classic";
        updatePhotoWorkoutControls();
      }));
      document.querySelectorAll(".gf-photo-format").forEach(btn=>btn.addEventListener("click",()=>{
        const editor = window.__gfPhotoExportEditor;
        editor.format = btn.dataset.format || "jpg";
        if (editor.format !== "png") editor.transparent = false;
        updatePhotoWorkoutControls();
      }));
      document.querySelectorAll(".gf-photo-size-mode").forEach(btn=>btn.addEventListener("click",()=>setPhotoExportSizeMode(btn.dataset.sizeMode)));
      document.querySelectorAll(".gf-photo-preset").forEach(btn=>btn.addEventListener("click",()=>{
        const preset=btn.dataset.preset||"square";
        if(preset==="custom"){
          const editor=window.__gfPhotoExportEditor;editor.sizeMode="custom";editor.preset="custom";updatePhotoWorkoutControls();document.getElementById("gf-photo-export-width")?.focus();document.getElementById("gf-photo-export-width")?.select?.();return;
        }
        setPhotoExportSizeMode("custom");
        syncPhotoExportSizeFromInputs(preset);
      }));
      ["gf-photo-export-width","gf-photo-export-height"].forEach(id=>document.getElementById(id)?.addEventListener("input",()=>{const editor=window.__gfPhotoExportEditor;editor.sizeMode="custom";syncPhotoExportSizeFromInputs();}));
      document.getElementById("gf-photo-export-transparent")?.addEventListener("change",e=>{
        const editor = window.__gfPhotoExportEditor;
        editor.transparent = !!e.target.checked;
        updatePhotoWorkoutControls();
      });
      document.getElementById("gf-photo-export-reset")?.addEventListener("click",()=>{
        const editor = window.__gfPhotoExportEditor;
        editor.offsetX=0; editor.offsetY=0; editor.zoom=1;
        updatePhotoWorkoutControls();
      });
      document.getElementById("gf-photo-export-zoom")?.addEventListener("input",e=>setPhotoWorkoutZoom(e.target.value));
      document.getElementById("gf-photo-export-zoom-out")?.addEventListener("click",()=>setPhotoWorkoutZoom((window.__gfPhotoExportEditor?.zoom||1)-.05));
      document.getElementById("gf-photo-export-zoom-in")?.addEventListener("click",()=>setPhotoWorkoutZoom((window.__gfPhotoExportEditor?.zoom||1)+.05));

      const canvas = document.getElementById("gf-photo-export-canvas");
      if (canvas) {
        const pointerPos = (ev) => {
          const r = canvas.getBoundingClientRect();
          return {x:(ev.clientX-r.left)/Math.max(1,r.width), y:(ev.clientY-r.top)/Math.max(1,r.height)};
        };
        canvas.addEventListener("pointerdown",ev=>{
          const editor=window.__gfPhotoExportEditor;
          if (!editor.image) return;
          editor.dragging=true;
          editor.lastPointer=pointerPos(ev);
          canvas.setPointerCapture?.(ev.pointerId);
        });
        canvas.addEventListener("pointermove",ev=>{
          const editor=window.__gfPhotoExportEditor;
          if (!editor.dragging || !editor.lastPointer) return;
          const p=pointerPos(ev);
          editor.offsetX += p.x-editor.lastPointer.x;
          editor.offsetY += p.y-editor.lastPointer.y;
          editor.lastPointer=p;
          drawPhotoWorkoutCanvas();
        });
        const stop=ev=>{
          const editor=window.__gfPhotoExportEditor;
          editor.dragging=false;
          editor.lastPointer=null;
          try{canvas.releasePointerCapture?.(ev.pointerId);}catch(_){ }
        };
        canvas.addEventListener("pointerup",stop);
        canvas.addEventListener("pointercancel",stop);
        canvas.addEventListener("dblclick",()=>{
          const editor=window.__gfPhotoExportEditor;
          editor.offsetX=0; editor.offsetY=0;
          editor.zoom=1;
          updatePhotoWorkoutControls();
        });
      }

      const onFullscreenResize=()=>{
        const editor=window.__gfPhotoExportEditor;if(!editor||editor.sizeMode!=="fullscreen")return;
        const next=getPhotoExportFullscreenSize();
        if(editor.width!==next.width||editor.height!==next.height){editor.width=next.width;editor.height=next.height;updatePhotoWorkoutControls();}
      };
      window.addEventListener("resize",onFullscreenResize,{passive:true});
      window.visualViewport?.addEventListener?.("resize",onFullscreenResize,{passive:true});

      document.getElementById("gf-photo-export-download")?.addEventListener("click",downloadPhotoWorkoutExport);
      document.getElementById("gf-photo-export-share")?.addEventListener("click",sharePhotoWorkoutExport);
      updatePhotoWorkoutControls();
    }

    function openPhotoWorkoutExportModal(sessionOverride=null){
      ensureAnalyticsModals();
      const editor = window.__gfPhotoExportEditor;
      if (!editor) return;
      editor.sessionOverride = sessionOverride || null;
      updatePhotoWorkoutControls();
      openModal("photo-workout-export-modal");
      requestAnimationFrame(()=>drawPhotoWorkoutCanvas());
    }

    function getPhotoWorkoutFilename(ext){
      const date = new Date().toISOString().slice(0,10);
      const editor = window.__gfPhotoExportEditor;
      const {width,height} = getPhotoExportSize();
      const suffix = editor?.sizeMode === "fullscreen" ? `fullscreen-${width}x${height}` : `${width}x${height}`;
      return `GYMFlow-Workout-${date}-${suffix}.${ext}`;
    }

    function getPhotoWorkoutCanvasBlob(canvas, format){
      const mime = format === "jpg" ? "image/jpeg" : "image/png";
      return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("Gagal membuat file gambar.")),mime,0.96));
    }

    async function downloadPhotoWorkoutExport(){
      const editor = window.__gfPhotoExportEditor;
      const canvas = document.getElementById("gf-photo-export-canvas");
      if (!editor?.image || !canvas) {
        toast(currentLanguage()==="en" ? "Upload a photo first." : "Upload foto terlebih dahulu.");
        return;
      }
      try {
        drawPhotoWorkoutCanvas();
        const blob = await getPhotoWorkoutCanvasBlob(canvas,editor.format);
        triggerBlobDownload(blob,getPhotoWorkoutFilename(editor.format));
        toast(currentLanguage()==="en" ? "Workout photo exported." : "Workout photo berhasil diexport.");
      } catch(err) {
        console.error("[GYMFlow Photo Export]",err);
        toast(err.message || "Export gagal.");
      }
    }

    async function sharePhotoWorkoutExport(){
      const editor = window.__gfPhotoExportEditor;
      const canvas = document.getElementById("gf-photo-export-canvas");
      if (!editor?.image || !canvas) {
        toast(currentLanguage()==="en" ? "Upload a photo first." : "Upload foto terlebih dahulu.");
        return;
      }
      try {
        if (!navigator.share) {
          await downloadPhotoWorkoutExport();
          return;
        }
        drawPhotoWorkoutCanvas();
        const blob = await getPhotoWorkoutCanvasBlob(canvas,editor.format);
        const ext = editor.format;
        const mime = editor.format === "jpg" ? "image/jpeg" : "image/png";
        const file = new File([blob],getPhotoWorkoutFilename(ext),{type:mime});
        if (navigator.canShare && navigator.canShare({files:[file]})) {
          await navigator.share({title:"GYMFlow Workout",text:"My GYMFlow workout",files:[file]});
        } else {
          await downloadPhotoWorkoutExport();
        }
      } catch(err) {
        if (err?.name === "AbortError") return;
        console.error("[GYMFlow Photo Share]",err);
        toast(err.message || "Share gagal.");
      }
    }

    function exportPDF() {
      if (state.history.length === 0) {
        toast(currentLanguage()==="en" ? "No workout history available to export." : "Belum ada data history latihan untuk didownload.");
        return;
      }
      openExportModal("daily");
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

      // Inisialisasi modal/export lebih awal supaya tombol Export di tab Statistics
      // langsung punya event handler, tanpa harus klik Export di header terlebih dahulu.
      ensureAnalyticsModals();
      
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
      document.getElementById("export-pdf-daily").onclick = () => openExportModal("full");
      initCustomSelect("statistics-period-select", (val) => {
        analyticsPeriod = val;
        syncStatisticsPeriodSelect();
        renderStatisticsAnalytics();
      });
      syncStatisticsPeriodSelect();

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
      document.querySelectorAll(".gf-routine-filter").forEach(btn => {
        btn.addEventListener("click", () => {
          routineFilter = btn.dataset.routineFilter || "all";
          renderRoutines();
        });
      });
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
        if(b.classList.contains("order-routine")){
          reorderRoutineByIndex(id, b.dataset.move === "up" ? -1 : 1);
          return;
        }
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

      initRoutineReordering();

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


/* ==================== PHASE 4 MOTION HELPERS ==================== */
function gfAnimateNumber(el, targetText, duration=520){
  if(!el) return;
  const raw=String(targetText ?? "");
  const match=raw.match(/^\s*([\d.,]+)(.*)$/);
  if(!match){el.textContent=raw;return;}
  const numberText=match[1];
  const suffix=match[2]||"";
  const normalized=numberText.replace(/\./g, "").replace(/,/g, ".");
  const target=Number(normalized);
  if(!Number.isFinite(target)){el.textContent=raw;return;}
  const hasDecimal=numberText.includes(",") || (/\.\d+/.test(normalized));
  const decimals=hasDecimal ? Math.min(1,(numberText.split(/[.,]/)[1]||"").length) : 0;
  const start=performance.now();
  const formatter = value => {
    if(decimals>0){
      const fixed=value.toFixed(decimals).replace(".",",");
      return fixed.replace(/\B(?=(\d{3})+(?!\d))/g,".");
    }
    return Math.round(value).toLocaleString("id-ID");
  };
  function tick(now){
    const p=Math.min(1,(now-start)/duration);
    const eased=1-Math.pow(1-p,3);
    el.textContent=formatter(target*eased)+suffix;
    if(p<1) requestAnimationFrame(tick); else el.textContent=raw;
  }
  el.textContent=formatter(0)+suffix;
  requestAnimationFrame(tick);
}

function gfRunProgressMotion(root=document){
  const selectors=[
    "#history-session-count",
    "#progress-this-week",
    "#progress-current-streak",
    "#history-calories",
    "#history-total-time",
    "#history-avg-duration",
    "#stat-total-workouts",
    "#stat-total-sets",
    "#stat-total-volume",
    "#stat-pr-count"
  ];
  selectors.forEach(sel=>{
    const el=root.querySelector(sel);
    if(!el || el.dataset.gfMotionDone==="1") return;
    const observer=new MutationObserver(()=>{
      const latest=el.textContent.trim();
      if(!latest) return;
      el.dataset.gfMotionDone="1";
      gfAnimateNumber(el,latest);
      observer.disconnect();
    });
    observer.observe(el,{childList:true,characterData:true,subtree:true});
    if(el.textContent.trim()){
      const latest=el.textContent.trim();
      el.dataset.gfMotionDone="1";
      gfAnimateNumber(el,latest);
      observer.disconnect();
    }
  });
}

function gfRefreshProgressMotion(){
  const history=document.getElementById("history");
  if(!history) return;
  history.classList.remove("gf-motion-reset");
  void history.offsetWidth;
  history.classList.add("gf-motion-reset");
  gfRunProgressMotion(history);
}

document.addEventListener("DOMContentLoaded",()=>{
  setTimeout(()=>{
    if(typeof gfRefreshProgressMotion === "function") gfRefreshProgressMotion();
  },120);
});

/* =========================================================
   GYMFlow Fluid Bottom Navigation
   Existing routine-builder logic remains unchanged.
   ========================================================= */
function gfUpdateLiquidNav(targetTab, animate=true){
  const nav = document.getElementById("gymflow-navbar-routine-builder");
  if(!nav) return;
  const buttons = [...nav.querySelectorAll(".mobile-nav-btn")];
  const active = buttons.find(btn => btn.dataset.tab === targetTab) || nav.querySelector(".mobile-nav-btn.active");
  const indicator = nav.querySelector(".nav-liquid-indicator");
  if(!active || !indicator) return;

  buttons.forEach(btn => {
    const isActive = btn === active;
    btn.classList.toggle("active", isActive);
    if(isActive) btn.setAttribute("aria-current","page");
    else btn.removeAttribute("aria-current");
  });

  const navRect = nav.getBoundingClientRect();
  const buttonRect = active.getBoundingClientRect();
  const x = buttonRect.left - navRect.left + buttonRect.width/2;
  const w = Math.min(72, Math.max(54, buttonRect.width - 10));

  nav.style.setProperty("--liquid-x", `${x}px`);
  nav.style.setProperty("--liquid-w", `${w}px`);

  if(animate){
    nav.classList.remove("is-moving");
    void nav.offsetWidth;
    nav.classList.add("is-moving");
    window.clearTimeout(nav._liquidTimer);
    nav._liquidTimer = window.setTimeout(()=>nav.classList.remove("is-moving"), 520);
  }
}

function navigate(tab){
  document.querySelectorAll(".tab").forEach(el => el.classList.toggle("active", el.id === tab));
  document.querySelectorAll("[data-tab]").forEach(el => el.classList.toggle("active", el.dataset.tab === tab));
  if(tab==="workout") renderWorkout();
  if(tab==="history"){ renderHistory(); renderOverviewMetrics(); }
  if(tab==="routines") renderRoutines();
  gfUpdateLiquidNav(tab, true);
}

window.addEventListener("resize", () => gfUpdateLiquidNav(document.querySelector(".mobile-nav-btn.active")?.dataset.tab || "dashboard", false));
if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", () => gfUpdateLiquidNav("dashboard", false), {once:true});
}else{
  requestAnimationFrame(() => gfUpdateLiquidNav(document.querySelector(".mobile-nav-btn.active")?.dataset.tab || "dashboard", false));
}
