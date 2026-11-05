"""Testes E2E da Release 1 do MainCourse (Selenium + pytest).

Cobrem o CRUD de pratos e de ingredientes já entregue na R01, agora navegando
pelas abas do painel. Os testes criam e excluem registros reais no Firestore
apontado pelo build.
"""

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait

from apoio import (
    TIMEOUT,
    clicar,
    abrir_aba,
    abrir_app,
    criar_ingrediente,
    criar_prato,
    excluir_ingrediente,
    excluir_prato,
    esperar_visivel,
    nome_unico,
    seletor_item,
)


def test_pagina_carrega(driver, base_url):
    abrir_app(driver, base_url)
    assert "Painel de Controle" in driver.find_element(By.TAG_NAME, "h1").text
    assert driver.find_element(By.TAG_NAME, "header").text.strip()


def test_abas_do_painel(driver, base_url):
    abrir_app(driver, base_url)

    for aba in ("pratos", "ingredientes", "receitas", "despensa"):
        assert driver.find_element(By.CSS_SELECTOR, f'[data-testid="aba-{aba}"]')
        abrir_aba(driver, base_url, aba)
        assert driver.find_element(By.CSS_SELECTOR, f'[data-rota="{aba}"]')
        assert driver.find_element(By.TAG_NAME, "h1").text.strip()


def test_crud_prato(driver, base_url):
    abrir_aba(driver, base_url, "pratos")

    nome = nome_unico("Prato")
    nome_editado = f"{nome} editado"

    criar_prato(driver, nome)
    item = esperar_visivel(driver, seletor_item("prato", nome))
    assert nome in item.text
    assert "Sem receita" in item.text

    try:
        clicar(driver, item.find_element(By.CSS_SELECTOR, '[data-testid="prato-editar"]'))

        campo = esperar_visivel(driver, '[data-testid="prato-nome"]')
        campo.clear()
        campo.send_keys(nome_editado)
        clicar(driver, driver.find_element(By.CSS_SELECTOR, '[data-testid="prato-adicionar"]'))

        item = esperar_visivel(driver, seletor_item("prato", nome_editado))
        assert nome_editado in item.text
        assert not driver.find_elements(By.CSS_SELECTOR, seletor_item("prato", nome))
    finally:
        excluir_prato(driver, nome_editado)
        excluir_prato(driver, nome)


def test_crud_ingrediente(driver, base_url):
    abrir_aba(driver, base_url, "ingredientes")

    nome = nome_unico("Ingrediente")

    criar_ingrediente(driver, nome, "L")
    item = esperar_visivel(driver, seletor_item("ingrediente", nome))
    selo = item.find_element(By.CSS_SELECTOR, '[data-testid="ingrediente-unidade-badge"]')
    assert selo.text.strip() == "L"

    try:
        clicar(driver, item.find_element(By.CSS_SELECTOR, '[data-testid="ingrediente-editar"]'))

        campo = esperar_visivel(driver, '[data-testid="ingrediente-nome"]')
        assert (
            campo.get_attribute("readonly") is not None
        ), "O nome do ingrediente não pode ser editado (RFS07)."

        unidade = Select(driver.find_element(By.CSS_SELECTOR, '[data-testid="ingrediente-unidade"]'))
        unidade.select_by_value("kg")
        clicar(driver, driver.find_element(By.CSS_SELECTOR, '[data-testid="ingrediente-adicionar"]'))

        def unidade_atualizada(navegador):
            linha = navegador.find_element(By.CSS_SELECTOR, seletor_item("ingrediente", nome))
            badge = linha.find_element(By.CSS_SELECTOR, '[data-testid="ingrediente-unidade-badge"]')
            return badge.text.strip() == "kg"

        WebDriverWait(driver, TIMEOUT).until(unidade_atualizada)
    finally:
        excluir_ingrediente(driver, nome)


def test_busca_de_prato(driver, base_url):
    """RFS02: filtro por parte do nome."""
    abrir_aba(driver, base_url, "pratos")

    prefixo = nome_unico("Filtro")
    nomes = [f"{prefixo} A", f"{prefixo} B"]

    for nome in nomes:
        criar_prato(driver, nome)

    try:
        busca = esperar_visivel(driver, '[data-testid="prato-busca"]')
        busca.send_keys(f"{prefixo} A")
        esperar_visivel(driver, seletor_item("prato", f"{prefixo} A"))
        WebDriverWait(driver, TIMEOUT).until(
            lambda navegador: not navegador.find_elements(
                By.CSS_SELECTOR, seletor_item("prato", f"{prefixo} B")
            )
        )
    finally:
        driver.find_element(By.CSS_SELECTOR, '[data-testid="prato-busca"]').clear()
        for nome in nomes:
            excluir_prato(driver, nome)
