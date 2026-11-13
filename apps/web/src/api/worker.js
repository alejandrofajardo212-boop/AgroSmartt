/**
 * worker.js
 * Servicio de peticiones HTTP para los 4 módulos del Trabajador / Operario.
 * Usa el cliente axios configurado en api/client.js (incluye token JWT automáticamente).
 */

import { api, getApiError } from './client.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildParams({ page = 1, limit = 20 } = {}) {
  return { params: { page, limit } };
}

// ─── Actividades ──────────────────────────────────────────────────────────────

export const activitiesService = {
  /**
   * Obtiene la lista paginada de actividades.
   * @param {{ page?: number, limit?: number }} options
   * @returns {Promise<{ items: object[], pagination: object }>}
   */
  async list(options = {}) {
    try {
      const { data } = await api.get('/activities', buildParams(options));
      return data;
    } catch (error) {
      throw new Error(getApiError(error));
    }
  },

  /**
   * Crea una nueva actividad agrícola.
   * @param {{ title: string, farmId: string, assignedTo: string, date: string, status: string }} payload
   */
  async create(payload) {
    try {
      const { data } = await api.post('/activities', payload);
      return data.item;
    } catch (error) {
      throw new Error(getApiError(error));
    }
  },

  /**
   * Actualiza una actividad existente.
   * @param {string} id
   * @param {Partial<object>} payload
   */
  async update(id, payload) {
    try {
      const { data } = await api.patch(`/activities/${id}`, payload);
      return data.item;
    } catch (error) {
      throw new Error(getApiError(error));
    }
  }
};

// ─── Tareas ───────────────────────────────────────────────────────────────────

export const tasksService = {
  /**
   * Obtiene la lista paginada de tareas asignadas.
   */
  async list(options = {}) {
    try {
      const { data } = await api.get('/tasks', buildParams(options));
      return data;
    } catch (error) {
      throw new Error(getApiError(error));
    }
  }
};

// ─── Cosechas ─────────────────────────────────────────────────────────────────

export const harvestsService = {
  /**
   * Obtiene la lista paginada de registros de cosecha.
   */
  async list(options = {}) {
    try {
      const { data } = await api.get('/harvests', buildParams(options));
      return data;
    } catch (error) {
      throw new Error(getApiError(error));
    }
  },

  /**
   * Registra una nueva cosecha.
   * @param {{ crop: string, farmId: string, date: string, quantityKg: number, quality: string }} payload
   */
  async create(payload) {
    try {
      const { data } = await api.post('/harvests', {
        ...payload,
        quantityKg: Number(payload.quantityKg)
      });
      return data.item;
    } catch (error) {
      throw new Error(getApiError(error));
    }
  },

  /**
   * Actualiza un registro de cosecha.
   */
  async update(id, payload) {
    try {
      const { data } = await api.patch(`/harvests/${id}`, {
        ...payload,
        ...(payload.quantityKg !== undefined && { quantityKg: Number(payload.quantityKg) })
      });
      return data.item;
    } catch (error) {
      throw new Error(getApiError(error));
    }
  }
};

// ─── Novedades ────────────────────────────────────────────────────────────────

export const newsService = {
  /**
   * Obtiene la lista paginada de novedades reportadas.
   */
  async list(options = {}) {
    try {
      const { data } = await api.get('/news', buildParams(options));
      return data;
    } catch (error) {
      throw new Error(getApiError(error));
    }
  },

  /**
   * Crea un nuevo reporte de novedad.
   * @param {{ title: string, farmId: string, reportedBy: string, date: string, description: string }} payload
   */
  async create(payload) {
    try {
      const { data } = await api.post('/news', payload);
      return data.item;
    } catch (error) {
      throw new Error(getApiError(error));
    }
  },

  /**
   * Actualiza un reporte de novedad existente.
   */
  async update(id, payload) {
    try {
      const { data } = await api.patch(`/news/${id}`, payload);
      return data.item;
    } catch (error) {
      throw new Error(getApiError(error));
    }
  }
};
