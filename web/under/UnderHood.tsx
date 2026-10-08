import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Network,
  BookOpen,
  Bot,
  Workflow,
  Activity,
  ArrowUpRight,
  Code2,
  Layers,
} from "lucide-react";
import { api, Data, Row } from "../lib";
import { Lab } from "./Lab";
import { Trace } from "./Trace";
import { MechanismCanvas } from "./MechanismCanvas";
import { Integrations, statusName } from "./Integrations";
import "./under.css";
const tabs = [
  ["map", "Карта системы", Network],
  ["rag", "RAG-песочница", BookOpen],
  ["agent", "Агент", Bot],
  ["integrations", "Интеграции", Workflow],
  ["log", "Журнал", Activity],
] as const;
export function UnderHood({
  data,
  open,
}: {
  data: Data;
  open: (r: Row) => void;
}) {
  const [tab, setTab] = useState("map");
  const [engineer, setEngineer] = useState(false);
  const [selected, setSelected] = useState("agent");
  const map = useQuery({
    queryKey: ["under-map"],
    queryFn: () => api("/under/map"),
  });
  const log = useQuery({
    queryKey: ["under-log", data.session.role],
    queryFn: () => api("/under/log"),
    enabled: tab === "log",
    refetchInterval: tab === "log" ? 5000 : false,
  });
  const node = map.data?.nodes.find((n: any) => n.id === selected);
  return (
    <section className="under">
      <div className="uh-hero">
        <div>
          <span className="eyebrow">
            <Layers size={14} /> ИНЖЕНЕРНАЯ СТОРОНА ПРОДУКТА
          </span>
          <h2>
            Посмотрите, как всё работает<span>.</span>
          </h2>
          <p>
            Задайте вопрос, запустите процесс и проследите путь до результата.
          </p>
        </div>
        <div className="uh-level" role="group" aria-label="Уровень объяснения">
          <button
            aria-pressed={!engineer}
            className={!engineer ? "active" : ""}
            onClick={() => setEngineer(false)}
          >
            Просто
          </button>
          <button
            aria-pressed={engineer}
            className={engineer ? "active" : ""}
            onClick={() => setEngineer(true)}
          >
            <Code2 size={15} />
            Для инженера
          </button>
        </div>
      </div>
      <div className="uh-tabs" role="tablist" aria-label="Под капотом">
        {tabs.map(([id, label, Icon]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>
      {tab === "map" && (
        <div className="uh-map-grid">
          <div className="uh-panel">
            <div className="uh-section-head">
              <h3>Одна система · несколько точек входа</h3>
              <span className="subtle-chip">Нажмите на узел</span>
            </div>
            {map.data && (
              <MechanismCanvas
                nodes={map.data.nodes}
                edges={map.data.edges}
                selected={selected}
                onSelect={setSelected}
              />
            )}
          </div>
          <div className="uh-panel uh-explainer">
            <span className="eyebrow">
              {engineer ? "АРХИТЕКТУРА" : "ПРОСТЫМИ СЛОВАМИ"}
            </span>
            <h2>{node?.title}</h2>
            <p>{engineer ? node?.engineer : node?.simple}</p>
            <button
              className="button primary"
              onClick={() => setTab(node?.tab || "rag")}
            >
              Посмотреть в действии
              <ArrowUpRight size={16} />
            </button>
            {engineer && (
              <div className="uh-code-links">
                <a href="/api/docs" target="_blank" rel="noreferrer">
                  OpenAPI ↗
                </a>
                <a
                  href="https://github.com/ZonaNeona/elite-car/tree/feature/under-hood"
                  target="_blank"
                  rel="noreferrer"
                >
                  Исходный код ↗
                </a>
              </div>
            )}
            <div className="uh-note">
              Действия выполняются в вашей личной демосессии. Внешние источники
              содержат учебные данные.
            </div>
          </div>
        </div>
      )}
      {(tab === "rag" || tab === "agent") && (
        <Lab
          key={tab + data.session.role}
          mode={tab}
          data={data}
          engineer={engineer}
        />
      )}
      {tab === "integrations" && (
        <Integrations data={data} engineer={engineer} open={open} />
      )}
      {tab === "log" && (
        <div className="uh-panel">
          <div className="uh-section-head">
            <h2>События вашей сессии</h2>
            <span className="subtle-chip">
              <i className="pulse-dot" />
              Обновление каждые 5 секунд
            </span>
          </div>
          <p className="muted">
            Вызовы AI показаны для текущей роли. Финансовые и объектные события
            проверяются по правам.
          </p>
          {log.error && <p className="error">{log.error.message}</p>}
          {log.data?.rows.length === 0 && (
            <p className="uh-note">
              Пока пусто. Запустите поиск или интеграцию — здесь появится
              исполнение.
            </p>
          )}
          {log.data?.rows.map((r: any) => (
            <details key={r.id} className="uh-log-row">
              <summary>
                <span className="uh-log-type">
                  {{
                    webhook: "Вебхук",
                    ai: "AI",
                    event: "Событие",
                    n8n: "n8n",
                    integration: "Синхронизация",
                    integration_trace: "Трасса",
                  }[r.type as string] || r.type}
                </span>
                <strong>{r.title}</strong>
                <small>
                  {new Date(r.at).toLocaleTimeString("ru-RU", {
                    timeZone: "Europe/Moscow",
                  })}{" "}
                  МСК · {statusName(r.status)}
                </small>
              </summary>
              {r.error && <p className="error">{r.error}</p>}
              {r.trace?.length > 0 ? (
                <Trace steps={r.trace} engineer={engineer} />
              ) : (
                <p className="muted">
                  {r.execution_id
                    ? "Исполнение n8n #" + r.execution_id
                    : "Событие сохранено в журнале бизнес-команд."}
                </p>
              )}
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
