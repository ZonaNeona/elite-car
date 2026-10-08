"""Скриншоты светлой (по умолчанию) и тёмной темы + ответ AI-помощника."""
import asyncio
import sys
from pathlib import Path

from playwright.async_api import async_playwright

OUT = Path(__file__).parent / "shots"
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5174"


async def shoot(b, theme):
    ctx = await b.new_context(viewport={"width": 1500, "height": 900}, device_scale_factor=1.2)
    if theme == "dark":
        await ctx.add_init_script("localStorage.setItem('ec-theme','dark')")
    pg = await ctx.new_page()
    await pg.goto(BASE, wait_until="networkidle")
    await pg.wait_for_timeout(1200)
    await pg.screenshot(path=OUT / f"t-{theme}-landing.png")
    await pg.get_by_role("button", name="Открыть как собственник").first.click()
    await pg.wait_for_selector(".kpi", timeout=60000)
    await pg.wait_for_timeout(3500)
    await pg.screenshot(path=OUT / f"t-{theme}-dashboard.png")
    await pg.get_by_role("button", name="Автопарк").first.click()
    await pg.wait_for_timeout(1500)
    await pg.get_by_role("button", name="Карточки").click()
    await pg.wait_for_timeout(1500)
    await pg.locator(".vehicle-card").first.click()
    await pg.wait_for_timeout(2500)
    await pg.screenshot(path=OUT / f"t-{theme}-drawer.png")
    await pg.keyboard.press("Escape")
    await pg.wait_for_timeout(500)
    if theme == "light":
        await pg.get_by_role("button", name="Спросить AI").first.click()
        await pg.wait_for_timeout(800)
        await pg.locator(".ai-input textarea").fill("Как рассчитывается выплата владельцу автомобиля?")
        await pg.get_by_role("button", name="Отправить").click()
        await pg.wait_for_selector(".ai-result", timeout=90000)
        await pg.wait_for_timeout(800)
        await pg.screenshot(path=OUT / "t-light-ai.png")
    await ctx.close()


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True, channel="chromium")
        for theme in ("light", "dark"):
            await shoot(b, theme)
        await b.close()
    print("ok")


asyncio.run(main())
