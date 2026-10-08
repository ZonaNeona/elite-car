import { useEffect, useState } from "react";
import { Check, Play, AlertTriangle, Clock3 } from "lucide-react";
export type Step = {
  step: string;
  title: string;
  ms?: number;
  output?: any;
  arguments?: any;
  status?: string;
  model?: string;
  cost?: string;
  tokens?: number;
};
export function Trace({
  steps,
  engineer = false,
}: {
  steps: Step[];
  engineer?: boolean;
}) {
  const [position, setPosition] = useState(steps.length);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    setPosition(steps.length);
    setPlaying(false);
  }, [steps]);
  useEffect(() => {
    if (!playing) return;
    if (position >= steps.length) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setPosition((n) => n + 1), 500);
    return () => clearTimeout(timer);
  }, [playing, position, steps.length]);
  return (
    <section className="uh-trace">
      <div className="uh-section-head">
        <h3>Трасса выполнения</h3>
        <button
          className="button secondary small"
          disabled={!steps.length || playing}
          onClick={() => {
            setPosition(0);
            setPlaying(true);
          }}
        >
          <Play size={13} />
          Воспроизвести
        </button>
      </div>
      <p className="muted">
        Проигрывание сохранённого исполнения. Время и результаты — из реальных
        вызовов.
      </p>
      <ol>
        {steps.map((s, i) => (
          <li
            key={i}
            className={
              (i < position ? "visible" : "waiting") +
              " " +
              (["denied", "error", "failed"].includes(s.status || "")
                ? "denied"
                : "")
            }
          >
            <span className="uh-step-dot">
              {i < position ? (
                ["denied", "error", "failed"].includes(s.status || "") ||
                s.step === "fallback" ? (
                  <AlertTriangle size={14} />
                ) : (
                  <Check size={14} />
                )
              ) : (
                i + 1
              )}
            </span>
            <div>
              <div className="uh-step-title">
                <strong>{s.title}</strong>
                <small>
                  <Clock3 size={12} />
                  {s.ms ?? 0} мс
                </small>
              </div>
              {s.model && (
                <small className="muted">
                  {s.model} · {s.tokens ?? 0} токенов · ${s.cost ?? "—"}
                </small>
              )}
              {s.status === "denied" && (
                <p className="negative">
                  Проверка доступа или аргументов отклонила вызов
                </p>
              )}
              {engineer && (
                <details>
                  <summary>Аргументы и результат</summary>
                  <pre>
                    {JSON.stringify(
                      { arguments: s.arguments, result: s.output },
                      null,
                      2,
                    )}
                  </pre>
                </details>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
