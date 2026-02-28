export const T = [
    {
        name: "Brutalist", cls: "t-brut",
        v: { "--bg": "#f5f0e6", "--card": "#fff", "--text": "#000", "--accent": "#ff5722", "--border": "3px solid #000", "--shadow": "4px 4px 0 #000", "--radius": "0px", "--font": "'Space Mono',monospace", "--weight": "800" }
    },
    {
        name: "Material", cls: "t-md3",
        v: { "--bg": "#fffbfe", "--card": "#fff", "--text": "#1c1b1f", "--accent": "#6750a4", "--border": "none", "--shadow": "0 2px 8px #0002", "--radius": "28px", "--font": "'Roboto',sans-serif", "--weight": "500" }
    },
    {
        name: "shadcn", cls: "t-shad",
        v: { "--bg": "#fafafa", "--card": "#fff", "--text": "#0a0a0a", "--accent": "#18181b", "--border": "1px solid #e4e4e7", "--shadow": "0 1px 3px #0001", "--radius": "8px", "--font": "'Inter',sans-serif", "--weight": "500" }
    },
    {
        name: "Fluent", cls: "t-flu",
        v: { "--bg": "#f3f3f3", "--card": "rgba(255,255,255,0.7)", "--text": "#1a1a1a", "--accent": "#0078d4", "--border": "1px solid #d1d1d1", "--shadow": "0 2px 4px #0001", "--radius": "8px", "--font": "'Segoe UI',sans-serif", "--weight": "400" }
    },
    {
        name: "Neumorph", cls: "t-neu",
        v: { "--bg": "#e0e5ec", "--card": "#e0e5ec", "--text": "#44476a", "--accent": "#6c63ff", "--border": "none", "--shadow": "6px 6px 12px #b8bec7,-6px -6px 12px #fff", "--radius": "16px", "--font": "'Nunito',sans-serif", "--weight": "700" }
    },
] as const;

export type Theme = typeof T[number];
