/**
 * Contract for editor panels. Each panel is a CONTROLLED component editing one
 * slice of the invitation design doc: it receives the current `value` (possibly
 * undefined/empty) and calls `onChange` with the next value (or undefined to
 * clear the slice). Panels never touch global state or save — the editor page
 * owns the design object and persistence.
 */
export type PanelProps<T> = {
  value: T | undefined;
  onChange: (value: T | undefined) => void;
};

/** Re-encode + upload an image, resolving to its stored asset key. */
export type ImageUploader = (file: File) => Promise<string>;
