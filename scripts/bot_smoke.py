"""Прогон сценариев бота без Telegram: апдейты → process(), отправка подменена печатью.
Запуск на сервере: ELITE_ENV=/etc/elite-car.env .venv/bin/python -m scripts.bot_smoke
Тестовое пространство (tg_user=9000001) в конце удаляется.
"""

import itertools
import re

from sqlalchemy import delete, select

from app import telegram
from app.db import Space, db

TG = 9000001
seq = itertools.count(900000000)
last_kb: list[list[str]] = []


async def fake_deliver(chat, messages, callback_id=None):
    global last_kb
    last_kb = []  # кнопки всех сообщений одного ответа
    for m in messages:
        text = re.sub(r"<[^>]+>", "", m.get("text", ""))
        tag = "📷 " if m.get("photo") else "📄 " if m.get("document") else ""
        print("   ←", tag + text.replace("\n", " | ")[:230])
        if m.get("kb"):
            buttons = [b.callback_data or ("app" if b.web_app else b.url) for row in m["kb"].inline_keyboard for b in row]
            last_kb += buttons
            print("     [" + ", ".join(buttons) + "]")


telegram._deliver = fake_deliver
user = {"id": TG, "first_name": "Тест"}
chat = {"id": TG, "type": "private"}


def msg(text):
    print(f"\n→ «{text}»")
    telegram.process({"update_id": next(seq), "message": {"message_id": 1, "from": user, "chat": chat, "text": text}})


def tap(data):
    print(f"\n→ [{data}]")
    telegram.process(
        {
            "update_id": next(seq),
            "callback_query": {"id": "cb", "from": user, "data": data, "message": {"message_id": 2, "chat": chat}},
        }
    )


def first(prefix):
    return next((x for x in last_kb if x and x.startswith(prefix)), None)


try:
    msg("/start")
    tap("role:driver")
    tap("d:balance")
    tap("d:car")
    tap("d:holiday")
    msg("что ты умеешь?")
    msg("Какие документы нужны, чтобы взять машину в аренду?")
    msg("Стучит подвеска справа, нужна диагностика")
    tap("role:client")
    tap("c:catalog")
    book = first("c:book:")
    if book:
        tap(book)
    tap("c:mine")
    tap("staff")
    tap("role:manager")
    tap("m:drafts")
    confirm = first("m:confirm:")
    if confirm:
        tap(confirm)
    tap("m:summary")
    tap("role:service")
    tap("s:tickets")
    est = first("s:est:")
    if est:
        tap(est)
    tap("role:finance")
    tap("f:estimates")
    approve = first("f:approve:")
    if approve:
        tap(approve)
    tap("f:holidays")
    hday = first("f:hday:")
    if hday:
        tap(hday)
    tap("f:economy")
finally:
    with db() as s:
        ids = s.scalars(select(Space.id).where(Space.data["tg_user"].astext == str(TG))).all()
        if ids:
            s.execute(delete(Space).where(Space.id.in_(ids)))
    print("\nтестовое пространство удалено:", len(ids))
