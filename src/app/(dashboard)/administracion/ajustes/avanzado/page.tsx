/**
 * Admin Settings — Configuración Avanzada
 *
 * Sección para configuraciones experimentales y extensiones futuras.
 * Las claves en esta sección se pueden añadir a system_config sin
 * necesidad de cambios de código en los formularios anteriores.
 */

import { fetchAllSystemConfigs } from "@/lib/queries/config";
import { ContentSection } from "@/components/content-section";
import { AdvancedConfigPanel } from "../_components/advanced-config-panel";

export default async function AdminSettingsAdvancedPage() {
  const allConfigs = await fetchAllSystemConfigs();

  return (
    <ContentSection
      title="Configuración avanzada"
      desc="Vista completa de todas las claves de configuración del sistema. Para uso técnico."
    >
      <AdvancedConfigPanel configs={allConfigs} />
    </ContentSection>
  );
}
