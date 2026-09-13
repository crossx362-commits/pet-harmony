import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Calendar, Cat, Check, ChevronRight, CircleHelp, Clock, Dog, Lock, PawPrint, Users } from "lucide-react";
import { computeTest, todayIndex, type HarmonyResult, type TestId } from "@/lib/compute";
import { todayISO } from "@/lib/dates";
import {
  ALL_TESTS,
  composeFromSession,
  emptySession,
  fetchResult,
  isDone,
  isSkipped,
  loadCurrentId,
  loadResult,
  loadSession,
  nextRequired,
  OPTIONAL_TESTS,
  prefill,
  REQUIRED_TESTS,
  requiredCount,
  requiredReady,
  mergeShared,
  saveResultLocal,
  saveSession,
  uid,
  type AuditionSession,
} from "@/lib/session";

const MBTI = [
  { key: "mbtiEnergy", label: "펫과 쉬는 날에는?", hint: "바깥 에너지를 얼마나 나누고 싶은지 봐요.", options: ["E|같이 밖에 나가고 싶어요", "I|집에서 조용히 쉬고 싶어요"] },
  { key: "mbtiStyle", label: "펫의 문제가 생기면?", hint: "문제를 푸는 버릇이 펫 케어 방식과도 이어져요.", options: ["N|여러 방법을 떠올려 시도해요", "S|확실한 원인부터 차근차근 봐요"] },
  { key: "mbtiRoutine", label: "펫과 루틴을 정할 때는?", hint: "기분 중심인지, 기준 중심인지 가벼운 힌트예요.", options: ["F|서로 기분과 마음을 먼저 봐요", "T|기준을 세우고 효율적으로 정해요"] },
];
const LIFE = [
  { key: "lifeTime", label: "평일에 펫과 보낼 수 있는 시간은?", hint: "출퇴근이 있는 날을 기준으로 골라 주세요.", options: ["high|하루에 꽤 오래 함께할 수 있어요", "mid|아침·저녁에 꾸준히 챙길 수 있어요", "low|짧아도 매일 챙기려고 해요"] },
  { key: "lifeActivity", label: "같이 하고 싶은 활동은?", hint: "산책형과 실내형이 점수가 조금 달라져요.", options: ["out|산책·놀이처럼 몸을 움직이는 것", "home|집에서 쉬고 교감하는 것", "mix|그날그날 다르게 하고 싶어요"] },
  { key: "lifeRoutine", label: "돌봄 루틴은 어떤 편인가요?", hint: "정해진 밥·산책 시간이 있는지도 포함해요.", options: ["steady|정해둔 시간에 꾸준히 하는 편", "flex|상황에 맞춰 유연하게 하는 편", "learn|배우면서 하나씩 만들어갈래요"] },
];

type Field = { key: string; label: string; type: string; required?: boolean; options?: string[]; hint?: string; group?: string; placeholder?: string };

const GROUPS: Record<string, { title: string; note: string }> = {
  me: { title: "나", note: "내 생일이 있어야 사주를 볼 수 있어요. 태어난 시간은 알면 더 정교해지고, 몰라도 괜찮아요." },
  pet: { title: "함께할 친구", note: "종을 고르면 생일을 몰라도 그 종의 기본 성향으로 추정해요. 이름은 결과에만 나와요." },
  dog: { title: "강아지 후보", note: "생일을 알면 더 정확하고, 모르면 강아지 기본 성향으로 먼저 봐요." },
  cat: { title: "고양이 후보", note: "생일을 알면 더 정확하고, 모르면 고양이 기본 성향으로 먼저 봐요." },
  a: { title: "첫 번째 사람", note: "나와 같은 사람이어도 괜찮아요. 시간은 선택이에요." },
  b: { title: "두 번째 사람", note: "가족·룸메이트처럼 같이 살 사람의 생일이에요." },
};

