export const T = [
    {
        name: "Brutalist", cls: "t-brut",
        v: {
            "--bg": "#f5f0e6", "--card": "#fff", "--text": "#000", "--accent": "#ff5722",
            "--border": "2px solid #000", "--border-ring": "#000", "--shadow": "4px 4px 0px 0px rgba(0,0,0,1)",
            "--shadow-hover": "8px 8px 0px 0px rgba(0,0,0,1)", "--shadow-active": "2px 2px 0px 0px rgba(0,0,0,1)",
            "--radius": "0px", "--font": "'Space Mono', monospace", "--weight": "800", "--btn-transform": "translate(-4px, -4px)", "--btn-transform-active": "translate(0)"
        }
    },
    {
        name: "Material 3", cls: "t-md3",
        v: {
            "--bg": "#fffbfe", "--card": "#f4eff4", "--text": "#1c1b1f", "--accent": "#6750a4",
            "--border": "none", "--border-ring": "#cac4d0", "--shadow": "0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px rgba(0,0,0,0.3)",
            "--shadow-hover": "0px 6px 10px 4px rgba(0,0,0,0.15), 0px 2px 3px rgba(0,0,0,0.3)", "--shadow-active": "0px 1px 3px 1px rgba(0,0,0,0.15)",
            "--radius": "28px", "--font": "'Roboto', sans-serif", "--weight": "500", "--btn-transform": "translateY(-1px)", "--btn-transform-active": "translateY(1px)"
        }
    },
    {
        name: "shadcn/ui", cls: "t-shad",
        v: {
            "--bg": "#ffffff", "--card": "#ffffff", "--text": "#09090b", "--accent": "#18181b",
            "--border": "1px solid #e4e4e7", "--border-ring": "#e4e4e7", "--shadow": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            "--shadow-hover": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)", "--shadow-active": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            "--radius": "6px", "--font": "'Inter', sans-serif", "--weight": "500", "--btn-transform": "none", "--btn-transform-active": "scale(0.98)"
        }
    },
    {
        name: "Fluent Mica", cls: "t-flu",
        v: {
            "--bg": "#f3f3f3", "--card": "rgba(255, 255, 255, 0.45)", "--text": "#1a1a1a", "--accent": "rgba(0, 120, 212, 0.9)",
            "--border": "1px solid rgba(255, 255, 255, 0.6)", "--border-ring": "rgba(0,0,0,0.1)", "--shadow": "0 4px 8px rgba(0,0,0,0.05)",
            "--shadow-hover": "0 8px 16px rgba(0,0,0,0.05)", "--shadow-active": "0 2px 4px rgba(0,0,0,0.05)",
            "--radius": "8px", "--font": "'Segoe UI', sans-serif", "--weight": "400", "--btn-transform": "translateY(-1px)", "--btn-transform-active": "scale(0.97)",
            "--backdrop": "blur(40px) saturate(150%)"
        }
    },
    {
        name: "Neumorphism", cls: "t-neu",
        v: {
            "--bg": "#e0e5ec", "--card": "#e0e5ec", "--text": "#44476a", "--accent": "#6c63ff",
            "--border": "none", "--border-ring": "#a3b1c6", "--shadow": "9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255, 0.5)",
            "--shadow-hover": "12px 12px 20px rgb(163,177,198,0.7), -12px -12px 20px rgba(255,255,255, 0.6)", "--shadow-active": "inset 6px 6px 10px 0 rgba(163,177,198, 0.7), inset -6px -6px 10px 0 rgba(255,255,255, 0.8)",
            "--radius": "16px", "--font": "'Nunito', sans-serif", "--weight": "700", "--btn-transform": "none", "--btn-transform-active": "none"
        }
    },
] as const;

export type Theme = typeof T[number];
