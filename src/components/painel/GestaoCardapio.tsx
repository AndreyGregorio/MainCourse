import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { DiaCardapio, DiaSemana, Prato, ReceitaDetalhada } from '../../types';
import type { Parametros } from '../../hooks/useRota';
import type { RotaId } from '../../lib/rotas';
import { DIAS_SEMANA, LIMITE_PESSOAS } from '../../lib/constants';
import { formatarQuantidadeComUnidade, pluralizar } from '../../lib/utils';
import { porcoesDoPrato, quantidadeParaPessoas } from '../../lib/receita';
import {
  Botao,
  Campo,
  Entrada,
  EstadoVazio,
  SecaoCard,
  Selecao,
  Selo,
} from '../ui/Basicos';
import {
  IconeAdicionar,
  IconeCardapio,
  IconeEditar,
  IconeExcluir,
  IconeReceita,
} from '../ui/Icones';

type Props = {
  cardapio: DiaCardapio[];
  cardapioPorDia: Map<DiaSemana, DiaCardapio>;
  pratos: Prato[];
  pratosComReceita: Prato[];
  receitasPorPrato: Map<string, ReceitaDetalhada[]>;
  aoIncluir: (dia: DiaSemana, pratoId: string, pessoas: number) => Promise<boolean>;
  aoAlterar: (registro: DiaCardapio, pratoId: string, pessoas: number) => Promise<boolean>;
  aoExcluir: (registro: DiaCardapio) => Promise<boolean>;
  irPara: (rota: RotaId, parametros?: Parametros) => void;
};

const TODAS = 'todas';

/** Primeiro dia ainda livre; usado para abrir o formulário já no dia certo. */
function acharDiaLivre(
  ocupados: Map<DiaSemana, DiaCardapio>,
  ignorar?: DiaSemana,
): DiaSemana {
  return DIAS_SEMANA.find((dia) => dia !== ignorar && !ocupados.has(dia)) ?? 'Segunda';
}

