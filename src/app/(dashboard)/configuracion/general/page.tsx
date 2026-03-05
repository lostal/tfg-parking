/**
 * Configuración del sistema — General
 */

export const dynamic = "force-dynamic";

import { getGlobalConfigs } from "@/lib/config";
import { ContentSection } from "@/components/content-section";
import { GlobalConfigForm } from "../_components/global-config-form";

export default async function ConfiguracionGeneralPage() {
  const config = await getGlobalConfigs();

  return (
    <ContentSection
      title="Configuración global"
      desc="Parámetros que afectan a toda la aplicación, independientemente del tipo de recurso."
    >
      <GlobalConfigForm config={config} />
    </ContentSection>
  );
}