const TEST_META: Record<TestId, { title: string; blurb: string; why: string; required: boolean; art: string; formArt: string; badge: string; submit: string; fields: Field[] }> = {
  saju: {
    title: "사주 케미",
    blurb: "생일로 보는 나와 펫의 어울림.",
    why: "내 생일과 펫 정보로 사주 케미를 봐요. 펫 생일을 모르면, 고른 종의 기본 성향으로 추정해요.",
    required: true,
    art: "/assets/webp/mode-saju.webp",
    formArt: "/assets/webp/mode-saju.webp",
    badge: "꼭 보기",
    submit: "사주 케미 보기",
    fields: [
      { key: "owner", label: "내 생일", type: "date", required: true, group: "me", hint: "양력 기준으로 입력해 주세요." },
      { key: "ownerTime", label: "태어난 시간", type: "time", group: "me", hint: "알면 사주가 조금 더 정교해져요." },
      { key: "species", label: "함께할 친구는?", type: "species", group: "pet", hint: "아직 모르면 강아지 기본 성향으로 먼저 봐요." },
      { key: "pet", label: "펫 생일", type: "date", group: "pet", hint: "보호소·입양 예정이면 비워도 돼요." },
      { key: "petTime", label: "펫 태어난 시간", type: "time", group: "pet", hint: "생일을 아는 경우에만 열려요." },
      { key: "petName", label: "펫 이름", type: "text", group: "pet", placeholder: "예: 두부", hint: "결과에 이름으로 불러 줘요. 없어도 괜찮아요." },
    ],
  },
  style: {
    title: "보호자 스타일",
    blurb: "세 질문으로 가볍게 알아봐요.",
    why: "정답이 있는 질문이 아니에요. 펫과 살 때 드러나는 내 리듬을 세 가지로 나눠 봐요.",
    required: true,
    art: "/assets/webp/mode-style.webp",
    formArt: "/assets/webp/mode-style.webp",
    badge: "꼭 보기",
    submit: "내 스타일 보기",
    fields: [],
  },
  lifestyle: {
    title: "생활 준비",
    blurb: "시간·활동·루틴이 이 친구와 맞는지 살펴봐요.",
    why: "하루에 얼마나 함께할 수 있는지, 어떤 활동을 좋아하는지, 돌봄을 어떻게 만드는지 봐요.",
    required: true,
    art: "/assets/webp/mode-lifestyle.webp",
    formArt: "/assets/webp/mode-lifestyle.webp",
    badge: "꼭 보기",
    submit: "생활 준비 보기",
    fields: [],
  },
  dogcat: {
    title: "강아지와 고양이",
    blurb: "나와 더 맞는 쪽을 점수로 비교해요.",
    why: "같은 내 생일로 강아지와 고양이를 나란히 봐요. 후보 생일을 몰라도 종 기본 성향으로 먼저 비교해요.",
    required: false,
    art: "/assets/webp/mode-dogcat.webp",
    formArt: "/assets/webp/mode-dogcat.webp",
    badge: "더 보기",
    submit: "비교 결과 보기",
    fields: [
      { key: "owner", label: "내 생일", type: "date", required: true, group: "me", hint: "양력 기준으로 입력해 주세요." },
      { key: "ownerTime", label: "태어난 시간", type: "time", group: "me", hint: "알면 비교가 조금 더 정교해져요." },
      { key: "dog", label: "강아지 생일", type: "date", group: "dog", hint: "모르면 강아지 기본 성향으로 추정해요." },
      { key: "cat", label: "고양이 생일", type: "date", group: "cat", hint: "모르면 고양이 기본 성향으로 추정해요." },
    ],
  },
  triangle: {
    title: "세 식구",
    blurb: "두 사람과 펫, 어디서 어긋나는지 한눈에.",
    why: "사람끼리, 그리고 각 사람과 펫 사이. 세 관계 중 어디가 약한지 봐요.",
    required: false,
    art: "/assets/webp/mode-triangle.webp",
    formArt: "/assets/webp/mode-triangle.webp",
    badge: "더 보기",
    submit: "세 식구 보기",
    fields: [
      { key: "a", label: "생일", type: "date", required: true, group: "a", hint: "양력 기준이에요." },
      { key: "aTime", label: "태어난 시간", type: "time", group: "a" },
      { key: "b", label: "생일", type: "date", required: true, group: "b", hint: "양력 기준이에요." },
      { key: "bTime", label: "태어난 시간", type: "time", group: "b" },
      { key: "species", label: "함께할 친구는?", type: "species", group: "pet", hint: "아직 모르면 강아지 기본 성향으로 먼저 봐요." },
      { key: "pet", label: "펫 생일", type: "date", group: "pet", hint: "모르면 고른 종의 기본 성향으로 추정해요." },
      { key: "petTime", label: "펫 태어난 시간", type: "time", group: "pet" },
      { key: "petName", label: "펫 이름", type: "text", group: "pet", placeholder: "예: 두부" },
    ],
  },
};

function isTestId(value: string): value is TestId {
  return ALL_TESTS.includes(value as TestId);
}

type Route =
  | { view: "home"; id: string; testId: null }
  | { view: "hub"; id: string; testId: null }
  | { view: "form"; id: string; testId: TestId }
  | { view: "mid"; id: string; testId: TestId }
  | { view: "harmony"; id: string; testId: null };

function parseHash(): Route {
  if (typeof window === "undefined") return { view: "home", id: "", testId: null };
  const h = location.hash || "";
  const result = /^#\/result\/([\w-]+)$/.exec(h);
  if (result) return { view: "harmony", id: result[1], testId: null };
  const hub = /^#\/hub\/([\w-]+)$/.exec(h);
  if (hub) return { view: "hub", id: hub[1], testId: null };
  const test = /^#\/test\/([\w-]+)\/([\w-]+)$/.exec(h);
  if (test && isTestId(test[2])) return { view: "form", id: test[1], testId: test[2] };
  const mid = /^#\/mid\/([\w-]+)\/([\w-]+)$/.exec(h);
  if (mid && isTestId(mid[2])) return { view: "mid", id: mid[1], testId: mid[2] };
  return { view: "home", id: "", testId: null };
}

function scoreColor(n: number) {
  if (n >= 70) return "#059669";
  if (n >= 40) return "#ea580c";
  return "#dc2626";
}

function fieldIcon(type: string) {
  if (type === "date") return <Calendar size={16} strokeWidth={2} />;
  if (type === "time") return <Clock size={16} strokeWidth={2} />;
  if (type === "species") return <PawPrint size={16} strokeWidth={2} />;
  return <Users size={16} strokeWidth={2} />;
}

type PaypalNs = {
  Buttons: (opts: {
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
  }) => { render: (el: HTMLElement) => Promise<void> };
};

function loadPaypalSdk(src: string) {
  const existing = document.querySelector<HTMLScriptElement>("script[data-paypal-sdk]");
  if (existing && (window as unknown as { paypal?: PaypalNs }).paypal) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("paypal")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.paypalSdk = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("paypal"));
    document.head.appendChild(script);
  });
}

