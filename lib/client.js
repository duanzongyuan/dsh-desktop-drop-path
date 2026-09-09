/**
 * dsh-desktop-drop-path — client half.
 *
 * Captures a file drop (capture phase, so it runs before the built-in image
 * attachment drop handler), resolves each file's absolute path via the DSH
 * Desktop preload bridge, and inserts the path(s) into the composer input.
 *
 * Desktop-only. The absolute-path resolution relies on the Electron preload
 * bridge exposed as `window.__DSH_DESKTOP_FILE_PATH__.getPathForFile(file)`.
 * When the bridge is absent (e.g. the plain web UI in a browser), the plugin
 * does nothing: it installs no handlers, so it never inserts a misleading
 * filename in place of a real path.
 *
 * The plugin needs no client services: it is pure DOM + the preload bridge.
 */
window.__ModuleLoader__.load({
	id: "dsh-desktop-drop-path",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;

		const inject = [];

		/** The DSH Desktop preload bridge, when present. */
		const BRIDGE = window.__DSH_DESKTOP_FILE_PATH__;
		/** Whether the renderer can resolve a Web File to an absolute disk path. */
		const HAS_BRIDGE = !!(BRIDGE && typeof BRIDGE.getPathForFile === "function");

		/** Resolve one Web File to its absolute disk path (best effort). */
		function resolvePath(file) {
			try {
				const path = BRIDGE.getPathForFile(file);
				if (typeof path === "string" && path.length > 0) return path;
			} catch (error) {
				/* not a disk-backed file; fall through to the name fallback. */
			}
			return file && typeof file.name === "string" ? file.name : "";
		}

		/** Whether the Web File is declared as an image media type. */
		function isImage(file) {
			const type = (file && file.type) || "";
			return type.startsWith("image/");
		}

		/**
		 * Insert text into the composer contenteditable at the end of its
		 * current content. Uses the native selection + execCommand path so the
		 * caller does not need to hold the Lexical editor instance.
		 */
		function insertIntoComposer(text) {
			// Prefer the active composer input, else the resident one. The
			// composer input host carries [data-composer-input] and is a
			// contenteditable (the Lexical root). We match the attribute first
			// and accept any matching editable, so we do not depend on Lexical's
			// current contenteditable attribute value.
			const candidates = document.querySelectorAll('[data-composer-input]');
			let editable = candidates.length > 0 ? candidates[0] : null;
			for (const candidate of candidates) {
				if (candidate.getAttribute("contenteditable") === "true") {
					editable = candidate;
					break;
				}
			}
			if (document.activeElement && document.activeElement.matches &&
				document.activeElement.matches('[data-composer-input]')) {
				editable = document.activeElement;
			}
			if (!editable) return false;
			editable.focus();
			try {
				const selection = window.getSelection();
				if (selection) {
					const range = document.createRange();
					range.selectNodeContents(editable);
					range.collapse(false); // collapse to the end
					selection.removeAllRanges();
					selection.addRange(range);
				}
				document.execCommand("insertText", false, text);
				return true;
			} catch (error) {
				/* execCommand is deprecated but still functional in Chromium. */
				return false;
			}
		}

		/** Pull the `Files` data transfer when present, else null. */
		function fileTransfer(event) {
			const dataTransfer = event.dataTransfer;
			if (!dataTransfer || !dataTransfer.types || !dataTransfer.types.includes("Files")) return null;
			if (!dataTransfer.files || dataTransfer.files.length === 0) return null;
			return dataTransfer;
		}

		function onDragOver(event) {
			if (fileTransfer(event) === null) return;
			event.preventDefault();
			if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
		}

		function onDrop(event) {
			const dataTransfer = fileTransfer(event);
			if (dataTransfer === null) return;
			const files = Array.from(dataTransfer.files);
			if (files.length === 0) return;

			// Only capture drops that contain at least one non-image file, so
			// pure image drops keep flowing to the built-in image rail.
			const hasNonImage = files.some((file) => !isImage(file));
			if (!hasNonImage) return;

			const paths = files.map(resolvePath).filter(Boolean);
			if (paths.length === 0) return;

			// Consume the drop in the capture phase so the image handler (which
			// rejects non-images with an error toast) never sees it.
			event.preventDefault();
			event.stopPropagation();

			const text = paths.length === 1 ? paths[0] : paths.join("\n");
			insertIntoComposer(text);

			// The built-in attachment plugin clears its drop hint mask inside its
			// own (bubble-phase) drop handler, which we just stopped from firing.
			// OS file drags also do not reliably emit `dragend`, so the plugin's
			// window-level reset may never run. Dispatch a synthetic `dragend` to
			// trigger that reset and dismiss the full-screen drop overlay.
			try {
				window.dispatchEvent(new Event("dragend"));
			} catch (error) {
				/* overlay dismissal is best-effort; the path is already inserted. */
			}
		}

		function apply(ctx) {
			// Guard against a duplicate install (e.g. HMR re-applying the plugin).
			if (window.__DSH_DESKTOP_DROP_PATH__INSTALLED__) return;

			// Environment detection: the feature is Desktop-only. Without the
			// preload path bridge we cannot resolve a real absolute path, so we
			// install nothing — this keeps the plugin inert in a plain browser
			// (dsh web) instead of inserting a misleading filename.
			if (!HAS_BRIDGE) {
				if (typeof console !== "undefined" && typeof console.warn === "function") {
					console.warn("[dsh-desktop-drop-path] not active: requires the DSH Desktop app (no __DSH_DESKTOP_FILE_PATH__ bridge).");
				}
				return;
			}

			window.__DSH_DESKTOP_DROP_PATH__INSTALLED__ = true;
			// Capture phase: runs before the built-in bubble-phase drop handler,
			// so a non-image drop can be consumed without tripping image intake.
			document.addEventListener("dragover", onDragOver, true);
			document.addEventListener("drop", onDrop, true);
		}

		exports.inject = inject;
		exports.apply = apply;
		return module.exports;
	}
});
