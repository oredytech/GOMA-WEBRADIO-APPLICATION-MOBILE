import logo from "@/assets/logo.png.asset.json";

export function TopBar({ transparent = false }: { transparent?: boolean }) {
  return (
    <header
      className={
        "fixed top-0 left-0 w-full z-40 flex justify-between items-center px-margin-mobile h-16 " +
        (transparent ? "bg-transparent" : "bg-surface/90 backdrop-blur-md")
      }
    >
      <button className="w-10 h-10 flex items-center justify-center rounded-full text-primary hover:bg-surface-variant transition-colors">
        <span className="material-symbols-outlined">menu</span>
      </button>
      <div className="flex items-center gap-2">
        <img alt="GOMA WEBRADIO Logo" className="h-8 w-auto" src={logo.url} />
        <h1 className="font-headline-md-mobile text-headline-md-mobile font-bold text-primary">
          GOMA WEBRADIO
        </h1>
      </div>
      <button className="w-10 h-10 flex items-center justify-center rounded-full text-primary hover:bg-surface-variant transition-colors">
        <span className="material-symbols-outlined">notifications</span>
      </button>
    </header>
  );
}
