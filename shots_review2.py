"""Второй заход: время загрузки дашборда, разделы, роль водителя, мобильный кабинет."""
import asyncio
import time
from pathlib import Path

from playwright.async_api import async_playwright

OUT = Path(__file__).parent / "shots"
BASE = "https://elite-car.shvarev-demo.ru"


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True, channel="chromium")
        page = await b.new_page(viewport={"width": 1600, "height": 950}, device_scale_factor=1.25)
        await page.goto(BASE, wait_until="networkidle")
        await page.get_by_role("button", name="Открыть личное демо").first.click()
        t = time.time()
        try:
            await page.wait_for_selector("text=Собираем данные", state="detached", timeout=60000)
        except Exception:
            pass
        print("дашборд загрузился за", round(time.time() - t, 1), "с")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=OUT / "r5-dashboard.png")
        await page.screenshot(path=OUT / "r5-dashboard-full.png", full_page=True)
        for name in ["Аналитика", "Заявки и сервис"]:
            await page.get_by_role("button", name=name).first.click()
            await page.wait_for_timeout(4000)
            await page.screenshot(path=OUT / f"r6-{name}.png")
        # роль водителя
        sel = page.locator("select").first
        opts = await sel.locator("option").all_inner_texts()
        print("роли:", opts)
        drv = next((o for o in opts if "Водитель" in o), None)
        if drv:
            await sel.select_option(label=drv)
            await page.wait_for_timeout(5000)
            await page.screenshot(path=OUT / "r7-driver.png")
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True)
        m = await ctx.new_page()
        await m.goto(BASE, wait_until="networkidle")
        await m.get_by_role("button", name="Открыть личное демо").first.click()
        await m.wait_for_timeout(9000)
        await m.screenshot(path=OUT / "r8-mobile-app.png")
        await b.close()


asyncio.run(main())
