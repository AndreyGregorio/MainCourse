"""Testes E2E da Release 2 do MainCourse (Selenium + pytest).

Cobrem as receitas (RFS09 a RFS12) e a despensa (RFS13 a RFS16), além dos
reflexos nos cadastros da R01: renomear/excluir prato com receitas e o bloqueio
de excluir ingrediente usado em receita (RFS03, RFS04 e RFS08).

Os testes criam e excluem registros reais no Firestore apontado pelo build; cada
teste usa nomes únicos e limpa o que criou no bloco `finally`.
"""

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait

from apoio import (
    TIMEOUT,
    abrir_aba,
    abrir_app,
    clicar,
    confirmar,
    criar_ingrediente,
    criar_item_despensa,
    criar_prato,
    criar_receita,
    esperar_opcao,
    esperar_sumir,
    esperar_texto,
    esperar_visivel,
    excluir_ingrediente,
    excluir_item_despensa,
    excluir_prato,
    linha_receita,
    nome_unico,
    seletor_item,
)


def preparar_receita(driver, base_url, quantidade_ingredientes=2):
    """Cria prato e ingredientes únicos e abre a aba de receitas."""
    prato = nome_unico("Prato R02")
    abrir_aba(driver, base_url, "pratos")
    criar_prato(driver, prato)

    ingredientes = [nome_unico("Ingrediente R02") for _ in range(quantidade_ingredientes)]
    abrir_aba(driver, base_url, "ingredientes")
    for nome in ingredientes:
        criar_ingrediente(driver, nome, "kg")

    abrir_aba(driver, base_url, "receitas")
    return prato, ingredientes


def limpar_receita(driver, base_url, prato, ingredientes):
    """Exclui o prato (leva as receitas) e depois os ingredientes."""
    abrir_aba(driver, base_url, "pratos")
    excluir_prato(driver, prato)
    abrir_aba(driver, base_url, "ingredientes")
    for nome in ingredientes:
        excluir_ingrediente(driver, nome)


def test_incluir_receita(driver, base_url):
    """RFS09 / CT09: inclui o vínculo com quantidade por pessoa e impede repetir."""
    prato, [ingrediente] = preparar_receita(driver, base_url, 1)

    try:
        criar_receita(driver, prato, f"{ingrediente} (kg)", "0,15")
        assert linha_receita(driver, ingrediente, "0,15 kg")
        esperar_texto(driver, "1 ingrediente")

        selecao = Select(driver.find_element(By.CSS_SELECTOR, '[data-testid="receita-ingrediente"]'))
        repetida = next(
            opcao for opcao in selecao.options if opcao.text.strip() == f"{ingrediente} (kg) — já na receita"
        )
        assert repetida.get_attribute("disabled") == "true", (
            "O mesmo ingrediente não pode entrar duas vezes no prato (RFS09)."
        )
    finally:
        limpar_receita(driver, base_url, prato, [ingrediente])


def test_consultar_receitas(driver, base_url):
    """RFS10 / CT10: agrupa por prato, ordena por ingrediente e filtra."""
    prato, ingredientes = preparar_receita(driver, base_url, 2)
    primeiro, segundo = sorted(ingredientes)

    try:
        # Insere fora da ordem alfabética para conferir a ordenação da consulta.
        criar_receita(driver, prato, f"{segundo} (kg)", "1")
        linha_receita(driver, segundo)
        criar_receita(driver, prato, f"{primeiro} (kg)", "2")
        linha_receita(driver, primeiro)

        grupo = esperar_visivel(
            driver, f'[data-testid="receita-grupo"][data-prato="{prato}"]'
        )
        nomes = [
            item.get_attribute("data-ingrediente")
            for item in grupo.find_elements(By.CSS_SELECTOR, '[data-testid="receita-item"]')
        ]
        assert nomes == sorted(nomes), "A consulta ordena por nome do ingrediente (RFS10)."
        assert "2 ingredientes" in grupo.text

        # Filtro por ingrediente: some o outro vínculo.
        Select(
            driver.find_element(By.CSS_SELECTOR, '[data-testid="receita-filtro-ingrediente"]')
        ).select_by_visible_text(primeiro)
        WebDriverWait(driver, TIMEOUT).until(
            lambda navegador: len(
                navegador.find_elements(By.CSS_SELECTOR, '[data-testid="receita-item"]')
            )
            == 1
        )
        assert driver.find_element(By.CSS_SELECTOR, '[data-testid="receita-item"]').get_attribute(
            "data-ingrediente"
        ) == primeiro
    finally:
        limpar_receita(driver, base_url, prato, ingredientes)


