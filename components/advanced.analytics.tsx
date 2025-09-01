"use client";

import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Tooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  Cell,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import React, { useEffect } from "react";
import {
  CalendarDays,
  SunMoon,
  Timer,
  TrendingDown,
  HelpCircle,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import type { DbSession } from "@/types/database";

interface ChartHelpModalProps {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Un modal genérico para mostrar información de ayuda sobre un gráfico.
 * Se activa mediante el `children` prop, que será nuestro botón de '?'.
 */
function ChartHelpModal({ title, description, children }: ChartHelpModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="glass border-border/50 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-foreground">
            <Info className="w-6 h-6 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
          {description}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Función para obtener los datos del Local Storage (puedes moverla a un archivo de utilidades)
function getSessionData() {
  if (typeof window === "undefined") return [];
  const sessions = localStorage.getItem("focusSessions");
  return sessions ? JSON.parse(sessions) : [];
}

/**
 * 1. Agregación para el Calendario de Consistencia
 * Crea un mapa de fechas con los minutos de foco totales para cada día.
 */
const getCalendarData = (sessions: DbSession[]) => {
  const data: { [date: string]: { level: number; minutes: number } } = {};

  sessions.forEach((session) => {
    // CAMBIO: Usamos created_at, duration_seconds, y status
    const date = new Date(session.created_at).toISOString().split("T")[0];
    const minutes = Math.round(session.duration_seconds / 60);
    if (session.status === "completed") {
      if (!data[date]) {
        data[date] = { level: 0, minutes: 0 };
      }
      data[date].minutes += minutes;
    }
  });

  // Determinar los niveles de color basados en los minutos
  const allMinutes = Object.values(data)
    .map((d) => d.minutes)
    .filter((m) => m > 0);
  if (allMinutes.length === 0) return { dates: {}, levels: [] };

  const maxMinutes = Math.max(...allMinutes);
  // Creamos 4 niveles de intensidad
  const levels = [
    Math.round(maxMinutes * 0.25),
    Math.round(maxMinutes * 0.5),
    Math.round(maxMinutes * 0.75),
    maxMinutes,
  ];

  Object.keys(data).forEach((date) => {
    const { minutes } = data[date];
    if (minutes > levels[2]) data[date].level = 4;
    else if (minutes > levels[1]) data[date].level = 3;
    else if (minutes > levels[0]) data[date].level = 2;
    else if (minutes > 0) data[date].level = 1;
    else data[date].level = 0;
  });

  return { dates: data, levels };
};

/**
 * 2. Agregación para Rendimiento por Momento del Día
 */
const getPerformanceByTimeOfDay = (sessions: DbSession[]) => {
  const data = {
    Morning: { focusMinutes: 0, distractions: 0 }, // 5am - 12pm
    Afternoon: { focusMinutes: 0, distractions: 0 }, // 12pm - 6pm
    Evening: { focusMinutes: 0, distractions: 0 }, // 6pm - 11pm
    Night: { focusMinutes: 0, distractions: 0 }, // 11pm - 5am
  };

  sessions.forEach((s) => {
    const hour = new Date(s.created_at).getHours();
    let period: keyof typeof data;

    if (hour >= 5 && hour < 12) period = "Morning";
    else if (hour >= 12 && hour < 18) period = "Afternoon";
    else if (hour >= 18 && hour < 23) period = "Evening";
    else period = "Night";

    if (s.status === "completed") {
      data[period].focusMinutes += Math.round(s.duration_seconds / 60);
    } else if (s.status === "interrupted") {
      data[period].distractions += 1;
    }
  });

  return Object.entries(data).map(([name, values]) => ({ name, ...values }));
};

/**
 * 3. Agregación para Efectividad por Duración de Sesión
 * NOTA: Esto asume que guardas la duración *planeada* de la sesión.
 * Si no es así, podemos agrupar por rangos (ej. 0-30min, 30-60min, etc.).
 * Por ahora, lo haré con rangos para que funcione con tu estructura actual.
 */
const getSessionEffectiveness = (sessions: DbSession[]) => {
  const data: { [range: string]: { completed: number; interrupted: number } } =
    {
      "0-30 min": { completed: 0, interrupted: 0 },
      "31-45 min": { completed: 0, interrupted: 0 },
      "46-60 min": { completed: 0, interrupted: 0 },
      "60+ min": { completed: 0, interrupted: 0 },
    };

  sessions.forEach((s) => {
    const plannedDuration = s.planned_duration_seconds / 60;
    let range: keyof typeof data;

    if (plannedDuration <= 30) range = "0-30 min";
    else if (plannedDuration <= 45) range = "31-45 min";
    else if (plannedDuration <= 60) range = "46-60 min";
    else range = "60+ min";

    if (s.status === "completed") data[range].completed += 1;
    else data[range].interrupted += 1;
  });

  return Object.entries(data)
    .map(([name, values]) => ({ name, ...values }))
    .filter((d) => d.completed > 0 || d.interrupted > 0);
};

/**
 * 4. Agregación para Tendencia de Distracciones
 */
const getDistractionTrends = (sessions: DbSession[]) => {
  const trends: { [week: string]: { [distraction: string]: number } } = {};
  const now = new Date();

  sessions.forEach((s) => {
    if (s.status === "interrupted" && s.distraction_reason) {
      const sessionDate = new Date(s.created_at);
      const weekStart = new Date(sessionDate);
      weekStart.setDate(sessionDate.getDate() - sessionDate.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!trends[weekKey]) trends[weekKey] = {};
      if (!trends[weekKey][s.distraction_reason]) {
        trends[weekKey][s.distraction_reason] = 0;
      }
      trends[weekKey][s.distraction_reason] += 1;
    }
  });

  const allReasons = [
    ...new Set(
      sessions
        .filter((s) => s.distraction_reason)
        .map((s) => s.distraction_reason)
    ),
  ];

  // Convertir a formato de gráfico
  return Object.entries(trends)
    .map(([week, reasons]) => {
      const entry: { [key: string]: any } = { week: week.slice(5) }; // Formato M-D
      allReasons.forEach((reason) => {
        entry[reason] = reasons[reason] || 0;
      });
      return entry;
    })
    .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
};

// --- NUEVOS COMPONENTES DE GRÁFICOS ---

/**
 * 1. Calendario de Consistencia
 */
export const ConsistencyCalendar = React.memo(function ConsistencyCalendar({
  sessions,
}: {
  sessions: DbSession[];
}) {
  const [data, setData] = React.useState<{
    dates: { [date: string]: { level: number; minutes: number } };
    levels: number[];
  }>({ dates: {}, levels: [] });

   useEffect(() => {
    if (sessions) {
      setData(getCalendarData(sessions));
    }
  }, [sessions]);

  const hasData = Object.keys(data.dates).length > 0;

  if (!hasData) {
    return (
      <div className="relative flex flex-col items-center justify-center h-full text-center p-6">
        <div className="relative z-10">
          <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20">
            <CalendarDays className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Build Your Habit</h3>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            Complete sessions day by day to see your consistency visualized on this calendar.
          </p>
        </div>
      </div>
    );
  }

  const today = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(today.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const days = [];
  let currentDate = sixMonthsAgo;
  while (currentDate <= today) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const colors = [
    "oklch(0.3 0.01 270)",
    "oklch(0.65 0.25 320 / 0.3)",
    "oklch(0.65 0.25 320 / 0.6)",
    "oklch(0.65 0.25 320 / 0.8)",
    "oklch(0.65 0.25 320 / 1)",
  ];

  return (
    <div className="space-y-3">
      <ChartHelpModal
        title="Calendario de Consistencia"
        description={
          <p>
            Este gráfico muestra tu dedicación diaria. Cada cuadrado es un día;
            cuanto más oscuro, más minutos de foco acumulaste.
            <br />
            <br />
            <strong>Tu objetivo:</strong> "Pintar" el calendario todos los días
            para construir un hábito de concentración inquebrantable y no
            "romper la cadena".
          </p>
        }
      >
        <button className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors z-10">
          <HelpCircle className="w-4 h-4" />
        </button>
      </ChartHelpModal>
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-muted-foreground" />
          Focus Consistency
        </h3>
        <p className="text-sm text-muted-foreground">
          Your daily focus minutes over the last 6 months.
        </p>
      </div>
      <div className="grid grid-rows-7 grid-flow-col gap-1">
        {days.map((day) => {
          const dateString = day.toISOString().split("T")[0];
          const dayData = data.dates[dateString];
          const color = dayData ? colors[dayData.level] : colors[0];
          return (
            <div
              key={dateString}
              className="aspect-square w-3.5 h-3.5 rounded-[3px]"
              style={{ backgroundColor: color }}
              title={`${dateString}: ${dayData ? dayData.minutes : 0} minutes`}
            />
          );
        })}
      </div>
    </div>
  );
});

/**
 * 2. Rendimiento por Momento del Día
 */
export const PerformanceByTimeOfDay = React.memo(
  function PerformanceByTimeOfDay({ sessions }: { sessions: DbSession[] }) {
    const [chartData, setChartData] = React.useState<any[]>([]);

    useEffect(() => {
      if (sessions) {
        setChartData(getPerformanceByTimeOfDay(sessions));
      }
    }, [sessions]);

    const hasData = chartData.some(
      (d) => d.focusMinutes > 0 || d.distractions > 0
    );

    if (!hasData) {
      // ... Placeholder ...
       return (
        <div className="relative flex flex-col items-center justify-center h-full text-center p-6">
          <div className="relative z-10">
            <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20">
              <SunMoon className="w-8 h-8 text-sky-400" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Discover Your Prime Time</h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Log your sessions to find out when you are most productive and when you are most vulnerable to distractions.
            </p>
          </div>
        </div>
      );
    }

    const chartConfig = {
      focusMinutes: { label: "Focus (min)", color: "oklch(0.65 0.25 320)" },
      distractions: { label: "Distractions", color: "oklch(0.7 0.15 80)" },
    };

    return (
      <div className="space-y-4">
        <ChartHelpModal
          title="Rendimiento por Momento del Día"
          description={
            <>
              <p>
                Este gráfico compara tus minutos de foco (barra violeta) con tu
                número de distracciones (barra naranja) en diferentes momentos
                del día.
              </p>
              <p>
                <strong>Tu objetivo:</strong> Identificar tus "horas doradas"
                —momentos de alta concentración y pocas distracciones— para
                agendar ahí tus tareas más importantes.
              </p>
            </>
          }
        >
          <button className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors z-10">
            <HelpCircle className="w-4 h-4" />
          </button>
        </ChartHelpModal>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
            <SunMoon className="w-5 h-5 text-muted-foreground" />
            Performance by Time of Day
          </h3>
          <p className="text-sm text-muted-foreground">
            When are you most productive?
          </p>
        </div>
        <ChartContainer config={chartConfig} className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.2 0.05 270 / 0.3)"
              />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "oklch(0.7 0 0)" }}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                stroke={chartConfig.focusMinutes.color}
                tick={{ fontSize: 12, fill: "oklch(0.7 0 0)" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke={chartConfig.distractions.color}
                tick={{ fontSize: 12, fill: "oklch(0.7 0 0)" }}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="focusMinutes"
                fill={chartConfig.focusMinutes.color}
                name="Focus (min)"
                radius={4}
              />
              <Bar
                yAxisId="right"
                dataKey="distractions"
                fill={chartConfig.distractions.color}
                name="Distractions"
                radius={4}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    );
  }
);

/**
 * 3. Efectividad por Duración de Sesión
 */
export const SessionEffectivenessChart = React.memo(
  function SessionEffectivenessChart({ sessions }: { sessions: DbSession[] }) {
    const [chartData, setChartData] = React.useState<any[]>([]);
  // ✅ CORREGIDO: El useEffect ahora usa las props de 'sessions' directamente
    useEffect(() => {
      if (sessions) {
        setChartData(getSessionEffectiveness(sessions));
      }
    }, [sessions]);

    const hasData = chartData.length > 0;

    if (!hasData) {
    return (
        <div className="relative flex flex-col items-center justify-center h-full text-center p-6">
          <div className="relative z-10">
            <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/20 to-teal-500/20">
              <Timer className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Find Your Sweet Spot</h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Do longer sessions work for you? Track your completion rate for different durations to find your ideal focus time.
            </p>
          </div>
        </div>
      );
    }

    const chartConfig = {
      completed: { label: "Completed", color: "oklch(0.6 0.2 140)" }, // verde
      interrupted: { label: "Interrupted", color: "oklch(0.7 0.15 40)" }, // rojo/naranja
    };

    return (
      <div className="space-y-4">
        <ChartHelpModal
          title="Efectividad por Duración de Sesión"
          description={
            <>
              <p>
                Aquí analizamos qué tan exitoso eres completando sesiones según
                la duración que estableces. La barra verde representa las
                sesiones completadas y la naranja, las interrumpidas.
              </p>
              <p>
                <strong>Tu objetivo:</strong> Descubrir tu "punto dulce". Si ves
                que las sesiones de 60 minutos tienen muchas interrupciones,
                quizás sea más efectivo hacer dos de 30 minutos.
              </p>
            </>
          }
        >
          <button className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors z-10">
            <HelpCircle className="w-4 h-4" />
          </button>
        </ChartHelpModal>
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
            <Timer className="w-5 h-5 text-muted-foreground" />
            Session Duration Effectiveness
          </h3>
          <p className="text-sm text-muted-foreground">
            Find your ideal session length.
          </p>
        </div>
        <ChartContainer config={chartConfig} className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              stackOffset="expand"
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide domain={[0, 1]} />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={80}
                tick={{ fontSize: 12, fill: "oklch(0.7 0 0)" }}
              />
              <Tooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, props) =>
                      `${props.payload[name]} sessions`
                    }
                  />
                }
              />
              <Bar
                dataKey="completed"
                fill={chartConfig.completed.color}
                stackId="a"
                radius={[4, 4, 4, 4]}
              />
              <Bar
                dataKey="interrupted"
                fill={chartConfig.interrupted.color}
                stackId="a"
                radius={[4, 4, 4, 4]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    );
  }
);

/**
 * 4. Tendencia de Distracciones Específicas
 */
export const DistractionTrendsChart = React.memo(
  function DistractionTrendsChart({ sessions }: { sessions: DbSession[] }) {
    const [chartData, setChartData] = React.useState<any[]>([]);

    useEffect(() => {
      if (sessions) {
        setChartData(getDistractionTrends(sessions));
      }
    }, [sessions]);

    const hasData = chartData.length > 0;

    if (!hasData) {
       return (
        <div className="relative flex flex-col items-center justify-center h-full text-center p-6">
          <div className="relative z-10">
            <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10">
              <TrendingDown className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Conquer Your Distractions</h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              When you get distracted, record the reason. This chart will show if you're winning the battle against your top attention thieves over time.
            </p>
          </div>
        </div>
      );
    }

    const allKeys =
      chartData.length > 0
        ? Object.keys(chartData[0]).filter((k) => k !== "week")
        : [];
    const colors = [
      "oklch(0.7 0.15 80)",
      "oklch(0.7 0.15 40)",
      "oklch(0.6 0.2 280)",
    ];

    return (
      <div className="space-y-4">
        <ChartHelpModal
          title="Tendencia de Distracciones"
          description={
            <>
              <p>
                Este gráfico te muestra la evolución de tus distracciones más
                comunes a lo largo del tiempo. Cada color representa un tipo de
                distracción.
              </p>
              <p>
                <strong>Tu objetivo:</strong> Ver que las áreas de color de tus
                "ladrones de atención" más grandes (ej. Redes Sociales) se hacen
                más pequeñas con el tiempo, demostrando que tus estrategias para
                evitarlas están funcionando.
              </p>
            </>
          }
        >
          <button className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors z-10">
            <HelpCircle className="w-4 h-4" />
          </button>
        </ChartHelpModal>
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-muted-foreground" />
            Distraction Trends
          </h3>
          <p className="text-sm text-muted-foreground">
            Are you conquering your main distractions?
          </p>
        </div>
        <ChartContainer config={{}} className="h-48">
          <ResponsiveContainer>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.2 0.05 270 / 0.3)"
              />
              <XAxis
                dataKey="week"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "oklch(0.7 0 0)" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "oklch(0.7 0 0)" }}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend />
              {allKeys.map((key, i) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId="1"
                  stroke={colors[i % colors.length]}
                  fill={colors[i % colors.length]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    );
  }
);
