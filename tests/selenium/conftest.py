import os
from pathlib import Path

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


@pytest.fixture()
def driver():
    options = Options()

    if os.getenv("HEADLESS", "1") != "0":
        options.add_argument("--headless=new")

    options.add_argument("--window-size=1280,900")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")

    # Permite usar um Chromium já instalado (ex.: CHROME_BIN=/usr/bin/chromium).
    binario = os.getenv("CHROME_BIN")
    if binario:
        options.binary_location = binario

    navegador = webdriver.Chrome(options=options)
    navegador.set_page_load_timeout(45)
    yield navegador
    navegador.quit()


@pytest.fixture()
def base_url():
    url = os.getenv("BASE_URL", "http://localhost:5173/").strip()
    return url.rstrip("/") + "/"


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Salva um screenshot da tela quando um teste falha (facilita o diagnóstico)."""
    resultado = yield
    relatorio = resultado.get_result()

    if relatorio.when != "call" or not relatorio.failed:
        return

    navegador = item.funcargs.get("driver")
    if navegador is None:
        return

    pasta = Path("tests/selenium/screenshots")
    pasta.mkdir(parents=True, exist_ok=True)
    try:
        navegador.save_screenshot(str(pasta / f"{item.name}.png"))
    except Exception:  # noqa: BLE001 - o screenshot é diagnóstico, nunca deve mascarar a falha
        pass
