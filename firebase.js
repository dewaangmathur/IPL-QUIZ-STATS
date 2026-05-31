import { initializeApp }    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, get, update, onValue }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const cfg = {
  apiKey:            "AIzaSyCQvlVO3U0HW8kriMl6osHyNsW6mfguEPI",
  authDomain:        "maha-ipl.firebaseapp.com",
  databaseURL:       "https://maha-ipl-default-rtdb.firebaseio.com",
  projectId:         "maha-ipl",
  storageBucket:     "maha-ipl.firebasestorage.app",
  messagingSenderId: "685628848358",
  appId:             "1:685628848358:web:5a0e244f6f1a3a7b16a327",
};

const app = initializeApp(cfg);
const db  = getDatabase(app);
export { db, ref, set, get, update, onValue };
