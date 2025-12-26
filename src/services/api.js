// services/api.js
const API_URL = process.env.REACT_APP_API_URL || 'https://an-nour-backend-5mf0.onrender.com';

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

// VISITORS
export const createVisitor = async (data) => {
  const response = await fetch(`${API_URL}/api/v1/visiteurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};

// FEEDBACK
export const createFeedback = async (data) => {
  const response = await fetch(`${API_URL}/api/v1/feedbacks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};
