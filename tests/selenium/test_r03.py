"""Testes E2E da Release 3 — cardápio e lista de compras (CT17 a CT22)."""

import uuid

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait

from apoio import (
    TIMEOUT,
    abrir_aba,
    clicar,
    criar_dia_cardapio,
    criar_ingrediente,
    criar_prato,
    criar_receita,
    dias_livres,
    esperar_atributo,
    esperar_texto,
    esperar_visivel,
    excluir_dia_cardapio,
    excluir_ingrediente,
    excluir_prato,
    item_compra,
    limpar_marcacoes,
    marcar_compra,
    quantidade_do_dia,
    seletor_item,
)

TODOS = "Todos os dias"


# ---------------------------------------------------------------------------
# Apoio local
# ---------------------------------------------------------------------------


def novo_prefixo():
    return f"R03 {uuid.uuid4().hex[:6]}"


def preparar_base(driver, base_url, pratos_spec):
    """Cria pratos, ingredientes e receitas de uma vez.

    `pratos_spec` é uma lista de `(prato, [(ingrediente, unidade, quantidade)])`.
    Prato com lista vazia é criado sem receita (para testar o RFS17).
    """
    ingredientes = {}
    for prato, receitas in pratos_spec:
        for ingrediente, unidade, _ in receitas:
            ingredientes[ingrediente] = unidade

    abrir_aba(driver, base_url, "pratos")
    for prato, _ in pratos_spec:
        criar_prato(driver, prato)

    abrir_aba(driver, base_url, "ingredientes")
    for ingrediente, unidade in ingredientes.items():
        criar_ingrediente(driver, ingrediente, unidade)

    abrir_aba(driver, base_url, "receitas")
    for prato, receitas in pratos_spec:
        for ingrediente, unidade, quantidade in receitas:
            criar_receita(driver, prato, f"{ingrediente} ({unidade})", quantidade)

    return list(ingredientes)


def limpar_base(driver, base_url, pratos, ingredientes, dias):
    """Limpeza tolerante a falhas: não deixa lixo para os próximos testes."""
    try:
        abrir_aba(driver, base_url, "cardapio")
        for dia in dias:
            excluir_dia_cardapio(driver, dia)

        abrir_aba(driver, base_url, "compras")
        for ingrediente in ingredientes:
            seletor = f'[data-testid="compras-item"][data-ingrediente="{ingrediente}"]'
            if not driver.find_elements(By.CSS_SELECTOR, seletor):
                continue
            if item_compra(driver, ingrediente).get_attribute("data-comprado") == "true":
                marcar_compra(driver, ingrediente, comprado=False)

        abrir_aba(driver, base_url, "pratos")
        for prato in pratos:
            excluir_prato(driver, prato)

        abrir_aba(driver, base_url, "ingredientes")
        for ingrediente in ingredientes:
            excluir_ingrediente(driver, ingrediente)
    except Exception as erro:  # noqa: BLE001 - a limpeza nunca deve mascarar a falha do teste
        print(f"Limpeza incompleta: {erro}")


def escolher_dias_livres(driver, quantidade):
    livres = dias_livres(driver)
    if len(livres) < quantidade:
        pytest.fail(
            "O cardápio já tem outros dias planejados. Rode a suíte com o emulador limpo "
            f"(livres: {livres})."
        )
    return livres[:quantidade]


def itens_da_lista(driver):
    return driver.find_elements(By.CSS_SELECTOR, '[data-testid="compras-item"]')


def nomes_da_lista(driver):
    return [item.get_attribute("data-ingrediente") for item in itens_da_lista(driver)]


def quantidade_na_lista(driver, ingrediente):
    item = item_compra(driver, ingrediente)
    return item.find_element(By.CSS_SELECTOR, '[data-testid="compras-quantidade-valor"]').text


def texto_do_item(driver, ingrediente):
    return item_compra(driver, ingrediente).text


def resumo_unidade(driver, unidade):
    return driver.find_element(
        By.CSS_SELECTOR,
        f'[data-testid="compras-resumo-unidade"][data-unidade="{unidade}"]',
    ).text


# ---------------------------------------------------------------------------
# CT17 — incluir dia do cardápio
# ---------------------------------------------------------------------------


