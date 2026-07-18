import { EmptyState, PageHeader } from '../../components/Ui'

export function UploadsPage() {
  return <><PageHeader eyebrow="Datos" title="Carga de archivos" description="Incorporá datasets CSV al flujo de procesamiento." /><EmptyState title="Módulo en preparación" description="La carga CSV se integra desde feature/csv-upload." /></>
}