def test_alterar_receita(driver, base_url):
    """RFS11 / CT11: só a quantidade muda; prato e ingrediente ficam bloqueados."""
    prato, [ingrediente] = preparar_receita(driver, base_url, 1)

    try:
        criar_receita(driver, prato, f"{ingrediente} (kg)", "0,5")
        item = esperar_visivel(
            driver, f'[data-testid="receita-item"][data-ingrediente="{ingrediente}"]'
        )
        clicar(driver, item.find_element(By.CSS_SELECTOR, '[data-testid="receita-editar"]'))

        prato_select = driver.find_element(By.CSS_SELECTOR, '[data-testid="receita-prato"]')
        ingrediente_select = driver.find_element(By.CSS_SELECTOR, '[data-testid="receita-ingrediente"]')
        assert prato_select.get_attribute("disabled") == "true"
        assert ingrediente_select.get_attribute("disabled") == "true"

        campo = esperar_visivel(driver, '[data-testid="receita-quantidade"]')
        campo.clear()
        campo.send_keys("1,25")
        clicar(driver, driver.find_element(By.CSS_SELECTOR, '[data-testid="receita-adicionar"]'))

        linha_receita(driver, ingrediente, "1,25 kg")
    finally:
        limpar_receita(driver, base_url, prato, [ingrediente])


def test_excluir_receita(driver, base_url):
    """RFS12 / CT12: exclui o vínculo sem apagar prato nem ingrediente."""
    prato, [ingrediente] = preparar_receita(driver, base_url, 1)

    try:
        criar_receita(driver, prato, f"{ingrediente} (kg)", "2")
        item = esperar_visivel(
            driver, f'[data-testid="receita-item"][data-ingrediente="{ingrediente}"]'
        )
        clicar(driver, item.find_element(By.CSS_SELECTOR, '[data-testid="receita-excluir"]'))
        confirmar(driver)
        WebDriverWait(driver, TIMEOUT).until(
            lambda navegador: not navegador.find_elements(
                By.CSS_SELECTOR, f'[data-testid="receita-item"][data-ingrediente="{ingrediente}"]'
            )
        )

        abrir_aba(driver, base_url, "pratos")
        assert driver.find_element(By.CSS_SELECTOR, seletor_item("prato", prato))
        abrir_aba(driver, base_url, "ingredientes")
        assert driver.find_element(By.CSS_SELECTOR, seletor_item("ingrediente", ingrediente))
    finally:
        limpar_receita(driver, base_url, prato, [ingrediente])


def test_ingrediente_em_receita_nao_e_excluido(driver, base_url):
    """RFS08 / CT08: bloqueio com o nome do prato e sem abrir confirmação."""
    prato, [ingrediente] = preparar_receita(driver, base_url, 1)

    try:
        criar_receita(driver, prato, f"{ingrediente} (kg)", "1")
        linha_receita(driver, ingrediente)

        abrir_aba(driver, base_url, "ingredientes")
        item = esperar_visivel(driver, seletor_item("ingrediente", ingrediente))
        clicar(driver, item.find_element(By.CSS_SELECTOR, '[data-testid="ingrediente-excluir"]'))

        esperar_texto(driver, "está nas receitas de")
        esperar_texto(driver, prato)
        assert not driver.find_elements(By.CSS_SELECTOR, '[data-testid="confirmar"]')
        assert driver.find_element(By.CSS_SELECTOR, seletor_item("ingrediente", ingrediente))
    finally:
        limpar_receita(driver, base_url, prato, [ingrediente])