def test_incluir_dia_cardapio(driver, base_url):
    """CT17/RFS17: inclui um dia só com prato que tem receita."""
    prefixo = novo_prefixo()
    prato_com_receita = f"{prefixo} Prato A"
    prato_sem_receita = f"{prefixo} Prato B"
    ingrediente = f"{prefixo} Ingrediente"
    dias_criados = []

    preparar_base(
        driver,
        base_url,
        [
            (prato_com_receita, [(ingrediente, "kg", "0,5")]),
            (prato_sem_receita, []),
        ],
    )

    try:
        abrir_aba(driver, base_url, "cardapio")
        opcoes_prato = [
            opcao.text
            for opcao in Select(
                driver.find_element(By.CSS_SELECTOR, '[data-testid="cardapio-prato"]')
            ).options
        ]
        assert prato_com_receita in opcoes_prato
        assert prato_sem_receita not in opcoes_prato, "Prato sem receita não pode ser escolhido"

        dia = escolher_dias_livres(driver, 1)[0]
        criar_dia_cardapio(driver, dia, prato_com_receita, 2)
        dias_criados.append(dia)

        item = esperar_visivel(
            driver, f'[data-testid="cardapio-item"][data-dia="{dia}"]'
        )
        assert prato_com_receita in item.text
        assert "2 pessoas" in item.text
        assert "1 ingrediente" in item.text
        assert quantidade_do_dia(driver, dia, ingrediente) == "1 kg"

        opcoes_dia = [
            opcao.text
            for opcao in Select(
                driver.find_element(By.CSS_SELECTOR, '[data-testid="cardapio-dia"]')
            ).options
        ]
        assert dia not in opcoes_dia, "O dia já preenchido não volta a aparecer no formulário"
    finally:
        limpar_base(
            driver,
            base_url,
            [prato_com_receita, prato_sem_receita],
            [ingrediente],
            dias_criados,
        )


# ---------------------------------------------------------------------------
# CT18 — consultar dia do cardápio
# ---------------------------------------------------------------------------


def test_consultar_cardapio(driver, base_url):
    """CT18/RFS18: ordena de segunda a sexta, filtra por dia e mostra os ingredientes."""
    prefixo = novo_prefixo()
    prato = f"{prefixo} Prato"
    ingrediente = f"{prefixo} Ingrediente"
    dias_criados = []

    preparar_base(driver, base_url, [(prato, [(ingrediente, "un", "1")])])

    try:
        abrir_aba(driver, base_url, "cardapio")
        dias = escolher_dias_livres(driver, 4)
        for dia, pessoas in zip(dias[:3], [2, 3, 1]):
            criar_dia_cardapio(driver, dia, prato, pessoas)
            dias_criados.append(dia)

        cartoes = [
            elemento.get_attribute("data-dia")
            for elemento in driver.find_elements(
                By.CSS_SELECTOR,
                '[data-testid="cardapio-item"], [data-testid="cardapio-livre"]',
            )
        ]
        assert cartoes == ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]

        Select(
            driver.find_element(By.CSS_SELECTOR, '[data-testid="cardapio-filtro-dia"]')
        ).select_by_value(dias[1])
        WebDriverWait(driver, TIMEOUT).until(
            lambda navegador: len(
                navegador.find_elements(By.CSS_SELECTOR, '[data-testid="cardapio-item"]')
            )
            == 1
        )
        visivel = driver.find_element(By.CSS_SELECTOR, '[data-testid="cardapio-item"]')
        assert visivel.get_attribute("data-dia") == dias[1]
        assert "3 pessoas" in visivel.text

        livre = dias[3]
        Select(
            driver.find_element(By.CSS_SELECTOR, '[data-testid="cardapio-filtro-dia"]')
        ).select_by_value(livre)
        esperar_visivel(driver, f'[data-testid="cardapio-livre"][data-dia="{livre}"]')
        assert not driver.find_elements(By.CSS_SELECTOR, '[data-testid="cardapio-item"]')

        Select(
            driver.find_element(By.CSS_SELECTOR, '[data-testid="cardapio-filtro-dia"]')
        ).select_by_visible_text(TODOS)
        assert len(driver.find_elements(By.CSS_SELECTOR, '[data-testid="cardapio-item"]')) == 3
        assert len(driver.find_elements(By.CSS_SELECTOR, '[data-testid="cardapio-livre"]')) == 2
    finally:
        limpar_base(driver, base_url, [prato], [ingrediente], dias_criados)


