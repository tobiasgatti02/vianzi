import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:3000",
});

API.interceptors.request.use((cfg) => {
  const dealerId = (import.meta as any).env.VITE_DEALER_ID as string | undefined;
  if (dealerId) {
    cfg.headers = cfg.headers || {};
    (cfg.headers as any)["x-dealer-id"] = dealerId;
  }
  return cfg;
});

export const getHandoffLeads = () => API.get("/leads/handoff");
export const getLeadDetail = (id: string) => API.get(`/leads/${id}`);
export const sendTextMessage = (leadId: string, text: string) =>
  API.post(`/messages/${leadId}/text`, { text });
export const sendAudioMessage = (leadId: string, file: Blob) => {
  const form = new FormData();
  form.append("audio", file);
  return API.post(`/audio/${leadId}/audio`, form);
};
