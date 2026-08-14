const BASE_URL = 'http://localhost:8000';

export const simulateMotor = async (params) => {
  try {
    const response = await fetch(`${BASE_URL}/api/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      throw new Error(`Simulation failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error simulating motor:", error);
    throw error;
  }
};

export const analyzeSpectrum = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error analyzing spectrum:", error);
    throw error;
  }
};

export const fetchMotors = async () => {
  const res = await fetch(`${BASE_URL}/api/motors`);
  if (!res.ok) throw new Error('Failed to fetch motors');
  return res.json();
};

export const fetchMotor = async (id) => {
  const res = await fetch(`${BASE_URL}/api/motors/${id}`);
  if (!res.ok) throw new Error('Motor not found');
  return res.json();
};

export const createMotor = async (data) => {
  const res = await fetch(`${BASE_URL}/api/motors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create motor');
  return res.json();
};

export const updateMotor = async (id, data) => {
  const res = await fetch(`${BASE_URL}/api/motors/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update motor');
  return res.json();
};

export const deleteMotor = async (id) => {
  const res = await fetch(`${BASE_URL}/api/motors/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete motor');
  return res.json();
};

export const scanMotor = async (id) => {
  const res = await fetch(`${BASE_URL}/api/motors/${id}/scan`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to scan motor');
  return res.json();
};

export const scanAllMotors = async () => {
  const res = await fetch(`${BASE_URL}/api/motors/scan-all`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to scan all motors');
  return res.json();
};

export const fetchPriorityQueue = async () => {
  const res = await fetch(`${BASE_URL}/api/priority-queue`);
  if (!res.ok) throw new Error('Failed to fetch priority queue');
  return res.json();
};

export const fetchFaultHistory = async (id) => {
  const res = await fetch(`${BASE_URL}/api/motors/${id}/history`);
  if (!res.ok) throw new Error('Failed to fetch fault history');
  return res.json();
};
