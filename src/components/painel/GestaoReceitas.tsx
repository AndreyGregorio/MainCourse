import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Ingrediente, Prato, ReceitaDetalhada } from '../../types';
import type { RotaId } from '../../lib/rotas';
import { LIMITE_PORCOES, LIMITE_QUANTIDADE } from '../../lib/constants';
import { porcoesDoPrato } from '../../lib/receita';
import {
  analisarQuantidade,
  arredondarQuantidade,
  compararNomes,
  formatarQuantidade,
  pluralizar,
} from '../../lib/utils';
import { Botao, Campo, Entrada, EstadoVazio, SecaoCard, Selecao, Selo } from '../ui/Basicos';
import { IconeEditar, IconeExcluir, IconeIngrediente, IconeReceita, IconeSeta } from '../ui/Icones';

type Props = {
  pratos: Prato[];
  ingredientes: Ingrediente[];
  receitas: ReceitaDetalhada[];
  receitasPorPrato: Map<string, ReceitaDetalhada[]>;
  aoIncluir: (pratoId: string, ingredienteId: string, quantidade: number) => Promise<boolean>;
  aoAlterar: (receitaId: string, quantidade: number) => Promise<boolean>;
  aoAjustarRendimento: (pratoId: string, porcoes: number) => Promise<boolean>;
  aoExcluir: (receita: ReceitaDetalhada) => Promise<boolean>;
  irPara: (rota: RotaId) => void;
  pratoInicial?: string;
};

const TODOS = 'todos';

/** SM-01: a quantidade pode ser informada por pessoa ou pela receita inteira. */
type ModoQuantidade = 'pessoa' | 'receita';

