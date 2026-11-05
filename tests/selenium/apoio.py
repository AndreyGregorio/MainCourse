"""Apoio comum aos testes E2E do MainCourse (Selenium + pytest)."""

import os
import time
import uuid

import pytest
from selenium.common.exceptions import (
    NoSuchElementException,
    StaleElementReferenceException,
    TimeoutException,
)
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait

TIMEOUT = int(os.getenv("E2E_TIMEOUT", "25"))

ABAS = {
    "inicio": "Painel",
    "pratos": "Pratos",
    "ingredientes": "Ingredientes",
    "receitas": "Receitas",
    "despensa": "Despensa",
}


def clicar(driver, elemento):
    """Centraliza o elemento antes do clique.

    O cabeçalho é fixo; sem centralizar, o navegador pode rolar o botão para o
    topo e o clique acabar no cabeçalho (ElementClickInterceptedException).
    """
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", elemento)
    time.sleep(0.15)
    elemento.click()


def esperar_visivel(driver, css):
    return WebDriverWait(driver, TIMEOUT).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, css))
    )


def esperar_sumir(driver, css):
    """Espera o elemento sair da tela ou do DOM."""

    def sumiu(navegador):
        try:
            return not navegador.find_element(By.CSS_SELECTOR, css).is_displayed()
        except (NoSuchElementException, StaleElementReferenceException):
            return True

    WebDriverWait(driver, TIMEOUT).until(sumiu)


def esperar_texto(driver, texto):
    """Espera um texto visível na página (avisos, toasts, erros inline)."""

    def contem(navegador):
        return texto in navegador.find_element(By.TAG_NAME, "body").text

    WebDriverWait(driver, TIMEOUT).until(contem)


def abrir_app(driver, base_url):
    """Abre o app e espera o painel carregar (login anônimo + coleções)."""
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


def abrir_aba(driver, base_url, aba):
    """Navega pela rota hash e espera a seção montar."""
    driver.get(f"{base_url}#/{aba}")
    seletor_secao = f'[data-rota="{aba}"]'
    esperar_visivel(driver, seletor_secao)
    titulo = esperar_visivel(driver, f"{seletor_secao} h1")
    assert ABAS[aba] in titulo.text, f"A aba {aba} não renderizou o título esperado."


def nome_unico(prefixo):
    return f"{prefixo} E2E {uuid.uuid4().hex[:8]}"


def seletor_item(tipo, nome, categoria=None):
    seletor = f'[data-testid="{tipo}-item"][data-nome="{nome}"]'
    if categoria:
        seletor += f'[data-categoria="{categoria}"]'
    return seletor


def confirmar(driver):
    clicar(driver, esperar_visivel(driver, '[data-testid="confirmar"]'))


def existe(driver, css):
    return bool(driver.find_elements(By.CSS_SELECTOR, css))


def esperar_campo_vazio(driver, testid):
    """Espera o formulário limpar depois de salvar (evita corrida com a gravação)."""
    seletor = f'[data-testid="{testid}"]'
    WebDriverWait(driver, TIMEOUT).until(
        lambda navegador: navegador.find_element(By.CSS_SELECTOR, seletor).get_attribute("value") == ""
    )


def criar_prato(driver, nome):
    campo = esperar_visivel(driver, '[data-testid="prato-nome"]')
    campo.clear()
    campo.send_keys(nome)
    clicar(driver, driver.find_element(By.CSS_SELECTOR, '[data-testid="prato-adicionar"]'))
    esperar_visivel(driver, seletor_item("prato", nome))
    esperar_campo_vazio(driver, "prato-nome")


def criar_ingrediente(driver, nome, unidade="kg"):
    campo_nome = esperar_visivel(driver, '[data-testid="ingrediente-nome"]')
    campo_nome.clear()
    campo_nome.send_keys(nome)
    Select(driver.find_element(By.CSS_SELECTOR, '[data-testid="ingrediente-unidade"]')).select_by_value(
        unidade
    )
    clicar(driver, driver.find_element(By.CSS_SELECTOR, '[data-testid="ingrediente-adicionar"]'))
    esperar_visivel(driver, seletor_item("ingrediente", nome))
    esperar_campo_vazio(driver, "ingrediente-nome")


def esperar_opcao(driver, testid, texto):
    """Espera a opção existir no select (os dados chegam em tempo real)."""

    def opcao_existe(navegador):
        elemento = navegador.find_element(By.CSS_SELECTOR, f'[data-testid="{testid}"]')
        return any(opcao.text.strip() == texto for opcao in Select(elemento).options)

    WebDriverWait(driver, TIMEOUT).until(opcao_existe)


