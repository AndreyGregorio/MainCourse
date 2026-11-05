"""Testes E2E da SM-01 — rendimento da receita e embalagem de compra.

O DRE (RFS09/RF01) modela a quantidade "por pessoa". A SM-01 permite informar a
receita inteira para um rendimento (ex.: 0,5 kg de massa para 8 porções) e
cadastrar a embalagem de compra (ex.: vidro de 680 g), para a lista responder
quantas embalagens comprar.
"""

from selenium.webdriver.common.by import By

from apoio import (
    abrir_aba,
    criar_dia_cardapio,
    criar_ingrediente,
    criar_prato,
    criar_receita,
    dias_livres,
    embalagem_da_lista,
    esperar_texto,
    excluir_dia_cardapio,
    excluir_ingrediente,
    excluir_prato,
    item_compra,
    linha_receita,
    nome_unico,
    quantidade_do_dia,
)


def quantidade_na_lista(driver, ingrediente):
    item = item_compra(driver, ingrediente)
    return item.find_element(By.CSS_SELECTOR, '[data-testid="compras-quantidade-valor"]').text


def limpar(driver, base_url, prato, ingredientes, dias):
    """Limpeza tolerante a falhas: não deixa lixo para os próximos testes."""
    try:
        abrir_aba(driver, base_url, "cardapio")
        for dia in dias:
            excluir_dia_cardapio(driver, dia)

        abrir_aba(driver, base_url, "pratos")
        excluir_prato(driver, prato)

        abrir_aba(driver, base_url, "ingredientes")
        for nome in ingredientes:
            excluir_ingrediente(driver, nome)
    except Exception as erro:  # noqa: BLE001 - a limpeza nunca deve mascarar a falha do teste
        print(f"Limpeza incompleta: {erro}")


def test_receita_inteira_escala_pelo_rendimento(driver, base_url):
    """SM-01/CT23: 0,5 kg para 8 porções vira 0,25 kg para 4 pessoas."""
    prefixo = nome_unico("SM01 Rendimento")
    prato = f"{prefixo} Lasanha"
    ingrediente = f"{prefixo} Massa"
    dias = []

    try:
        abrir_aba(driver, base_url, "pratos")
        criar_prato(driver, prato, porcoes=8)

        abrir_aba(driver, base_url, "ingredientes")
        criar_ingrediente(driver, ingrediente, "kg")

        abrir_aba(driver, base_url, "receitas")
        criar_receita(driver, prato, f"{ingrediente} (kg)", "0,5", modo="receita")
        assert linha_receita(driver, ingrediente, "0,5 kg")
        esperar_texto(driver, "rende 8 porções")

        abrir_aba(driver, base_url, "cardapio")
        livres = dias_livres(driver)
        assert livres, "O cardápio está cheio; rode a suíte com o emulador limpo."
        dia = livres[0]
        criar_dia_cardapio(driver, dia, prato, 4)
        dias.append(dia)
        assert quantidade_do_dia(driver, dia, ingrediente) == "0,25 kg"

        abrir_aba(driver, base_url, "compras")
        assert quantidade_na_lista(driver, ingrediente) == "0,25"
    finally:
        limpar(driver, base_url, prato, [ingrediente], dias)


def test_embalagem_arredonda_a_compra(driver, base_url):
    """SM-01/CT24: 1,5 kg com vidro de 0,68 kg vira 3 vidros (2,04 kg)."""
    prefixo = nome_unico("SM01 Embalagem")
    prato = f"{prefixo} Lasanha"
    ingrediente = f"{prefixo} Molho"
    dias = []

    try:
        abrir_aba(driver, base_url, "pratos")
        criar_prato(driver, prato, porcoes=8)

        abrir_aba(driver, base_url, "ingredientes")
        criar_ingrediente(driver, ingrediente, "kg", embalagem=("vidro 680 g", "0,68"))

        abrir_aba(driver, base_url, "receitas")
        criar_receita(driver, prato, f"{ingrediente} (kg)", "1,5", modo="receita")
        linha_receita(driver, ingrediente, "1,5 kg")

        abrir_aba(driver, base_url, "cardapio")
        livres = dias_livres(driver)
        assert livres, "O cardápio está cheio; rode a suíte com o emulador limpo."
        dia = livres[0]
        criar_dia_cardapio(driver, dia, prato, 8)
        dias.append(dia)

        abrir_aba(driver, base_url, "compras")
        assert quantidade_na_lista(driver, ingrediente) == "1,5"
        assert embalagem_da_lista(driver, ingrediente) == "comprar 3 × vidro 680 g (2,04 kg)"
    finally:
        limpar(driver, base_url, prato, [ingrediente], dias)


def test_prato_sem_rendimento_mantem_por_pessoa(driver, base_url):
    """SM-01/CT25: rendimento 1 continua por pessoa e a embalagem arredonda a compra."""
    prefixo = nome_unico("SM01 Por pessoa")
    prato = f"{prefixo} Prato"
    ingrediente = f"{prefixo} Queijo"
    dias = []

    try:
        abrir_aba(driver, base_url, "pratos")
        criar_prato(driver, prato)

        abrir_aba(driver, base_url, "ingredientes")
        criar_ingrediente(driver, ingrediente, "kg", embalagem=("pacote 1 kg", "1"))

        abrir_aba(driver, base_url, "receitas")
        criar_receita(driver, prato, f"{ingrediente} (kg)", "0,15")
        assert linha_receita(driver, ingrediente, "0,15 kg")

        abrir_aba(driver, base_url, "cardapio")
        livres = dias_livres(driver)
        assert livres, "O cardápio está cheio; rode a suíte com o emulador limpo."
        dia = livres[0]
        criar_dia_cardapio(driver, dia, prato, 6)
        dias.append(dia)
        assert quantidade_do_dia(driver, dia, ingrediente) == "0,9 kg"

        abrir_aba(driver, base_url, "compras")
        assert quantidade_na_lista(driver, ingrediente) == "0,9"
        assert embalagem_da_lista(driver, ingrediente) == "comprar 1 × pacote 1 kg (1 kg)"
    finally:
        limpar(driver, base_url, prato, [ingrediente], dias)
