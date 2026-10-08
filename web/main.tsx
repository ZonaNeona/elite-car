import React, { useState, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  CarFront,
  Users,
  FileText,
  Wrench,
  Wallet,
  ChartNoAxesCombined,
  Settings,
  ArrowUpRight,
  ChevronDown,
  Plus,
  Search,
  Command,
  ArrowRight,
  RotateCcw,
  Bell,
  Menu,
  X,
  ShieldCheck,
  Smartphone,
  LoaderCircle,
  CheckCircle2,
  WifiOff,
  Sparkles,
  Building2,
  LogOut,
} from "lucide-react";
import { api, Data, Row, dirs, getLabel, staffRoles, financialRoles } from "./lib";
import { SearchBox, Loading, Empty, ThemeToggle } from "./ui";
import { Landing } from "./landing";
import { ActionDialog, Action } from "./actions";
import {
  Dashboard,
  Fleet,
  People,
  Contracts,
  Service,
  Finance,
  Analytics,
  SettingsPage,
  MobileHome,
  DetailPanel,
  AIPanel,
} from "./views";
import "./style.css";
import { Operations } from "./operations";
import { GlobalSearch } from "./search";
const client = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 15000, refetchOnWindowFocus: false } },
});
const nav = [
  ["today", "Сегодня", LayoutDashboard],
  ["fleet", "Автопарк", CarFront],
  ["people", "Клиенты и водители", Users],
  ["contracts", "Договоры", FileText],
  ["service", "Заявки и сервис", Wrench],
  ["finance", "Финансы", Wallet],
  ["analytics", "Аналитика", ChartNoAxesCombined],
  ["settings", "Источники и настройки", Settings],
] as const;
function App() {
  const [globalSearch, setGlobalSearch] = useState(false);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setGlobalSearch(true);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const q = useQueryClient();
  const [entered, setEntered] = useState(false);
  const [starting, setStarting] = useState(false);
  const [fatal, setFatal] = useState("");
  const [page, setPage] = useState("today");
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [direction, setDirection] = useState("");
  const [period, setPeriod] = useState("30");
  const [selected, setSelected] = useState<Row | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [ai, setAi] = useState(false);
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [notifications, setNotifications] = useState<{ title: string; at: string }[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const health = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const r = await fetch("/api/health");
      if (!r.ok) throw new Error("Нет связи");
      return r.json();
    },
    refetchInterval: 30000,
  });
  const session = useQuery({ queryKey: ["session"], queryFn: () => api("/session"), retry: false });
  const boot = useQuery<Data>({
    queryKey: ["bootstrap"],
    queryFn: () => api("/bootstrap"),
    enabled: !!session.data || entered,
    retry: false,
  });
  const data = boot.data;
  const mobileRole = data && !staffRoles.includes(data.session.role);
  const end = data?.today;
  const start = useMemo(() => {
    if (!end) return;
    const d = new Date(end + "T12:00:00");
    d.setDate(d.getDate() - Number(period) + 1);
    return d.toISOString().slice(0, 10);
  }, [end, period]);
  const report = useQuery({
    queryKey: ["report", start, end, branch, direction, data?.session.role],
    queryFn: () => api(`/report?start=${start}&end=${end}&branch=${branch}&direction=${direction}`),
    enabled: !!data,
  });
  useEffect(() => {
    const set = () => setOnline(navigator.onLine);
    window.addEventListener("online", set);
    window.addEventListener("offline", set);
    return () => {
      window.removeEventListener("online", set);
      window.removeEventListener("offline", set);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!data) return;
    const es = new EventSource("/api/v1/events");
    es.onopen = () => {
      q.invalidateQueries({ queryKey: ["bootstrap"] });
      q.invalidateQueries({ queryKey: ["report"] });
    };
    let timer: ReturnType<typeof setTimeout>;
    es.onmessage = (e) => {
      try {
        const item = JSON.parse(e.data);
        setNotifications((p) => [item, ...p].slice(0, 30));
        clearTimeout(timer);
        timer = setTimeout(() => {
          q.invalidateQueries({ queryKey: ["bootstrap"] });
          q.invalidateQueries({ queryKey: ["report"] });
          q.invalidateQueries({ queryKey: ["detail"] });
          q.invalidateQueries({ queryKey: ["ledger"] });
        }, 700);
      } catch {}
    };
    return () => {
      es.close();
      clearTimeout(timer);
    };
  }, [data?.session.id, data?.session.role, q]);
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initData) {
      api("/telegram/auth", { method: "POST", body: JSON.stringify({ initData: tg.initData }) })
        .then(() => {
          setEntered(true);
          q.invalidateQueries();
        })
        .catch((e) => setFatal(e.message));
      tg.ready();
      tg.expand();
    }
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, [q]);
  async function begin(asRole?: string) {
    setStarting(true);
    setFatal("");
    try {
      await api("/session", { method: "POST", body: "{}" });
      if (asRole && asRole !== "owner")
        await api("/session/role", { method: "POST", body: JSON.stringify({ role: asRole }) });
      setEntered(true);
      await q.invalidateQueries();
    } catch (e: any) {
      setFatal(e.message);
    } finally {
      setStarting(false);
    }
  }
  async function role(value: string) {
    try {
      await q.cancelQueries();
      const session = await api("/session/role", { method: "POST", body: JSON.stringify({ role: value }) });
      const fresh = await api<Data>("/bootstrap");
      setSelected(null);
      setPage("today");
      setBranch("");
      setDirection("");
      q.setQueryData(["session"], session);
      q.setQueryData(["bootstrap"], fresh);
      q.removeQueries({
        predicate: (query) => !["session", "bootstrap", "health"].includes(String(query.queryKey[0])),
      });
      setEntered(true);
    } catch (e: any) {
      setToast(e.message);
    }
  }
  function done(msg: string, row?: Row) {
    setToast(msg);
    if (row?.id && row?.kind) setSelected(row);
    q.invalidateQueries();
  }
  const open = (row: Row) => setSelected(row);
  const act = (id: string, label: string, target?: Row) => setAction({ id, label, target });
  if (!data) {
    if (boot.isLoading || session.isLoading)
      return (
        <div className="fullscreen">
          <Loading />
        </div>
      );
    return (
      <Landing
        starting={starting}
        online={online}
        error={fatal || boot.error?.message || ""}
        bot={health.data?.telegram_username}
        begin={begin}
      />
    );
  }
  const common = { data, open, act, search, branch, direction };
  const pageInfo = nav.find((n) => n[0] === page) || nav[0];
  const allowedNav = nav
    .filter((n) => !["finance", "analytics"].includes(n[0]) || financialRoles.includes(data.session.role))
    .filter((n) => n[0] !== "settings" || ["owner", "admin", "finance"].includes(data.session.role))
    .filter((n) => n[0] !== "people" || staffRoles.includes(data.session.role))
    .filter((n) => data.session.role !== "screening" || ["today", "people"].includes(n[0]))
    .filter((n) => data.session.role !== "service" || !["people", "contracts"].includes(n[0]));
  return (
    <div className="app">
      <aside className={"sidebar " + (menu ? "shown" : "")}>
        <div className="side-brand">
          <div className="brand-icon">
            <CarFront size={24} />
          </div>
          <div className="wordmark">
            Car City<span>× ELITE CAR · концепт</span>
          </div>
          <button
            className="mobile-close icon-button"
            onClick={() => setMenu(false)}
            aria-label="Закрыть меню"
          >
            <X />
          </button>
        </div>
        <div className="workspace-label">
          <span className="workspace-avatar">EC</span>
          <div>
            <strong>Группа ELITE CAR</strong>
            <small>Личное пространство</small>
          </div>
          <ChevronDown size={14} />
        </div>
        <span className="nav-label">РАБОЧЕЕ ПРОСТРАНСТВО</span>
        <nav>
          {allowedNav.map(([id, label, Icon]) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => {
                setPage(id);
                setMenu(false);
                setSearch("");
              }}
            >
              <Icon size={18} />
              {label}
              {id === "service" && (
                <span className="nav-count">{data.ticket.filter((t) => t.status !== "closed").length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="assistant-button" onClick={() => setAi(true)}>
            <Sparkles size={20} />
            <div>
              <strong>Помощник парка</strong>
              <small>Данные → понятные решения</small>
            </div>
            <ArrowUpRight size={16} />
          </button>
          <a href="/guide.html" target="_blank" rel="noreferrer" className="demo-label">
            Показ за 5 минут ↗
          </a>
          <div className="demo-label">
            <i /> Независимый демопроект
          </div>
          <div className="user-box">
            <div className="avatar">ИШ</div>
            <div>
              <strong>{data.session.roles[data.session.role]}</strong>
              <small>Демонстрационная роль</small>
            </div>
          </div>
        </div>
      </aside>
      {menu && <div className="mobile-scrim" onClick={() => setMenu(false)} />}
      <div className="main">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-toggle icon-button"
              onClick={() => setMenu(true)}
              aria-label="Открыть меню"
            >
              <Menu />
            </button>
            <span>Рабочее пространство</span>
            <span>/</span>
            <strong>{pageInfo[1]}</strong>
          </div>
          <div className="topbar-right">
            <ThemeToggle />
            <button
              className="icon-button"
              aria-label="Глобальный поиск"
              title="Поиск · Ctrl+K"
              onClick={() => setGlobalSearch(true)}
            >
              <Search size={18} />
            </button>
            <span className="live-indicator">
              <i />
              {health.error
                ? "Нет связи с сервером"
                : health.data?.status === "ok"
                  ? "Система работает"
                  : "Проверяем систему"}
            </span>
            <button
              className="icon-button notification-button"
              aria-label="Уведомления"
              onClick={() => setShowNotes(!showNotes)}
            >
              <Bell size={18} />
              {notifications.length > 0 && <i />}
            </button>
            <select
              aria-label="Демонстрационная роль"
              value={data.session.role}
              onChange={(e) => role(e.target.value)}
            >
              {Object.entries(data.session.roles).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </header>
        {!online && (
          <div className="offline">
            <WifiOff size={16} />
            Нет соединения. Изменения временно недоступны.
          </div>
        )}
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">{mobileRole ? "ВАШ ЛИЧНЫЙ КАБИНЕТ" : "CAR CITY × ELITE CAR"}</div>
              <h1>
                {page === "today" ? (mobileRole ? "Всё важное — под рукой" : "Обзор бизнеса") : pageInfo[1]}
                <span className="heading-dot">.</span>
              </h1>
              <p>
                {page === "today"
                  ? "Контроль процессов. Прозрачные цифры. Следующее действие."
                  : {
                      fleet: "Каждый автомобиль — от выдачи до финансового результата.",
                      people: "От первого обращения до долгосрочного сотрудничества.",
                      contracts: "Условия, обязательства и история в одном месте.",
                      service: "От обращения до возвращения автомобиля в работу.",
                      finance: "Каждая сумма имеет источник и основание.",
                      analytics: "Разбирайтесь в результате до отдельной операции.",
                      settings: "Источники данных, правила и состояние системы.",
                    }[page]}
              </p>
            </div>
            <div className="heading-actions">
              <button className="button secondary" onClick={() => setAi(true)}>
                <Sparkles size={16} />
                Спросить AI
              </button>
              {["owner", "admin", "manager", "driver", "client"].includes(data.session.role) &&
                ["today", "fleet", "contracts"].includes(page) && (
                  <button className="button primary" onClick={() => act("contract.create", "Новый договор")}>
                    <Plus size={17} />
                    Новый договор
                  </button>
                )}
              {page === "people" && (
                <button className="button primary" onClick={() => act("client.create", "Новый клиент")}>
                  <Plus size={17} />
                  Новый клиент
                </button>
              )}
              {page === "service" && (
                <button className="button primary" onClick={() => act("ticket.create", "Новое обращение")}>
                  <Plus size={17} />
                  Создать заявку
                </button>
              )}
            </div>
          </div>
          <div className="filterbar">
            <div className="segment">
              <button className={!direction ? "selected" : ""} onClick={() => setDirection("")}>
                Вся группа
              </button>
              {Object.entries(dirs).map(([id, name]) => (
                <button
                  key={id}
                  className={direction === id ? "selected" : ""}
                  onClick={() => setDirection(id)}
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="filter-right">
              <select aria-label="Филиал" value={branch} onChange={(e) => setBranch(e.target.value)}>
                <option value="">Все площадки</option>
                {data.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <select aria-label="Период" value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="7">7 дней</option>
                <option value="30">30 дней</option>
                <option value="90">90 дней</option>
              </select>
            </div>
          </div>
          {page !== "today" && page !== "settings" && (
            <div className="page-search">
              <SearchBox
                value={search}
                onChange={setSearch}
                placeholder="Найти автомобиль, договор или клиента…"
              />
            </div>
          )}
          {page === "today" &&
            (mobileRole ? (
              <MobileHome
                {...common}
                report={report.data}
                onTelegram={async () => {
                  try {
                    const r = await api("/telegram/link", { method: "POST", body: "{}" });
                    window.open(r.url, "_blank", "noopener");
                  } catch (e: any) {
                    setToast(e.message);
                  }
                }}
              />
            ) : ["manager", "service", "screening"].includes(data.session.role) ? (
              <Operations data={data} open={open} />
            ) : (
              <Dashboard {...common} report={report.data} go={setPage} />
            ))}
          {page === "fleet" && <Fleet {...common} />}
          {page === "people" && <People {...common} />}
          {page === "contracts" && <Contracts {...common} />}
          {page === "service" && <Service {...common} />}
          {page === "finance" && <Finance {...common} report={report.data} done={done} />}
          {page === "analytics" && <Analytics {...common} report={report.data} />}
          {page === "settings" && <SettingsPage {...common} done={done} />}
          {report.error && <div className="error">Не удалось обновить отчёт: {report.error.message}</div>}
          <div className="page-footer">
            <span>Концепт для ELITE CAR · учебные данные, не официальный сервис</span>
            <span>Изменения сохраняются в вашей сессии</span>
          </div>
        </main>
      </div>
      {mobileRole && (
        <nav className="mobile-bottom-nav">
          {allowedNav
            .filter((n) => ["today", "contracts", "service", "finance"].includes(n[0]))
            .map(([id, label, Icon]) => (
              <button key={id} className={page === id ? "active" : ""} onClick={() => setPage(id)}>
                <Icon size={20} />
                <span>{id === "today" ? "Главная" : id === "service" ? "Помощь" : label}</span>
              </button>
            ))}
        </nav>
      )}
      {selected && <DetailPanel row={selected} {...common} onClose={() => setSelected(null)} />}
      {action && <ActionDialog action={action} data={data} onClose={() => setAction(null)} onDone={done} />}
      {globalSearch && <GlobalSearch data={data} open={open} onClose={() => setGlobalSearch(false)} />}
      {ai && <AIPanel data={data} target={selected} onClose={() => setAi(false)} />}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
          <button onClick={() => setToast("")} aria-label="Закрыть">
            <X size={14} />
          </button>
        </div>
      )}
      {showNotes && (
        <div className="notifications card">
          <div className="card-head">
            <h3>События пространства</h3>
            <button className="icon-button" onClick={() => setShowNotes(false)} aria-label="Закрыть">
              <X size={16} />
            </button>
          </div>
          {notifications.length ? (
            notifications.slice(0, 12).map((n, i) => (
              <div className="notification" key={i}>
                <span className="tiny-dot" />
                <div>
                  <strong>{n.title}</strong>
                  <small>{new Date(n.at).toLocaleTimeString("ru-RU")}</small>
                </div>
              </div>
            ))
          ) : (
            <Empty title="Новых событий нет" />
          )}
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
