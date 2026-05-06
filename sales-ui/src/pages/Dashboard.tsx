import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../hooks/useTheme";
import {
	getHandoffLeads,
	getLeadDetail,
	sendTextMessage,
	sendAudioMessage,
} from "../api/backend";

function timeHHMM(iso: any) {
	if (!iso) return "";
	const d = new Date(iso);
	return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function dayLabel(iso: any) {
	if (!iso) return "";
	const d = new Date(iso);
	const today = new Date();
	const same =
		d.getFullYear() === today.getFullYear() &&
		d.getMonth() === today.getMonth() &&
		d.getDate() === today.getDate();
	return same ? "Hoy" : d.toLocaleDateString();
}

function intentPill(intent: any) {
	const safe = (intent ?? "").toString();
	const base = "px-2 py-1 rounded-full text-[11px] font-medium";
	if (safe.includes("CASH")) return `${base} bg-emerald-100 text-emerald-700`;
	if (safe.includes("FINANCE")) return `${base} bg-violet-100 text-violet-700`;
	if (safe.includes("BUY_NOW")) return `${base} bg-rose-100 text-rose-700`;
	if (safe.includes("PRICE")) return `${base} bg-amber-100 text-amber-700`;
	if (safe.includes("ABANDON")) return `${base} bg-zinc-100 text-zinc-700`;
	return `${base} bg-sky-100 text-sky-700`;
}

function bubbleRow(sender: string) {
	return sender === "user" ? "justify-start" : "justify-end";
}

function bubbleStyle(sender: string) {
	if (sender === "user") {
		return "bg-[#202c33] text-neutral-100 rounded-2xl rounded-bl-md";
	}
	return "bg-[#005c4b] text-white rounded-2xl rounded-br-md";
}

export default function Dashboard() {
	const { theme, toggleTheme } = useTheme();

	const [leads, setLeads] = useState<any[]>([]);
	const [selectedLead, setSelectedLead] = useState<any | null>(null);
	const [messages, setMessages] = useState<any[]>([]);

	const [query, setQuery] = useState("");
	const [text, setText] = useState("");
	const [loadingLead, setLoadingLead] = useState(false);
	const [sendingText, setSendingText] = useState(false);

	const [recording, setRecording] = useState(false);
	const [sendingAudio, setSendingAudio] = useState(false);
	const recorderRef = useRef<MediaRecorder | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const chunksRef = useRef<Blob[]>([]);

	const bottomRef = useRef<HTMLDivElement | null>(null);
	const [autoScroll, setAutoScroll] = useState(true);

	const [toast, setToast] = useState<any | null>(null);
	const toastTimer = useRef<any>(null);
	const showToast = (msg: string, type: string = "info") => {
		setToast({ msg, type });
		if (toastTimer.current) clearTimeout(toastTimer.current);
		toastTimer.current = setTimeout(() => setToast(null), 2000);
	};

	const refreshLeads = async () => {
		const res = await getHandoffLeads();
		setLeads((res as any).data || []);
	};

	const refreshLeadDetail = async (id: string) => {
		const res = await getLeadDetail(id);
		setSelectedLead((res as any).data.lead || null);
		setMessages((res as any).data.messages || []);
	};

	useEffect(() => {
		refreshLeads();
		const t = setInterval(refreshLeads, 3000);
		return () => clearInterval(t);
	}, []);

	useEffect(() => {
		if (!selectedLead?.id) return;
		const t = setInterval(() => refreshLeadDetail(selectedLead.id), 2000);
		return () => clearInterval(t);
	}, [selectedLead?.id]);

	useEffect(() => {
		if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, autoScroll]);

	const leadsView = useMemo(() => {
		const q = query.trim().toLowerCase();
		const normalized = (leads || []).map((l: any) => ({
			...l,
			_name: l.customer_name || l.id,
			_model: l.model_interest?.model || "Sin modelo",
			_last: l.last_message_at || l.handoff_at,
			_time: timeHHMM(l.last_message_at || l.handoff_at),
			_day: dayLabel(l.last_message_at || l.handoff_at),
			_preview: l.model_interest?.model
				? `Modelo: ${l.model_interest.model} · Pago: ${l.purchase_type || "N/D"}`
				: "Nuevo lead",
		}));

		const filtered = q
			? normalized.filter(
					(l: any) =>
						l._name.toLowerCase().includes(q) ||
						l._model.toLowerCase().includes(q) ||
						(l.intent || "").toLowerCase().includes(q)
				)
			: normalized;

		return filtered.sort(
			(a: any, b: any) => new Date(b._last).getTime() - new Date(a._last).getTime()
		);
	}, [leads, query]);

	const onSelectLead = async (lead: any) => {
		setLoadingLead(true);
		await refreshLeadDetail(lead.id);
		setLoadingLead(false);
		setAutoScroll(true);
	};

	const onSendText = async () => {
		if (!selectedLead?.id) return;
		const msg = text.trim();
		if (!msg) return;

		setSendingText(true);
		setMessages((prev) => [
			...prev,
			{
				sender: "human",
				type: "text",
				content: msg,
				created_at: new Date().toISOString(),
				_optimistic: true,
			},
		]);
		setText("");

		try {
			await sendTextMessage(selectedLead.id, msg);
			showToast("Mensaje enviado ✅", "ok");
			await refreshLeadDetail(selectedLead.id);
		} catch {
			showToast("Falló el envío de texto", "err");
		} finally {
			setSendingText(false);
			setAutoScroll(true);
		}
	};

	const startRecording = async () => {
		if (!selectedLead?.id) return;

		chunksRef.current = [];
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		streamRef.current = stream;

		const preferred = "audio/ogg;codecs=opus";
		const fallback = "audio/webm;codecs=opus";
		const mimeType = (window as any).MediaRecorder?.isTypeSupported?.(preferred)
			? preferred
			: (window as any).MediaRecorder?.isTypeSupported?.(fallback)
			? fallback
			: "";

		const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
		recorderRef.current = rec;

		rec.ondataavailable = (e: any) => {
			if (e?.data && e.data.size > 0) chunksRef.current.push(e.data);
		};

		rec.onstop = async (_ev: any) => {
			streamRef.current?.getTracks()?.forEach((t) => t.stop());
			const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
			if (!blob.size || blob.size <= 0) {
				showToast("El audio salió vacío", "err");
				return;
			}

			setSendingAudio(true);
			try {
				await sendAudioMessage(selectedLead.id, blob);
				showToast("Audio enviado 🎙️✅", "ok");
				await refreshLeadDetail(selectedLead.id);
			} catch {
				showToast("Falló el envío de audio", "err");
			} finally {
				setSendingAudio(false);
				setAutoScroll(true);
			}
		};

		rec.start();
		setRecording(true);
		showToast("Grabando…", "info");
	};

	const stopRecording = () => {
		if (!recorderRef.current) return;
		recorderRef.current.stop();
		recorderRef.current = null;
		setRecording(false);
	};

	return (
		<div className="h-full w-full flex bg-zinc-100 text-zinc-900 dark:bg-[#0b141a] dark:text-neutral-100">
			{toast && (
				<div
					className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-xl shadow border backdrop-blur
					${
						toast.type === "ok"
							? "bg-emerald-500/15 border-emerald-500/25 text-emerald-200"
							: toast.type === "err"
							? "bg-rose-500/15 border-rose-500/25 text-rose-200"
							: "bg-sky-500/15 border-sky-500/25 text-sky-200"
					}`}
				>
					{toast.msg}
				</div>
			)}

			<aside className="w-[90px] bg-white border-r border-zinc-200 flex flex-col items-center py-4 gap-4 dark:bg-[#111b21] dark:border-[#1f2c33]">
				<div className="w-12 h-12 rounded-xl bg-rose-500 text-white font-bold flex items-center justify-center">logo</div>
				<nav className="flex flex-col gap-2 mt-2">
					<button className="w-12 h-12 rounded-xl bg-zinc-900 text-white flex items-center justify-center dark:bg-[#202c33]" title="Messaging">💬</button>
					<button className="w-12 h-12 rounded-xl hover:bg-zinc-100 flex items-center justify-center dark:hover:bg-[#202c33]" title="Archived">🗂️</button>
					<button className="w-12 h-12 rounded-xl hover:bg-zinc-100 flex items-center justify-center dark:hover:bg-[#202c33]" title="Settings">⚙️</button>
				</nav>
				<button onClick={toggleTheme} className="w-12 h-12 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center dark:border-[#1f2c33] dark:bg-[#111b21] dark:hover:bg-[#202c33]" title={theme === "dark" ? "Modo claro" : "Modo oscuro"}>
					{theme === "dark" ? "🌞" : "🌙"}
				</button>
				<div className="mt-auto w-full px-3">
					<button className="w-full py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs dark:border-[#1f2c33] dark:hover:bg-[#202c33]">Support</button>
				</div>
			</aside>

			<section className="w-[380px] bg-white border-r border-zinc-200 flex flex-col dark:bg-[#111b21] dark:border-[#1f2c33]">
				<div className="p-4 border-b border-zinc-200 dark:border-[#1f2c33]">
					<div className="text-lg font-semibold">Messaging</div>
					<div className="mt-3 flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 dark:bg-[#202c33] dark:border-[#1f2c33]">
						<span className="text-zinc-400">🔎</span>
						<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search in dashboard…" className="bg-transparent outline-none text-sm w-full placeholder:text-zinc-400 dark:text-neutral-100 dark:placeholder:text-neutral-400" />
					</div>
				</div>
				<div className="flex-1 overflow-y-auto p-3">
					{leadsView.length === 0 ? (
						<div className="text-sm text-zinc-500 p-3 dark:text-neutral-400">No hay leads en handoff todavía</div>
					) : (
						leadsView.map((l: any) => (
							<button key={l.id} onClick={() => onSelectLead(l)} className={`w-full text-left p-3 rounded-2xl mb-2 border transition ${selectedLead?.id === l.id ? "border-emerald-400/40 bg-emerald-500/10 dark:border-emerald-400/30 dark:bg-emerald-500/10" : "border-zinc-200 hover:bg-zinc-50 dark:border-[#1f2c33] dark:hover:bg-[#202c33]"}`}>
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-xl bg-zinc-200 flex items-center justify-center font-semibold dark:bg-[#202c33]">{String(l._name).slice(0, 2).toUpperCase()}</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-start justify-between gap-2">
											<div className="font-semibold truncate">{l._name}</div>
											<div className="text-xs text-zinc-500 dark:text-neutral-400">{l._time}</div>
										</div>
										<div className="text-sm text-zinc-600 truncate dark:text-neutral-300">{l._preview}</div>
										<div className="mt-2 flex items-center gap-2">
											<span className={intentPill(l.intent)}>{l.intent}</span>
											<span className="text-xs text-zinc-500 dark:text-neutral-400">{l._day}</span>
										</div>
									</div>
								</div>
							</button>
						))
					)}
				</div>
			</section>

			<main className="flex-1 flex flex-col">
				{!selectedLead ? (
					<div className="flex-1 flex items-center justify-center text-zinc-500 dark:text-neutral-400">Seleccioná un contacto para ver el chat</div>
				) : (
					<>
						<div className="bg-white border-b border-zinc-200 p-4 flex items-center justify-between dark:bg-[#111b21] dark:border-[#1f2c33]">
							<div className="flex items-center gap-3">
								<div className="w-11 h-11 rounded-xl bg-zinc-200 flex items-center justify-center font-semibold dark:bg-[#202c33]">{(selectedLead.customer_name || selectedLead.id).slice(0, 2).toUpperCase()}</div>
								<div>
									<div className="font-semibold">{selectedLead.customer_name || selectedLead.id}</div>
									<div className="text-sm text-zinc-600 dark:text-neutral-300">
										Modelo: <span className="text-zinc-900 dark:text-neutral-100">{selectedLead.model_interest?.model || "Sin modelo"}</span>{" · "}
										Pago: <span className="text-zinc-900 dark:text-neutral-100">{selectedLead.purchase_type || "Sin definir"}</span>{" · "}
										Estado: <span className="text-zinc-900 dark:text-neutral-100">{selectedLead.status}</span>
									</div>
								</div>
							</div>
							<button onClick={() => refreshLeadDetail(selectedLead.id)} className="px-3 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-sm dark:border-[#1f2c33] dark:hover:bg-[#202c33]">Refrescar</button>
						</div>

						<div className="flex-1 overflow-y-auto px-6 py-5 space-y-3 bg-zinc-100 dark:bg-[#0b141a]" onScroll={(e) => {
							const el = e.currentTarget as HTMLDivElement;
							const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
							setAutoScroll(nearBottom);
						}}>
							{loadingLead ? (
								<div className="text-zinc-500 dark:text-neutral-400">Cargando conversación…</div>
							) : (
								<>
									<div className="w-full flex justify-center">
										<span className="text-xs bg-zinc-200 text-zinc-700 px-3 py-1 rounded-full dark:bg-[#202c33] dark:text-neutral-200">{dayLabel(new Date().toISOString())}</span>
									</div>
									{messages.map((m: any, i: number) => (
										<div key={m.message_id || `${m.sender}-${m.created_at}-${i}`} className={`w-full flex ${bubbleRow(m.sender)}`}>
											<div className={`max-w-[720px] px-4 py-3 shadow-sm ${bubbleStyle(m.sender)}`}>
												{m.type === "audio" ? (
													<div className="text-sm">🎙️ Audio enviado <span className="opacity-60">(media: {m.media_url || "n/a"})</span></div>
												) : (
													<div className="text-sm whitespace-pre-wrap">{m.content}</div>
												)}
												<div className={`mt-2 text-[11px] opacity-70 ${m.sender === "user" ? "text-left" : "text-right"}`}>
													{timeHHMM(m.created_at)}{m._optimistic ? " · enviando…" : ""}
												</div>
											</div>
										</div>
									))}
								</>
							)}
							<div ref={bottomRef} />
						</div>

						<div className="bg-white border-t border-zinc-200 p-4 dark:bg-[#111b21] dark:border-[#1f2c33]">
							<div className="flex gap-3 items-end">
								<textarea className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-zinc-300 resize-none dark:bg-[#202c33] dark:border-[#1f2c33] dark:text-neutral-100 dark:placeholder:text-neutral-400" rows={2} placeholder="Escribí tu mensaje… (Enter envía / Shift+Enter salto)" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSendText(); } }} disabled={sendingText || sendingAudio} />
								<button onClick={onSendText} className={`px-4 py-3 rounded-2xl text-sm font-semibold text-white ${sendingText ? "bg-emerald-700/50 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`} disabled={sendingText || sendingAudio}>{sendingText ? "Enviando…" : "Enviar"}</button>
								{!recording ? (
									<button onClick={startRecording} className={`px-4 py-3 rounded-2xl text-sm font-semibold text-white ${sendingAudio ? "bg-zinc-700/50 cursor-not-allowed" : "bg-[#00a884] hover:bg-[#029a79]"}`} disabled={sendingAudio || sendingText} title="Grabar audio">🎙️</button>
								) : (
									<button onClick={stopRecording} className="px-4 py-3 rounded-2xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700" title="Enviar audio">⏹</button>
								)}
							</div>
							<div className="mt-2 text-xs text-zinc-500 dark:text-neutral-400">Tip: el audio suele cerrar más rápido que el texto</div>
						</div>
					</>
				)}
			</main>
		</div>
	);
}