# ---------------------------------------------------------------------------
# CT19 — alterar dia do cardápio
# ---------------------------------------------------------------------------


def test_alterar_dia_cardapio(driver, base_url):
    """CT19/RFS19: o dia não muda; trocar prato/pessoas recalcula a lista."""
    prefixo = novo_prefixo()
    prato_a = f"{prefixo} Prato A"
    prato_b = f"{prefixo} Prato B"
    ingrediente_a = f"{prefixo} Ingrediente A"
    ingrediente_b = f"{prefixo} Ingrediente B"
    dias_criados = []

    preparar_base(
        driver,
        base_url,
        [
            (prato_a, [(ingrediente_a, "kg", "0,1")]),
            (prato_b, [(ingrediente_b, "un", "2")]),
        ],
    )

    try:
        abrir_aba(driver, base_url, "cardapio")
        dia = escolher_dias_livres(driver, 1)[0]
        criar_dia_cardapio(driver, dia, prato_a, 2)
        dias_criados.append(dia)

        clicar(driver, esperar_visivel(driver, '[data-testid="cardapio-editar"]'))
        selecao_dia = esperar_visivel(driver, '[data-testid="cardapio-dia"]')
        assert selecao_dia.get_attribute("disabled") == "true", "O dia é imutável na edição (RFS19)"
        assert selecao_dia.get_attribute("value") == dia

        Select(
            driver.find_element(By.CSS_SELECTOR, '[data-testid="cardapio-prato"]')
        ).select_by_visible_text(prato_b)
        campo = esperar_visivel(driver, '[data-testid="cardapio-pessoas"]')
        campo.clear()
        campo.send_keys("3")
        clicar(driver, driver.find_element(By.CSS_SELECTOR, '[data-testid="cardapio-adicionar"]'))

        esperar_atributo(
            driver,
            f'[data-testid="cardapio-item"][data-dia="{dia}"]',
            "data-prato",
            prato_b,
        )
        item = driver.find_element(
            By.CSS_SELECTOR, f'[data-testid="cardapio-item"][data-dia="{dia}"]'
        )
        assert "3 pessoas" in item.text
        assert quantidade_do_dia(driver, dia, ingrediente_b) == "6 un"

        abrir_aba(driver, base_url, "compras")
        assert quantidade_na_lista(driver, ingrediente_b) == "6"
        assert not driver.find_elements(
            By.CSS_SELECTOR,
            f'[data-testid="compras-item"][data-ingrediente="{ingrediente_a}"]',
        )
    finally:
        limpar_base(driver, base_url, [prato_a, prato_b], [ingrediente_a, ingrediente_b], dias_criados)


# ---------------------------------------------------------------------------
# CT20 — excluir dia do cardápio
# ---------------------------------------------------------------------------


def test_excluir_dia_cardapio(driver, base_url):
    """CT20/RFS20: excluir o dia libera a semana e tira os itens da lista."""
    prefixo = novo_prefixo()
    prato = f"{prefixo} Prato"
    ingrediente = f"{prefixo} Ingrediente"
    dias_criados = []

    preparar_base(driver, base_url, [(prato, [(ingrediente, "kg", "0,5")])])

    try:
        abrir_aba(driver, base_url, "cardapio")
        dias = escolher_dias_livres(driver, 2)
        criar_dia_cardapio(driver, dias[0], prato, 2)
        criar_dia_cardapio(driver, dias[1], prato, 1)
        dias_criados.extend(dias)

        abrir_aba(driver, base_url, "compras")
        assert quantidade_na_lista(driver, ingrediente) == "1,5"

        abrir_aba(driver, base_url, "cardapio")
        excluir_dia_cardapio(driver, dias[0])
        dias_criados.remove(dias[0])
        assert "Livre" in driver.find_element(
            By.CSS_SELECTOR, f'[data-testid="cardapio-livre"][data-dia="{dias[0]}"]'
        ).text

        abrir_aba(driver, base_url, "compras")
        assert quantidade_na_lista(driver, ingrediente) == "0,5"

        abrir_aba(driver, base_url, "cardapio")
        excluir_dia_cardapio(driver, dias[1])
        dias_criados.remove(dias[1])

        abrir_aba(driver, base_url, "compras")
        assert not driver.find_elements(
            By.CSS_SELECTOR,
            f'[data-testid="compras-item"][data-ingrediente="{ingrediente}"]',
        )
    finally:
        limpar_base(driver, base_url, [prato], [ingrediente], dias_criados)


