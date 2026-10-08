import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Play,
  RefreshCw,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { api, Data, Row, dt, rub } from "../lib";
import { MechanismCanvas } from "./MechanismCanvas";
import { Trace } from "./Trace";
export const sourceNames: Record<string, string> = {
  "1c": "1С · учёт",
  "yandex-pro": "Яндекс Про",
  fines: "Штрафы ГИБДД",
  telematics: "Телематика",
};
export const statusName = (s: string) =>
  ({
    pending: "Ожидает запуска",
    queued: "В очереди",
    running: "Выполняется",
    done: "Завершено",
    failed: "Ошибка",
    success: "Выполнено",
    error: "Ошибка",
  })[s] || s;
export function SourcesWidget({
  data,
  open,
  go,
}: {
  data: Data;
  open: (r: Row) => void;
  go?: () => void;
}) {
  const q = useQuery({
    queryKey: ["integrations", data.session.role],
    queryFn: () => api("/integrations"),
    enabled: ["owner", "admin", "finance", "manager"].includes(
      data.session.role,
    ),
    refetchInterval: 10000,
  });
  if (!q.data) return null;
  return (
    <div className="uh-panel uh-sources-widget">
      <div className="uh-section-head">
        <div>
          <span className="eyebrow">ИСТОЧНИКИ И СВЕРКА</span>
          <h3>Данные приходят из четырёх систем</h3>
        </div>
        {go && (
          <button className="text-button" onClick={go}>
            Под капотом
            <ArrowUpRight size={14} />
          </button>
        )}
      </div>
      <div className="uh-source-grid">
        {q.data.sources.map((s: any) => (
          <div key={s.id}>
            <strong>{sourceNames[s.id]}</strong>
            <span className={"uh-dot " + (s.status === "done" ? "ok" : "")} />
            <small>
              {s.updated
                ? new Date(s.updated).toLocaleString("ru-RU", {
                    timeZone: "Europe/Moscow",
                  })
                : "Ещё не запускался"}
            </small>
            <small>Учебный источник · {statusName(s.status)}</small>
          </div>
        ))}
      </div>
      {q.data.diffs.length > 0 && (
        <details className="uh-reconcile">
          <summary>
            <AlertTriangle size={15} />
            Сверка: {q.data.diffs.length} расхождений
          </summary>
          {q.data.diffs.slice(0, 20).map((d: any) => (
            <button
              key={d.id}
              onClick={() => {
                const v = data.vehicle.find((v) => v.id === d.vehicle);
                if (v) open(v);
              }}
            >
              <span>
                {d.vehicle_code} · {d.field_label}
                <small>
                  В системе: {d.local} · источник: {d.external}
                </small>
              </span>
              <ArrowUpRight size={15} />
            </button>
          ))}
        </details>
      )}
    </div>
  );
}
export function Integrations({
  data,
  engineer,
  open,
}: {
  data: Data;
  engineer: boolean;
  open: (r: Row) => void;
}) {
  const [source, setSource] = useState("1c");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [selected, setSelected] = useState("");
  const [node, setNode] = useState("");
  const [frame, setFrame] = useState(100);
  const [playing, setPlaying] = useState(false);
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["integrations", data.session.role],
    queryFn: () => api("/integrations"),
    enabled: ["owner", "admin", "finance", "manager"].includes(
      data.session.role,
    ),
    refetchInterval: 3000,
  });
  const runs = (list.data?.runs || []).filter((r: any) => r.source === source);
  const run = runs.find((r: any) => r.id === selected) || runs[0];
  const trace = run?.data?.trace || [];
  const workflow = list.data?.workflows?.[source];
  useEffect(() => {
    if (!playing) return;
    if (frame >= trace.length) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setFrame((n) => n + 1), 650);
    return () => clearTimeout(timer);
  }, [playing, frame, trace.length]);
  async function launch() {
    setPending(true);
    setError("");
    try {
      const r = await api("/integrations/run", {
        method: "POST",
        body: JSON.stringify({ source }),
      });
      setSelected(r.id);
      setFrame(100);
      qc.invalidateQueries({ queryKey: ["integrations"] });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }
  const step = trace.find((s: any) => s.node === node || s.title === node);
  if (!["owner", "admin", "finance", "manager"].includes(data.session.role))
    return (
      <div className="uh-panel">
        <h2>Интеграции доступны сотрудникам</h2>
        <p>
          Выберите роль собственника, менеджера или финансиста в шапке, чтобы
          запускать сверку источников. RAG и агент доступны в текущей роли.
        </p>
      </div>
    );
  return (
    <>
      <SourcesWidget data={data} open={open} />
      <div className="uh-integration-picker">
        {Object.entries(sourceNames).map(([id, name]) => (
          <button
            key={id}
            className={source === id ? "active" : ""}
            onClick={() => {
              setSource(id);
              setSelected("");
              setFrame(100);
              setPlaying(false);
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="uh-panel">
        <div className="uh-section-head">
          <div>
            <span className="eyebrow">
              РЕАЛЬНЫЙ WORKFLOW N8N · УЧЕБНЫЙ ИСТОЧНИК
            </span>
            <h2>{sourceNames[source]}</h2>
          </div>
          <button
            className="button primary"
            disabled={pending || run?.status === "running" || !navigator.onLine}
            onClick={launch}
          >
            <Play size={16} />
            {pending ? "Запускаем…" : "Запустить"}
          </button>
        </div>
        <p className="muted">
          {engineer
            ? "Вебхук n8n → HTTP → нормализация → подписанный пакет → транзакционный ingest. Трасса получена из реального исполнения n8n."
            : "Источник передаёт данные, система проверяет их и показывает отличия от своего учёта. Повторный запуск не создаёт дубликаты."}
        </p>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {list.error && <p className="error">{list.error.message}</p>}
        {workflow && (
          <MechanismCanvas
            nodes={workflow.nodes.map((n: any) => ({
              ...n,
              state: trace.slice(0, frame).find((s: any) => s.node === n.id)
                ?.status,
            }))}
            edges={workflow.edges}
            selected={node}
            onSelect={setNode}
          />
        )}
        <div className="uh-section-head">
          <span className="muted">
            {run
              ? "Исполнение #" +
                (run.execution_id || "ожидается") +
                " · " +
                statusName(run.status)
              : "Запустите процесс, чтобы увидеть настоящее исполнение"}
          </span>
          <button
            className="button secondary small"
            disabled={!trace.length || playing}
            onClick={() => {
              setFrame(0);
              setPlaying(true);
            }}
          >
            <RefreshCw size={14} />
            Проиграть по узлам
          </button>
        </div>
        {step && (
          <div className="uh-node-detail">
            <strong>{step.title}</strong>
            <p>
              {step.ms} мс · {step.items ?? 0} записей ·{" "}
              {statusName(step.status)}
            </p>
            {engineer && <pre>{JSON.stringify(step.output, null, 2)}</pre>}
          </div>
        )}
        {run?.data?.error && <p className="error">{run.data.error}</p>}
      </div>
      <div className="uh-panel">
        <h3>История запусков</h3>
        {!runs.length && (
          <p className="muted">История появится после первого запуска.</p>
        )}
        <div className="uh-runs">
          {runs.map((r: any) => (
            <button
              key={r.id}
              className={run?.id === r.id ? "active" : ""}
              onClick={() => {
                setSelected(r.id);
                setFrame(100);
                setPlaying(false);
              }}
            >
              <span>
                {new Date(r.started).toLocaleString("ru-RU", {
                  timeZone: "Europe/Moscow",
                })}
              </span>
              <strong data-status={r.status}>{statusName(r.status)}</strong>
              <small>
                n8n #{r.execution_id || "—"} · {r.data.rows ?? 0} строк ·{" "}
                {r.data.diffs ?? 0} расхождений
              </small>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
