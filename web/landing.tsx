import {
  ArrowUpRight,
  Bot,
  CarFront,
  ChartNoAxesCombined,
  ClipboardList,
  DatabaseBackup,
  FileText,
  KeyRound,
  LoaderCircle,
  Lock,
  ScrollText,
  Send,
  ServerCog,
  ShieldCheck,
  Smartphone,
  Users,
  Wrench,
} from "lucide-react";
import { ThemeToggle } from "./ui";

type Props = {
  starting: boolean;
  online: boolean;
  error: string;
  bot?: string | null;
  begin: (role?: string) => void;
  under: () => void;
};

// Бэклог из вакансии ELITE CAR → что из этого уже работает в прототипе
const BACKLOG = [
  {
    icon: Bot,
    tag: "Текущая задача",
    title: "Бот таксопарка на три типа пользователей",
    text: "Водитель, клиент и сотрудник отдела в одном боте. У каждого свои права и свои данные, общая бизнес-логика с веб-кабинетом.",
  },
  {
    icon: Smartphone,
    tag: "Следующая итерация",
    title: "Из бота — в приложение",
    text: "Telegram Mini App и PWA на тех же командах и правах: водитель открывает кабинет прямо из чата.",
  },
  {
    icon: ChartNoAxesCombined,
    tag: "Дашборд собственника",
    title: "Доходность каждой машины",
    text: "Выручка против лизинга, страховки, ТО, ремонтов и общих расходов. Видно, какие машины тянут парк вниз.",
  },
  {
    icon: ClipboardList,
    tag: "Отделы",
    title: "Заявки, документы, уведомления",
    text: "Ремонт от обращения до контрольного осмотра, договоры в PDF и Excel, сверка банковской выписки, SLA реакции.",
  },
  {
    icon: CarFront,
    tag: "Второй контур",
    title: "Прокат и аренда с выкупом",
    text: "До них у вас ещё не дошли, а в модели они уже есть: брони без пересечений, залоги, график выкупа, каникулы.",
  },
];

const ROLES = [
  {
    id: "owner",
    title: "Собственник",
    text: "Экономика группы и каждой машины, загрузка, долги, что требует внимания сегодня.",
    photo: "/cars/hongqi-h5-sm.webp",
  },
  {
    id: "manager",
    title: "Менеджер парка",
    text: "Выдача и возврат, брони, проверка документов водителя, очередь заявок.",
    photo: "/cars/moskvich-3-sm.webp",
  },
  {
    id: "driver",
    title: "Водитель",
    text: "Своя машина, начисления и оплаты, каникулы, обращение в сервис с фото.",
    photo: "/cars/haval-f7-sm.webp",
  },
];

const SECURITY = [
  {
    icon: Lock,
    title: "Права на уровне команд",
    text: "Каждое действие проверяет роль, принадлежность объекта и статус — не только интерфейс.",
  },
  {
    icon: ScrollText,
    title: "Аудит каждого изменения",
    text: "Кто, что и когда поменял; деньги исправляются сторно, а не правкой записи.",
  },
  {
    icon: DatabaseBackup,
    title: "Бэкапы с проверкой восстановления",
    text: "Ежедневный дамп PostgreSQL и регулярный тест: поднимаем копию и сверяем.",
  },
  {
    icon: KeyRound,
    title: "Секреты вне кода",
    text: "Токены и ключи — в закрытом env на сервере; вебхук Telegram проверяет secret_token.",
  },
  {
    icon: ServerCog,
    title: "152-ФЗ",
    text: "Хранение в РФ, минимум персональных данных, доступ к файлам только по правам. Здесь — только учебные данные.",
  },
];

