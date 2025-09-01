"use client"

import { Area, AreaChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Bar, LineChart, Line } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import React, { useState, useEffect, useCallback } from "react"
import { BarChartHorizontal, BrainCircuit, Flame, TrendingUp, Zap, } from "lucide-react";

const chartConfig = {
  completed: {
    label: "Completed",
    color: "oklch(0.65 0.25 320)", 
  },
  distracted: {
    label: "Interrupted",
    color: "oklch(0.7 0.15 80)",
  },
  minutes: { 
    label: "Focus Minutes",
    color: "oklch(0.65 0.25 320)",
  },
  ratio: {
    label: "Focus Ratio",
    color: "oklch(0.7 0.2 140)" // Un color verde para el progreso
  }
};
import type { DbSession } from "@/types/database";
type Session = any;


type WeeklyProgressChartProps = {
  sessions: DbSession[];
};

function getSessionData() {
  if (typeof window === "undefined") return []
  const sessions = localStorage.getItem("focusSessions")
  return sessions ? JSON.parse(sessions) : []
}

function aggregateDataByPeriod(
  sessions: DbSession[],
  period: "day" | "week" | "month"
) {
  const now = new Date();

  if (period === "day") {
    const data: { [key: string]: { completed: number; distracted: number } } = {};
    const today = now.toDateString();
    const todaySessions = sessions.filter(
      (session) => new Date(session.created_at).toDateString() === new Date().toDateString()
    );

    for (let hour = 0; hour < 24; hour++) {
      const hourKey = `${hour.toString().padStart(2, "0")}:00`;
      data[hourKey] = { completed: 0, distracted: 0 };
    }

    todaySessions.forEach((session) => {
      const sessionDate = new Date(session.created_at);
      const hourKey = `${sessionDate
        .getHours()
        .toString()
        .padStart(2, "0")}:00`;
      const minutes = Math.round(session.duration_seconds / 60);

      if (session.status === "completed") {
        data[hourKey].completed += minutes;
      } else if (session.status === "interrupted") { 
        data[hourKey].distracted += minutes;
      }
    });

    return Object.entries(data).map(([time, { completed, distracted }]) => ({
      time,
      completed,
      distracted,
    }));
  }

  if (period === "week") {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Establecemos el final de la semana en Sábado (día 6)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekData: { [key: string]: number } = {};
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    days.forEach((day) => (weekData[day] = 0));

    // Filtramos solo las sesiones que están DENTRO de esta semana
    const thisWeekSessions = sessions.filter(s => {
      const sessionDate = new Date(s.created_at);
      return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
    });

    thisWeekSessions.forEach((session) => {
      const sessionDate = new Date(session.created_at);
      const dayName = days[sessionDate.getDay()];
      // Sumamos la duración sin importar si fue completada o interrumpida
      weekData[dayName] += Math.round(session.duration_seconds / 60);
    });
    
    return days.map((day) => ({ day, minutes: weekData[day] }));
  }
  if (period === "month") {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); // El día 0 del siguiente mes es el último día del mes actual
    endOfMonth.setHours(23, 59, 59, 999);

    const monthData: { [key: string]: number } = {};
    const numWeeks = Math.ceil(endOfMonth.getDate() / 7);

    for (let week = 1; week <= numWeeks; week++) {
      monthData[`Week ${week}`] = 0;
    }

    // Filtramos solo las sesiones que están DENTRO de este mes
    const thisMonthSessions = sessions.filter(s => {
      const sessionDate = new Date(s.created_at);
      return sessionDate >= startOfMonth && sessionDate <= endOfMonth;
    });

    thisMonthSessions.forEach((session) => {
      const sessionDate = new Date(session.created_at);
      const weekOfMonth = Math.ceil(sessionDate.getDate() / 7);
      const weekKey = `Week ${weekOfMonth}`;
      // Sumamos la duración sin importar el estado
      monthData[weekKey] += Math.round(session.duration_seconds / 60);
    });
     return Object.entries(monthData).map(([week, minutes]) => ({
      day: week, // Usamos 'day' para que el Eje X del gráfico funcione
      minutes,
    }));
  
  }
  

  return [];
}

