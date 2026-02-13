import { useEffect, useState } from "react";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/tasks")
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(setTasks)
      .catch((e) => setErr(String(e)));
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "Arial" }}>
      <h1>Görevler</h1>

      {err && <p style={{ color: "red" }}>Hata: {err}</p>}

      {tasks.map((t) => (
        <div key={t.id} style={{ marginBottom: 8 }}>
          <b>{t.title}</b> — {t.done ? "✅" : "⬜"}
        </div>
      ))}
    </div>
  );
}
