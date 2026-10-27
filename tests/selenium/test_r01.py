"""Testes E2E da Release 1 do MainCourse (Selenium + pytest).

Cobrem o fluxo de CRUD de pratos e de ingredientes no app publicado.
Os testes criam e excluem registros reais no Firestore apontado pelo build.
"""

import os
import uuid

import pytest
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait

TIMEOUT = int(os.getenv("E2E_TIMEOUT", "25"))


def esperar_visivel(driver, css):
    return WebDriverWait(driver, TIMEOUT).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, css))
    )


def esperar_sumir(driver, css):
    return WebDriverWait(driver, TIMEOUT).until(
        EC.invisibility_of_element_located((By.CSS_SELECTOR, css))
    )


def abrir(driver, base_url):
    driver.get(base_url)

    try:
        titulo = esperar_visivel(driver, "h1")
    except TimeoutException:
        pytest.fail(
            "O app ficou em 'Conectando...'. Confira as chaves do Firebase, o login anônimo, "
            "o domínio autorizado e as regras do Firestore."
        )

    assert "Painel de Controle" in titulo.text
    assert "MainCourse" in driver.title


def nome_unico(prefixo):
    return f"{prefixo} E2E {uuid.uuid4().hex[:8]}"


def seletor_item(tipo, nome):
    return f'[data-testid="{tipo}-item"][data-nome="{nome}"]'


def excluir_prato(driver, nome):
    try:
        item = driver.find_element(By.CSS_SELECTOR, seletor_item("prato", nome))
    except NoSuchElementException:
        return

    item.find_element(By.CSS_SELECTOR, '[data-testid="prato-excluir"]').click()
    esperar_visivel(driver, '[data-testid="confirmar"]').click()
    esperar_sumir(driver, seletor_item("prato", nome))


def excluir_ingrediente(driver, nome):
    try:
        item = driver.find_element(By.CSS_SELECTOR, seletor_item("ingrediente", nome))
    except NoSuchElementException:
        return

    item.find_element(By.CSS_SELECTOR, '[data-testid="ingrediente-excluir"]').click()
    esperar_visivel(driver, '[data-testid="confirmar"]').click()
    esperar_sumir(driver, seletor_item("ingrediente", nome))


def test_pagina_carrega(driver, base_url):
    abrir(driver, base_url)
    assert "Painel de Controle" in driver.find_element(By.TAG_NAME, "h1").text
    assert driver.find_element(By.TAG_NAME, "header").text.strip()


def test_crud_prato(driver, base_url):
    abrir(driver, base_url)

    nome = nome_unico("Prato")
    nome_editado = f"{nome} editado"

    campo = esperar_visivel(driver, '[data-testid="prato-nome"]')
    campo.send_keys(nome)
    driver.find_element(By.CSS_SELECTOR, '[data-testid="prato-adicionar"]').click()

    item = esperar_visivel(driver, seletor_item("prato", nome))
    assert nome in item.text

    try:
        item.find_element(By.CSS_SELECTOR, '[data-testid="prato-editar"]').click()

        campo = esperar_visivel(driver, '[data-testid="prato-nome"]')
        campo.clear()
        campo.send_keys(nome_editado)
        driver.find_element(By.CSS_SELECTOR, '[data-testid="prato-adicionar"]').click()

        item = esperar_visivel(driver, seletor_item("prato", nome_editado))
        assert nome_editado in item.text
        assert not driver.find_elements(By.CSS_SELECTOR, seletor_item("prato", nome))
    finally:
        excluir_prato(driver, nome_editado)
        excluir_prato(driver, nome)


def test_crud_ingrediente(driver, base_url):
    abrir(driver, base_url)

    nome = nome_unico("Ingrediente")

    campo = esperar_visivel(driver, '[data-testid="ingrediente-nome"]')
    campo.send_keys(nome)

    unidade = Select(driver.find_element(By.CSS_SELECTOR, '[data-testid="ingrediente-unidade"]'))
    unidade.select_by_value("L")

    driver.find_element(By.CSS_SELECTOR, '[data-testid="ingrediente-adicionar"]').click()

    item = esperar_visivel(driver, seletor_item("ingrediente", nome))
    selo = item.find_element(By.CSS_SELECTOR, '[data-testid="ingrediente-unidade-badge"]')
    assert selo.text.strip() == "L"

    try:
        item.find_element(By.CSS_SELECTOR, '[data-testid="ingrediente-editar"]').click()

        campo = esperar_visivel(driver, '[data-testid="ingrediente-nome"]')
        assert campo.get_attribute("readonly") is not None, "O nome do ingrediente não pode ser editado (RFS07)."

        unidade = Select(driver.find_element(By.CSS_SELECTOR, '[data-testid="ingrediente-unidade"]'))
        unidade.select_by_value("kg")
        driver.find_element(By.CSS_SELECTOR, '[data-testid="ingrediente-adicionar"]').click()

        def unidade_atualizada(navegador):
            linha = navegador.find_element(By.CSS_SELECTOR, seletor_item("ingrediente", nome))
            badge = linha.find_element(By.CSS_SELECTOR, '[data-testid="ingrediente-unidade-badge"]')
            return badge.text.strip() == "kg"

        WebDriverWait(driver, TIMEOUT).until(unidade_atualizada)
    finally:
        excluir_ingrediente(driver, nome)
