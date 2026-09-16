export type ThemeId =
  | "dark"
  | "light"
  | "ocean"
  | "forest"
  | "sunset"
  | "lavender"
  | "rose"
  | "rainbow"
  | "mono";

export type ThemeConfig = {
  id: ThemeId;
  name: string;
  preview: string;
};

export const THEMES: ThemeConfig[] = [
  { id: "dark", name: "Dark", preview: "bg-slate-900" },
  { id: "light", name: "Light", preview: "bg-slate-100" },
  { id: "ocean", name: "Ocean", preview: "bg-sky-600" },
  { id: "forest", name: "Forest", preview: "bg-emerald-600" },
  { id: "sunset", name: "Sunset", preview: "bg-orange-500" },
  { id: "lavender", name: "Lavender", preview: "bg-purple-500" },
  { id: "rose", name: "Rose", preview: "bg-rose-500" },
  { id: "rainbow", name: "Rainbow", preview: "bg-gradient-to-br from-green-400 via-orange-500 to-purple-500" },
  { id: "mono", name: "Mono", preview: "bg-gradient-to-br from-black via-gray-700 to-black" },
];

export const THEME_STORAGE_KEY = "todu-theme";

export const THEME_INIT_SCRIPT = `(function(){try{var ids=${JSON.stringify(
  THEMES.map((t) => t.id),
)};var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(ids.indexOf(t)<0){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}var d=document.documentElement;d.setAttribute("data-theme",t);d.classList.add("theme-"+t)}catch(e){}})();`;