//new
function getHeatmapData(sessions: any[]) {
    const heatmap: { [key: string]: number[] } = {
        "Sun": Array(24).fill(0),
        "Mon": Array(24).fill(0),
        "Tue": Array(24).fill(0),
        "Wed": Array(24).fill(0),
        "Thu": Array(24).fill(0),
        "Fri": Array(24).fill(0),
        "Sat": Array(24).fill(0),
    };
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeekSessions = sessions.filter(s => new Date(s.created_at) >= startOfWeek);

     thisWeekSessions.forEach(session => {
        // CAMBIO: Usamos los campos de la base de datos
        const date = new Date(session.created_at); 
        const day = date.getDay();
        const hour = date.getHours();
        const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day];
        
        // El heatmap solo muestra sesiones completadas
        if (session.status === 'completed') { 
            heatmap[dayName][hour] += Math.round(session.duration_seconds / 60);
        }
    });
    
    // Encontrar el valor máximo para normalizar los colores
    const maxMinutes = Math.max(...Object.values(heatmap).flat());
    
    return { heatmap, maxMinutes };
}

// NUEVA función para el Ratio de Foco
function getFocusRatioData(sessions: any[]) {
    const data: { [week: string]: { focus: number; distractions: number } } = {};
    const now = new Date();

    for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() - (i * 7));
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        
        const weekLabel = `Week of ${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
        data[weekLabel] = { focus: 0, distractions: 0 };

        sessions.forEach(session => {
            const sessionDate = new Date(session.created_at);
            if (sessionDate >= weekStart && sessionDate < weekEnd) {
                if (session.type === 'completed') {
                    data[weekLabel].focus += Math.round(session.duration / 60);
                } else if (session.type === 'distracted') {
                    data[weekLabel].distractions += 1;
                }
            }
        });
    }

    return Object.entries(data).map(([week, values]) => ({
        week,
        // Si no hay distracciones, el ratio es simplemente el total de minutos de foco (un puntaje alto).
        ratio: values.distractions > 0 ? Math.round(values.focus / values.distractions) : values.focus,
    }));
}




export const AttentionThiefChart = React.memo(function AttentionThiefChart({
  distractions = {},
}: {
  distractions?: { [key: string]: number };
}) {
  const hasData = Object.keys(distractions).length > 0;

  if (!hasData) {
    // Placeholder cuando no hay datos
    return (
       <div className="relative flex flex-col items-center justify-center h-full text-center p-6">
        <div className="relative z-10">
          <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
             <Zap className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Identify Your Distractions</h3>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            Press the "Distraction" button during a session to start tracking what pulls you away.
          </p>
        </div>
      </div>
    )
  }

  const distractionData = Object.entries(distractions)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count); // Ordenar de mayor a menor

  const topDistraction = distractionData[0];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
          <BarChartHorizontal className="w-5 h-5 text-muted-foreground" />
          Attention Thieves
        </h3>
        <p className="text-sm text-muted-foreground">
          Your top distraction is <strong className="text-foreground">{topDistraction.name}</strong> with {topDistraction.count} interruptions.
        </p>
      </div>
      <ChartContainer config={{}} className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={distractionData} layout="vertical" margin={{ left: 10, right: 10 }}>
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              tickLine={false} 
              axisLine={false}
              tick={{ fill: "oklch(0.7 0 0)", fontSize: 12 }}
              width={80} // Ajusta el espacio para los nombres
            />
            <ChartTooltip
              cursor={{ fill: 'oklch(0.5 0.02 270 / 0.1)' }}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" radius={5}>
              {distractionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`oklch(0.7 0.15 ${80 + index * 20})`} />
              ))}
            </Bar>
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
});



export const ProductivityHeatmap = React.memo(function ProductivityHeatmap({ sessions }: { sessions: Session[] }) {
    const [data, setData] = React.useState<{ heatmap: { [key: string]: number[] }, maxMinutes: number } | null>(null);


   useEffect(() => {
        if (sessions) {
            // Llama a la función de agregación (que corregiremos a continuación)
            setData(getHeatmapData(sessions));
        }
    }, [sessions]);

    const hasData = data && data.maxMinutes > 0;
    
    if (!hasData) {
        return (
            <div className="relative flex flex-col items-center justify-center h-full text-center p-6">
                <div className="relative z-10">
                    <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20">
                        <Flame className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Find Your Focus Zone</h3>
                    <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                        Complete focus sessions to reveal your most productive times of the week.
                    </p>
                </div>
            </div>
        );
    }
    
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

    return (
        <div className="space-y-3">
            <div>
                <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-muted-foreground" />
                    Weekly Focus Heatmap
                </h3>
                <p className="text-sm text-muted-foreground">Your peak concentration times at a glance.</p>
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <div />
                <div className="grid grid-cols-14 text-center">
                    {hours.map(h => <span key={h}>{h % 12 === 0 ? 12 : h % 12}{h < 12 ? 'a' : 'p'}</span>)}
                </div>

                {days.map(day => (
                    <React.Fragment key={day}>
                        <span>{day}</span>
                        <div className="grid grid-cols-14 gap-1">
                            {hours.map(hour => {
                                const minutes = data.heatmap[day][hour];
                                const opacity = data.maxMinutes > 0 ? minutes / data.maxMinutes : 0;
                                return (
                                    <div 
                                        key={`${day}-${hour}`}
                                        className="aspect-square rounded-[3px]"
                                        style={{ 
                                            backgroundColor: `oklch(0.65 0.25 320 / ${Math.max(opacity, 0.05)})` 
                                        }}
                                        title={`${minutes} minutes on ${day} at ${hour}:00`}
                                    />
                                );
                            })}
                        </div>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
});


export const FocusRatioChart = React.memo(function FocusRatioChart() {
    const [chartData, setChartData] = React.useState<any[]>([]);

    React.useEffect(() => {
        const sessions = getSessionData();
        setChartData(getFocusRatioData(sessions));
    }, []);

    const hasData = chartData.some(d => d.ratio > 0);

    if (!hasData) {
        return (
             <div className="relative flex flex-col items-center justify-center h-full text-center p-6">
                <div className="relative z-10">
                    <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                        <TrendingUp className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Track Your Improvement</h3>
                    <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                        This chart shows how many minutes you can focus per distraction. Aim to make this number grow!
                    </p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
             <div>
                <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-muted-foreground" />
                    Focus Ratio Trend
                </h3>
                <p className="text-sm text-muted-foreground">Minutes focused per interruption, weekly.</p>
            </div>
             <ChartContainer config={chartConfig} className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                         <defs>
                            <linearGradient id="gradRatio" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={chartConfig.ratio.color} stopOpacity={0.4}/>
                                <stop offset="100%" stopColor={chartConfig.ratio.color} stopOpacity={0.05}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.05 270 / 0.3)"/>
                        <XAxis
                            dataKey="week"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "oklch(0.7 0 0)", fontSize: 10 }}
                            tickFormatter={(value) => value.substring(value.indexOf(' ')+1)}
                        />
                         <YAxis 
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "oklch(0.7 0 0)", fontSize: 12 }}
                        />
                        <ChartTooltip content={<ChartTooltipContent indicator="dot" />}/>
                        <Line
                            type="monotone"
                            dataKey="ratio"
                            stroke={chartConfig.ratio.color}
                            strokeWidth={3}
                            dot={{ r: 5, fill: chartConfig.ratio.color }}
                        />
                        {/* Agregamos un área debajo de la línea para darle más peso visual */}
                        <Area type="monotone" dataKey="ratio" stroke="none" fill="url(#gradRatio)" />
                    </LineChart>
                </ResponsiveContainer>
            </ChartContainer>
        </div>
    );
});

export const WeeklyProgressChart = React.memo(function WeeklyProgressChart({ sessions }: { sessions:  DbSession[] }) {
  const [timePeriod, setTimePeriod] = useState<"day" | "week" | "month">("day");
  const [chartData, setChartData] = useState<any[]>([]);

  // Este useEffect ahora se dispara cuando las sesiones o el período de tiempo cambian
   useEffect(() => {
    // Asegúrate que tu función aggregateDataByPeriod está actualizada
    // para usar los campos de DbSession (created_at, duration_seconds, status)
    if (sessions) {
      const aggregatedData = aggregateDataByPeriod(sessions, timePeriod);
      setChartData(aggregatedData);
    }
  }, [sessions, timePeriod]);

  const actuallyHasData = chartData.some(
    (item) => item.minutes > 0 || item.completed > 0 || item.distracted > 0
  );


  if (!actuallyHasData) {
    return (
      <div className="relative flex flex-col items-center justify-center h-full text-center p-8">
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <div className="absolute top-4 right-8 w-32 h-32 rounded-full bg-gradient-to-br from-primary/10 to-accent/5 blur-2xl" />
          <div className="absolute bottom-8 left-4 w-24 h-24 rounded-full bg-gradient-to-br from-accent/10 to-primary/5 blur-xl" />
        </div>

        <div className="relative z-10 mb-8">
          <div className="relative">
            {/* Mock chart lines */}
            <svg width="280" height="120" viewBox="0 0 280 120" className="opacity-30">
              <defs>
                <linearGradient id="mockGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="oklch(0.65 0.25 320)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="oklch(0.65 0.25 320)" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="mockGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="oklch(0.7 0.3 340)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="oklch(0.7 0.3 340)" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <g stroke="oklch(0.3 0.05 270 / 0.2)" strokeWidth="1">
                <line x1="0" y1="30" x2="280" y2="30" />
                <line x1="0" y1="60" x2="280" y2="60" />
                <line x1="0" y1="90" x2="280" y2="90" />
              </g>

              {/* Mock data lines */}
              <path
                d="M20 80 L60 65 L100 70 L140 45 L180 50 L220 30 L260 25"
                stroke="oklch(0.65 0.25 320)"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M20 90 L60 85 L100 75 L140 70 L180 60 L220 55 L260 45"
                stroke="oklch(0.7 0.3 340)"
                strokeWidth="2"
                fill="none"
              />

              {/* Data points */}
              <circle cx="260" cy="25" r="3" fill="oklch(0.65 0.25 320)" className="animate-pulse" />
              <circle cx="260" cy="45" r="3" fill="oklch(0.7 0.3 340)" className="animate-pulse delay-300" />
            </svg>

            {/* Floating tooltip mockup */}
            <div className="absolute top-2 right-8 glass border border-border/50 rounded-lg p-3 text-xs ">
              <div className="text-muted-foreground mb-1">Today</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="text-foreground">Focus Time</span>
                <span className="text-muted-foreground ml-auto">0m</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-sm">
          <h2 className="text-2xl font-bold text-foreground mb-3">Supercharge your focus journey</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            From first session to deep work mastery, understand exactly how your focus sessions drive productivity with
            our powerful analytics engine.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Focus Time This {timePeriod === "day" ? "Day" : timePeriod === "week" ? "Week" : "Month"}
          </h3>
          <p className="text-sm text-muted-foreground">
            Your {timePeriod === "day" ? "hourly" : timePeriod === "week" ? "daily" : "weekly"} focus sessions in
            minutes
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-full glass border border-border/50">
          {(["day", "week", "month"] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                timePeriod === period
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>
    <ChartContainer config={chartConfig} className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <defs>
              <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartConfig.completed.color} stopOpacity={0.8}/>
                <stop offset="100%" stopColor={chartConfig.completed.color} stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="gradDistracted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartConfig.distracted.color} stopOpacity={0.7}/>
                <stop offset="100%" stopColor={chartConfig.distracted.color} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.05 270 / 0.3)"/>
            <XAxis
              dataKey={timePeriod === "day" ? "time" : "day"}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "oklch(0.7 0 0)", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "oklch(0.7 0 0)", fontSize: 12 }}
              tickFormatter={(value) => `${value}m`}
            />
            <ChartTooltip content={<ChartTooltipContent />}/>

            {/* ✅ GRÁFICO CONDICIONAL CORREGIDO */}
            {timePeriod === "day" ? (
              <>
                <Area type="monotone" dataKey="completed" stroke={chartConfig.completed.color} strokeWidth={3} fill="url(#gradCompleted)"/>
                <Area type="monotone" dataKey="distracted" stroke={chartConfig.distracted.color} strokeWidth={2} fill="url(#gradDistracted)"/>
              </>
            ) : (
              <Area type="monotone" dataKey="minutes" stroke={chartConfig.minutes.color} strokeWidth={3} fill="url(#gradCompleted)"/>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
});

export const DistractionBreakdown = React.memo(function DistractionBreakdown({
  hasData = true,
  distractions = {},
}: {
  hasData?: boolean;
  distractions?: { [key: string]: number };
}) {
  if (!hasData) {
    return (
      <div className="relative flex flex-col items-center justify-center h-full text-center p-6 ">
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <div className="absolute top-6 left-6 w-20 h-20 rounded-full bg-gradient-to-br from-green-500/10 to-emerald-500/5 blur-xl" />
          <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/5 blur-lg" />
        </div>

        <div className="relative z-10 mb-6">
          {/* Mock pie chart */}
          <div className="relative w-24 h-24 mx-auto mb-4">
            <svg width="96" height="96" viewBox="0 0 96 96" className="opacity-20">
              <circle
                cx="48"
                cy="48"
                r="32"
                fill="none"
                stroke="oklch(0.6 0.2 280)"
                strokeWidth="12"
                strokeDasharray="100 100"
                className="animate-pulse"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-green-400">
                  <path
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h3 className="text-xl font-bold text-foreground mb-2">Master your attention</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs leading-relaxed">
            Track what breaks your focus and transform distractions into insights for deeper concentration.
          </p>
        </div>
      </div>
    )
  }

  // Convert distractions object to chart data
  const colors = [
    "oklch(0.65 0.25 320)",
    "oklch(0.6 0.2 280)",
    "oklch(0.7 0.3 340)",
    "oklch(0.55 0.15 300)",
    "oklch(0.75 0.25 310)",
  ]
  const totalDistractions = Object.values(distractions).reduce((sum, count) => sum + count, 0)

  const distractionData = Object.entries(distractions).map(([name, count], index) => ({
    name,
    value: Math.round((count / totalDistractions) * 100),
    count,
    color: colors[index % colors.length],
  }))

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Distractions</h3>
        <p className="text-sm text-muted-foreground">What breaks your focus</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="w-24 h-24">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distractionData}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={45}
                paddingAngle={2}
                dataKey="value"
              >
                {distractionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 ml-4 space-y-2">
          {distractionData.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-foreground">{item.name}</span>
              </div>
              <span className="text-muted-foreground">{item.count}x</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
});

export const SessionStatistics = React.memo(function SessionStatistics({
  sessionsCompleted = 0,
  currentStreak = 0,
  totalHours = 0,
}: {
  sessionsCompleted?: number
  currentStreak?: number
  totalHours?: number
}) {
  const hasData = sessionsCompleted > 0 || currentStreak > 0 || totalHours > 0

  if (!hasData) {
    return (
      <div className="relative flex flex-col items-center justify-center h-full text-center p-6">
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-accent/5 blur-lg" />
          <div className="absolute bottom-6 left-6 w-12 h-12 rounded-full bg-gradient-to-br from-orange-500/10 to-red-500/5 blur-md" />
        </div>

        <div className="relative z-10 mb-6">
          {/* Mock stats cards */}
          <div className="space-y-3 w-full max-w-[200px] flex">
            <div className="glass border border-border/30 rounded-lg p-3 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary/40"></div>
                </div>
                <div className="flex-1">
                  <div className="w-8 h-4 bg-muted/30 rounded mb-1"></div>
                  <div className="w-16 h-2 bg-muted/20 rounded"></div>
                </div>
              </div>
            </div>

            <div className="glass border border-border/30 rounded-lg p-3 animate-pulse delay-150">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-orange-400/40"></div>
                </div>
                <div className="flex-1">
                  <div className="w-6 h-4 bg-muted/30 rounded mb-1"></div>
                  <div className="w-14 h-2 bg-muted/20 rounded"></div>
                </div>
              </div>
            </div>

            <div className="glass border border-border/30 rounded-lg p-3 animate-pulse delay-300">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-green-400">
                    <path
                      d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-green-400">
                      <path
                        d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{totalHours}h</div>
                  <div className="text-sm text-muted-foreground">Total Hours Focused</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h3 className="text-lg font-bold text-foreground mb-2">Build your legacy</h3>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            Every session counts. Start your first focus session and watch your productivity metrics come to life.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Your Stats</h3>
        <p className="text-sm text-muted-foreground">Track your progress</p>
      </div>
      <div className="space-y-4">
        <div className="relative p-4 rounded-xl glass border border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-primary">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M12 6v6l4 2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-foreground">{sessionsCompleted}</div>
              <div className="text-sm text-muted-foreground">Sessions Completed</div>
            </div>
          </div>
        </div>

        <div className="relative p-4 rounded-xl glass border border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-orange-400">
                <path
                  d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-foreground">{currentStreak}</div>
              <div className="text-sm text-muted-foreground">Current Streak</div>
            </div>
          </div>
        </div>

        <div className="relative p-4 rounded-xl glass border border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-green-400">
                <path
                  d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-foreground">{totalHours}h</div>
              <div className="text-sm text-muted-foreground">Total Hours Focused</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
});
