import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001",
});

API.interceptors.request.use((cfg) => {
  const dealerId = process.env.NEXT_PUBLIC_DEALER_ID;
  if (dealerId) {
    cfg.headers = cfg.headers || {};
    (cfg.headers as any)["x-dealer-id"] = dealerId;
  }
  return cfg;
});

export const getHandoffLeads = () => API.get("/leads");
export const getLeadDetail = (id: string) => API.get(`/leads/${id}`);
export const sendTextMessage = (leadId: string, text: string) =>
  API.post(`/messages/${leadId}/text`, { text });
export const sendAudioMessage = (leadId: string, file: Blob) => {
  const form = new FormData();
  form.append("audio", file);
  return API.post(`/audio/${leadId}/audio`, form);
};