export function GestaoReceitas({
  pratos,
  ingredientes,
  receitas,
  receitasPorPrato,
  aoIncluir,
  aoAlterar,
  aoAjustarRendimento,
  aoExcluir,
  irPara,
  pratoInicial,
}: Props) {
  const [pratoId, setPratoId] = useState(pratoInicial ?? '');
  const [ingredienteId, setIngredienteId] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [modo, setModo] = useState<ModoQuantidade>('pessoa');
  const [editando, setEditando] = useState<ReceitaDetalhada | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [filtroPrato, setFiltroPrato] = useState<string>(pratoInicial ?? TODOS);
  const [filtroIngrediente, setFiltroIngrediente] = useState<string>(TODOS);

  const completo = pratos.length > 0 && ingredientes.length > 0;

  /** Prato do formulário: o escolhido, o que está em edição ou o primeiro da lista. */
  const pratoAtual = editando ? editando.prato_id : pratoId || pratos[0]?.id || '';

  const usadosNoPrato = useMemo(() => {
    const mapa = new Map<string, ReceitaDetalhada>();
    for (const receita of receitasPorPrato.get(pratoAtual) ?? []) {
      mapa.set(receita.ingrediente_id, receita);
    }
    return mapa;
  }, [pratoAtual, receitasPorPrato]);

  const pratoAtualObj = pratos.find((prato) => prato.id === pratoAtual);
  const porcoes = porcoesDoPrato(pratoAtualObj);

  // O rendimento é editável aqui também: sem ele, "receita inteira" vira
  // "por pessoa" (1 porção) e o cardápio multiplica a quantidade por engano.
  // O valor digitado fica ligado ao prato selecionado; ao trocar de prato, o
  // campo volta a mostrar o rendimento gravado no cadastro.
  const [rendimentoEditado, setRendimentoEditado] = useState<{
    pratoId: string;
    valor: string;
  } | null>(null);
  const rendimento =
    rendimentoEditado?.pratoId === pratoAtual
      ? rendimentoEditado.valor
      : String(porcoes);
  const definirRendimento = (valor: string) =>
    setRendimentoEditado({ pratoId: pratoAtual, valor });

  const rendimentoNumero = Number(rendimento);
  const rendimentoValido =
    Number.isInteger(rendimentoNumero) &&
    rendimentoNumero >= 1 &&
    rendimentoNumero <= LIMITE_PORCOES;
  const rendimentoExibido = rendimentoValido ? rendimentoNumero : porcoes;

  const ingredienteSelecionado = ingredientes.find((item) => item.id === ingredienteId);
  const unidadeAtual =
    ingredienteSelecionado?.unidade_medida ?? editando?.unidade_medida ?? null;

  const grupos = useMemo(() => {
    return pratos
      .filter((prato) => filtroPrato === TODOS || prato.id === filtroPrato)
      .map((prato) => {
        const doPrato = (receitasPorPrato.get(prato.id) ?? []).filter(
          (receita) =>
            filtroIngrediente === TODOS || receita.ingrediente_id === filtroIngrediente,
        );
        return { prato, receitas: doPrato };
      })
  }, [filtroIngrediente, filtroPrato, pratos, receitasPorPrato]);

  const gruposComReceita = grupos.filter((grupo) => grupo.receitas.length > 0).length;
  const totalFiltrado = grupos.reduce((total, grupo) => total + grupo.receitas.length, 0);

  function limparFormulario() {
    setEditando(null);
    setIngredienteId('');
    setQuantidade('');
    setModo('pessoa');
    setErroForm(null);
  }

  function selecionarPrato(novoPrato: string) {
    setPratoId(novoPrato);
    setIngredienteId('');
    setErroForm(null);
    setRendimentoEditado(null);
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErroForm(null);

    // Lê o formulário do DOM: o que o usuário vê é o que é validado e salvo,
    // mesmo quando o navegador preenche um campo sem disparar o onChange.
    const formulario = new FormData(evento.currentTarget);
    const pratoForm = editando
      ? editando.prato_id
      : String(formulario.get('prato') ?? pratoAtual);
    const ingredienteForm = editando
      ? editando.ingrediente_id
      : String(formulario.get('ingrediente') ?? ingredienteId);
    const modoTexto = String(formulario.get('modo') ?? modo);
    // Na edição a quantidade já está gravada como total da receita.
    const modoForm: ModoQuantidade = editando
      ? 'receita'
      : modoTexto === 'receita'
        ? 'receita'
        : 'pessoa';

    if (!pratoForm) {
      setErroForm('Escolha o prato da receita.');
      return;
    }
    if (!ingredienteForm) {
      setErroForm('Escolha o ingrediente que entra no prato.');
      return;
    }

    const rendimentoTexto = String(formulario.get('rendimento') ?? '');
    const rendimentoNumero = Number(rendimentoTexto);
    if (
      !Number.isInteger(rendimentoNumero) ||
      rendimentoNumero < 1 ||
      rendimentoNumero > LIMITE_PORCOES
    ) {
      setErroForm(`Informe o rendimento da receita, de 1 a ${LIMITE_PORCOES} porções.`);
      return;
    }

    const valor = analisarQuantidade(String(formulario.get('quantidade') ?? ''));
    if (valor === null || valor <= 0) {
      setErroForm(
        modoForm === 'pessoa'
          ? 'Informe a quantidade por pessoa com um número maior que zero (ex.: 0,15).'
          : 'Informe a quantidade da receita inteira com um número maior que zero (ex.: 0,5).',
      );
      return;
    }

    // A receita é guardada para o rendimento do prato (SM-01). No modo "por
    // pessoa", multiplicar pelo rendimento deixa o valor equivalente.
    const total = arredondarQuantidade(
      modoForm === 'pessoa' ? valor * rendimentoNumero : valor,
    );
    const base = modoForm === 'pessoa' ? 'por pessoa' : 'da receita';
    if (total > LIMITE_QUANTIDADE) {
      setErroForm(`A quantidade ${base} pode ser no máximo ${LIMITE_QUANTIDADE}.`);
      return;
    }

    const pratoDaReceita = pratos.find((prato) => prato.id === pratoForm);
    const rendimentoAtual = porcoesDoPrato(pratoDaReceita);

    setSalvando(true);

    if (rendimentoNumero !== rendimentoAtual) {
      const ajustou = await aoAjustarRendimento(pratoForm, rendimentoNumero);
      if (!ajustou) {
        setSalvando(false);
        return;
      }
    }

    const salvou = editando
      ? await aoAlterar(editando.id, total)
      : await aoIncluir(pratoForm, ingredienteForm, total);
    setSalvando(false);

    if (salvou) {
      limparFormulario();
    }
  }

  function editar(receita: ReceitaDetalhada) {
    const pratoDaReceita = pratos.find((prato) => prato.id === receita.prato_id);
    const porcoesDaReceita = porcoesDoPrato(pratoDaReceita);
    setEditando(receita);
    setPratoId(receita.prato_id);
    setIngredienteId(receita.ingrediente_id);
    // A quantidade gravada é sempre o total da receita; mostrar "por pessoa"
    // aqui faria a edição multiplicar o valor de novo ao salvar.
    setModo('receita');
    setRendimentoEditado({
      pratoId: receita.prato_id,
      valor: String(porcoesDaReceita),
    });
    setQuantidade(formatarQuantidade(receita.quantidade));
    setErroForm(null);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-maincourse-gold">RFC03</p>
        <h1 className="font-display text-3xl font-bold text-maincourse-navy">Receitas</h1>
      </header>

      {!completo ? (
        <SecaoCard>
          <EstadoVazio
            icone="📖"
            titulo="Faltam pré-requisitos para montar receitas"
            detalhe="Cadastre pelo menos um prato e um ingrediente para começar."
          />
          <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
            <Botao type="button" onClick={() => irPara('pratos')} variante="secundario">
              Cadastrar pratos
            </Botao>
            <Botao type="button" onClick={() => irPara('ingredientes')} variante="secundario">
              Cadastrar ingredientes
            </Botao>
          </div>
        </SecaoCard>
      ) : (
        <SecaoCard>
          <div className="mb-1 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-maincourse-gold/20 text-maincourse-navy"
                aria-hidden="true"
              >
                <IconeReceita />
              </span>
              <h2 className="font-display text-xl font-bold text-maincourse-navy">
                {editando ? 'Editar quantidade' : 'Adicionar ingrediente ao prato'}
              </h2>
            </div>
            <span className="rounded-full bg-maincourse-navy/5 px-2.5 py-1 text-xs font-bold text-maincourse-navy/60">
              {receitas.length}
            </span>
          </div>
          <p className="mb-2 text-sm leading-relaxed text-maincourse-navy/55">
            {editando
              ? 'Prato e ingrediente identificam a receita e não podem ser alterados; só a quantidade muda.'
              : 'Um prato não aceita o mesmo ingrediente duas vezes. A unidade vem do cadastro do ingrediente.'}
          </p>
          {pratoAtualObj && (
            <p className="mb-4 text-xs font-semibold text-maincourse-navy/50">
              “{pratoAtualObj.nome}” · rendimento informado:{' '}
              {pluralizar(rendimentoExibido, 'porção', 'porções')}. Vale para todas as receitas
              deste prato e é salvo junto com a receita.
            </p>
          )}

          <form
            onSubmit={enviar}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:items-end xl:grid-cols-[1.05fr_1.05fr_0.85fr_0.7fr_0.9fr_auto]"
          >
            <Campo rotulo="Prato" className="min-w-0">
              <Selecao
                name="prato"
                value={pratoAtual}
                onChange={(evento) => selecionarPrato(evento.target.value)}
                disabled={Boolean(editando)}
                aria-label="Prato da receita"
              >
                <option value="">Selecione o prato…</option>
                {pratos.map((prato) => (
                  <option key={prato.id} value={prato.id}>
                    {prato.nome}
                  </option>
                ))}
              </Selecao>
            </Campo>

            <Campo
              rotulo="Ingrediente"
              className="min-w-0"
              dica={editando ? 'Não pode ser alterado nesta edição.' : undefined}
            >
              <Selecao
                name="ingrediente"
                value={ingredienteId}
                onChange={(evento) => {
                  setIngredienteId(evento.target.value);
                  setErroForm(null);
                }}
                disabled={Boolean(editando)}
                aria-label="Ingrediente da receita"
              >
                <option value="">Selecione o ingrediente…</option>
                {ingredientes.map((ingrediente) => {
                  const usado = usadosNoPrato.has(ingrediente.id);
                  return (
                    <option key={ingrediente.id} value={ingrediente.id} disabled={usado}>
                      {ingrediente.nome} ({ingrediente.unidade_medida})
                      {usado ? ' — já na receita' : ''}
                    </option>
                  );
                })}
              </Selecao>
            </Campo>

            <Campo rotulo="Informar" className="min-w-0">
              <Selecao
                name="modo"
                value={modo}
                onChange={(evento) => {
                  setModo(evento.target.value as ModoQuantidade);
                  setErroForm(null);
                }}
                disabled={Boolean(editando)}
                aria-label="Base da quantidade da receita"
              >
                <option value="pessoa">Por pessoa</option>
                <option value="receita">Receita inteira</option>
              </Selecao>
            </Campo>

            <Campo
              rotulo="Rende (porções)"
              className="min-w-0"
              dica="Vale para todas as receitas deste prato."
            >
              <Entrada
                name="rendimento"
                type="number"
                inputMode="numeric"
                min={1}
                max={LIMITE_PORCOES}
                step={1}
                value={rendimento}
                onChange={(evento) => {
                  definirRendimento(evento.target.value);
                  setErroForm(null);
                }}
                required
                aria-label="Quantas porções a receita do prato rende"
              />
            </Campo>

            <Campo
              rotulo={`${modo === 'pessoa' ? 'Quantidade por pessoa' : 'Quantidade na receita'}${
                unidadeAtual ? ` (${unidadeAtual})` : ''
              }`}
              className="min-w-0"
              dica={
                modo === 'pessoa'
                  ? 'Vale para 1 pessoa; o cardápio multiplica pelas pessoas do dia.'
                  : `Vale para a receita inteira (${pluralizar(
                      rendimentoExibido,
                      'porção',
                      'porções',
                    )}).`
              }
            >
              <Entrada
                name="quantidade"
                type="text"
                inputMode="decimal"
                value={quantidade}
                onChange={(evento) => {
                  setQuantidade(evento.target.value);
                  setErroForm(null);
                }}
                placeholder="Ex.: 0,15"
                autoComplete="off"
              />
            </Campo>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Botao
                type="submit"
                carregando={salvando}
                className="w-full lg:w-auto"
              >
                {editando ? 'Salvar' : 'Adicionar'}
              </Botao>
              {editando && (
                <Botao
                  type="button"
                  variante="secundario"
                  onClick={limparFormulario}
                  className="w-full lg:w-auto"
                >
                  Cancelar
                </Botao>
              )}
            </div>
          </form>

          {modo === 'receita' && rendimentoExibido <= 1 && (
            <p className="mt-3 rounded-lg bg-maincourse-gold/15 px-3 py-2 text-xs font-semibold leading-relaxed text-maincourse-navy">
              Com rendimento 1, “Receita inteira” e “Por pessoa” dão o mesmo resultado. Se a
              receita serve a travessa toda, informe o rendimento no campo Rende.
            </p>
          )}

          {erroForm && (
            <p
              role="alert"
              className="mt-3 rounded-lg bg-maincourse-red/10 px-3 py-2 text-sm font-semibold text-maincourse-red"
            >
              {erroForm}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-2 border-t border-maincourse-navy/10 pt-4 sm:flex-row sm:items-end">
            <Campo rotulo="Filtrar por prato" className="flex-1">
              <Selecao
                value={filtroPrato}
                onChange={(evento) => setFiltroPrato(evento.target.value)}
                aria-label="Filtrar receitas pelo prato"
              >
                <option value={TODOS}>Todos os pratos</option>
                {pratos.map((prato) => (
                  <option key={prato.id} value={prato.id}>
                    {prato.nome}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo rotulo="Filtrar por ingrediente" className="flex-1">
              <Selecao
                value={filtroIngrediente}
                onChange={(evento) => setFiltroIngrediente(evento.target.value)}
                aria-label="Filtrar receitas pelo ingrediente"
              >
                <option value={TODOS}>Todos os ingredientes</option>
                {ingredientes.map((ingrediente) => (
                  <option key={ingrediente.id} value={ingrediente.id}>
                    {ingrediente.nome}
                  </option>
                ))}
              </Selecao>
            </Campo>
          </div>

          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-lg font-bold text-maincourse-navy">
              Receitas por prato
            </h3>
            <p className="text-xs font-semibold text-maincourse-navy/45">
              {pluralizar(totalFiltrado, 'ingrediente', 'ingredientes')} em{' '}
              {pluralizar(gruposComReceita, 'prato', 'pratos')}
            </p>
          </div>

          {totalFiltrado === 0 ? (
            <div className="mt-3">
              <EstadoVazio
                icone="🍽️"
                titulo="Nenhuma receita com esses filtros"
                detalhe="Escolha outro prato/ingrediente ou adicione o primeiro vínculo no formulário acima."
              />
            </div>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {grupos
                .filter((grupo) => grupo.receitas.length > 0)
                .map(({ prato, receitas: doPrato }) => (
                  <li
                    key={prato.id}
                    className="overflow-hidden rounded-xl border border-maincourse-navy/10 bg-maincourse-cream/40"
                  >
                    <div className="flex flex-wrap items-center gap-2 border-b border-maincourse-navy/10 bg-white/70 px-3 py-2">
                      <span className="min-w-0 flex-1 font-semibold text-maincourse-navy">
                        {prato.nome}
                      </span>
                      <Selo tom="gold">
                        {doPrato.length} ingrediente{doPrato.length > 1 ? 's' : ''}
                      </Selo>
                    </div>
                    <ul className="divide-y divide-maincourse-navy/5">
                      {[...doPrato]
                        .sort((a, b) => compararNomes(a.ingrediente_nome, b.ingrediente_nome))
                        .map((receita) => (
                          <li
                            key={receita.id}
                            className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5"
                          >
                            <IconeIngrediente className="h-4 w-4 shrink-0 text-maincourse-gold" />
                            <span className="min-w-0 flex-1 text-sm text-maincourse-navy">
                              {receita.ingrediente_nome}
                            </span>
                            <span
                              className="text-sm font-bold text-maincourse-navy"
                            >
                              {formatarQuantidade(receita.quantidade)}{' '}
                              {receita.unidade_medida}
                            </span>
                            <span className="text-xs text-maincourse-navy/45">
                              na receita · rende{' '}
                              {pluralizar(porcoesDoPrato(prato), 'porção', 'porções')}
                            </span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => editar(receita)}
                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-bold text-maincourse-navy transition hover:bg-white"
                                aria-label={`Editar a quantidade de ${receita.ingrediente_nome} em ${receita.prato_nome}`}
                              >
                                <IconeEditar />
                                <span className="hidden sm:inline">Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => void aoExcluir(receita)}
                                className="inline-flex items-center rounded-lg px-2.5 py-2 text-sm font-bold text-maincourse-red transition hover:bg-white"
                                aria-label={`Remover ${receita.ingrediente_nome} da receita de ${receita.prato_nome}`}
                              >
                                <IconeExcluir />
                              </button>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </li>
                ))}
            </ul>
          )}

          {filtroIngrediente === TODOS && filtroPrato === TODOS && pratos.length > gruposComReceita && (
            <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-maincourse-navy/45">
              <IconeSeta className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {pluralizar(pratos.length - gruposComReceita, 'prato ainda', 'pratos ainda')} sem
              receita. Escolha o prato no formulário acima para montar a ficha técnica.
            </p>
          )}
        </SecaoCard>
      )}
    </div>
  );
}
