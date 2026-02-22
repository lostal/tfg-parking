/**
 * AdminStatsCards
 *
 * Cuatro tarjetas de resumen para el panel de administración.
 * Muestra KPIs globales: plazas libres, ocupación, reservas mensuales y usuarios activos.
 * Animaciones: entrada en cascada (stagger) + contador animado al montar.
 */

"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ParkingCircle, TrendingUp, CalendarDays, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminStatsCardsProps {
  freeSpots: number;
  totalSpots: number;
  occupancyPercent: number;
  monthlyReservations: number;
  activeUsersMonth: number;
}

// Variantes de animación para el contenedor (stagger)
const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

// Variantes de animación para cada tarjeta
const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 380, damping: 28 },
  },
};

// ─── Número animado ───────────────────────────────────────────

function AnimatedNumber({
  value,
  suffix = "",
  prefix = "",
}: {
  value: number;
  suffix?: string;
  prefix?: string;
}) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const node = nodeRef.current;
    if (!node) return;

    const start = 0;
    const end = value;
    const duration = 900; // ms
    const startTime = performance.now();

    function update(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Curva ease-out cúbica
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      if (node) node.textContent = `${prefix}${current}${suffix}`;
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }, [value, prefix, suffix]);

  return (
    <span ref={nodeRef} className="tabular-nums">
      {prefix}0{suffix}
    </span>
  );
}

// ─── Componente principal ─────────────────────────────────────

export function AdminStatsCards({
  freeSpots,
  totalSpots,
  occupancyPercent,
  monthlyReservations,
  activeUsersMonth,
}: AdminStatsCardsProps) {
  const usedSpots = totalSpots - freeSpots;

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Plazas libres hoy */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Plazas libres hoy
            </CardTitle>
            <ParkingCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedNumber value={freeSpots} />
            </div>
            <p className="text-muted-foreground text-xs">
              de {totalSpots} plazas totales
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ocupación hoy */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupación hoy</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedNumber value={occupancyPercent} suffix="%" />
            </div>
            <p className="text-muted-foreground text-xs">
              {usedSpots} de {totalSpots} plazas ocupadas
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reservas este mes */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reservas este mes
            </CardTitle>
            <CalendarDays className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +<AnimatedNumber value={monthlyReservations} />
            </div>
            <p className="text-muted-foreground text-xs">
              reservas confirmadas
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Usuarios activos este mes */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuarios activos
            </CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedNumber value={activeUsersMonth} />
            </div>
            <p className="text-muted-foreground text-xs">
              han reservado este mes
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