export function GestaoCardapio({
  cardapio,
  cardapioPorDia,
  pratos,
  pratosComReceita,
  receitasPorPrato,
  aoIncluir,
  aoAlterar,
  aoExcluir,
  irPara,
}: Props) {
  const [diaForm, setDiaForm] = useState<DiaSemana>(() => acharDiaLivre(cardapioPorDia));
  const [pratoId, setPratoId] = useState('');
  const [pessoas, setPessoas] = useState('2');
  const [editando, setEditando] = useState<DiaCardapio | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [filtroDia, setFiltroDia] = useState<DiaSemana | typeof TODAS>(TODAS);

  const pratosPorId = useMemo(
    () => new Map(pratos.map((prato) => [prato.id, prato])),
    [pratos],
  );

  const diasLivres = DIAS_SEMANA.filter((dia) => !cardapioPorDia.has(dia));
  const diaSelecionado: DiaSemana = editando
    ? editando.dia
    : diasLivres.includes(diaForm)
      ? diaForm
      : (diasLivres[0] ?? 'Segunda');

  const pratoSelecionado = pratosComReceita.some((prato) => prato.id === pratoId)
    ? pratoId
    : (pratosComReceita[0]?.id ?? '');

  const pratoEmEdicaoSemReceita =
    editando !== null && !pratosComReceita.some((prato) => prato.id === editando.prato_id);

  const totalPessoas = cardapio.reduce((total, registro) => total + registro.pessoas, 0);
  const podeIncluir = diasLivres.length > 0;

  const visiveis = DIAS_SEMANA.filter(
    (dia) => filtroDia === TODAS || filtroDia === dia,
  );

  function limpar() {
    setEditando(null);
    setPratoId('');
    setPessoas('2');
    setErroForm(null);
    setDiaForm(acharDiaLivre(cardapioPorDia));
  }

  function editar(registro: DiaCardapio) {
    setEditando(registro);
    setDiaForm(registro.dia);
    setPratoId(registro.prato_id);
    setPessoas(String(registro.pessoas));
    setErroForm(null);
    document.getElementById('cardapio-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function planejar(dia: DiaSemana) {
    setEditando(null);
    setDiaForm(dia);
    setPratoId('');
    setPessoas('2');
    setErroForm(null);
    document.getElementById('cardapio-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErroForm(null);

    if (!pratoSelecionado) {
      setErroForm('Escolha um prato com receita para este dia.');
      return;
    }

    const pessoasNumero = Number(pessoas.trim().replace(',', '.'));
    if (!Number.isInteger(pessoasNumero) || pessoasNumero < 1) {
      setErroForm('Informe a quantidade de pessoas com um número inteiro maior ou igual a 1.');
      return;
    }
    if (pessoasNumero > LIMITE_PESSOAS) {
      setErroForm(`A quantidade de pessoas pode ser no máximo ${LIMITE_PESSOAS}.`);
      return;
    }

    setSalvando(true);
    const salvou = editando
      ? await aoAlterar(editando, pratoSelecionado, pessoasNumero)
      : await aoIncluir(diaSelecionado, pratoSelecionado, pessoasNumero);
    setSalvando(false);

    if (salvou) {
      const diaUsado = editando?.dia ?? diaSelecionado;
      setEditando(null);
      setPratoId('');
      setPessoas('2');
      setDiaForm(acharDiaLivre(cardapioPorDia, diaUsado));
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-maincourse-gold">RFC05</p>
        <h1 className="font-display text-3xl font-bold text-maincourse-navy">Cardápio</h1>
      </header>

      <SecaoCard>
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-maincourse-gold/20 text-maincourse-navy"
              aria-hidden="true"
            >
              <IconeCardapio />
            </span>
            <h2 className="font-display text-xl font-bold text-maincourse-navy">
              {editando ? `Editando ${editando.dia.toLowerCase()}` : 'Planejar um dia'}
            </h2>
          </div>
          <span className="shrink-0 rounded-full bg-maincourse-navy/5 px-2.5 py-1 text-xs font-bold text-maincourse-navy/60">
            {cardapio.length}/5
          </span>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-maincourse-navy/55">
          Um prato com receita e o número de pessoas que vão comer. Na edição, só o prato e as
          pessoas mudam.
        </p>

        {pratosComReceita.length === 0 ? (
          <div className="space-y-3">
            <EstadoVazio
              icone="🍽️"
              titulo="Nenhum prato com receita ainda"
              detalhe="O cardápio só aceita pratos com pelo menos um ingrediente na receita."
            />
            <Botao type="button" onClick={() => irPara('receitas')} className="w-full sm:w-auto">
              <IconeReceita />
              Montar as receitas
            </Botao>
          </div>
        ) : !editando && !podeIncluir ? (
          <div className="rounded-xl border border-maincourse-gold/40 bg-maincourse-gold/10 px-4 py-3 text-sm text-maincourse-navy">
            <p className="font-bold">Semana completa</p>
            <p className="mt-1 text-maincourse-navy/65">
              Os cinco dias estão planejados. Edite um dia abaixo para trocar o prato ou as pessoas.
            </p>
          </div>
        ) : (
          <form
            id="cardapio-form"
            onSubmit={enviar}
            data-testid="cardapio-form"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
          >
            <Campo rotulo="Dia da semana" className="min-w-0">
              <Selecao
                value={diaSelecionado}
                onChange={(evento) => setDiaForm(evento.target.value as DiaSemana)}
                disabled={Boolean(editando)}
                aria-readonly={Boolean(editando)}
                data-testid="cardapio-dia"
              >
                {editando
                  ? [editando.dia].map((dia) => (
                      <option key={dia} value={dia}>
                        {dia}
                      </option>
                    ))
                  : diasLivres.map((dia) => (
                      <option key={dia} value={dia}>
                        {dia}
                      </option>
                    ))}
              </Selecao>
            </Campo>

            <Campo
              rotulo="Prato"
              className="min-w-0 sm:col-span-2"
              dica="Só aparecem pratos com pelo menos um ingrediente na receita."
            >
              <Selecao
                value={pratoSelecionado}
                onChange={(evento) => setPratoId(evento.target.value)}
                data-testid="cardapio-prato"
              >
                {pratosComReceita.map((prato) => (
                  <option key={prato.id} value={prato.id}>
                    {prato.nome}
                  </option>
                ))}
              </Selecao>
            </Campo>

            <Campo rotulo="Pessoas" className="min-w-0">
              <Entrada
                type="number"
                inputMode="numeric"
                min={1}
                max={LIMITE_PESSOAS}
                step={1}
                value={pessoas}
                onChange={(evento) => setPessoas(evento.target.value)}
                placeholder="2"
                data-testid="cardapio-pessoas"
              />
            </Campo>

            <div className="flex flex-col gap-2 sm:flex-row lg:col-span-4">
              <Botao
                type="submit"
                carregando={salvando}
                className="w-full sm:w-auto"
                data-testid="cardapio-adicionar"
              >
                {editando ? 'Salvar dia' : 'Adicionar ao cardápio'}
              </Botao>
              {editando && (
                <Botao
                  type="button"
                  variante="secundario"
                  onClick={limpar}
                  className="w-full sm:w-auto"
                  data-testid="cardapio-cancelar"
                >
                  Cancelar
                </Botao>
              )}
            </div>
          </form>
        )}

        {pratoEmEdicaoSemReceita && (
          <p
            role="alert"
            data-testid="cardapio-aviso-receita"
            className="mt-3 rounded-lg bg-maincourse-gold/15 px-3 py-2 text-sm font-semibold text-maincourse-navy"
          >
            O prato atual deste dia ficou sem receita. Escolha outro prato com ingredientes para
            que o dia volte a gerar compras.
          </p>
        )}

        {erroForm && (
          <p
            role="alert"
            data-testid="cardapio-erro"
            className="mt-3 rounded-lg bg-maincourse-red/10 px-3 py-2 text-sm font-semibold text-maincourse-red"
          >
            {erroForm}
          </p>
        )}
      </SecaoCard>

      <SecaoCard>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-maincourse-navy">Semana</h2>
            <p className="mt-1 text-xs font-semibold text-maincourse-navy/45" data-testid="cardapio-resumo">
              {cardapio.length} de 5 dias planejados ·{' '}
              {pluralizar(totalPessoas, 'pessoa na semana', 'pessoas na semana')}
            </p>
          </div>
          <Campo rotulo="Filtrar por dia" className="w-full sm:w-56">
            <Selecao
              value={filtroDia}
              onChange={(evento) =>
                setFiltroDia(evento.target.value as DiaSemana | typeof TODAS)
              }
              data-testid="cardapio-filtro-dia"
              aria-label="Filtrar o cardápio por dia da semana"
            >
              <option value={TODAS}>Todos os dias</option>
              {DIAS_SEMANA.map((dia) => (
                <option key={dia} value={dia}>
                  {dia}
                </option>
              ))}
            </Selecao>
          </Campo>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {visiveis.map((dia) => {
            const registro = cardapioPorDia.get(dia);
            if (!registro) {
              return (
                <div
                  key={dia}
                  data-testid="cardapio-livre"
                  data-dia={dia}
                  className="flex flex-col justify-between rounded-xl border border-dashed border-maincourse-navy/25 bg-maincourse-cream/50 p-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-lg font-bold text-maincourse-navy/70">
                        {dia}
                      </h3>
                      <Selo tom="cinza">Livre</Selo>
                    </div>
                    <p className="mt-1 text-sm text-maincourse-navy/45">
                      Nenhum prato planejado para este dia.
                    </p>
                  </div>
                  <Botao
                    type="button"
                    variante="secundario"
                    className="mt-3 w-full"
                    onClick={() => planejar(dia)}
                    disabled={pratosComReceita.length === 0}
                    data-testid="cardapio-planejar"
                  >
                    <IconeAdicionar />
                    Planejar {dia.toLowerCase()}
                  </Botao>
                </div>
              );
            }

            const prato = pratosPorId.get(registro.prato_id);
            const receitas = receitasPorPrato.get(registro.prato_id) ?? [];
            const porcoes = porcoesDoPrato(prato);

            return (
              <div
                key={dia}
                data-testid="cardapio-item"
                data-dia={dia}
                data-prato={prato?.nome ?? registro.prato_id}
                className="flex flex-col rounded-xl border border-maincourse-navy/10 bg-maincourse-cream/40 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-bold text-maincourse-navy">{dia}</h3>
                  <Selo tom="verde">Planejado</Selo>
                </div>

                <p
                  className="mt-1 font-semibold text-maincourse-navy"
                  data-testid="cardapio-prato-nome"
                >
                  {prato?.nome ?? 'Prato removido'}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-maincourse-navy/50">
                  <span data-testid="cardapio-pessoas-valor">{registro.pessoas}</span>{' '}
                  {registro.pessoas === 1 ? 'pessoa' : 'pessoas'} ·{' '}
                  {pluralizar(receitas.length, 'ingrediente', 'ingredientes')}
                </p>

                {receitas.length > 0 ? (
                  <details className="mt-2 text-sm" data-testid="cardapio-detalhes">
                    <summary className="cursor-pointer select-none font-semibold text-maincourse-navy/70">
                      Ver ingredientes do dia
                    </summary>
                    <ul className="mt-2 space-y-1">
                      {receitas.map((receita) => (
                        <li
                          key={receita.id}
                          data-testid="cardapio-ingrediente"
                          data-ingrediente={receita.ingrediente_nome}
                          className="flex items-baseline justify-between gap-2 text-maincourse-navy/65"
                        >
                          <span className="min-w-0">{receita.ingrediente_nome}</span>
                          <span
                            className="shrink-0 text-xs font-bold text-maincourse-navy"
                            data-testid="cardapio-quantidade-valor"
                          >
                            {formatarQuantidadeComUnidade(
                              quantidadeParaPessoas(
                                receita.quantidade,
                                porcoes,
                                registro.pessoas,
                              ),
                              receita.unidade_medida,
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[11px] text-maincourse-navy/40">
                      {porcoes > 1
                        ? `Quantidade total do dia: receita para ${pluralizar(porcoes, 'porção', 'porções')} distribuída entre ${pluralizar(registro.pessoas, 'pessoa', 'pessoas')}.`
                        : `Quantidade total do dia: quantidade por pessoa × ${registro.pessoas}.`}
                    </p>
                  </details>
                ) : (
                  <p
                    data-testid="cardapio-sem-receita"
                    className="mt-2 rounded-lg bg-maincourse-gold/15 px-2.5 py-2 text-xs font-semibold text-maincourse-navy"
                  >
                    Este prato ficou sem receita; o dia não gera itens na lista de compras.
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-1 border-t border-maincourse-navy/10 pt-2">
                  <button
                    type="button"
                    onClick={() => editar(registro)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-bold text-maincourse-navy transition hover:bg-white"
                    aria-label={`Editar ${dia}`}
                    data-testid="cardapio-editar"
                  >
                    <IconeEditar />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => irPara('receitas', { prato: registro.prato_id })}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-bold text-maincourse-navy transition hover:bg-white"
                    aria-label={`Ver a receita de ${prato?.nome ?? 'prato'}`}
                    data-testid="cardapio-receita"
                  >
                    <IconeReceita />
                    Receita
                  </button>
                  <button
                    type="button"
                    onClick={() => void aoExcluir(registro)}
                    className="ml-auto inline-flex items-center rounded-lg px-2.5 py-2 text-sm font-bold text-maincourse-red transition hover:bg-white"
                    aria-label={`Excluir ${dia} do cardápio`}
                    data-testid="cardapio-excluir"
                  >
                    <IconeExcluir />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </SecaoCard>
    </div>
  );
}
