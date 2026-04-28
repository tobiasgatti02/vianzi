import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000", // backend CHAT APP
});

export const getHandoffLeads = () =>
  API.get("/leads/handoff");

export const getLeadDetail = (id) =>
  API.get(`/leads/${id}`);

export const sendTextMessage = (leadId, text) =>
  API.post(`/messages/${leadId}/text`, { text });

export const sendAudioMessage = (leadId, file) => {
  const form = new FormData();
  form.append("audio", file);

  return API.post(`/audio/${leadId}/audio`, form);
};