def test_renomear_prato_atualiza_receita(driver, base_url):
    """RFS03: renomear o prato mantém e atualiza os vínculos da receita."""
    prato, [ingrediente] = preparar_receita(driver, base_url, 1)
    novo_nome = f"{prato} renomeado"

    try:
        criar_receita(driver, prato, f"{ingrediente} (kg)", "3")
        linha_receita(driver, ingrediente)

        abrir_aba(driver, base_url, "pratos")
        item = esperar_visivel(driver, seletor_item("prato", prato))
        clicar(driver, item.find_element(By.CSS_SELECTOR, '[data-testid="prato-editar"]'))
        campo = esperar_visivel(driver, '[data-testid="prato-nome"]')
        campo.clear()
        campo.send_keys(novo_nome)
        clicar(driver, driver.find_element(By.CSS_SELECTOR, '[data-testid="prato-adicionar"]'))
        esperar_visivel(driver, seletor_item("prato", novo_nome))

        abrir_aba(driver, base_url, "receitas")
        esperar_visivel(driver, f'[data-testid="receita-grupo"][data-prato="{novo_nome}"]')
        assert linha_receita(driver, ingrediente, "3 kg")
    finally:
        limpar_receita(driver, base_url, novo_nome, [ingrediente])


def test_excluir_prato_leva_receitas(driver, base_url):
    """RFS04: a confirmação avisa e exclui junto as receitas do prato."""
    prato, [ingrediente] = preparar_receita(driver, base_url, 1)

    try:
        criar_receita(driver, prato, f"{ingrediente} (kg)", "1")
        linha_receita(driver, ingrediente)

        abrir_aba(driver, base_url, "pratos")
        item = esperar_visivel(driver, seletor_item("prato", prato))
        clicar(driver, item.find_element(By.CSS_SELECTOR, '[data-testid="prato-excluir"]'))

        esperar_visivel(driver, '[data-testid="confirmar"]')
        assert "receita" in driver.find_element(By.CSS_SELECTOR, '[role="dialog"]').text
        confirmar(driver)
        WebDriverWait(driver, TIMEOUT).until(
            lambda navegador: not navegador.find_elements(
                By.CSS_SELECTOR, seletor_item("prato", prato)
            )
        )

        abrir_aba(driver, base_url, "receitas")
        WebDriverWait(driver, TIMEOUT).until(
            lambda navegador: not navegador.find_elements(
                By.CSS_SELECTOR, f'[data-testid="receita-item"][data-ingrediente="{ingrediente}"]'
            )
        )
    finally:
        abrir_aba(driver, base_url, "ingredientes")
        excluir_ingrediente(driver, ingrediente)


def test_incluir_item_despensa(driver, base_url):
    """RFS13 / CT13: valida nome único por categoria e aceita o mesmo nome fora dela."""
    nome = nome_unico("Item R02")
    abrir_aba(driver, base_url, "despensa")

    try:
        criar_item_despensa(driver, nome, "Limpeza", "1", "un", "armário de baixo")
        item = esperar_visivel(driver, seletor_item("despensa", nome, "Limpeza"))
        assert "armário de baixo" in item.text
        assert "Em falta" not in item.text

        # duplicado na mesma categoria (a inclusão é recusada, nada é criado)
        criar_item_despensa(driver, nome.upper(), "Limpeza", "2", "un", esperar=False)
        esperar_texto(driver, "Já existe um item")
        assert len(driver.find_elements(By.CSS_SELECTOR, seletor_item("despensa", nome, "Limpeza"))) == 1

        # mesmo nome em outra categoria é permitido
        criar_item_despensa(driver, nome, "Itens Gerais", "0", "un")
        item = esperar_visivel(driver, seletor_item("despensa", nome, "Itens Gerais"))
        assert "Em falta" in item.text
    finally:
        excluir_item_despensa(driver, nome, "Itens Gerais")
        excluir_item_despensa(driver, nome, "Limpeza")


