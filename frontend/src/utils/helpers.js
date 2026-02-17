export function toErrorMessage(err, fallback) {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  if (err.message) return err.message;
  return fallback;
}

export function splitTagsInput(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

