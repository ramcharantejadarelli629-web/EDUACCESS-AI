const API_BASE = '/api/v1';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        errorMessage = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
      } else if (errorJson.validation_errors) {
        errorMessage = errorJson.validation_errors.join(' | ');
      }
    } catch (_) {
      // Non-JSON response
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export const apiClient = {
  async checkLiveness() {
    const res = await fetch(`${API_BASE}/health/liveness`);
    return handleResponse(res);
  },

  async checkReadiness() {
    const res = await fetch(`${API_BASE}/health/readiness`);
    return handleResponse(res);
  },

  async simplifyText({ text, readingLevel = 'standard', targetAudience = 'general_learner', sourceReference = null }) {
    const res = await fetch(`${API_BASE}/simplify-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        reading_level: readingLevel,
        target_audience: targetAudience,
        source_reference: sourceReference,
      }),
    });
    return handleResponse(res);
  },

  async simplifyUrl({ url, readingLevel = 'standard' }) {
    const res = await fetch(`${API_BASE}/simplify-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        reading_level: readingLevel,
      }),
    });
    return handleResponse(res);
  },

  async explainDiagram({ file, detailLevel = 'balanced', pageNumber = 1 }) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('detail_level', detailLevel);
    if (pageNumber) {
      formData.append('page_number', pageNumber.toString());
    }

    const res = await fetch(`${API_BASE}/explain-diagram`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  async inspectPdf(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/pdf/inspect`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },
};
