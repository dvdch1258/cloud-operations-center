export const incidentsResources = {
  en: {
    incidents: {
      eyebrow: "INCIDENT MANAGEMENT",
      title: "Incidents",
      subtitle:
        "Detection, investigation and resolution of operational incidents.",

      updated: "Updated {{time}}",
      waitingForData: "Waiting for data",

      refreshError:
        "The operation could not be completed",
      retry: "Retry",

      errors: {
        load:
          "Incidents could not be loaded.",
        selectService:
          "Select a service.",
        save:
          "The incident could not be saved.",
        delete:
          "The incident could not be deleted.",
        changeStatus:
          "The status could not be changed.",
      },

      confirmDelete:
        'Are you sure you want to delete "{{title}}"?',

      severity: {
        low: "Low",
        medium: "Medium",
        high: "High",
        critical: "Critical",
      },

      status: {
        open: "Open",
        investigating: "Investigating",
        resolved: "Resolved",
        closed: "Closed",
      },

      kpi: {
        active: "Active",
        activeDescription: "Require attention",
        investigating: "Investigating",
        investigatingDescription:
          "Currently under analysis",
        critical: "Active critical",
        criticalDescription:
          "Highest priority",
        finalized: "Finalized",
        finalizedDescription:
          "Resolved or closed",
      },

      headerActions: {
        cancelEdit: "Cancel editing",
        cancelCreate: "Cancel creation",
        newIncident: "New incident",
      },

      form: {
        editEyebrow: "EDIT",
        createEyebrow: "NEW INCIDENT",
        editTitle: "Edit incident",
        createTitle: "New incident",

        editDescription:
          "Update the incident information and status.",
        createDescription:
          "Register an incident linked to one of the monitored services.",

        close: "Close form",

        title: "Title",
        titlePlaceholder:
          "Main backend outage",

        severity: "Severity",

        service: "Affected service",
        unassigned: "Unassigned",

        status: "Status",

        description: "Description",
        descriptionPlaceholder:
          "Describe the impact, symptoms and observed context...",

        cancel: "Cancel",
        saving: "Saving...",
        save: "Save changes",
        create: "Create incident",
      },

      filters: {
        eyebrow: "FILTERS",
        clear: "Clear filters",

        search: "Search",
        searchPlaceholder:
          "Title, description or service...",

        status: "Status",
        severity: "Severity",
        service: "Service",

        all: "All",
        allStatuses: "All",
        allSeverities: "All",
        allServices: "All",

        open: "Open",
        investigating: "Investigating",
        resolved: "Resolved",
        closed: "Closed",
      },

      inventory: {
        eyebrow: "OPERATIONAL QUEUE",
        title: "Registered incidents",
        description:
          "Tracking and resolution of platform incidents.",

        visible: "visible",

        loading: "Loading incidents...",

        noMatchesTitle: "No matches",
        emptyTitle: "No incidents registered",

        noMatchesDescription:
          "Try modifying or clearing the filters.",
        emptyDescription:
          "There are no incidents requiring follow-up.",

        columns: {
          incident: "Incident",
          status: "Status",
          service: "Service",
          duration: "Duration",
          created: "Created",
          actions: "Actions",
        },

        noDescription: "No description",
        unassigned: "Unassigned",
        affectedService: "Affected service",

        finalized: "Finalized",
        inProgress: "In progress",

        resolvedAt: "Resolved {{date}}",
        unresolved: "Unresolved",

        detail: "Details",
        investigate: "Investigate",
        resolve: "Resolve",
        close: "Close",
        edit: "Edit",
        delete: "Delete",
      },
    },
  },

  es: {
    incidents: {
      eyebrow: "GESTIÓN DE INCIDENTES",
      title: "Incidentes",
      subtitle:
        "Detección, investigación y resolución de incidencias operativas.",

      updated: "Actualizado {{time}}",
      waitingForData: "Esperando datos",

      refreshError:
        "No se pudo completar la operación",
      retry: "Reintentar",

      errors: {
        load:
          "No se pudieron cargar los incidentes.",
        selectService:
          "Selecciona un servicio.",
        save:
          "No se pudo guardar el incidente.",
        delete:
          "No se pudo eliminar el incidente.",
        changeStatus:
          "No se pudo cambiar el estado.",
      },

      confirmDelete:
        '¿Seguro que quieres eliminar "{{title}}"?',

      severity: {
        low: "Baja",
        medium: "Media",
        high: "Alta",
        critical: "Crítica",
      },

      status: {
        open: "Abierto",
        investigating: "Investigando",
        resolved: "Resuelto",
        closed: "Cerrado",
      },

      kpi: {
        active: "Activos",
        activeDescription: "Requieren atención",
        investigating: "Investigando",
        investigatingDescription:
          "Actualmente en análisis",
        critical: "Críticos activos",
        criticalDescription:
          "Prioridad máxima",
        finalized: "Finalizados",
        finalizedDescription:
          "Resueltos o cerrados",
      },

      headerActions: {
        cancelEdit: "Cancelar edición",
        cancelCreate: "Cancelar creación",
        newIncident: "Nuevo incidente",
      },

      form: {
        editEyebrow: "EDICIÓN",
        createEyebrow: "NUEVA INCIDENCIA",
        editTitle: "Editar incidente",
        createTitle: "Nuevo incidente",

        editDescription:
          "Actualiza la información y el estado del incidente.",
        createDescription:
          "Registra una incidencia vinculada a uno de los servicios monitorizados.",

        close: "Cerrar formulario",

        title: "Título",
        titlePlaceholder:
          "Caída del backend principal",

        severity: "Severidad",

        service: "Servicio afectado",
        unassigned: "Sin asignar",

        status: "Estado",

        description: "Descripción",
        descriptionPlaceholder:
          "Describe el impacto, síntomas y contexto observado...",

        cancel: "Cancelar",
        saving: "Guardando...",
        save: "Guardar cambios",
        create: "Crear incidente",
      },

      filters: {
        eyebrow: "FILTROS",
        clear: "Limpiar filtros",

        search: "Buscar",
        searchPlaceholder:
          "Título, descripción o servicio...",

        status: "Estado",
        severity: "Severidad",
        service: "Servicio",

        all: "Todos",
        allStatuses: "Todos",
        allSeverities: "Todas",
        allServices: "Todos",

        open: "Abiertos",
        investigating: "Investigando",
        resolved: "Resueltos",
        closed: "Cerrados",
      },

      inventory: {
        eyebrow: "COLA OPERATIVA",
        title: "Incidentes registrados",
        description:
          "Seguimiento y resolución de incidencias de la plataforma.",

        visible: "visibles",

        loading: "Cargando incidentes...",

        noMatchesTitle: "No hay coincidencias",
        emptyTitle: "Sin incidentes registrados",

        noMatchesDescription:
          "Prueba a modificar o limpiar los filtros.",
        emptyDescription:
          "No hay incidencias que requieran seguimiento.",

        columns: {
          incident: "Incidente",
          status: "Estado",
          service: "Servicio",
          duration: "Duración",
          created: "Creado",
          actions: "Acciones",
        },

        noDescription: "Sin descripción",
        unassigned: "Sin asignar",
        affectedService: "Servicio afectado",

        finalized: "Finalizado",
        inProgress: "En curso",

        resolvedAt: "Resuelto {{date}}",
        unresolved: "Sin resolución",

        detail: "Detalle",
        investigate: "Investigar",
        resolve: "Resolver",
        close: "Cerrar",
        edit: "Editar",
        delete: "Eliminar",
      },
    },
  },
};
