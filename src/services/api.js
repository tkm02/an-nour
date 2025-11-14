// services/api.js
const API_URL = 'http://localhost:8000/api/v1';

// CREATE
export const createRegistration = async (data) => {
  const response = await fetch(`${API_URL}/registrations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};

// READ ALL
export const getRegistrations = async (params = {}) => {
  const query = new URLSearchParams(params);
  const response = await fetch(`${API_URL}/registrations?${query}`);
  return response.json();
};

// READ ONE
export const getRegistration = async (id) => {
  const response = await fetch(`${API_URL}/registrations/${id}`);
  return response.json();
};

// UPDATE
export const updateRegistration = async (id, data) => {
  const response = await fetch(`${API_URL}/registrations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};

// DELETE
export const deleteRegistration = async (id) => {
  const response = await fetch(`${API_URL}/registrations/${id}`, {
    method: 'DELETE'
  });
  return response.json();
};
