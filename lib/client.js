// dsh-session-rename — browser half (lazy-CJS bundle, no build step).
//
// What this plugin does — and deliberately all it does:
//   * The conversation header shows the current session title as a disabled
//     crumb. This plugin makes that title clickable: clicking it (or the
//     pencil button it adds beside the title) opens an in-place editor —
//     Enter saves, Escape cancels, an empty name shows a clear hint.
//   * Saving calls the frontend Session's own rename(), i.e. the built-in
//     `session.rename` wire contract behind the sidebar's native Rename
//     dialog. The Host appends a user-sourced `session/title` log event:
//     durable across restarts, projected immediately into the header crumb,
//     the sidebar history list, and every other title surface, and pinning
//     the session so automatic first-prompt titling never overwrites it.
//
// What it never touches: session type, conversation modes (standard / Think /
// Bash), the selected model, agent execution logic, and message content.
// Rename is a title-only log event; none of those surfaces read it.
window.__ModuleLoader__.load({
	id: "dsh-session-rename",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");

		// ── locale ──────────────────────────────────────────────────────────
		const en = {
			rename: "Rename",
			hint: "Rename session",
			placeholder: "Session name",
			empty: "Name cannot be empty.",
			failed: "Rename failed."
		};
		const zh = {
			rename: "重命名",
			hint: "重命名会话",
			placeholder: "输入会话名称",
			empty: "名称不能为空。",
			failed: "重命名失败。"
		};

		// ── styling (inline, self-contained) ───────────────────────────────
		const s = {
			button: {
				cursor: "pointer",
				width: "20px",
				height: "20px",
				color: "var(--dsw-alias-label-tertiary)",
				background: "transparent",
				border: "none",
				borderRadius: "4px",
				flex: "none",
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				padding: 0
			},
			editor: {
				position: "fixed",
				zIndex: 1000,
				display: "flex",
				flexDirection: "column",
				alignItems: "stretch"
			},
			input: {
				boxSizing: "border-box",
				width: "100%",
				height: "100%",
				border: "1px solid var(--dsw-alias-state-business-primary, var(--dsw-alias-border-l2))",
				background: "var(--dsw-alias-bg-layer-1, #fff)",
				color: "var(--dsw-alias-label-primary)",
				borderRadius: "6px",
				outline: "none",
				padding: "0 8px",
				fontSize: "14px",
				lineHeight: "20px",
				font: "inherit"
			},
			error: {
				position: "absolute",
				top: "calc(100% + 4px)",
				left: 0,
				whiteSpace: "nowrap",
				color: "var(--dsw-alias-state-error-primary, #dc2626)",
				background: "var(--dsw-alias-bg-layer-1, #fff)",
				border: "1px solid var(--dsw-alias-border-l2)",
				borderRadius: "6px",
				padding: "3px 8px",
				fontSize: "12px",
				lineHeight: "18px"
			}
		};

		// The host renders the current session's header title as the last,
		// disabled crumb button (CSS-module classes end in _crumb/_crumbCurrent).
		// Disabled buttons swallow no events in Chromium's capture phase, so a
		// document-level capture listener can still offer click-to-rename on the
		// title itself without modifying the host package.
		const CRUMB_SELECTOR = 'button[disabled][class*="_crumbCurrent"]';

		function PencilIcon() {
			return react.createElement("svg", {
				width: 14,
				height: 14,
				viewBox: "0 0 24 24",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 2,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": true
			},
				react.createElement("path", { d: "M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" })
			);
		}

		/**
		* Header entry: a pencil affordance beside the title, plus a document
		* capture listener that turns clicks on the disabled title crumb into
		* the same in-place editor. The editor overlays the title's own rect.
		*/
		function HeaderRename({ sessionId, useSessions, renameSession, t }) {
			const title = useSessions((state) => {
				const summary = state.byId[sessionId];
				return summary === void 0 ? "" : summary.displayTitle || "";
			});
			const [editing, setEditing] = react.useState(false);
			const [draft, setDraft] = react.useState("");
			const [error, setError] = react.useState(null);
			const [busy, setBusy] = react.useState(false);
			const [anchor, setAnchor] = react.useState(null);
			const rootRef = react.useRef(null);
			const inputRef = react.useRef(null);
			const titleRef = react.useRef(title);
			titleRef.current = title;

			// Focus and select-all exactly once when the editor opens, so the
			// user can type a replacement name immediately (no manual Ctrl+A).
			// The effect keys on `editing` only: later re-renders from typing
			// never re-select, so continued input (or IME composition) appends
			// normally instead of overwriting the draft.
			react.useEffect(() => {
				if (!editing) return;
				const el = inputRef.current;
				if (el === null) return;
				el.focus();
				el.select();
			}, [editing]);

			const findCrumb = () => {
				const root = rootRef.current;
				if (root === null) return null;
				const header = root.closest("header");
				if (header === null) return null;
				return header.querySelector(CRUMB_SELECTOR);
			};

			const openEditor = (rect) => {
				setDraft(titleRef.current);
				setError(null);
				setBusy(false);
				setAnchor(rect === void 0 ? null : rect);
				setEditing(true);
			};

			const cancel = () => {
				if (busy) return;
				setEditing(false);
				setError(null);
			};

			const save = () => {
				if (busy) return;
				const next = draft.trim();
				if (next === "") {
					setError(t("empty"));
					return;
				}
				setBusy(true);
				setError(null);
				Promise.resolve(renameSession(sessionId, next)).then((result) => {
					if (result !== void 0 && result !== null && result.ok === true) {
						setEditing(false);
					} else {
						const message = result !== void 0 && result !== null && result.error !== void 0 && result.error !== null ? result.error.message : void 0;
						setError(message || t("failed"));
					}
				}, () => {
					setError(t("failed"));
				}).finally(() => {
					setBusy(false);
				});
			};

			// Click on the header's disabled current-session title crumb opens
			// the editor, anchored over the crumb's own rectangle. Capture
			// phase: the host button is disabled, so nothing else consumes it.
			react.useEffect(() => {
				const onClick = (event) => {
					const target = event.target;
					if (target === null || typeof target.closest !== "function") return;
					const crumb = target.closest(CRUMB_SELECTOR);
					if (crumb === null) return;
					const root = rootRef.current;
					if (root === null) return;
					const header = root.closest("header");
					if (header === null || crumb.closest("header") !== header) return;
					event.preventDefault();
					event.stopPropagation();
					openEditor(crumb.getBoundingClientRect());
				};
				document.addEventListener("click", onClick, true);
				return () => document.removeEventListener("click", onClick, true);
			}, [sessionId]);

			if (!editing) {
				return react.createElement("button", {
					ref: rootRef,
					type: "button",
					style: s.button,
					title: t("hint"),
					"aria-label": t("hint"),
					onClick: () => {
						const crumb = findCrumb();
						openEditor(crumb === null ? void 0 : crumb.getBoundingClientRect());
					},
					onMouseEnter: (event) => { event.currentTarget.style.color = "var(--dsw-alias-label-primary)"; },
					onMouseLeave: (event) => { event.currentTarget.style.color = "var(--dsw-alias-label-tertiary)"; }
				}, react.createElement(PencilIcon));
			}

			const box = anchor === null
				? { position: "fixed", top: "24px", left: "50%", transform: "translateX(-50%)", width: "320px", height: "28px" }
				: {
					left: Math.max(8, anchor.left - 4) + "px",
					top: Math.max(4, anchor.top - 4) + "px",
					width: Math.max(anchor.width + 48, 240) + "px",
					height: anchor.height + 8 + "px"
				};

			return react.createElement("span", {
				ref: rootRef,
				style: Object.assign({}, s.editor, box),
				"data-session-rename-editor": ""
			},
				react.createElement("input", {
					type: "text",
					style: s.input,
					value: draft,
					disabled: busy,
					placeholder: t("placeholder"),
					"aria-label": t("hint"),
					ref: inputRef,
					onChange: (event) => { setDraft(event.currentTarget.value); setError(null); },
					onKeyDown: (event) => {
						if (event.key === "Enter") { event.preventDefault(); save(); }
						else if (event.key === "Escape") { event.preventDefault(); setEditing(false); setError(null); }
					},
					onBlur: () => { cancel(); }
				}),
				error === null ? null : react.createElement("span", { role: "alert", style: s.error }, error)
			);
		}

		// ── client entry ────────────────────────────────────────────────────
		const NS = "sessionRename";
		const inject = ["slots", "locale", "sessions"];
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "ui-session-rename: dictionaries");

			// The header actions list is declared by ui-conversation's strict
			// session header; slots.inject tracks that declaration lifetime.
			const disposeInject = ctx.slots.inject("conversation.session.header.actions", () =>
				ctx.slots.register({
					name: "conversation.session.header.actions",
					id: "session-rename",
					order: 100,
					locale: NS,
					inject: () => ({
						renameSession: (sessionId, title) => {
							const binding = ctx.sessions.binding(sessionId);
							const session = binding === void 0 || binding === null ? void 0 : binding.session;
							if (session === void 0) {
								return Promise.resolve({ ok: false, error: { code: "session-unavailable", message: "session is unavailable" } });
							}
							return session.rename(title);
						}
					})
				}, HeaderRename)
			);
			ctx.effect(() => () => { disposeInject(); }, "ui-session-rename: header entry");
		}
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
