import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { CategoriaDespensa, ItemDespensa, Unidade } from '../../types';
import type { DadosItemDespensa } from '../../lib/acoes';
import { CATEGORIAS_DESPENSA, LIMITE_NOME, LIMITE_OBSERVACAO, UNIDADES } from '../../lib/constants';
import { analisarQuantidade, formatarQuantidade, normalizar, pluralizar } from '../../lib/utils';
import {
  Botao,
  Campo,
  Entrada,
  EstadoVazio,
  SecaoCard,
  Selecao,
  Selo,
} from '../ui/Basicos';
import { IconeDespensa, IconeEditar, IconeExcluir } from '../ui/Icones';

type Props = {
  itens: ItemDespensa[];
  porCategoria: Map<CategoriaDespensa, ItemDespensa[]>;
  aoIncluir: (nome: string, dados: DadosItemDespensa) => Promise<boolean>;
  aoAlterar: (item: ItemDespensa, dados: DadosItemDespensa) => Promise<boolean>;
  aoExcluir: (item: ItemDespensa) => Promise<boolean>;
};

const TODAS = 'todas';

type Formulario = {
  nome: string;
  categoria: CategoriaDespensa;
  quantidade: string;
  unidade: Unidade;
  observacao: string;
};

const FORMULARIO_VAZIO: Formulario = {
  nome: '',
  categoria: 'Itens Gerais',
  quantidade: '0',
  unidade: 'un',
  observacao: '',
};

