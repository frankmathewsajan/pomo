import { useMemo, useState } from "react";
import { useApp } from "./ctx";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function Analytics({ onBack }: { onBack: () => void }) {
    const { history, durations } = useApp();
    const [view, setView] = useState<"day" | "week" | "month" | "year">("day");

    const stats = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // start of day

        const filtered = history.filter(h => {
            const d = new Date(h.at);
            const diff = now.getTime() - d.getTime();
            if (view === "day") return diff <= 86400000;
            if (view === "week") return diff <= 86400000 * 7;
            if (view === "month") return diff <= 86400000 * 30;
            if (view === "year") return diff <= 86400000 * 365;
            return false;
        });

        let pomoMs = 0;
        let pomoEarlyMs = 0;
        const tagMap: Record<string, number> = {};

        filtered.forEach(h => {
            const blockDurMs = (durations[h.block] || [25, 5])[0] * 60000;
            let dur = blockDurMs;
            if (h.status === "completed") {
                pomoMs += dur;
            } else if (h.status === "early") {
                dur = dur / 2; // rough estimate
                pomoEarlyMs += dur;
            }

            if (h.status === "completed" || h.status === "early") {
                if (h.tags) {
                    h.tags.forEach(t => {
                        tagMap[t] = (tagMap[t] || 0) + dur;
                    });
                }
            }
        });

        const totalPomoMs = pomoMs + pomoEarlyMs;
        const periodMs = view === "day" ? 86400000 : view === "week" ? 86400000 * 7 : view === "month" ? 86400000 * 30 : 86400000 * 365;
        const idleMs = Math.max(0, periodMs - totalPomoMs);

        const pieData = [
            { name: "Focus Time", value: totalPomoMs, fill: "var(--accent)" },
            { name: "Idle Time", value: idleMs, fill: "rgba(100, 100, 100, 0.15)" }
        ];

        const tagData = Object.entries(tagMap).map(([name, val]) => ({
            name, hours: val / 3600000
        })).sort((a, b) => b.hours - a.hours);

        return { totalPomoMs, idleMs, pieData, tagData };
    }, [history, view, durations]);

    const formatMs = (ms: number) => {
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        if (h === 0) return `${m}m`;
        return `${h}h ${m}m`;
    };

    return (
        <div className="flex flex-col w-full max-w-4xl h-full p-6 sm:p-12 overflow-y-auto relative animate-in fade-in zoom-in-95 duration-300 backdrop-blur-md pb-32">
            <button className="absolute top-4 right-4 wb w-10 h-10 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors" onClick={onBack}>
                ✕
            </button>
            <h1 className="text-3xl font-black tracking-tight mb-8">Analytics Dashboard</h1>

            <div className="flex gap-2 mb-8 bg-black/5 p-1.5 rounded-lg w-fit">
                {["day", "week", "month", "year"].map(v => (
                    <button
                        key={v}
                        className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition-all shadow-sm ${view === v ? "bg-[var(--card)] text-[var(--accent)]" : "opacity-60 hover:opacity-100 shadow-none bg-transparent"}`}
                        onClick={() => setView(v as any)}
                    >
                        {v}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-full overflow-hidden">
                <div className="flex flex-col gap-4 bg-[var(--card)] p-6 rounded-2xl shadow-sm border border-[var(--border-ring)] pb-8">
                    <h2 className="text-sm font-bold uppercase tracking-widest opacity-60">Time Distribution</h2>
                    <div className="h-48 mt-4 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.pieData}
                                    cx="50%" cy="50%"
                                    innerRadius={50} outerRadius={70}
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {stats.pieData.map((e, index) => <Cell key={index} fill={e.fill} />)}
                                </Pie>
                                <Tooltip formatter={(val: any) => formatMs(val)} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-ring)', background: 'var(--card)', color: 'var(--text)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-8 mt-4">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1">Focused</span>
                            <span className="font-bold text-lg" style={{ color: 'var(--accent)' }}>{formatMs(stats.totalPomoMs)}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1">Idle Time</span>
                            <span className="font-bold text-lg opacity-70">{formatMs(stats.idleMs)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 bg-[var(--card)] p-6 rounded-2xl shadow-sm border border-[var(--border-ring)] p-8">
                    <h2 className="text-sm font-bold uppercase tracking-widest opacity-60">Tags Breakdown</h2>
                    <div className="h-64 mt-4 w-full">
                        {stats.tagData.length === 0 ? (
                            <div className="w-full h-full flex flex-col items-center gap-2 justify-center opacity-40 text-sm font-bold">
                                <span>No Tag Data Found</span>
                                <span className="text-[10px] font-normal opacity-70">Complete tasks with tags to see statistics here</span>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.tagData} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: 'var(--text)', opacity: 0.8 }} />
                                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} formatter={(val: any) => [val.toFixed(1) + 'h', "Duration"]} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-ring)', background: 'var(--card)', color: 'var(--text)' }} />
                                    <Bar dataKey="hours" fill="var(--accent)" radius={[0, 4, 4, 0]} barSize={20}>
                                        {stats.tagData.map((e, index) => <Cell key={index} fill="var(--accent)" fillOpacity={0.8 + (index * 0.05)} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
