import api from '../services/api';

/**
 * Logs a user activity to the backend (activity_logs table).
 * Fire-and-forget: failures are only logged to the console so they never
 * block or break the PDF preview/generation flow the user is actually doing.
 *
 * @param {Object} params
 * @param {'preview'|'generate'|'access'} params.activityType
 * @param {string} params.entityType   e.g. 'progestor'
 * @param {string} params.description  Human-readable description, should state
 *                                      which document/report/invoice and whether
 *                                      it was only previewed or fully generated.
 * @param {Object|null} [params.metadata]
 */
export const logActivity = async ({ activityType, entityType, description, metadata = null }) => {
  try {
    await api.post('/api/logs', { activityType, entityType, description, metadata });
  } catch (err) {
    console.error('Activity log error:', err);
  }
};

export default logActivity;