export function GestaoDespensa({ itens, porCategoria, aoIncluir, aoAlterar, aoExcluir }: Props) {
  const [formulario, setFormulario] = useState<Formulario>(FORMULARIO_VAZIO);
  const [editando, setEditando] = useState<ItemDespensa | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaDespensa | typeof TODAS>(TODAS);
  const [busca, setBusca] = useState('');

  const filtrados = useMemo(() => {
    const termo = normalizar(busca);
    return itens.filter((item) => {
      const combinaCategoria = filtroCategoria === TODAS || item.categoria === filtroCategoria;
      const combinaNome = termo ? normalizar(item.nome).includes(termo) : true;
      return combinaCategoria && combinaNome;
    });
  }, [busca, filtroCategoria, itens]);

  const emFalta = itens.filter((item) => item.quantidade === 0).length;

  function atualizar<K extends keyof Formulario>(campo: K, valor: Formulario[K]) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
    setErroForm(null);
  }

  function limpar() {
    setFormulario(FORMULARIO_VAZIO);
    setEditando(null);
    setErroForm(null);
  }

  function editar(item: ItemDespensa) {
    setEditando(item);
    setFormulario({
      nome: item.nome,
      categoria: item.categoria,
      quantidade: formatarQuantidade(item.quantidade),
      unidade: item.unidade_medida,
      observacao: item.observacao,
    });
    setErroForm(null);
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErroForm(null);

    const nomeLimpo = formulario.nome.trim();
    if (!editando && nomeLimpo.length < 2) {
      setErroForm('O nome do item precisa ter pelo menos 2 caracteres.');
      return;
    }
    if (formulario.observacao.trim().length > LIMITE_OBSERVACAO) {
      setErroForm(`A observação pode ter no máximo ${LIMITE_OBSERVACAO} caracteres.`);
      return;
    }
    const quantidade = analisarQuantidade(formulario.quantidade);
    if (quantidade === null || quantidade < 0) {
      setErroForm('Informe a quantidade com um número maior ou igual a zero.');
      return;
    }

    const dados: DadosItemDespensa = {
      categoria: formulario.categoria,
      quantidade,
      unidade_medida: formulario.unidade,
      observacao: formulario.observacao.trim(),
    };

    setSalvando(true);
    const salvou = editando
      ? await aoAlterar(editando, dados)
      : await aoIncluir(nomeLimpo, dados);
    setSalvando(false);

    if (salvou) limpar();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-maincourse-gold">RFC04</p>
        <h1 className="font-display text-3xl font-bold text-maincourse-navy">Despensa</h1>
      </header>

      <SecaoCard>
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-maincourse-gold/20 text-maincourse-navy"
              aria-hidden="true"
            >
              <IconeDespensa />
            </span>
            <h2 className="font-display text-xl font-bold text-maincourse-navy">
              {editando ? `Editando “${editando.nome}”` : 'Novo item da despensa'}
            </h2>
          </div>
          <span className="rounded-full bg-maincourse-navy/5 px-2.5 py-1 text-xs font-bold text-maincourse-navy/60">
            {itens.length}
          </span>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-maincourse-navy/55">
          {editando
            ? 'O nome não pode ser alterado. Os demais campos podem; se a categoria mudar, o item muda de grupo.'
            : 'O mesmo nome pode existir em categorias diferentes, mas não se repete dentro da mesma categoria.'}
        </p>

        <form
          onSubmit={enviar}
          data-testid="despensa-form"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
        >
          <Campo rotulo="Nome" className="min-w-0 sm:col-span-2">
            <Entrada
              required
              type="text"
              value={formulario.nome}
              onChange={(evento) => atualizar('nome', evento.target.value)}
              placeholder="Ex.: Detergente"
              maxLength={LIMITE_NOME}
              autoComplete="off"
              readOnly={Boolean(editando)}
              aria-readonly={Boolean(editando)}
              className={editando ? 'bg-maincourse-navy/5' : ''}
              data-testid="despensa-nome"
            />
          </Campo>

          <Campo rotulo="Categoria" className="min-w-0">
            <Selecao
              value={formulario.categoria}
              onChange={(evento) =>
                atualizar('categoria', evento.target.value as CategoriaDespensa)
              }
              data-testid="despensa-categoria"
            >
              {CATEGORIAS_DESPENSA.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </Selecao>
          </Campo>

          <Campo rotulo="Quantidade" className="min-w-0">
            <Entrada
              type="text"
              inputMode="decimal"
              value={formulario.quantidade}
              onChange={(evento) => atualizar('quantidade', evento.target.value)}
              placeholder="0"
              autoComplete="off"
              data-testid="despensa-quantidade"
            />
          </Campo>

          <Campo rotulo="Unidade" className="min-w-0">
            <Selecao
              value={formulario.unidade}
              onChange={(evento) => atualizar('unidade', evento.target.value as Unidade)}
              data-testid="despensa-unidade"
            >
              {UNIDADES.map((unidade) => (
                <option key={unidade} value={unidade}>
                  {unidade}
                </option>
              ))}
            </Selecao>
          </Campo>

          <Campo
            rotulo="Observação"
            className="min-w-0 sm:col-span-2"
            dica="Opcional: marca, validade ou onde fica guardado (até 120 caracteres)."
          >
            <Entrada
              type="text"
              value={formulario.observacao}
              onChange={(evento) => atualizar('observacao', evento.target.value)}
              placeholder="Ex.: marca Y, armário de baixo"
              maxLength={LIMITE_OBSERVACAO}
              autoComplete="off"
              data-testid="despensa-observacao"
            />
          </Campo>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Botao
              type="submit"
              carregando={salvando}
              className="w-full"
              data-testid="despensa-adicionar"
            >
              {editando ? 'Salvar' : 'Adicionar'}
            </Botao>
            {editando && (
              <Botao
                type="button"
                variante="secundario"
                onClick={limpar}
                className="w-full"
                data-testid="despensa-cancelar"
              >
                Cancelar
              </Botao>
            )}
          </div>
        </form>

        {erroForm && (
          <p
            role="alert"
            data-testid="despensa-erro"
            className="mt-3 rounded-lg bg-maincourse-red/10 px-3 py-2 text-sm font-semibold text-maincourse-red"
          >
            {erroForm}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2 border-t border-maincourse-navy/10 pt-4 sm:flex-row sm:items-end">
          <Campo rotulo="Filtrar por categoria" className="flex-1">
            <Selecao
              value={filtroCategoria}
              onChange={(evento) =>
                setFiltroCategoria(evento.target.value as CategoriaDespensa | typeof TODAS)
              }
              data-testid="despensa-filtro-categoria"
              aria-label="Filtrar despensa pela categoria"
            >
              <option value={TODAS}>Todas as categorias</option>
              {CATEGORIAS_DESPENSA.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo rotulo="Buscar por nome" className="flex-1">
            <Entrada
              type="search"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Filtrar item…"
              aria-label="Filtrar itens da despensa pelo nome"
              data-testid="despensa-busca"
            />
          </Campo>
        </div>

        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-lg font-bold text-maincourse-navy">Itens por categoria</h3>
          <p className="text-xs font-semibold text-maincourse-navy/45" data-testid="despensa-resumo">
            {pluralizar(filtrados.length, 'item exibido', 'itens exibidos')}
            {emFalta > 0 ? ` · ${pluralizar(emFalta, 'em falta', 'em falta')}` : ''}
          </p>
        </div>

        {itens.length === 0 ? (
          <div className="mt-3">
            <EstadoVazio
              icone="🧺"
              titulo="Nenhum item na despensa"
              detalhe="Cadastre o primeiro item acima — inclusive o que está em falta, com quantidade zero."
            />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="mt-3">
            <EstadoVazio
              icone="🔎"
              titulo="Nenhum item com esses filtros"
              detalhe="Troque a categoria ou limpe a busca."
            />
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {CATEGORIAS_DESPENSA.filter((categoria) =>
              filtrados.some((item) => item.categoria === categoria),
            ).map((categoria) => (
              <section
                key={categoria}
                data-testid="despensa-grupo"
                data-categoria={categoria}
                className="overflow-hidden rounded-xl border border-maincourse-navy/10 bg-maincourse-cream/40"
              >
                <div className="flex items-center gap-2 border-b border-maincourse-navy/10 bg-white/70 px-3 py-2">
                  <span className="min-w-0 flex-1 font-semibold text-maincourse-navy">
                    {categoria}
                  </span>
                  <Selo tom="gold">
                    {pluralizar((porCategoria.get(categoria) ?? []).length, 'item', 'itens')}
                  </Selo>
                </div>
                <ul className="divide-y divide-maincourse-navy/5">
                  {(porCategoria.get(categoria) ?? [])
                    .filter((item) => filtrados.includes(item))
                    .map((item) => (
                      <li
                        key={item.id}
                        data-testid="despensa-item"
                        data-nome={item.nome}
                        data-categoria={item.categoria}
                        className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-maincourse-navy">
                            {item.nome}
                          </span>
                          {item.observacao && (
                            <span className="mt-0.5 block text-xs text-maincourse-navy/45">
                              {item.observacao}
                            </span>
                          )}
                        </span>
                        <Selo tom={item.unidade_medida === 'L' ? 'gold' : 'cinza'}>
                          {item.unidade_medida}
                        </Selo>
                        <span
                          className="min-w-[3.5rem] text-right text-sm font-bold text-maincourse-navy"
                          data-testid="despensa-quantidade-valor"
                        >
                          {formatarQuantidade(item.quantidade)}
                        </span>
                        {item.quantidade === 0 ? (
                          <Selo tom="vermelho">Em falta</Selo>
                        ) : (
                          <span className="w-[4.5rem]" aria-hidden="true" />
                        )}
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => editar(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-bold text-maincourse-navy transition hover:bg-white"
                            aria-label={`Editar ${item.nome}`}
                            data-testid="despensa-editar"
                          >
                            <IconeEditar />
                            <span className="hidden sm:inline">Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void aoExcluir(item)}
                            className="inline-flex items-center rounded-lg px-2.5 py-2 text-sm font-bold text-maincourse-red transition hover:bg-white"
                            aria-label={`Excluir ${item.nome}`}
                            data-testid="despensa-excluir"
                          >
                            <IconeExcluir />
                          </button>
                        </div>
                      </li>
                    ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </SecaoCard>
    </div>
  );
}