def criar_receita(driver, prato, ingrediente, quantidade):
    """Inclui um ingrediente na receita do prato (o formulário deve estar visível)."""
    esperar_opcao(driver, "receita-prato", prato)
    Select(driver.find_element(By.CSS_SELECTOR, '[data-testid="receita-prato"]')).select_by_visible_text(
        prato
    )
    esperar_opcao(driver, "receita-ingrediente", ingrediente)
    Select(
        driver.find_element(By.CSS_SELECTOR, '[data-testid="receita-ingrediente"]')
    ).select_by_visible_text(ingrediente)
    campo = esperar_visivel(driver, '[data-testid="receita-quantidade"]')
    campo.clear()
    campo.send_keys(quantidade)
    clicar(driver, driver.find_element(By.CSS_SELECTOR, '[data-testid="receita-adicionar"]'))
    esperar_campo_vazio(driver, "receita-quantidade")


def linha_receita(driver, ingrediente, quantidade=None):
    """Espera a linha da receita e devolve o texto da quantidade exibida."""
    seletor = f'[data-testid="receita-item"][data-ingrediente="{ingrediente}"]'
    item = esperar_visivel(driver, seletor)
    valor = item.find_element(By.CSS_SELECTOR, '[data-testid="receita-quantidade-valor"]').text

    def conteudo_esperado(navegador):
        linha = navegador.find_element(By.CSS_SELECTOR, seletor)
        texto = linha.find_element(By.CSS_SELECTOR, '[data-testid="receita-quantidade-valor"]').text
        return quantidade is None or texto == quantidade

    WebDriverWait(driver, TIMEOUT).until(conteudo_esperado)
    return valor


def criar_item_despensa(
    driver,
    nome,
    categoria,
    quantidade,
    unidade="un",
    observacao="",
    esperar=True,
):
    campo_nome = esperar_visivel(driver, '[data-testid="despensa-nome"]')
    campo_nome.clear()
    campo_nome.send_keys(nome)
    Select(driver.find_element(By.CSS_SELECTOR, '[data-testid="despensa-categoria"]')).select_by_value(
        categoria
    )
    campo = esperar_visivel(driver, '[data-testid="despensa-quantidade"]')
    campo.clear()
    campo.send_keys(quantidade)
    Select(driver.find_element(By.CSS_SELECTOR, '[data-testid="despensa-unidade"]')).select_by_value(
        unidade
    )
    observacao_campo = driver.find_element(By.CSS_SELECTOR, '[data-testid="despensa-observacao"]')
    observacao_campo.clear()
    if observacao:
        observacao_campo.send_keys(observacao)
    clicar(driver, driver.find_element(By.CSS_SELECTOR, '[data-testid="despensa-adicionar"]'))
    if esperar:
        esperar_visivel(driver, seletor_item("despensa", nome, categoria))
        esperar_campo_vazio(driver, "despensa-nome")


def excluir_prato(driver, nome):
    try:
        item = driver.find_element(By.CSS_SELECTOR, seletor_item("prato", nome))
    except NoSuchElementException:
        return

    clicar(driver, item.find_element(By.CSS_SELECTOR, '[data-testid="prato-excluir"]'))
    confirmar(driver)
    esperar_sumir(driver, seletor_item("prato", nome))


def excluir_ingrediente(driver, nome):
    try:
        item = driver.find_element(By.CSS_SELECTOR, seletor_item("ingrediente", nome))
    except NoSuchElementException:
        return

    clicar(driver, item.find_element(By.CSS_SELECTOR, '[data-testid="ingrediente-excluir"]'))
    confirmar(driver)
    esperar_sumir(driver, seletor_item("ingrediente", nome))


def excluir_item_despensa(driver, nome, categoria=None):
    seletor = seletor_item("despensa", nome, categoria)
    try:
        item = driver.find_element(By.CSS_SELECTOR, seletor)
    except NoSuchElementException:
        return

    clicar(driver, item.find_element(By.CSS_SELECTOR, '[data-testid="despensa-excluir"]'))
    confirmar(driver)
    esperar_sumir(driver, seletor)


def excluir_receita(driver, ingrediente):
    seletor = f'[data-testid="receita-item"][data-ingrediente="{ingrediente}"]'
    try:
        item = driver.find_element(By.CSS_SELECTOR, seletor)
    except NoSuchElementException:
        return

    clicar(driver, item.find_element(By.CSS_SELECTOR, '[data-testid="receita-excluir"]'))
    confirmar(driver)
    esperar_sumir(driver, seletor)
