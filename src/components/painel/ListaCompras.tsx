import { useMemo, useState } from 'react';
import type {
  DiaCardapio,
  DiaSemana,
  Ingrediente,
  ItemDespensa,
  Prato,
  ReceitaDetalhada,
} from '../../types';
import type { Parametros } from '../../hooks/useRota';
import type { RotaId } from '../../lib/rotas';
import { DIAS_SEMANA } from '../../lib/constants';
import { calcularLista, csvDaLista, textoDaLista } from '../../lib/listaCompras';
import {
  baixarCsv,
  copiarTexto,
  formatarQuantidade,
  normalizar,
  pluralizar,
  rotuloDias,
} from '../../lib/utils';
import { useToast } from '../ui/toast-context';
import { Botao, Campo, EstadoVazio, SecaoCard, Selecao, Selo } from '../ui/Basicos';
import { IconeCardapio, IconeCompras, IconeDespensa, IconeSeta } from '../ui/Icones';

type Props = {
  cardapio: DiaCardapio[];
  pratos: Prato[];
  ingredientes: Ingrediente[];
  receitas: ReceitaDetalhada[];
  despensa: ItemDespensa[];
  comprados: Set<string>;
  compradosDespensa: Set<string>;
  aoMarcarComprado: (ingredienteId: string, comprado: boolean) => Promise<boolean>;
  aoMarcarCompradoDespensa: (itemId: string, comprado: boolean) => Promise<boolean>;
  aoLimparMarcacoes: () => Promise<boolean>;
  irPara: (rota: RotaId, parametros?: Parametros) => void;
};

const TODAS = 'todas';