# ---------------------------------------------------------------------------
# CT21 — lista de compras da semana
# ---------------------------------------------------------------------------


def test_lista_de_compras(driver, base_url):
    """CT21/RF01: quantidade por pessoa × pessoas, dias, pratos e filtro por dia."""
    prefixo = novo_prefixo()
    prato_1 = f"{prefixo} Prato 1"
    prato_2 = f"{prefixo} Prato 2"
    ing_a = f"{prefixo} Ingrediente A"
    ing_b = f"{prefixo} Ingrediente B"
    ing_c = f"{prefixo} Ingrediente C"
    dias_criados = []

    preparar_base(
        driver,
        base_url,
        [
            (prato_1, [(ing_a, "kg", "0,15"), (ing_b, "un", "1")]),
            (prato_2, [(ing_a, "kg", "0,2"), (ing_c, "L", "0,5")]),
        ],
    )

    try:
        abrir_aba(driver, base_url, "cardapio")
        dias = escolher_dias_livres(driver, 2)
        criar_dia_cardapio(driver, dias[0], prato_1, 2)
        criar_dia_cardapio(driver, dias[1], prato_2, 3)
        dias_criados.extend(dias)

        abrir_aba(driver, base_url, "compras")
        assert nomes_da_lista(driver) == [ing_a, ing_b, ing_c], "A lista é alfabética (RF01)"
        assert quantidade_na_lista(driver, ing_a) == "0,9"
        assert quantidade_na_lista(driver, ing_b) == "2"
        assert quantidade_na_lista(driver, ing_c) == "1,5"

        item_a = texto_do_item(driver, ing_a)
        assert prato_1 in item_a and prato_2 in item_a
        assert len(driver.find_elements(By.CSS_SELECTOR, '[data-testid="compras-item"]')) == 3

        filtro = Select(
            driver.find_element(By.CSS_SELECTOR, '[data-testid="compras-filtro-dia"]')
        )
        filtro.select_by_value(dias[0])
        WebDriverWait(driver, TIMEOUT).until(lambda navegador: len(itens_da_lista(navegador)) == 2)
        assert nomes_da_lista(driver) == [ing_a, ing_b]
        assert quantidade_na_lista(driver, ing_a) == "0,3"
        assert quantidade_na_lista(driver, ing_b) == "2"

        filtro.select_by_value(dias[1])
        WebDriverWait(driver, TIMEOUT).until(lambda navegador: len(itens_da_lista(navegador)) == 2)
        assert nomes_da_lista(driver) == [ing_a, ing_c]
        assert quantidade_na_lista(driver, ing_a) == "0,6"
        assert quantidade_na_lista(driver, ing_c) == "1,5"

        filtro.select_by_visible_text("Semana inteira")
        WebDriverWait(driver, TIMEOUT).until(lambda navegador: len(itens_da_lista(navegador)) == 3)
        assert quantidade_na_lista(driver, ing_a) == "0,9"
    finally:
        limpar_base(
            driver,
            base_url,
            [prato_1, prato_2],
            [ing_a, ing_b, ing_c],
            dias_criados,
        )


# ---------------------------------------------------------------------------
# CT22 — resumo por unidade e marcações
# ---------------------------------------------------------------------------


