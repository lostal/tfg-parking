/**
 * Parking Page
 *
 * Hub principal con toggle de vistas (Mapa, Lista, Calendario).
 * - Tab Mapa: SVG interactivo (P2)
 * - Tab Lista: Grid de tarjetas (MVP)
 * - Tab Calendario: Calendar booking (MVP)
 */

"use client";

import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ComingSoon } from "@/components/coming-soon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, LayoutGrid, Calendar } from "lucide-react";
import { ListView } from "./_components/list-view";

export default function ParkingPage() {
  return (
    <>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className="mb-2 flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Parking</h2>
            <p className="text-muted-foreground">
              Gestiona tus plazas de aparcamiento
            </p>
          </div>
        </div>

        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="map">
              <Map className="mr-2 h-4 w-4" />
              Mapa
            </TabsTrigger>
            <TabsTrigger value="list">
              <LayoutGrid className="mr-2 h-4 w-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="mr-2 h-4 w-4" />
              Calendario
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-4">
            <ComingSoon />
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <ListView />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <ComingSoon />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  );
}
