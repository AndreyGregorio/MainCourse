import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Ingrediente, Prato, ReceitaDetalhada } from '../../types';
import type { RotaId } from '../../lib/rotas';
import { LIMITE_QUANTIDADE } from '../../lib/constants';
import {
  analisarQuantidade,
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
  aoExcluir: (receita: ReceitaDetalhada) => Promise<boolean>;
  irPara: (rota: RotaId) => void;
  pratoInicial?: string;
};

const TODOS = 'todos';

export function GestaoReceitas({
  pratos,
  ingredientes,
  receitas,
  receitasPorPrato,
  aoIncluir,
  aoAlterar,
  aoExcluir,
  irPara,
  pratoInicial,
}: Props) {
  const [pratoId, setPratoId] = useState(pratoInicial ?? '');
  const [ingredienteId, setIngredienteId] = useState('');
  const [quantidade, setQuantidade] = useState('');
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
    setErroForm(null);
  }

  function selecionarPrato(novoPrato: string) {
    setPratoId(novoPrato);
    setIngredienteId('');
    setErroForm(null);
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErroForm(null);

    if (!pratoAtual) {
      setErroForm('Escolha o prato da receita.');
      return;
    }
    if (!editando && !ingredienteId) {
      setErroForm('Escolha o ingrediente que entra no prato.');
      return;
    }

    const valor = analisarQuantidade(quantidade);
    if (valor === null || valor <= 0) {
      setErroForm('Informe a quantidade por pessoa com um número maior que zero (ex.: 0,15).');
      return;
    }
    if (valor > LIMITE_QUANTIDADE) {
      setErroForm(`A quantidade por pessoa pode ser no máximo ${LIMITE_QUANTIDADE}.`);
      return;
    }

    setSalvando(true);
    const salvou = editando
      ? await aoAlterar(editando.id, valor)
      : await aoIncluir(pratoAtual, ingredienteId, valor);
    setSalvando(false);

    if (salvou) {
      limparFormulario();
    }
  }

  function editar(receita: ReceitaDetalhada) {
    setEditando(receita);
    setPratoId(receita.prato_id);
    setIngredienteId(receita.ingrediente_id);
    setQuantidade(formatarQuantidade(receita.quantidade_por_pessoa));
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
          <p className="mb-4 text-sm leading-relaxed text-maincourse-navy/55">
            {editando
              ? 'Prato e ingrediente identificam a receita e não podem ser alterados; só a quantidade por pessoa muda.'
              : 'Um prato não aceita o mesmo ingrediente duas vezes. A unidade vem do cadastro do ingrediente.'}
          </p>

          <form
            onSubmit={enviar}
            data-testid="receita-form"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_0.8fr_auto] lg:items-end"
          >
            <Campo rotulo="Prato" className="min-w-0">
              <Selecao
                value={pratoAtual}
                onChange={(evento) => selecionarPrato(evento.target.value)}
                disabled={Boolean(editando)}
                data-testid="receita-prato"
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
                value={ingredienteId}
                onChange={(evento) => {
                  setIngredienteId(evento.target.value);
                  setErroForm(null);
                }}
                disabled={Boolean(editando)}
                data-testid="receita-ingrediente"
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

            <Campo
              rotulo={`Quantidade por pessoa${unidadeAtual ? ` (${unidadeAtual})` : ''}`}
              className="min-w-0"
            >
              <Entrada
                type="text"
                inputMode="decimal"
                value={quantidade}
                onChange={(evento) => {
                  setQuantidade(evento.target.value);
                  setErroForm(null);
                }}
                placeholder="Ex.: 0,15"
                autoComplete="off"
                data-testid="receita-quantidade"
              />
            </Campo>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Botao
                type="submit"
                carregando={salvando}
                className="w-full lg:w-auto"
                data-testid="receita-adicionar"
              >
                {editando ? 'Salvar' : 'Adicionar'}
              </Botao>
              {editando && (
                <Botao
                  type="button"
                  variante="secundario"
                  onClick={limparFormulario}
                  className="w-full lg:w-auto"
                  data-testid="receita-cancelar"
                >
                  Cancelar
                </Botao>
              )}
            </div>
          </form>

          {erroForm && (
            <p
              role="alert"
              data-testid="receita-erro"
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
                data-testid="receita-filtro-prato"
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
                data-testid="receita-filtro-ingrediente"
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
            <p className="text-xs font-semibold text-maincourse-navy/45" data-testid="receita-resumo">
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
                    data-testid="receita-grupo"
                    data-prato={prato.nome}
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
                            data-testid="receita-item"
                            data-prato={receita.prato_nome}
                            data-ingrediente={receita.ingrediente_nome}
                            className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5"
                          >
                            <IconeIngrediente className="h-4 w-4 shrink-0 text-maincourse-gold" />
                            <span className="min-w-0 flex-1 text-sm text-maincourse-navy">
                              {receita.ingrediente_nome}
                            </span>
                            <span
                              className="text-sm font-bold text-maincourse-navy"
                              data-testid="receita-quantidade-valor"
                            >
                              {formatarQuantidade(receita.quantidade_por_pessoa)}{' '}
                              {receita.unidade_medida}
                            </span>
                            <span className="text-xs text-maincourse-navy/45">/ pessoa</span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => editar(receita)}
                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-bold text-maincourse-navy transition hover:bg-white"
                                aria-label={`Editar a quantidade de ${receita.ingrediente_nome} em ${receita.prato_nome}`}
                                data-testid="receita-editar"
                              >
                                <IconeEditar />
                                <span className="hidden sm:inline">Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => void aoExcluir(receita)}
                                className="inline-flex items-center rounded-lg px-2.5 py-2 text-sm font-bold text-maincourse-red transition hover:bg-white"
                                aria-label={`Remover ${receita.ingrediente_nome} da receita de ${receita.prato_nome}`}
                                data-testid="receita-excluir"
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