export function Landing({ under, starting, online, error, bot, begin }: Props) {
  const botUrl = bot ? `https://t.me/${bot}` : null;
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="brandmark">
          <span className="brandmark-icon">
            <CarFront size={18} />
          </span>
          <span>
            Car City <i>×</i> ELITE CAR
          </span>
        </div>
        <div className="landing-nav-right">
          <a href="/guide.html" target="_blank" rel="noreferrer">
            Сценарий показа
          </a>
          <span className="concept-chip">
            Концепт для отклика · не официальный сервис
          </span>
          <ThemeToggle />
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Цифровой контур группы ELITE CAR</span>
          <h1>
            Бот, приложение и дашборд собственника{" "}
            <em>для парка на 4000 машин</em>
          </h1>
          <p>
            Прототип по вашему бэклогу: водители, клиенты и отделы работают в
            одной системе, а собственник видит доходность каждой машины. Модели
            и тарифы — из публичного каталога Car City, люди и деньги — учебные.
          </p>
          <div className="hero-actions">
            <button
              className="button primary xl"
              onClick={() => begin("owner")}
              disabled={starting || !online}
            >
              {starting ? (
                <LoaderCircle className="spin" />
              ) : (
                <>
                  Открыть как собственник <ArrowUpRight />
                </>
              )}
            </button>
            {botUrl && (
              <a
                className="button ghost xl"
                href={botUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Send size={18} /> Бот в Telegram
              </a>
            )}
          </div>
          <button
            className="button secondary"
            onClick={under}
            disabled={starting || !online}
          >
            <ServerCog size={18} />
            Под капотом · RAG, AI-агент и интеграции
          </button>
          <div className="hero-proof">
            <ShieldCheck size={16} /> Своя сессия для каждого гостя · 160 машин
            · 90 дней истории
          </div>
          {!online && (
            <div className="error">
              Нет соединения — демо откроется, когда сеть вернётся.
            </div>
          )}
          {error && <div className="error">{error}</div>}
        </div>
        <div className="hero-visual">
          <img
            className="hero-photo"
            src="/cars/exeed-lx.webp"
            alt="Exeed LX"
          />
          <div className="float-card fc-1">
            <img src="/cars/haval-f7-sm.webp" alt="" />
            <div>
              <strong>Haval F7 · Комфорт+</strong>
              <span>2 800 ₽/сутки · в работе</span>
            </div>
          </div>
          <div className="float-card fc-2">
            <span className="fc-label">Результат машины за месяц</span>
            <strong className="positive">+21 400 ₽</strong>
            <span>после лизинга, страховки и ТО</span>
          </div>
          <div className="float-card fc-3">
            <Wrench size={16} />
            <div>
              <strong>SRV-202 · ТО</strong>
              <span>смета согласована владельцем</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-heading">
          <span className="eyebrow">Ваш бэклог → что уже работает</span>
          <h2>Пять пунктов из вакансии — в одном прототипе</h2>
        </div>
        <div className="backlog-grid">
          {BACKLOG.map((b, i) => (
            <article
              key={b.title}
              className={"backlog-card " + (i === 0 ? "featured" : "")}
            >
              <div className="backlog-top">
                <span className="backlog-icon">
                  <b.icon size={20} />
                </span>
                <span className="backlog-tag">{b.tag}</span>
              </div>
              <h3>{b.title}</h3>
              <p>{b.text}</p>
              {i === 0 && botUrl && (
                <a
                  className="text-button"
                  href={botUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  @{bot} <ArrowUpRight size={15} />
                </a>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-heading">
          <span className="eyebrow">Три входа</span>
          <h2>Посмотрите глазами разных людей</h2>
        </div>
        <div className="role-grid">
          {ROLES.map((r) => (
            <button
              key={r.id}
              className="role-card"
              onClick={() => begin(r.id)}
              disabled={starting || !online}
            >
              <img src={r.photo} alt="" loading="lazy" />
              <div className="role-body">
                <h3>{r.title}</h3>
                <p>{r.text}</p>
                <span className="role-go">
                  Открыть <ArrowUpRight size={16} />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="landing-section security">
        <div className="landing-heading">
          <span className="eyebrow">Персональные данные</span>
          <h2>Безопасность заложена в архитектуру</h2>
          <p>
            Работаем с паспортами, правами и деньгами водителей, поэтому
            доступы, аудит и бэкапы — не «потом», а с первой версии.
          </p>
        </div>
        <div className="security-grid">
          {SECURITY.map((x) => (
            <div key={x.title} className="security-item">
              <x.icon size={20} />
              <h3>{x.title}</h3>
              <p>{x.text}</p>
            </div>
          ))}
        </div>
        <div className="stack-line">
          <FileText size={15} /> FastAPI · PostgreSQL 16 · очередь задач · React
          · Telegram Bot API и Mini App · LLM через OpenRouter · VPS в РФ
        </div>
      </section>

      <footer className="landing-footer">
        <span>
          Независимый концепт для отклика на вакансию ELITE CAR. Не связан с
          компанией, не принимает реальные заказы и платежи.
        </span>
        <a href="/credits.html" target="_blank" rel="noreferrer">
          <Users size={14} /> Фото автомобилей: Wikimedia Commons, авторы и
          лицензии
        </a>
      </footer>
    </div>
  );
}