export function PetAudition() {
  const [route, setRoute] = useState<Route>({ view: "home", id: "", testId: null });
  const [session, setSession] = useState<AuditionSession | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [skipped, setSkipped] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState("");
  const [shareNote, setShareNote] = useState("");
  const [scope, setScope] = useState<"life" | "today" | "month" | "year">("life");
  const [paymentReady, setPaymentReady] = useState(false);
  const paypalTips = useRef<HTMLDivElement>(null);
  const paypalPdf = useRef<HTMLDivElement>(null);
  const renderedPayPal = useRef({ tips: false, pdf: false });

  const view = route.view;
  const resultId = route.id;
  const testId = route.testId;
  const result = session?.harmony || (view === "harmony" ? loadResult(resultId) : null);
  const doneCount = session ? requiredCount(session) : 0;
  const ready = session ? requiredReady(session) : false;
  const upcoming = session ? nextRequired(session) : "saju";

  const go = (hash: string) => {
    if (location.hash === hash) setRoute(parseHash());
    else location.hash = hash;
  };

  const persist = (next: AuditionSession) => {
    saveSession(next);
    setSession(next);
  };

  const startAudition = () => {
    const existingId = loadCurrentId();
    const existing = existingId ? loadSession(existingId) : null;
    const next = existing || emptySession(uid());
    persist(next);
    const first = nextRequired(next) || "saju";
    if (requiredReady(next)) go("#/hub/" + next.resultId);
    else {
      setValues(prefill(next, first));
      setSkipped({});
      setNotice("");
      go(`#/test/${next.resultId}/${first}`);
    }
  };

  const openHub = () => {
    const existingId = loadCurrentId();
    const existing = existingId ? loadSession(existingId) : null;
    const next = existing || emptySession(uid());
    persist(next);
    go("#/hub/" + next.resultId);
  };

  const openTest = (id: TestId) => {
    if (!session) return;
    setValues(prefill(session, id));
    setSkipped({});
    setNotice("");
    go(`#/test/${session.resultId}/${id}`);
  };

  const openHarmony = () => {
    if (!session) return;
    if (!requiredReady(session)) {
      setNotice("꼭 볼 세 가지가 아직 남았어요.");
      go("#/hub/" + session.resultId);
      return;
    }
    const composed = composeFromSession(session);
    if ("error" in composed) {
      setNotice(composed.error);
      return;
    }
    const next = { ...session, harmony: composed };
    persist(next);
    go("#/result/" + session.resultId);
  };

  const skipOptional = (id: TestId) => {
    if (!session) return;
    persist({
      ...session,
      tests: { ...session.tests, [id]: { status: "skipped", input: session.tests[id]?.input || {} } },
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !testId) return;
    const out = computeTest(testId, values);
    if ("error" in out) {
      setNotice(out.error);
      return;
    }
    const next: AuditionSession = {
      ...session,
      tests: { ...session.tests, [testId]: { status: "done", input: values } },
      shared: mergeShared(session.shared, testId, values),
    };
    persist(next);
    go(`#/mid/${next.resultId}/${testId}`);
  };

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (!resultId) {
      const current = loadCurrentId();
      if (current) setSession(loadSession(current));
      return;
    }
    const local = loadSession(resultId);
    if (local) {
      setSession(local);
      if (view === "form" && testId) setValues(prefill(local, testId));
      if (view === "harmony" && !local.harmony && !requiredReady(local)) {
        go("#/hub/" + resultId);
      }
      return;
    }
    if (view !== "harmony") return;
    const cached = loadResult(resultId);
    if (cached) setSession({ ...emptySession(resultId), harmony: cached });
    fetchResult(resultId).then((remote) => {
      if (!remote) return;
      setSession((prev) => {
        const base = prev && prev.resultId === resultId ? prev : emptySession(resultId);
        const next = { ...base, harmony: remote };
        saveSession(next);
        return next;
      });
    });
  }, [resultId, view, testId]);

  useEffect(() => {
    if (view !== "harmony" || !resultId) return;
    let cancelled = false;
    renderedPayPal.current = { tips: false, pdf: false };
    (async () => {
      const cfg = await fetch("/api/paypal-config")
        .then((r) => r.json())
        .catch(() => ({ clientId: "" }));
      if (cancelled) return;
      if (!cfg.clientId) {
        setPaymentReady(false);
        return;
      }
      setPaymentReady(true);
      const src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(cfg.clientId)}&currency=USD&intent=capture`;
      try {
        await loadPaypalSdk(src);
      } catch {
        return;
      }
      if (cancelled) return;
      const paypal = (window as unknown as { paypal?: PaypalNs }).paypal;
      if (!paypal?.Buttons) return;
      const current = loadSession(resultId) || session;
      const harmony = current?.harmony;
      const mount = (product: "tips" | "pdf", el: HTMLDivElement | null) => {
        if (!el) return;
        if (product === "tips" && (renderedPayPal.current.tips || harmony?.unlocked)) return;
        if (product === "pdf" && (renderedPayPal.current.pdf || harmony?.pdfPaid)) return;
        if (product === "tips") renderedPayPal.current.tips = true;
        else renderedPayPal.current.pdf = true;
        el.innerHTML = "";
        paypal
          .Buttons({
            createOrder: async () => {
              const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resultId, product }),
              });
              const body = await res.json();
              if (!res.ok) throw new Error(body.error || "order");
              return body.orderId as string;
            },
            onApprove: async (data) => {
              const res = await fetch("/api/capture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resultId, product, orderId: data.orderID }),
              });
              if (!res.ok) return;
              const remote = await fetchResult(resultId);
              setSession((prev) => {
                const base = prev || emptySession(resultId);
                const nextHarmony = {
                  ...(remote || base.harmony || ({} as HarmonyResult)),
                  unlocked: product === "pdf" || product === "tips" || remote?.unlocked || base.harmony?.unlocked,
                  pdfPaid: product === "pdf" || remote?.pdfPaid || base.harmony?.pdfPaid,
                };
                const next = { ...base, harmony: nextHarmony };
                saveResultLocal(resultId, nextHarmony);
                saveSession(next);
                return next;
              });
            },
          })
          .render(el)
          .catch(() => {});
      };
      if (!harmony?.unlocked) mount("tips", paypalTips.current);
      if (!harmony?.pdfPaid) mount("pdf", paypalPdf.current);
    })();
    return () => {
      cancelled = true;
    };
  }, [view, resultId, result?.unlocked, result?.pdfPaid]);

  const midResult = useMemo(() => {
    if (view !== "mid" || !session || !testId) return null;
    const input = session.tests[testId]?.input;
    if (!input) return null;
    const out = computeTest(testId, input);
    return "error" in out ? null : out;
  }, [view, session, testId]);

  const scores = ((view === "harmony" ? result?.free.scores : midResult?.free.scores) as { label: string; score: number; note?: string }[]) || [];

  const scopeScore = useMemo(() => {
    if (!result?.free.harmonyDetail) return null;
    const d = result.free.harmonyDetail as { total: number; petElement: string };
    const now = new Date();
    if (scope === "today") return { label: "오늘의 흐름", score: todayIndex(d.total, d.petElement, now), tip: "오늘은 산책·놀이·휴식 중 어떤 활동이 더 잘 맞는지 참고해보세요." };
    if (scope === "month") return { label: "이번 달 흐름", score: todayIndex(d.total, d.petElement, new Date(now.getFullYear(), now.getMonth(), 1)), tip: "이번 달은 루틴을 조정할 때 참고할 수 있어요." };
    if (scope === "year") return { label: "올해 흐름", score: todayIndex(d.total, d.petElement, new Date(now.getFullYear(), 0, 1)), tip: "올해의 큰 방향을 보는 참고값이에요." };
    return { label: "평생 흐름", score: d.total, tip: "사주와 생활을 바탕으로 본 기본 조화도예요." };
  }, [result, scope]);

  const nextAfterMid = session ? nextRequired(session) : null;
  const progressLabel = session ? `꼭 보기 ${requiredCount(session)} / 3` : "꼭 보기 0 / 3";

  return (
    <>
      <div className="page-bg" aria-hidden>
        <img className="page-bg-paper" src="/assets/webp/paper-hanji.webp" alt="" />
        <img className="page-bg-window" src="/assets/webp/bg-window.webp" alt="" />
        <img className="page-bg-plant" src="/assets/webp/deco-plant.webp" alt="" />
      </div>
      <div className="wrap">
        <header className="site-header">
          <a
            className="brand"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              location.hash = "";
              setRoute({ view: "home", id: "", testId: null });
            }}
          >
            <span className="brand-mark" aria-hidden>
              <PawPrint size={18} strokeWidth={2.2} />
            </span>
            <span>
              <strong>펫과나</strong>
              <small>우리 집 조화도</small>
            </span>
          </a>
          <nav className="site-nav" aria-label="주요 메뉴">
            <button type="button" className={view === "home" ? "on" : ""} onClick={() => go("")}>
              홈
            </button>
            <button type="button" className={view === "hub" || view === "form" || view === "mid" ? "on" : ""} onClick={openHub}>
              전체
            </button>
            <button
              type="button"
              className={view === "harmony" ? "on" : ""}
              onClick={() => {
                if (ready) openHarmony();
                else openHub();
              }}
            >
              조화도
            </button>
          </nav>
        </header>

        {view === "home" && (
          <section>
            <div className="home-hero">
              <div className="hero-copy">
                <span className="eyebrow">3분이면 점수</span>
                <h1>우리 집 강아지·고양이, 잘 맞을까요?</h1>
                <p className="lead">생일만 있으면 바로 볼 수 있어요. 가입 없이, 점수는 무료예요.</p>
                <div className="hero-meta">
                  <span>바로 시작</span>
                  <span>무료 점수</span>
                  <span>결제는 나중에</span>
                </div>
                <button className="hero-cta" type="button" onClick={startAudition}>
                  {session && doneCount > 0 ? `이어서 하기 · ${progressLabel}` : "바로 해보기"}
                  <span aria-hidden> →</span>
                </button>
                <p className="hero-sub">사주 · 스타일 · 생활 세 가지면 조화도까지</p>
              </div>
              <div className="hero-art" aria-hidden>
                <div className="hero-art-glow" />
                <picture>
                  <img src="/assets/webp/pet-harmony-hero.webp" alt="" />
                </picture>
              </div>
            </div>
            <section className="sample-preview">
              <div className="sample-copy">
                <span className="eyebrow">미리보기</span>
                <h2>끝나면 점수가 나와요</h2>
                <p>중간마다 짧게 보고, 마지막에 한눈에. 가입은 없어요.</p>
                <img className="sample-art" src="/assets/webp/sample-family.webp" alt="" />
              </div>
              <div className="sample-score">
                <span>조화도 샘플</span>
                <strong>
                  82<span>점</span>
                </strong>
                <div className="sample-meter">
                  <i />
                </div>
                <b>사주 · 스타일 · 생활을 이은 점수</b>
                <small>평생 / 오늘 / 이번 달 / 올해 흐름도 여기서 봐요</small>
              </div>
            </section>
            <section className="what-you-get">
              <div className="what-you-get-heading">
                <span className="eyebrow">하는 법</span>
                <h2>세 번만 답하면 끝</h2>
                <p>생일, 나와 펫의 리듬, 하루 루틴. 그다음 점수가 열려요.</p>
              </div>
              <div className="journey-grid">
                <div className="journey-item">
                  <img src="/assets/webp/journey-look.webp" alt="" />
                  <b>1</b>
                  <strong>세 가지 보기</strong>
                  <span>사주 케미, 보호자 스타일, 생활 준비를 하나씩 짧게</span>
                </div>
                <div className="journey-item">
                  <img src="/assets/webp/sample-family.webp" alt="" />
                  <b>2</b>
                  <strong>조화도</strong>
                  <span>세 가지를 이은 우리 집 점수와 기간별 흐름</span>
                </div>
                <div className="journey-item">
                  <img src="/assets/webp/pay-pdf.webp" alt="" />
                  <b>3</b>
                  <strong>한 장으로</strong>
                  <span>상세 팁과 사진 리포트는 조화도가 열린 뒤에만</span>
                </div>
              </div>
              <div className="price-cards">
                <div className="price-card">
                  <img src="/assets/webp/pay-free.webp" alt="" />
                  <b>무료 점수</b>
                  <strong>$0</strong>
                  <span>총점과 한줄. 가입 없이 바로.</span>
                </div>
                <div className="price-card">
                  <img src="/assets/webp/pay-tips.webp" alt="" />
                  <b>케어팁</b>
                  <strong>$0.99</strong>
                  <span>놀이·식사·산책·휴식 + 사주 풀이. 한 번만.</span>
                </div>
                <div className="price-card featured">
                  <img src="/assets/webp/pay-pdf.webp" alt="" />
                  <b>사진 리포트</b>
                  <strong>$3.99</strong>
                  <span>팁 포함. 사진 넣고 한 장으로 간직.</span>
                </div>
              </div>
            </section>
            <div className="trust-strip">
              <span className="trust-icon" aria-hidden>
                <PawPrint size={16} />
              </span>
              <span>
                <strong>입양을 고민 중이라면</strong>
                <br />이 결과는 재미와 참고용이에요. 수의사·입양 상담을 대신하지 않아요.
              </span>
            </div>
          </section>
        )}

        {view === "hub" && session && (
          <section>
            <button className="back" type="button" onClick={() => go("")}>
              <ArrowLeft size={14} /> 홈
            </button>
            <span className="eyebrow">전체</span>
            <h1>무엇을 볼까요</h1>
            <p className="lead form-lead">꼭 볼 세 가지를 마치면 조화도가 열려요. 더 보기는 안 해도 점수가 깎이지 않아요.</p>
            <div className="hub-progress" aria-label={progressLabel}>
              {REQUIRED_TESTS.map((id) => (
                <i key={id} className={isDone(session, id) ? "on" : ""} />
              ))}
              <span>{progressLabel}</span>
            </div>
            <div className="hub-section">꼭 보기</div>
            <div className="hub-list">
              {REQUIRED_TESTS.map((id) => (
                <HubCard key={id} id={id} session={session} next={upcoming === id} onOpen={openTest} />
              ))}
            </div>
            <div className="hub-section">더 보기 · 안 해도 돼요</div>
            <p className="hub-aside">강아지·고양이 비교와 세 식구는 호기심용이에요. 하면 조화도 보너스가 조금 붙어요.</p>
            <div className="hub-list">
              {OPTIONAL_TESTS.map((id) => (
                <HubCard key={id} id={id} session={session} onOpen={openTest} onSkip={skipOptional} />
              ))}
            </div>
            <button
              className={`harmony-cta${ready ? "" : " locked"}`}
              type="button"
              onClick={openHarmony}
            >
              {ready ? (
                <>
                  조화도 보기 <ChevronRight size={18} />
                </>
              ) : (
                <>
                  <Lock size={16} /> 조화도 보기 · 세 가지를 먼저 봐 주세요
                </>
              )}
            </button>
            {notice && <p className="form-tip" role="alert">{notice}</p>}
          </section>
        )}

        {view === "form" && testId && session && (
          <section>
            <div className="form-head">
              <div>
                <button className="back" type="button" onClick={() => session && go("#/hub/" + session.resultId)}>
                  <ArrowLeft size={14} /> 전체
                </button>
                <div className="form-progress" aria-hidden>
                  {TEST_META[testId].required ? (
                    REQUIRED_TESTS.map((id, i) => (
                      <span key={id} className={id === testId ? "current" : isDone(session, id) ? "done" : ""}>
                        {i > 0 ? " · " : ""}
                        {TEST_META[id].title}
                        {isDone(session, id) ? " 완료" : id === testId ? " 지금" : ""}
                      </span>
                    ))
                  ) : (
                    <span className="current">더 보기 · {TEST_META[testId].title}</span>
                  )}
                </div>
                <span className="badge">{TEST_META[testId].badge}</span>
                <h1>{TEST_META[testId].title}</h1>
                <p className="lead form-lead">{TEST_META[testId].why}</p>
              </div>
              <div className="form-art" aria-hidden>
                <img src={TEST_META[testId].formArt} alt="" />
              </div>
            </div>
            <form className="card form-card" onSubmit={submit}>
              <FormFields
                testId={testId}
                values={values}
                setValues={setValues}
                skipped={skipped}
                setSkipped={setSkipped}
                session={session}
              />
              {notice && (
                <p className="form-tip" role="alert">
                  {notice}
                </p>
              )}
              <div className="actions">
                <button type="submit">{TEST_META[testId].submit}</button>
              </div>
            </form>
          </section>
        )}

        {view === "mid" && testId && midResult && session && (
          <section id="view-mid">
            <button className="back" type="button" onClick={() => go(`#/test/${session.resultId}/${testId}`)}>
              <ArrowLeft size={14} /> 다시 입력
            </button>
            <span className="badge">{TEST_META[testId].badge} · {progressLabel}</span>
            <h1>{String(midResult.free.headline)}</h1>
            {midResult.free.estimatedSpecies ? (
              <span className="pill">추정 · {midResult.free.estimatedSpecies === "cat" ? "고양이" : "강아지"} 기본 성향</span>
            ) : null}
            <div className="mid-art" aria-hidden>
              <img src={TEST_META[testId].art} alt="" />
            </div>
            <div className="gauge-row fade-up">
              {scores.map((s) => (
                <Gauge key={s.label} score={s.score} label={s.label} note={s.note} />
              ))}
            </div>
            <p className="score-sub">{String(midResult.free.summary || "")}</p>
            <p className="score-sub" style={{ fontWeight: 600, color: "var(--accent-dark)" }}>
              {String(midResult.free.sajuTeaser || "")}
            </p>
            <p className="upsell-nudge">조화도에서 놀이·식사·산책·휴식을 어떻게 맞출지 열어볼 수 있어요. 점수는 지금 무료예요.</p>
            {notice && (
              <p className="form-tip" role="alert">
                {notice}
              </p>
            )}
            <div className="mid-actions">
              {ready ? (
                <button type="button" onClick={openHarmony}>
                  조화도 보기
                </button>
              ) : (
                <button type="button" onClick={() => nextAfterMid && openTest(nextAfterMid)}>
                  다음으로 · {nextAfterMid ? TEST_META[nextAfterMid].title : ""}
                </button>
              )}
              <button className="secondary" type="button" onClick={() => go("#/hub/" + session.resultId)}>
                전체
              </button>
            </div>
          </section>
        )}

        {view === "harmony" && result && (
          <section id="view-result" style={{ position: "relative" }}>
            <div className="result-confetti" aria-hidden>
              <picture>
                <img src="/assets/webp/pay-free.webp" alt="" />
              </picture>
            </div>
            <button className="back" type="button" onClick={() => go(session ? "#/hub/" + session.resultId : "")}>
              <ArrowLeft size={14} /> 전체
            </button>
            <span className="badge">{result.title}</span>
            <h1>{String(result.free.headline)}</h1>
            {result.free.estimatedSpecies ? (
              <span className="pill">추정 · {result.free.estimatedSpecies === "cat" ? "고양이" : "강아지"} 기본 성향</span>
            ) : null}
            <div className="mix-reveal" aria-label="조화도 구성">
              {(result.free.scores as { label: string; score: number }[]).map((s) => (
                <span className="mix-chip" key={s.label}>
                  <b>{s.label}</b>
                  <em>{s.score}점</em>
                </span>
              ))}
              <span className="mix-chip total">
                <b>합친 조화도</b>
                <em>{(result.free.harmonyDetail as { total?: number } | undefined)?.total ?? ""}점</em>
              </span>
            </div>
            <p className="weight-note">사주 40% · 생활 30% · 스타일 20% · 더 보기 보너스 최대 10%</p>
            <div className="harmony-hero" aria-hidden>
              <img src="/assets/webp/sample-family.webp" alt="" />
            </div>
            {!!(result.free.badges as string[] | undefined)?.length && (
              <div className="badge-row">
                {(result.free.badges as string[]).map((b) => (
                  <span className="pill" key={b}>
                    {b}
                  </span>
                ))}
              </div>
            )}
            <div className="scope-tabs">
              {(["life", "today", "month", "year"] as const).map((s) => (
                <button key={s} type="button" className={scope === s ? "active" : ""} onClick={() => setScope(s)}>
                  {s === "life" ? "평생" : s === "today" ? "오늘" : s === "month" ? "이번 달" : "올해"}
                </button>
              ))}
            </div>
            {scopeScore && (
              <div className="scope-result">
                <span className="scope-label">{scopeScore.label}</span>
                <strong>조화도 {scopeScore.score}점</strong>
                <p>{scopeScore.tip}</p>
              </div>
            )}
            <div id="result-viz" className="fade-up">
              <ScoreStory scores={scores} total={(result.free.harmonyDetail as { total?: number } | undefined)?.total} />
              <div className="gauge-row">
                {scores.map((s) => (
                  <Gauge key={s.label} score={s.score} label={s.label} note={s.note} />
                ))}
              </div>
            </div>
            <p className="score-sub">{String(result.free.summary || "")}</p>
            <p id="result-saju-teaser" className="score-sub" style={{ fontWeight: 600, color: "#c2410c" }}>
              {String(result.free.sajuTeaser || "")}
            </p>
            <div className="share-box">
              <button
                className="secondary"
                type="button"
                onClick={async () => {
                  const url = `${location.origin}${location.pathname}#/result/${resultId}`;
                  try {
                    await navigator.clipboard.writeText(url);
                    setShareNote("링크를 복사했어요.");
                  } catch {
                    setShareNote(url);
                  }
                }}
              >
                결과 링크 복사
              </button>
              {shareNote && <small> {shareNote}</small>}
            </div>
            <div className="locked">
              {result.unlocked && result.paid ? (
                <PaidBlock data={result} />
              ) : (
                <Paywall
                  paymentReady={paymentReady}
                  tipsRef={paypalTips}
                  preview={(result.free.carePreview as { name: string; grade: string; score: number }[] | undefined) || []}
                />
              )}
            </div>
            {!result.pdfPaid && (
              <div className="pdf-actions" id="pdf-offer">
                <div className="final-step">
                  <img className="pay-art" src="/assets/webp/pay-pdf.webp" alt="" />
                  <b>사진 리포트 · $3.99</b>
                  <p>케어팁을 포함하고, 사진을 넣어 한 장으로 남길 수 있어요. 한 번만 · 구독 아님.</p>
                  <label htmlFor="petPhoto">새 가족 사진 업로드 (선택, 결제 전에도 미리 넣기)</label>
                  <input
                    id="petPhoto"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        setSession((prev) => {
                          const base = prev || emptySession(resultId);
                          if (!base.harmony) return prev;
                          const nextResult = { ...base.harmony, photoData: String(reader.result) };
                          const next = { ...base, harmony: nextResult };
                          saveResultLocal(resultId, nextResult);
                          saveSession(next);
                          return next;
                        });
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  {result.photoData && (
                    <div className="photo-preview">
                      <img src={result.photoData} alt="업로드한 펫 사진" />
                    </div>
                  )}
                </div>
                <div ref={paypalPdf} id="paypal-pdf-button" className="paypal-button">
                  {!paymentReady && <span className="payment-status">PayPal만 받아요. 연결되면 바로 결제할 수 있어요.</span>}
                </div>
              </div>
            )}
            {result.pdfPaid && (
              <div className="pdf-actions" id="pdf-offer">
                <div className="final-step">
                  <img className="pay-art" src="/assets/webp/pay-pdf.webp" alt="" />
                  <b>사진을 넣고 우리 이야기를 한 장으로 간직해요</b>
                  <label htmlFor="petPhotoPaid">새 가족 사진 업로드 (선택)</label>
                  <input
                    id="petPhotoPaid"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        setSession((prev) => {
                          const base = prev || emptySession(resultId);
                          if (!base.harmony) return prev;
                          const nextResult = { ...base.harmony, photoData: String(reader.result) };
                          const next = { ...base, harmony: nextResult };
                          saveResultLocal(resultId, nextResult);
                          saveSession(next);
                          return next;
                        });
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  {result.photoData && (
                    <div className="photo-preview">
                      <img src={result.photoData} alt="업로드한 펫 사진" />
                    </div>
                  )}
                </div>
                <button type="button" id="save-pdf" onClick={() => window.print()}>
                  Print / Save as PDF
                </button>
                <div className="email-delivery">
                  <strong>
                    리포트 링크를 이메일로 받을까요? <span>(선택)</span>
                  </strong>
                  <EmailRow resultId={resultId} />
                </div>
              </div>
            )}
            {!result.unlocked && (
              <div className="pay-sticky">
                <span>상세 케어팁</span>
                <strong>$0.99</strong>
                <a href="#paid-lock">이어서</a>
              </div>
            )}
            <p className="disclaimer">
              결과 번호: <span>{resultId}</span>
              <br />
              사주·조화도는 재미와 참고용이에요. 정통 명리·수의사·입양 상담을 대신하지 않습니다. Entertainment only. 결제는 PayPal Checkout입니다.
            </p>
          </section>
        )}
      </div>
      <footer className="site-footer">
        펫과나 · 반려생활을 더 다정하게 <span>© 2026</span>
      </footer>
    </>
  );
}