export function ListaCompras({
  cardapio,
  pratos,
  ingredientes,
  receitas,
  despensa,
  comprados,
  compradosDespensa,
  aoMarcarComprado,
  aoMarcarCompradoDespensa,
  aoLimparMarcacoes,
  irPara,
}: Props) {
  const { avisar } = useToast();
  const [filtroDia, setFiltroDia] = useState<DiaSemana | typeof TODAS>(TODAS);
  const [marcando, setMarcando] = useState<string | null>(null);
  const [marcandoDespensa, setMarcandoDespensa] = useState<string | null>(null);
  const [limpando, setLimpando] = useState(false);
  const [copiando, setCopiando] = useState(false);

  const diaFiltrado = filtroDia === TODAS ? null : filtroDia;

  const resultado = useMemo(
    () =>
      calcularLista({
        cardapio,
        pratos,
        receitas,
        ingredientes,
        comprados,
        filtroDia: diaFiltrado,
      }),
    [cardapio, comprados, diaFiltrado, ingredientes, pratos, receitas],
  );

  const diasSemReceita = useMemo(
    () =>
      cardapio.filter(
        (registro) => !receitas.some((receita) => receita.prato_id === registro.prato_id),
      ),
    [cardapio, receitas],
  );

  const compradosDaDespensa = useMemo(
    () => despensa.filter((item) => compradosDespensa.has(item.id)).length,
    [compradosDespensa, despensa],
  );

  const totalDespensa = despensa.length;
  const totalMarcados = resultado.totalComprados + compradosDaDespensa;
  const semItens = resultado.totalItens === 0;
  const semNada = semItens && totalDespensa === 0;

  const periodo = diaFiltrado ?? 'Semana';
  const periodoDoTexto = totalDespensa > 0 ? `${periodo} + despensa` : periodo;
  const texto = useMemo(
    () =>
      textoDaLista(
        resultado.itens,
        resultado.resumo,
        periodoDoTexto,
        despensa,
        compradosDespensa,
      ),
    [compradosDespensa, despensa, periodoDoTexto, resultado.itens, resultado.resumo],
  );

  const progresso =
    resultado.totalItens === 0
      ? 0
      : Math.round((resultado.totalComprados / resultado.totalItens) * 100);
  const progressoDespensa =
    totalDespensa === 0
      ? 0
      : Math.round((compradosDaDespensa / totalDespensa) * 100);

  async function marcar(ingredienteId: string, comprado: boolean) {
    setMarcando(ingredienteId);
    await aoMarcarComprado(ingredienteId, comprado);
    setMarcando(null);
  }

  async function marcarDespensa(itemId: string, comprado: boolean) {
    setMarcandoDespensa(itemId);
    await aoMarcarCompradoDespensa(itemId, comprado);
    setMarcandoDespensa(null);
  }

  async function limpar() {
    setLimpando(true);
    await aoLimparMarcacoes();
    setLimpando(false);
  }

  async function copiar() {
    setCopiando(true);
    try {
      await copiarTexto(texto);
      avisar('Lista copiada. É só colar no WhatsApp.');
    } catch {
      avisar('Não foi possível copiar a lista neste navegador.', 'erro');
    } finally {
      setCopiando(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-maincourse-gold">RFC06</p>
        <h1 className="font-display text-3xl font-bold text-maincourse-navy">Lista de compras</h1>
      </header>

      <SecaoCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-maincourse-gold/20 text-maincourse-navy"
              aria-hidden="true"
            >
              <IconeCompras />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-bold text-maincourse-navy">
                Compras da {diaFiltrado ? diaFiltrado.toLowerCase() : 'semana'}
              </h2>
              <p
                className="mt-0.5 text-xs font-semibold text-maincourse-navy/45"
              >
                {resultado.totalComprados} de{' '}
                {pluralizar(resultado.totalItens, 'item comprado', 'itens comprados')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Botao
              type="button"
              variante="secundario"
              onClick={() => void copiar()}
              carregando={copiando}
              disabled={semNada}
            >
              Copiar resumo
            </Botao>
            <Botao
              type="button"
              variante="secundario"
              onClick={() =>
                baixarCsv(
                  `maincourse-lista-${diaFiltrado ? normalizar(diaFiltrado) : 'semana'}.csv`,
                  csvDaLista(resultado.itens, despensa, compradosDespensa),
                )
              }
              disabled={semNada}
            >
              Baixar CSV
            </Botao>
            <Botao
              type="button"
              variante="perigo"
              onClick={() => void limpar()}
              carregando={limpando}
              disabled={totalMarcados === 0}
            >
              Limpar marcações
            </Botao>
          </div>
        </div>

        {cardapio.length === 0 ? (
          <div className="mt-4">
            <EstadoVazio
              icone="🛒"
              titulo="O cardápio da semana está vazio"
              detalhe="A lista de ingredientes é calculada a partir dos pratos e das pessoas de cada dia do cardápio. Os itens da despensa aparecem logo abaixo e já podem ser marcados."
            />
            <Botao
              type="button"
              className="mt-3 w-full sm:w-auto"
              onClick={() => irPara('cardapio')}
            >
              <IconeCompras />
              Montar o cardápio
            </Botao>
          </div>
        ) : (
          <>
            <div className="mt-4">
              <div
                className="h-2 overflow-hidden rounded-full bg-maincourse-navy/10"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={resultado.totalItens}
                aria-valuenow={resultado.totalComprados}
                aria-label="Itens do cardápio já comprados"
              >
                <div
                  className="h-full rounded-full bg-maincourse-gold transition-all"
                  style={{ width: `${progresso}%` }}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-maincourse-navy/10 pt-4 sm:flex-row sm:items-end">
              <Campo rotulo="Filtrar por dia da semana" className="w-full sm:w-64">
                <Selecao
                  value={filtroDia}
                  onChange={(evento) =>
                    setFiltroDia(evento.target.value as DiaSemana | typeof TODAS)
                  }
                  aria-label="Filtrar a lista de compras por dia da semana"
                >
                  <option value={TODAS}>Semana inteira</option>
                  {DIAS_SEMANA.map((dia) => (
                    <option key={dia} value={dia}>
                      {dia}
                    </option>
                  ))}
                </Selecao>
              </Campo>
              <p className="text-xs text-maincourse-navy/45 sm:pb-3">
                {diaFiltrado
                  ? `Mostrando só os ingredientes usados na ${diaFiltrado.toLowerCase()}.`
                  : 'Quantidade total da semana, dias/pratos de cada ingrediente e, quando houver embalagem, quantos pacotes comprar.'}
              </p>
            </div>
          </>
        )}
      </SecaoCard>

      {diasSemReceita.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-maincourse-gold/40 bg-maincourse-gold/10 px-4 py-3 text-sm text-maincourse-navy"
        >
          <p className="font-bold">
            {pluralizar(
              diasSemReceita.length,
              'dia do cardápio está sem receita',
              'dias do cardápio estão sem receita',
            )}
          </p>
          <p className="mt-1 text-maincourse-navy/65">
            {rotuloDias(diasSemReceita.map((registro) => registro.dia))} não entram na lista
            enquanto o prato não tiver ingredientes.
          </p>
          <button
            type="button"
            onClick={() => irPara('cardapio')}
            className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-maincourse-navy underline decoration-maincourse-gold/60 underline-offset-2"
          >
            Revisar o cardápio
            <IconeSeta className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {cardapio.length > 0 && (
        <SecaoCard>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-bold text-maincourse-navy">
              Itens da {diaFiltrado ? diaFiltrado.toLowerCase() : 'semana'}
            </h2>
            <p className="text-xs font-semibold text-maincourse-navy/45">
              {pluralizar(resultado.totalItens, 'ingrediente', 'ingredientes')} ·{' '}
              {pluralizar(resultado.totalComprados, 'comprado', 'comprados')}
            </p>
          </div>

          {semItens ? (
            <EstadoVazio
              icone="🥕"
              titulo={
                diaFiltrado
                  ? `Nenhum ingrediente na ${diaFiltrado.toLowerCase()}`
                  : 'Nenhum ingrediente para comprar'
              }
              detalhe={
                diaFiltrado
                  ? 'Escolha outro dia ou volte para a semana inteira.'
                  : 'Confira se os pratos do cardápio têm receita com ingredientes.'
              }
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {resultado.itens.map((item) => (
                <li
                  key={item.ingrediente_id}
                  className={`flex flex-wrap items-start gap-x-3 gap-y-2 rounded-xl border p-3 transition ${
                    item.comprado
                      ? 'border-maincourse-navy/5 bg-maincourse-cream/30'
                      : 'border-maincourse-navy/10 bg-maincourse-cream/50'
                  }`}
                >
                  <label className="mt-0.5 flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={item.comprado}
                      disabled={marcando === item.ingrediente_id}
                      onChange={() => void marcar(item.ingrediente_id, !item.comprado)}
                      aria-label={`${item.comprado ? 'Desmarcar' : 'Marcar'} ${item.ingrediente_nome} como comprado`}
                      className="h-5 w-5 cursor-pointer rounded border-maincourse-navy/30 accent-maincourse-navy"
                    />
                  </label>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-semibold text-maincourse-navy ${
                        item.comprado ? 'line-through decoration-maincourse-navy/30' : ''
                      }`}
                    >
                      {item.ingrediente_nome}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {item.dias.map((dia) => (
                        <Selo key={dia} tom="gold">
                          {rotuloDias([dia])}
                        </Selo>
                      ))}
                      <span
                        className="text-xs text-maincourse-navy/50"
                      >
                        {item.pratos.join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className={`text-base font-bold ${
                          item.comprado ? 'text-maincourse-navy/45' : 'text-maincourse-navy'
                        }`}
                      >
                        {formatarQuantidade(item.quantidade)}
                      </span>
                      <Selo tom={item.unidade_medida === 'L' ? 'gold' : 'cinza'}>
                        {item.unidade_medida}
                      </Selo>
                    </div>
                    {item.embalagens !== null && item.embalagem && (
                      <span
                        className="text-xs font-semibold text-maincourse-navy/50"
                      >
                        comprar {item.embalagens} × {item.embalagem.rotulo}
                        {item.quantidade_compra !== null
                          ? ` (${formatarQuantidade(item.quantidade_compra)} ${item.unidade_medida})`
                          : ''}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SecaoCard>
      )}

      <SecaoCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-maincourse-gold/20 text-maincourse-navy"
              aria-hidden="true"
            >
              <IconeDespensa />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-bold text-maincourse-navy">
                Itens da despensa
              </h2>
              <p
                className="mt-0.5 text-xs font-semibold text-maincourse-navy/45"
              >
                {compradosDaDespensa} de{' '}
                {pluralizar(totalDespensa, 'item marcado', 'itens marcados')}
              </p>
            </div>
          </div>
          <Selo tom={compradosDaDespensa > 0 ? 'verde' : 'cinza'}>
            {totalDespensa} {totalDespensa === 1 ? 'item' : 'itens'}
          </Selo>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-maincourse-navy/55">
          Itens fixos da casa, como limpeza, salada, temperos e itens gerais. A quantidade é o
          estoque atual e não entra no resumo por unidade; marque o que você já comprou.
        </p>

        {totalDespensa === 0 ? (
          <div className="mt-3">
            <EstadoVazio
              icone="🧺"
              titulo="Nenhum item na despensa"
              detalhe="Cadastre os itens fixos da casa para eles aparecerem aqui e poderem ser marcados na compra."
            />
            <Botao
              type="button"
              className="mt-3 w-full sm:w-auto"
              onClick={() => irPara('despensa')}
            >
              <IconeDespensa />
              Cadastrar itens da despensa
            </Botao>
          </div>
        ) : (
          <>
            <div className="mt-4">
              <div
                className="h-2 overflow-hidden rounded-full bg-maincourse-navy/10"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={totalDespensa}
                aria-valuenow={compradosDaDespensa}
                aria-label="Itens da despensa já comprados"
              >
                <div
                  className="h-full rounded-full bg-maincourse-gold transition-all"
                  style={{ width: `${progressoDespensa}%` }}
                />
              </div>
            </div>

            <ul className="mt-4 flex flex-col gap-2">
              {despensa.map((item) => {
                const comprado = compradosDespensa.has(item.id);
                return (
                  <li
                    key={item.id}
                    className={`flex flex-wrap items-start gap-x-3 gap-y-2 rounded-xl border p-3 transition ${
                      comprado
                        ? 'border-maincourse-navy/5 bg-maincourse-cream/30'
                        : 'border-maincourse-navy/10 bg-maincourse-cream/50'
                    }`}
                  >
                    <label className="mt-0.5 flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={comprado}
                        disabled={marcandoDespensa === item.id}
                        onChange={() => void marcarDespensa(item.id, !comprado)}
                        aria-label={`${comprado ? 'Desmarcar' : 'Marcar'} ${item.nome} como comprado`}
                        className="h-5 w-5 cursor-pointer rounded border-maincourse-navy/30 accent-maincourse-navy"
                      />
                    </label>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-semibold text-maincourse-navy ${
                          comprado ? 'line-through decoration-maincourse-navy/30' : ''
                        }`}
                      >
                        {item.nome}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Selo tom="cinza">{item.categoria}</Selo>
                        {item.quantidade === 0 && <Selo tom="vermelho">Em falta</Selo>}
                        {item.observacao && (
                          <span className="text-xs text-maincourse-navy/50">
                            {item.observacao}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="ml-auto flex shrink-0 items-baseline gap-1.5">
                      <span
                        className={`text-base font-bold ${
                          comprado ? 'text-maincourse-navy/45' : 'text-maincourse-navy'
                        }`}
                      >
                        {formatarQuantidade(item.quantidade)}
                      </span>
                      <Selo tom={item.unidade_medida === 'L' ? 'gold' : 'cinza'}>
                        {item.unidade_medida}
                      </Selo>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 flex justify-center border-t border-maincourse-navy/10 pt-4">
              <Botao
                type="button"
                variante="fantasma"
                onClick={() => irPara('despensa')}
              >
                <IconeDespensa />
                Gerenciar despensa
              </Botao>
            </div>
          </>
        )}
      </SecaoCard>

      {!semNada && (
        <SecaoCard>
          <div className="mb-3">
            <h2 className="font-display text-xl font-bold text-maincourse-navy">
              {resultado.totalItens > 0 ? 'Resumo por unidade' : 'Compartilhar a lista'}
            </h2>
            <p className="mt-0.5 text-sm text-maincourse-navy/50">
              {resultado.totalItens > 0
                ? 'Soma da lista de ingredientes em cada unidade de medida e quantos itens já foram comprados.'
                : 'A lista de ingredientes está vazia; o texto abaixo inclui os itens da despensa.'}
            </p>
            {totalDespensa > 0 && resultado.totalItens > 0 && (
              <p className="mt-1 text-xs text-maincourse-navy/45">
                Os itens da despensa aparecem no texto e no CSV, mas não entram neste resumo.
              </p>
            )}
          </div>

          {resultado.totalItens > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {resultado.resumo.map((resumo) => (
                <div
                  key={resumo.unidade}
                  className="rounded-xl border border-maincourse-navy/10 bg-maincourse-cream/40 p-4"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-maincourse-navy/45">
                      {resumo.unidade}
                    </span>
                    <Selo tom={resumo.comprados > 0 ? 'verde' : 'cinza'}>
                      {resumo.comprados}/{resumo.itens}
                    </Selo>
                  </div>
                  <p
                    className="mt-1 font-display text-2xl font-bold text-maincourse-navy"
                  >
                    {formatarQuantidade(resumo.quantidade)}{' '}
                    <span className="text-base font-semibold text-maincourse-navy/60">
                      {resumo.unidade}
                    </span>
                  </p>
                  <p
                    className="mt-1 text-xs text-maincourse-navy/50"
                  >
                    {resumo.comprados} de{' '}
                    {pluralizar(resumo.itens, 'item comprado', 'itens comprados')} nesta unidade
                  </p>
                </div>
              ))}
            </div>
          )}

          <details className="mt-4 rounded-xl border border-maincourse-navy/10 bg-maincourse-cream/40 p-3">
            <summary
              className="cursor-pointer select-none text-sm font-bold text-maincourse-navy"
            >
              Texto pronto para compartilhar
              {totalDespensa > 0 ? ' (com a despensa)' : ''}
            </summary>
            <pre
              className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white p-3 text-xs leading-relaxed text-maincourse-navy/75"
            >
              {texto}
            </pre>
            <Botao
              type="button"
              variante="secundario"
              onClick={() => void copiar()}
              carregando={copiando}
              className="mt-2 w-full sm:w-auto"
            >
              Copiar texto
            </Botao>
          </details>
        </SecaoCard>
      )}

      <div className="flex justify-center">
        <Botao
          type="button"
          variante="fantasma"
          onClick={() => irPara('cardapio')}
        >
          <IconeCardapio />
          {cardapio.length > 0 ? 'Ajustar o cardápio' : 'Montar o cardápio'}
        </Botao>
      </div>
    </div>
  );
}
