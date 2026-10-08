"""Скриншоты нового дизайна: лендинг (десктоп/мобильный), дашборд, автопарк, кабинет водителя."""
import asyncio
import sys
from pathlib import Path

from playwright.async_api import async_playwright

OUT = Path(__file__).parent / "shots"
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5174"
ONLY = sys.argv[2] if len(sys.argv) > 2 else "all"


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True, channel="chromium")
        page = await b.new_page(viewport={"width": 1600, "height": 950}, device_scale_factor=1.25)
        await page.goto(BASE, wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=OUT / "n1-landing.png")
        await page.screenshot(path=OUT / "n1-landing-full.png", full_page=True)
        if ONLY in ("all", "app"):
            await page.get_by_role("button", name="Открыть как собственник").first.click()
            await page.wait_for_selector(".kpi", timeout=60000)
            await page.wait_for_timeout(2500)
            await page.screenshot(path=OUT / "n2-dashboard.png")
            await page.screenshot(path=OUT / "n2-dashboard-full.png", full_page=True)
            await page.get_by_role("button", name="Автопарк").first.click()
            await page.wait_for_timeout(2500)
            await page.screenshot(path=OUT / "n3-fleet.png")
            await page.get_by_role("button", name="Карточки").click()
            await page.wait_for_timeout(2500)
            await page.screenshot(path=OUT / "n4-fleet-cards.png")
            await page.locator(".vehicle-card").first.click()
            await page.wait_for_timeout(2500)
            await page.screenshot(path=OUT / "n5-drawer.png")
            await page.keyboard.press("Escape")
            await page.get_by_role("button", name="Заявки и сервис").first.click()
            await page.wait_for_timeout(2500)
            await page.screenshot(path=OUT / "n6-service.png")
            await page.locator("select").first.select_option(label="Водитель")
            await page.wait_for_timeout(4000)
            await page.screenshot(path=OUT / "n7-driver.png")
        m = await b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        await m.goto(BASE, wait_until="networkidle")
        await m.wait_for_timeout(1500)
        await m.screenshot(path=OUT / "n8-landing-mobile.png")
        await b.close()
    print("ok")


asyncio.run(main())