def test_consultar_despensa(driver, base_url):
    """RFS14 / CT14: agrupa pelas categorias na ordem fixa e filtra por nome."""
    nomes = {
        "Limpeza": nome_unico("Limpeza R02"),
        "Temperos": nome_unico("Tempero R02"),
        "Salada": nome_unico("Salada R02"),
    }
    abrir_aba(driver, base_url, "despensa")

    try:
        # Cria fora da ordem das categorias para conferir o agrupamento.
        criar_item_despensa(driver, nomes["Temperos"], "Temperos", "0,5", "kg")
        criar_item_despensa(driver, nomes["Salada"], "Salada", "0", "un")
        criar_item_despensa(driver, nomes["Limpeza"], "Limpeza", "1", "un")

        categorias_padrao = ["Limpeza", "Salada", "Temperos", "Itens Gerais"]
        ordem = [
            grupo.get_attribute("data-categoria")
            for grupo in driver.find_elements(By.CSS_SELECTOR, '[data-testid="despensa-grupo"]')
        ]
        assert ordem == sorted(ordem, key=categorias_padrao.index), (
            f"A consulta segue a ordem fixa das categorias (RFS14): {ordem}"
        )

        Select(
            driver.find_element(By.CSS_SELECTOR, '[data-testid="despensa-filtro-categoria"]')
        ).select_by_visible_text("Temperos")
        esperar_visivel(driver, seletor_item("despensa", nomes["Temperos"], "Temperos"))
        esperar_sumir(driver, seletor_item("despensa", nomes["Limpeza"], "Limpeza"))
        esperar_sumir(driver, seletor_item("despensa", nomes["Salada"], "Salada"))

        Select(
            driver.find_element(By.CSS_SELECTOR, '[data-testid="despensa-filtro-categoria"]')
        ).select_by_visible_text("Todas as categorias")
        busca = esperar_visivel(driver, '[data-testid="despensa-busca"]')
        busca.send_keys(nomes["Salada"])
        esperar_visivel(driver, seletor_item("despensa", nomes["Salada"], "Salada"))
        esperar_sumir(driver, seletor_item("despensa", nomes["Temperos"], "Temperos"))
    finally:
        abrir_aba(driver, base_url, "despensa")
        for nome in nomes.values():
            excluir_item_despensa(driver, nome)


def test_alterar_item_despensa(driver, base_url):
    """RFS15 / CT15: nome bloqueado, categoria pode mudar e quantidade é ajustada."""
    nome = nome_unico("Item R02")
    abrir_aba(driver, base_url, "despensa")

    try:
        criar_item_despensa(driver, nome, "Limpeza", "1", "un")
        item = esperar_visivel(driver, seletor_item("despensa", nome, "Limpeza"))
        clicar(driver, item.find_element(By.CSS_SELECTOR, '[data-testid="despensa-editar"]'))

        campo_nome = esperar_visivel(driver, '[data-testid="despensa-nome"]')
        assert campo_nome.get_attribute("readonly") is not None

        Select(
            driver.find_element(By.CSS_SELECTOR, '[data-testid="despensa-categoria"]')
        ).select_by_value("Temperos")
        campo = esperar_visivel(driver, '[data-testid="despensa-quantidade"]')
        campo.clear()
        campo.send_keys("0")
        clicar(driver, driver.find_element(By.CSS_SELECTOR, '[data-testid="despensa-adicionar"]'))

        item = esperar_visivel(driver, seletor_item("despensa", nome, "Temperos"))
        assert "Em falta" in item.text
        assert not driver.find_elements(By.CSS_SELECTOR, seletor_item("despensa", nome, "Limpeza"))
    finally:
        excluir_item_despensa(driver, nome, "Temperos")


def test_excluir_item_despensa(driver, base_url):
    """RFS16 / CT16: exclui o item com confirmação."""
    nome = nome_unico("Item R02")
    abrir_aba(driver, base_url, "despensa")

    try:
        criar_item_despensa(driver, nome, "Itens Gerais", "3", "kg", "marca Y")
        item = esperar_visivel(driver, seletor_item("despensa", nome))
        clicar(driver, item.find_element(By.CSS_SELECTOR, '[data-testid="despensa-excluir"]'))
        confirmar(driver)
        WebDriverWait(driver, TIMEOUT).until(
            lambda navegador: not navegador.find_elements(
                By.CSS_SELECTOR, seletor_item("despensa", nome)
            )
        )
    finally:
        excluir_item_despensa(driver, nome)