function FormFields({
  testId,
  values,
  setValues,
  skipped,
  setSkipped,
  session,
}: {
  testId: TestId;
  values: Record<string, string>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  skipped: Record<string, boolean>;
  setSkipped: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  session: AuditionSession;
}) {
  const fields = TEST_META[testId].fields.filter((f) => {
    if (f.key === "petTime" && (!values.pet || skipped.pet)) return false;
    if (testId === "dogcat" && session.shared.owner && (f.key === "owner" || f.key === "ownerTime")) return false;
    if (testId === "triangle" && session.shared.owner && (f.key === "a" || f.key === "aTime")) return false;
    if (testId === "triangle" && session.shared.petName && f.key === "petName") return false;
    return true;
  });
  const groupOrder = [...new Set(fields.map((f) => f.group || "me"))];
  return (
    <>
      {groupOrder.map((gid) => {
        const group = GROUPS[gid] || { title: "", note: "" };
        const items = fields.filter((f) => (f.group || "me") === gid);
        return (
          <div className="form-block" key={gid}>
            {group.title && <h3>{group.title}</h3>}
            {group.note && <p>{group.note}</p>}
            {items.map((f, i) => {
              const next = items[i + 1];
              if (f.type === "date" && next?.type === "time") return null;
              if (f.type === "time" && items[i - 1]?.type === "date") {
                return (
                  <div className="field-pair" key={f.key}>
                    <FieldInput field={items[i - 1]} values={values} setValues={setValues} skipped={skipped} setSkipped={setSkipped} />
                    <FieldInput field={f} values={values} setValues={setValues} skipped={skipped} setSkipped={setSkipped} />
                  </div>
                );
              }
              return <FieldInput key={f.key} field={f} values={values} setValues={setValues} skipped={skipped} setSkipped={setSkipped} />;
            })}
          </div>
        );
      })}
      {testId === "style" && MBTI.map((q) => <Question key={q.key} q={q} values={values} setValues={setValues} />)}
      {testId === "lifestyle" && LIFE.map((q) => <Question key={q.key} q={q} values={values} setValues={setValues} />)}
      {values.petName && (testId === "saju" || testId === "triangle") && (
        <p className="name-preview">{values.petName}와 나의 어울림을 볼 거예요.</p>
      )}
    </>
  );
}

