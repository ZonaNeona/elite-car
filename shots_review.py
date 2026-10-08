"""Скриншоты живого стенда ELITE CAR для разбора: первый экран, после входа в демо, мобильный."""
import asyncio
from pathlib import Path

from playwright.async_api import async_playwright

OUT = Path(__file__).parent / "shots"
OUT.mkdir(exist_ok=True)
BASE = "https://elite-car.shvarev-demo.ru"


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True, channel="chromium")
        page = await b.new_page(viewport={"width": 1600, "height": 950}, device_scale_factor=1.25)
        await page.goto(BASE, wait_until="networkidle")
        await page.wait_for_timeout(2500)
        await page.screenshot(path=OUT / "r1-landing.png")
        # пробуем войти в личное демо
        for label in ["Открыть демо", "Начать", "Войти", "Открыть", "демо"]:
            btn = page.get_by_role("button", name=label)
            if await btn.count():
                await btn.first.click()
                break
        await page.wait_for_timeout(5000)
        await page.screenshot(path=OUT / "r2-after-start.png")
        print("buttons:", [await x.inner_text() for x in await page.get_by_role("button").all()][:40])
        print("links:", [await x.inner_text() for x in await page.get_by_role("link").all()][:40])
        await page.goto(BASE + "/guide.html", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=OUT / "r3-guide.png", full_page=False)
        m = await b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        await m.goto(BASE, wait_until="networkidle")
        await m.wait_for_timeout(2500)
        await m.screenshot(path=OUT / "r4-mobile.png")
        await b.close()


asyncio.run(main())
