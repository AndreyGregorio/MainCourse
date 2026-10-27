import os

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

    navegador = webdriver.Chrome(options=options)
    navegador.set_page_load_timeout(45)
    yield navegador
    navegador.quit()


@pytest.fixture()
def base_url():
    url = os.getenv("BASE_URL", "http://localhost:5173/").strip()
    return url.rstrip("/") + "/"
