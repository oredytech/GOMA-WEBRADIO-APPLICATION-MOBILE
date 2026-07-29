import { useState } from "react";

export function MiniPlayer() {
  const [playing, setPlaying] = useState(true);
  return (
    <div className="fixed bottom-24 left-4 right-4 bg-surface-container-lowest/85 border border-outline-variant/40 backdrop-blur-md p-3 rounded-lg shadow-2xl flex items-center gap-3 z-40">
      <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 border border-outline-variant/40">
        <img
          className="w-full h-full object-cover"
          alt="Now playing"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUg2e-_7JzMp8TpZg9E1yrPCbik5Vg36Yi-sI3vFRFZLwq8-UhVIfyid7txvrcv_cl-IlBNAZ155DcVtpJ2f3AKS2rsPYh-HqZE9wlyNIMJlGMWmPM9M4pG958fb7CEdX2YvS6savZNq_iFikwxonnoXV3LN8j9qZ5us-Zz5o4TfM9RCFoG_xEp46Nw6QVevnOBLM3eZczxGn---Avsfxm9kUrlV5AD0AuqSv0dSpX4e2ZEZgetBLATg"
        />
      </div>
      <div className="flex-grow overflow-hidden">
        <h4 className="font-label-lg text-label-lg text-primary truncate">DIRECT : Le Grand Réveil</h4>
        <p className="text-on-surface-muted truncate" style={{ fontSize: 11 }}>Animé par Mama Goma</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white active:scale-95 transition-transform shadow-md"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            {playing ? "pause" : "play_arrow"}
          </span>
        </button>
      </div>
    </div>
  );
}
