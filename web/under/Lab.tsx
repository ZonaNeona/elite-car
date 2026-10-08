import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Send,
  Sparkles,
  FileText,
  CheckCircle2,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { api, Data } from "../lib";
import { Trace } from "./Trace";
export function Drafts({
  drafts,
  onConfirmed,
}: {
  drafts: any[];
  onConfirmed?: () => void;
}) {
  const [status, setStatus] = useState<Record<string, string>>({});
  const q = useQueryClient();
  async function confirm(d: any) {
    setStatus((v) => ({ ...v, [d.id]: "Обработка…" }));
    try {
      const r = await api("/under/drafts/" + d.id + "/confirm", {
        method: "POST",
        body: "{}",
      });
      setStatus((v) => ({ ...v, [d.id]: "Создана заявка " + r.code }));
      q.invalidateQueries({ queryKey: ["bootstrap"] });
      onConfirmed?.();
    } catch (e: any) {
      setStatus((v) => ({ ...v, [d.id]: e.message }));
    }
  }
  return (
    <>
      {drafts.map((d) => (
        <div className="uh-draft" key={d.id}>
          <span className="eyebrow">
            {status[d.id]?.startsWith("Создана")
              ? "ЗАЯВКА СОЗДАНА"
              : "ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ"}
          </span>
          <h3>{d.payload.title}</h3>
          <p>
            {d.vehicle_code} · {d.payload.description}
          </p>
          <small>
            {status[d.id]?.startsWith("Создана")
              ? "Обращение сохранено в вашей сессии."
              : "Черновик действует 10 минут. Заявка ещё не создана."}
          </small>
          <button
            className="button primary"
            disabled={
              status[d.id] === "Обработка…" ||
              status[d.id]?.startsWith("Создана") ||
              !navigator.onLine
            }
            onClick={() => confirm(d)}
          >
            <CheckCircle2 size={16} />
            Подтвердить создание заявки
          </button>
          {status[d.id] && <p role="status">{status[d.id]}</p>}
        </div>
      ))}
    </>
  );
}
export function Lab({
  mode,
  data,
  engineer,
}: {
  mode: "rag" | "agent";
  data: Data;
  engineer: boolean;
}) {
  const [prompt, setPrompt] = useState("");
  const [job, setJob] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const kb = useQuery({
    queryKey: ["under-kb"],
    queryFn: () => api("/under/kb"),
    enabled: mode === "rag",
  });
  const result = useQuery({
    queryKey: ["under-job", job, data.session.role],
    queryFn: () => api("/jobs/" + job),
    enabled: !!job,
    refetchInterval: (q) =>
      ["done", "failed"].includes((q.state.data as any)?.state) ? false : 1200,
  });
  const busy =
    pending || (!!job && !["done", "failed"].includes(result.data?.state));
  const r = result.data?.result;
  async function run() {
    setError("");
    setPending(true);
    setJob("");
    try {
      const j = await api("/under/" + mode, {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });
      setJob(j.id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }
  const suggestions =
    mode === "rag"
      ? [
          "Какие документы нужны водителю?",
          "Кто согласует расходы на ремонт?",
          "Как вернуть залог?",
          "Как приготовить борщ?",
        ]
      : [
          "Сколько я должен?",
          "Какие машины в ремонте дольше недели?",
          "Какие 3 машины дают самый низкий результат и почему?",
          "Стучит подвеска. Подготовь заявку по моей машине.",
        ];
  return (
    <div className="uh-lab">
      <div>
        <div className="uh-panel">
          <span className="eyebrow">
            {mode === "rag"
              ? "ОТ ВОПРОСА К ДОКАЗАТЕЛЬСТВУ"
              : "ОТ ВОПРОСА К ДЕЙСТВИЮ"}
          </span>
          <h2>
            {mode === "rag"
              ? "Найдём ответ в правилах"
              : "Поручите задачу помощнику"}
          </h2>
          <p className="muted">
            {mode === "rag"
              ? "Поиск понимает смысл, находит фрагменты и передаёт их модели. Вы видите весь путь."
              : "Модель сама выбирает инструменты. Каждый вызов проверяется на сервере от имени вашей роли."}
          </p>
          <div className="uh-suggestions">
            {suggestions.map((s) => (
              <button key={s} onClick={() => setPrompt(s)}>
                {s}
              </button>
            ))}
          </div>
          <label className="uh-question">
            Ваш вопрос
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Напишите своими словами…"
            />
          </label>
          <div className="uh-section-head">
            <span className="muted">
              Роль: {data.session.roles[data.session.role]}
            </span>
            <button
              className="button primary"
              disabled={busy || prompt.trim().length < 2 || !navigator.onLine}
              onClick={run}
            >
              {busy ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <Send size={16} />
              )}{" "}
              {busy ? "Выполняется…" : "Запустить"}
            </button>
          </div>
          {(error || result.error) && (
            <p className="error" role="alert">
              {error || result.error?.message}
            </p>
          )}
          {result.data?.state === "failed" && (
            <p className="error">{r.error}</p>
          )}
          {busy && (
            <div className="uh-processing">
              <span className="pulse-dot" />
              Задание в очереди · страница получит реальный результат
              автоматически
            </div>
          )}
        </div>
        {r && result.data?.state === "done" && (
          <div className="uh-panel uh-answer">
            <span className="eyebrow">
              <Sparkles size={14} /> РЕЗУЛЬТАТ
            </span>
            <p className="uh-answer-text">{r.answer}</p>
            {r.sources?.map((s: any, i: number) => (
              <a
                className="uh-source"
                key={i}
                href={s.url || undefined}
                target={s.url ? "_blank" : undefined}
                rel="noreferrer"
              >
                <FileText size={15} />
                <span>
                  {s.title}
                  <small>
                    Версия {s.version} ·{" "}
                    {s.kind === "demo"
                      ? "учебный регламент"
                      : "публичный источник"}
                  </small>
                </span>
              </a>
            ))}
            <div className="uh-meta">
              {r.model} · {r.tokens || 0} токенов · $
              {Number(r.cost || 0).toFixed(6)}
            </div>
            <Drafts drafts={r.drafts || []} />
          </div>
        )}
        {r?.trace && (
          <div className="uh-panel">
            <Trace steps={r.trace} engineer={engineer} />
          </div>
        )}
      </div>
      <aside>
        {mode === "rag" ? (
          <>
            <div className="uh-panel">
              <span className="eyebrow">БАЗА ЗНАНИЙ</span>
              <div className="uh-metrics">
                <div>
                  <strong>{kb.data?.documents.length ?? "—"}</strong>
                  <span>документов</span>
                </div>
                <div>
                  <strong>{kb.data?.vectors ?? "—"}</strong>
                  <span>векторов</span>
                </div>
                <div>
                  <strong>384</strong>
                  <span>измерения</span>
                </div>
              </div>
              <small className="muted">
                Эмбеддинги локально · PostgreSQL + pgvector
              </small>
              <div className="uh-docs">
                {kb.data?.documents.map((d: any) => (
                  <details key={d.id}>
                    <summary>{d.title}</summary>
                    <p>
                      {d.chunks} фрагментов · {d.version} ·{" "}
                      {d.kind === "public"
                        ? "публичный источник"
                        : "учебное правило"}
                    </p>
                    {d.url && (
                      <a href={d.url} target="_blank" rel="noreferrer">
                        Открыть источник ↗
                      </a>
                    )}
                  </details>
                ))}
              </div>
            </div>
            {r?.chunks && (
              <div className="uh-panel">
                <h3>Найденные фрагменты</h3>
                {r.chunks.map((c: any, i: number) => (
                  <details className="uh-chunk" key={c.id} open={i === 0}>
                    <summary>
                      {i + 1}. {c.title}
                    </summary>
                    <p>{c.text}</p>
                    <div className="uh-score">
                      <span
                        style={{ width: Math.max(0, c.cosine * 100) + "%" }}
                      />
                    </div>
                    <small>
                      Cosine {c.cosine.toFixed(3)} · RRF {c.rrf.toFixed(4)}
                      {engineer &&
                        ` · vector #${c.vector_rank ?? "—"} / FTS #${c.fts_rank ?? "—"}`}
                    </small>
                  </details>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="uh-panel uh-permissions">
            <ShieldCheck size={28} />
            <h3>Права проверяет код</h3>
            <p>
              Переключите роль в шапке и задайте тот же вопрос. Инструмент
              получает только доступные этой роли объекты.
            </p>
            <p>
              Создание заявки проходит через черновик. Списания, изменение
              договора и согласование ремонта агенту недоступны.
            </p>
            <div className="uh-tool-list">
              {[
                "get_balance",
                "list_vehicles",
                "vehicle_economics",
                "find_contract",
                "search_knowledge",
                "create_ticket → черновик",
              ].map((t) => (
                <code key={t}>{t}</code>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