def test_resumo_por_unidade_e_marcacoes(driver, base_url):
    """CT22/RF02: total por unidade, itens comprados, texto e limpeza das marcações."""
    prefixo = novo_prefixo()
    prato = f"{prefixo} Prato"
    ing_kg = f"{prefixo} Ingrediente kg"
    ing_un = f"{prefixo} Ingrediente un"
    dias_criados = []

    preparar_base(
        driver,
        base_url,
        [(prato, [(ing_kg, "kg", "0,5"), (ing_un, "un", "2")])],
    )

    try:
        abrir_aba(driver, base_url, "cardapio")
        dia = escolher_dias_livres(driver, 1)[0]
        criar_dia_cardapio(driver, dia, prato, 2)
        dias_criados.append(dia)

        abrir_aba(driver, base_url, "compras")
        assert "0 de 2 itens comprados" in driver.find_element(
            By.CSS_SELECTOR, '[data-testid="compras-progresso"]'
        ).text
        assert "1 kg" in resumo_unidade(driver, "kg")
        assert "4 un" in resumo_unidade(driver, "un")

        marcar_compra(driver, ing_kg, True)
        marcar_compra(driver, ing_un, True)
        assert "2 de 2 itens comprados" in driver.find_element(
            By.CSS_SELECTOR, '[data-testid="compras-progresso"]'
        ).text
        assert "1/1" in resumo_unidade(driver, "kg")
        assert "1/1" in resumo_unidade(driver, "un")

        clicar(driver, esperar_visivel(driver, '[data-testid="compras-texto"]'))
        texto = esperar_visivel(driver, '[data-testid="compras-texto-conteudo"]').text
        assert "[x]" in texto
        assert ing_kg in texto and ing_un in texto

        limpar_marcacoes(driver)
        assert "0 de 2 itens comprados" in driver.find_element(
            By.CSS_SELECTOR, '[data-testid="compras-progresso"]'
        ).text
        assert item_compra(driver, ing_kg).get_attribute("data-comprado") == "false"
        assert item_compra(driver, ing_un).get_attribute("data-comprado") == "false"
    finally:
        limpar_base(driver, base_url, [prato], [ing_kg, ing_un], dias_criados)


# ---------------------------------------------------------------------------
# RFS03/RFS04 — reflexos no cardápio
# ---------------------------------------------------------------------------


def test_renomear_e_excluir_prato_no_cardapio(driver, base_url):
    """RFS03/RFS04: renomear acompanha o cardápio; excluir prato usado é bloqueado."""
    prefixo = novo_prefixo()
    prato = f"{prefixo} Prato"
    prato_novo = f"{prefixo} Prato Renomeado"
    ingrediente = f"{prefixo} Ingrediente"
    dias_criados = []

    preparar_base(driver, base_url, [(prato, [(ingrediente, "kg", "0,2")])])

    try:
        abrir_aba(driver, base_url, "cardapio")
        dia = escolher_dias_livres(driver, 1)[0]
        criar_dia_cardapio(driver, dia, prato, 2)
        dias_criados.append(dia)

        abrir_aba(driver, base_url, "pratos")
        clicar(
            driver,
            esperar_visivel(driver, f'[data-testid="prato-item"][data-nome="{prato}"]')
            .find_element(By.CSS_SELECTOR, '[data-testid="prato-editar"]'),
        )
        campo = esperar_visivel(driver, '[data-testid="prato-nome"]')
        campo.clear()
        campo.send_keys(prato_novo)
        clicar(driver, driver.find_element(By.CSS_SELECTOR, '[data-testid="prato-adicionar"]'))
        esperar_visivel(driver, seletor_item("prato", prato_novo))

        abrir_aba(driver, base_url, "cardapio")
        esperar_atributo(
            driver,
            f'[data-testid="cardapio-item"][data-dia="{dia}"]',
            "data-prato",
            prato_novo,
        )
        assert prato_novo in driver.find_element(
            By.CSS_SELECTOR, f'[data-testid="cardapio-item"][data-dia="{dia}"]'
        ).text

        abrir_aba(driver, base_url, "compras")
        assert prato_novo in texto_do_item(driver, ingrediente)

        abrir_aba(driver, base_url, "pratos")
        clicar(
            driver,
            esperar_visivel(driver, f'[data-testid="prato-item"][data-nome="{prato_novo}"]')
            .find_element(By.CSS_SELECTOR, '[data-testid="prato-excluir"]'),
        )
        esperar_texto(driver, "está no cardápio")
        assert not driver.find_elements(By.CSS_SELECTOR, '[data-testid="confirmar"]')
        assert driver.find_elements(By.CSS_SELECTOR, seletor_item("prato", prato_novo))

        abrir_aba(driver, base_url, "cardapio")
        excluir_dia_cardapio(driver, dia)
        dias_criados.remove(dia)

        abrir_aba(driver, base_url, "pratos")
        excluir_prato(driver, prato_novo)
        assert not driver.find_elements(By.CSS_SELECTOR, seletor_item("prato", prato_novo))
    finally:
        limpar_base(driver, base_url, [prato, prato_novo], [ingrediente], dias_criados)
