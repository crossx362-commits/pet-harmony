const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export type BirthResolution = {
  iso: string;
  estimated: boolean;
  species: "dog" | "cat";
};

export function speciesKind(species?: string): "dog" | "cat" {
  const s = String(species || "").trim().toLowerCase();
  if (s === "고양이" || s === "cat") return "cat";
  return "dog";
}

export function estimateBirth(kind: "dog" | "cat"): string {
  return kind === "cat" ? "2021-09-15" : "2020-05-01";
}

export function todayISO(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Empty allowed. Invalid / impossible / future dates fail. */
export function parseOptionalBirth(
  raw: string | undefined,
  now = new Date(),
): { ok: true; iso: string | null } | { ok: false; error: string } {
  const value = String(raw || "").trim();
  if (!value) return { ok: true, iso: null };
  const m = ISO.exec(value);
  if (!m) return { ok: false, error: "날짜는 YYYY-MM-DD 형식으로 입력해 주세요." };
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== mo - 1 ||
    dt.getUTCDate() !== d
  ) {
    return { ok: false, error: "존재하지 않는 날짜예요." };
  }
  if (value > todayISO(now)) {
    return { ok: false, error: "미래 날짜는 사용할 수 없어요." };
  }
  if (y < 1900) return { ok: false, error: "너무 오래된 날짜예요." };
  return { ok: true, iso: value };
}

export function parseRequiredBirth(
  raw: string | undefined,
  label: string,
  now = new Date(),
): { ok: true; iso: string } | { ok: false; error: string } {
  const value = String(raw || "").trim();
  if (!value) return { ok: false, error: `${label}을 입력해 주세요.` };
  const parsed = parseOptionalBirth(value, now);
  if (!parsed.ok) return parsed;
  if (!parsed.iso) return { ok: false, error: `${label}을 입력해 주세요.` };
  return { ok: true, iso: parsed.iso };
}

export function resolvePetBirth(
  raw: string | undefined,
  species: string | undefined,
  now = new Date(),
): { ok: true; birth: BirthResolution } | { ok: false; error: string } {
  const parsed = parseOptionalBirth(raw, now);
  if (!parsed.ok) return parsed;
  const kind = speciesKind(species);
  if (parsed.iso) {
    return { ok: true, birth: { iso: parsed.iso, estimated: false, species: kind } };
  }
  return {
    ok: true,
    birth: { iso: estimateBirth(kind), estimated: true, species: kind },
  };
}

/** Time is ignored unless a real (non-estimated) birthday exists. */
export function resolveTime(time: string | undefined, hasRealBirth: boolean): string {
  if (!hasRealBirth) return "";
  const t = String(time || "").trim();
  if (!t) return "";
  if (!/^\d{2}:\d{2}$/.test(t)) return "";
  const [h, m] = t.split(":").map(Number);
  if (h > 23 || m > 59) return "";
  return t;
}