function FieldInput({
  field,
  values,
  setValues,
  skipped,
  setSkipped,
}: {
  field: Field;
  values: Record<string, string>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  skipped: Record<string, boolean>;
  setSkipped: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const unknown = !!skipped[field.key];
  if (field.type === "species") {
    return (
      <div className="field-card field-species">
        <div className="field-head">
          <span className="field-icon">{fieldIcon("species")}</span>
          <label>{field.label}</label>
        </div>
        {field.hint && <p className="field-hint">{field.hint}</p>}
        <div className="species-grid">
          {[
            { v: "강아지", label: "강아지", Icon: Dog, hint: "산책·놀이 리듬" },
            { v: "고양이", label: "고양이", Icon: Cat, hint: "실내 교감 리듬" },
            { v: "", label: "아직 몰라요", Icon: CircleHelp, hint: "강아지 기준으로 먼저" },
          ].map((opt) => {
            const on = (values[field.key] || "") === opt.v;
            return (
              <button
                key={opt.label}
                type="button"
                className={`species-opt${on ? " on" : ""}`}
                onClick={() => setValues((v) => ({ ...v, [field.key]: opt.v }))}
              >
                <opt.Icon size={20} strokeWidth={2} />
                <strong>{opt.label}</strong>
                <em>{opt.hint}</em>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <div className={`field-card field-${field.type}`}>
      <div className="field-head">
        <span className="field-icon">{fieldIcon(field.type)}</span>
        <label htmlFor={field.key}>
          {field.label}
          {field.required ? <i>필수</i> : <i>선택</i>}
        </label>
      </div>
      {field.hint && <p className="field-hint">{field.hint}</p>}
      {field.type === "date" && !field.required && (
        <div className="mode-toggle">
          <button
            type="button"
            className={!unknown ? "on" : ""}
            onClick={() => setSkipped((s) => ({ ...s, [field.key]: false }))}
          >
            생일을 알아요
          </button>
          <button
            type="button"
            className={unknown ? "on" : ""}
            onClick={() => {
              setSkipped((s) => ({ ...s, [field.key]: true }));
              setValues((v) => ({ ...v, [field.key]: "", ...(field.key === "pet" ? { petTime: "" } : {}) }));
            }}
          >
            생일을 몰라요
          </button>
        </div>
      )}
      {!(field.type === "date" && !field.required && unknown) && (
        <input
          id={field.key}
          type={field.type}
          value={values[field.key] || ""}
          required={!!field.required}
          placeholder={field.placeholder}
          min={field.type === "date" ? "1900-01-01" : undefined}
          max={field.type === "date" ? todayISO() : undefined}
          onChange={(e) => {
            if (field.type === "date") setSkipped((s) => ({ ...s, [field.key]: false }));
            setValues((v) => ({ ...v, [field.key]: e.target.value }));
          }}
        />
      )}
      {field.type === "date" && !field.required && unknown && (
        <p className="field-hint on">종 기본 성향으로 추정해서 점수를 내요.</p>
      )}
    </div>
  );
}

function HubCard({
  id,
  session,
  next,
  onOpen,
  onSkip,
}: {
  id: TestId;
  session: AuditionSession;
  next?: boolean;
  onOpen: (id: TestId) => void;
  onSkip?: (id: TestId) => void;
}) {
  const meta = TEST_META[id];
  const done = isDone(session, id);
  const skipped = isSkipped(session, id);
  return (
    <div className={`hub-card-wrap${done ? " done" : ""}${next ? " next" : ""}${skipped ? " skipped" : ""}`}>
      <button className={`hub-card${done ? " done" : ""}${next ? " next" : ""}${skipped ? " skipped" : ""}`} type="button" onClick={() => onOpen(id)}>
        <img src={meta.art} alt="" />
        <span>
          <b>
            {done ? "클리어" : skipped ? "안 함" : next ? "지금" : meta.badge}
          </b>
          <strong>{meta.title}</strong>
          <em>{meta.blurb}</em>
        </span>
        <i>{done ? <Check size={18} /> : skipped ? null : <ChevronRight size={18} />}</i>
      </button>
      {onSkip && !done ? (
        skipped ? (
          <button type="button" className="hub-skip" onClick={() => onOpen(id)}>
            다시 보기
          </button>
        ) : (
          <button
            type="button"
            className="hub-skip"
            onClick={(e) => {
              e.stopPropagation();
              onSkip(id);
            }}
          >
            안 함
          </button>
        )
      ) : null}
    </div>
  );
}

function Question({
  q,
  values,
  setValues,
}: {
  q: { key: string; label: string; hint?: string; options: string[] };
  values: Record<string, string>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  return (
    <div className="ask">
      <p className="ask-label">{q.label}</p>
      {q.hint && <p className="ask-hint">{q.hint}</p>}
      <div className="choice-grid">
        {q.options.map((o) => {
          const [value, text] = o.split("|");
          const on = values[q.key] === value;
          return (
            <button key={value} type="button" className={`choice${on ? " on" : ""}`} onClick={() => setValues((v) => ({ ...v, [q.key]: value }))}>
              {text}
            </button>
          );
        })}
      </div>
      <input type="hidden" name={q.key} value={values[q.key] || ""} />
    </div>
  );
}

function Gauge({ score, label, note }: { score: number; label: string; note?: string }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Number(score) || 0));
  const offset = c * (1 - pct / 100);
  return (
    <div className="gauge">
      <svg viewBox="0 0 100 100" aria-label={`${label} ${pct}점`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#fed7aa" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={scoreColor(pct)} strokeWidth="10" strokeLinecap="round" transform="rotate(-90 50 50)" strokeDasharray={c.toFixed(2)} strokeDashoffset={offset.toFixed(2)} />
        <text x="50" y="54" textAnchor="middle" className="gauge-score-text">
          {pct}
        </text>
      </svg>
      <div className="g-label">{label}</div>
      {note ? <div className="g-note">{note}</div> : null}
    </div>
  );
}

function ScoreStory({ scores, total }: { scores: { label: string; score: number }[]; total?: number }) {
  const main = total != null ? { label: "조화도", score: total } : scores.find((s) => /총점|조화도|종합|케미/.test(s.label)) || scores[0];
  if (!main) return null;
  const score = Math.max(0, Math.min(100, main.score));
  const easy = score >= 80 ? "우리 집과 아주 잘 맞을 가능성이 높아요!" : score >= 60 ? "조금만 맞춰가면 좋은 팀이 될 수 있어요." : "생활 루틴을 먼저 천천히 맞춰보면 좋아요.";
  return (
    <div className="score-story">
      <div className="score-story-top">
        <span>우리 집과의 어울림 점수</span>
        <strong>
          {score}
          <em>점</em>
        </strong>
      </div>
      <div className="big-score-track">
        <i style={{ width: `${score}%` }} />
      </div>
      <b>{easy}</b>
    </div>
  );
}

function Paywall({
  paymentReady,
  tipsRef,
  preview,
}: {
  paymentReady: boolean;
  tipsRef: React.RefObject<HTMLDivElement | null>;
  preview: { name: string; grade: string; score: number }[];
}) {
  const rows = preview.length
    ? preview
    : [
        { name: "놀이", grade: "잠김", score: 0 },
        { name: "식사", grade: "잠김", score: 0 },
        { name: "산책", grade: "잠김", score: 0 },
        { name: "휴식", grade: "잠김", score: 0 },
      ];
  return (
    <div className="cta pay-explain" id="paid-lock">
      <img src="/assets/webp/pay-tips.webp" alt="" />
      <div className="offer-copy">
        <p className="offer-kicker">점수는 봤어요. 맞추는 법은 여기 있어요.</p>
        <h2>우리 집 맞춤 케어팁</h2>
        <p>놀이 · 식사 · 산책 · 휴식과 사주 풀이. 한 번만 내면 이 결과에서 계속 열려요.</p>
        <div className="lock-preview">
          {rows.map((a) => (
            <div className="lock-row" key={a.name}>
              <b>{a.name}</b>
              <em>{a.grade}</em>
              <span className="lock-blur">이 집에서 이렇게 맞추면 좋아요</span>
            </div>
          ))}
        </div>
        <ul className="offer-list">
          <li>네 가지 생활 팁 + 등급</li>
          <li>나와 펫 사주 풀이</li>
          <li>구독 없음 · PayPal 한 번</li>
        </ul>
        <div className="offer-price">
          <strong>$0.99</strong>
          <span>한 번만 · 구독 아님</span>
        </div>
        <div ref={tipsRef} className="paypal-button">
          {!paymentReady && <span className="payment-status">PayPal만 받아요. 연결되면 바로 결제할 수 있어요.</span>}
        </div>
        <a className="offer-alt" href="#pdf-offer">
          사진 리포트 $3.99 · 팁 포함
        </a>
      </div>
    </div>
  );
}

function PaidBlock({ data }: { data: HarmonyResult }) {
  const paid = (data.paid || {}) as {
    areas?: { name: string; tip: string; grade?: string; score?: number }[];
    saju?: { compatTitle?: string; petDesc?: string; ownerDesc?: string; synergyDesc?: string };
  };
  const areas = paid.areas || [];
  const saju = paid.saju;
  return (
    <div className="paid-pack">
      {saju && (
        <div className="paid-saju">
          <img src="/assets/webp/pay-tips.webp" alt="" />
          <div>
            <b>{saju.compatTitle || "사주 풀이"}</b>
            {saju.petDesc && <p>{saju.petDesc}</p>}
            {saju.ownerDesc && <p>{saju.ownerDesc}</p>}
            {saju.synergyDesc && <p>{saju.synergyDesc}</p>}
          </div>
        </div>
      )}
      <div className="paid-areas">
        {areas.map((a) => (
          <div className="paid-area" key={a.name}>
            <span>
              {a.name} · {a.grade}
            </span>
            <strong>{a.score ?? ""}</strong>
            <p>{a.tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmailRow({ resultId }: { resultId: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("최종 리포트 결제 후 사용할 수 있어요.");
  return (
    <>
      <div className="email-row">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일 주소" />
        <button
          type="button"
          className="secondary"
          onClick={async () => {
            const res = await fetch("/api/report-link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resultId, email }) });
            const body = await res.json().catch(() => ({}));
            setStatus(res.ok ? "리포트 링크를 이메일로 보냈어요." : body.error === "email_not_configured" ? "이메일 발송 설정 전이에요." : "이메일을 보내지 못했어요.");
          }}
        >
          링크 보내기
        </button>
      </div>
      <small>{status}</small>
    </>
  );
}
