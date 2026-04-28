import express from 'express';
import { getHandoffLeads, getLeadById, updateLead } from '../storage/leads.store.js';
import { getMessagesByLead } from '../storage/messages.store.js';

const router = express.Router();

router.get('/handoff', (req, res) => {
  res.json(getHandoffLeads());
});


router.get('/:id', (req, res) => {
  const lead = getLeadById(req.params.id);
  const messages = getMessagesByLead(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json({ lead, messages });
});


router.post('/:id/outcome', (req, res) => {
  updateLead(req.params.id, { outcome: req.body, status: 'closed' });
  res.json({ ok: true });
});

export default router;