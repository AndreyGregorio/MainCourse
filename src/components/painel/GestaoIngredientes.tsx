import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Embalagem, Ingrediente, Unidade } from '../../types';
import { LIMITE_EMBALAGEM, LIMITE_NOME, UNIDADES } from '../../lib/constants';
import { analisarQuantidade, normalizar, pluralizar } from '../../lib/utils';
import { Botao, Campo, Entrada, EstadoVazio, SecaoCard, Selecao, Selo } from '../ui/Basicos';
import { IconeEditar, IconeExcluir, IconeIngrediente } from '../ui/Icones';

type FiltroUnidade = Unidade | 'todas';

type Props = {
  ingredientes: Ingrediente[];
  usosPorIngrediente: Map<string, number>;
  aoCriar: (nome: string, unidade: Unidade, embalagem: Embalagem | null) => Promise<boolean>;
  aoAtualizar: (nome: string, unidade: Unidade, embalagem: Embalagem | null) => Promise<boolean>;
  aoRemover: (nome: string) => Promise<boolean>;
};

export function GestaoIngredientes({
  ingredientes,
  usosPorIngrediente,
  aoCriar,
  aoAtualizar,
  aoRemover,
}: Props) {
  const [nome, setNome] = useState('');
  const [unidade, setUnidade] = useState<Unidade>('kg');
  const [embalagemRotulo, setEmbalagemRotulo] = useState('');
  const [embalagemQuantidade, setEmbalagemQuantidade] = useState('');
  const [editando, setEditando] = useState<Ingrediente | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroUnidade, setFiltroUnidade] = useState<FiltroUnidade>('todas');

  const filtrados = useMemo(() => {
    const termo = normalizar(busca);
    return ingredientes.filter((ingrediente) => {
      const combinaNome = termo ? normalizar(ingrediente.nome).includes(termo) : true;
      const combinaUnidade =
        filtroUnidade === 'todas' ? true : ingrediente.unidade_medida === filtroUnidade;
      return combinaNome && combinaUnidade;
    });
  }, [busca, filtroUnidade, ingredientes]);

  function limpar() {
    setNome('');
    setUnidade('kg');
    setEmbalagemRotulo('');
    setEmbalagemQuantidade('');
    setErro(null);
    setEditando(null);
  }

  /** Trocar a unidade invalida a embalagem antiga (ela é medida na unidade). */
  function trocarUnidade(nova: Unidade) {
    if (nova !== unidade) {
      setEmbalagemRotulo('');
      setEmbalagemQuantidade('');
    }
    setUnidade(nova);
    setErro(null);
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    // Lê o formulário do DOM: se o navegador preencher um campo sem disparar
    // onChange, o valor visível continua sendo o valor validado.
    const formulario = new FormData(evento.currentTarget);
    const nomeLimpo = String(formulario.get('nome') ?? '').trim();
    if (!nomeLimpo) {
      setErro('Informe o nome do ingrediente.');
      return;
    }

    const unidadeTexto = String(formulario.get('unidade') ?? unidade);
    const unidadeForm = UNIDADES.includes(unidadeTexto as Unidade)
      ? (unidadeTexto as Unidade)
      : unidade;

    const rotulo = String(formulario.get('embalagem-rotulo') ?? '').trim();
    const quantidadeTexto = String(formulario.get('embalagem-quantidade') ?? '').trim();
    let embalagem: Embalagem | null = null;

    if (rotulo && !quantidadeTexto) {
      setErro('Informe a quantidade da embalagem ou apague o rótulo.');
      return;
    }
    if (!rotulo && quantidadeTexto) {
      setErro('Informe o rótulo da embalagem ou apague a quantidade.');
      return;
    }
    if (rotulo) {
      const quantidade = analisarQuantidade(quantidadeTexto);
      if (quantidade === null || quantidade <= 0) {
        setErro('A quantidade da embalagem precisa ser um número maior que zero.');
        return;
      }
      embalagem = { rotulo, quantidade };
    }

    setSalvando(true);
    const salvou = editando
      ? await aoAtualizar(editando.nome, unidadeForm, embalagem)
      : await aoCriar(nomeLimpo, unidadeForm, embalagem);
    setSalvando(false);
    if (salvou) limpar();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-maincourse-gold">RFC02</p>
        <h1 className="font-display text-3xl font-bold text-maincourse-navy">Ingredientes</h1>
      </header>

      <SecaoCard>
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-maincourse-gold/20 text-maincourse-navy"
              aria-hidden="true"
            >
              <IconeIngrediente />
            </span>
            <h2 className="font-display text-xl font-bold text-maincourse-navy">
              {editando ? `Editando “${editando.nome}”` : 'Novo ingrediente'}
            </h2>
          </div>
          <span className="rounded-full bg-maincourse-navy/5 px-2.5 py-1 text-xs font-bold text-maincourse-navy/60">
            {ingredientes.length}
          </span>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-maincourse-navy/55">
          A unidade escolhida vale para todas as receitas e itens de despensa com o mesmo nome. A
          embalagem é opcional: cadastre-a para a lista de compras dizer quantos pacotes comprar
          (ex.: “pacote 500 g” em um ingrediente em <strong>kg</strong>).
        </p>

        <form
          onSubmit={enviar}
          className="mb-5 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end"
        >
          <Campo
            rotulo={editando ? 'Nome (não editável)' : 'Nome do ingrediente'}
            className="flex-1"
            dica={
              editando
                ? 'O nome não pode ser alterado; ajuste só a unidade.'
                : undefined
            }
          >
            <Entrada
              name="nome"
              required
              type="text"
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
              placeholder="Ex.: Queijo mussarela"
              maxLength={LIMITE_NOME}
              autoComplete="off"
              readOnly={Boolean(editando)}
              aria-readonly={Boolean(editando)}
              className={editando ? 'bg-maincourse-navy/5' : ''}
            />
          </Campo>
          <Campo rotulo="Unidade" className="lg:w-28">
            <Selecao
              name="unidade"
              value={unidade}
              onChange={(evento) => trocarUnidade(evento.target.value as Unidade)}
            >
              {UNIDADES.map((valor) => (
                <option key={valor} value={valor}>
                  {valor}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo
            rotulo="Embalagem (opcional)"
            className="lg:w-52"
            dica="Deixe os dois vazios para comprar a granel."
          >
            <Entrada
              name="embalagem-rotulo"
              type="text"
              value={embalagemRotulo}
              onChange={(evento) => {
                setEmbalagemRotulo(evento.target.value);
                setErro(null);
              }}
              placeholder="Ex.: pacote 500 g"
              maxLength={LIMITE_EMBALAGEM}
              autoComplete="off"
              aria-label="Rótulo da embalagem de compra"
            />
          </Campo>
          <Campo rotulo={`Qtd. da embalagem (${unidade})`} className="lg:w-40">
            <Entrada
              name="embalagem-quantidade"
              type="text"
              inputMode="decimal"
              value={embalagemQuantidade}
              onChange={(evento) => {
                setEmbalagemQuantidade(evento.target.value);
                setErro(null);
              }}
              placeholder="Ex.: 0,5"
              autoComplete="off"
              aria-label="Quantidade da embalagem na unidade do ingrediente"
            />
          </Campo>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Botao
              type="submit"
              carregando={salvando}
              className="w-full sm:w-auto"
            >
              {editando ? 'Salvar' : 'Adicionar'}
            </Botao>
            {editando && (
              <Botao
                type="button"
                variante="secundario"
                onClick={limpar}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Botao>
            )}
          </div>
        </form>

        {erro && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-maincourse-red/30 bg-maincourse-red/5 px-3 py-2 text-sm font-semibold text-maincourse-navy"
          >
            {erro}
          </p>
        )}

        {ingredientes.length === 0 ? (
          <EstadoVazio
            icone="🥕"
            titulo="Nenhum ingrediente cadastrado"
            detalhe="Sem ingredientes não dá para montar as receitas."
          />
        ) : (
          <>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="search"
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Filtrar ingrediente…"
                aria-label="Filtrar ingredientes pelo nome"
                className="w-full rounded-xl border border-maincourse-navy/15 bg-maincourse-cream/50 p-3 text-base text-maincourse-navy outline-none transition placeholder:text-maincourse-navy/35 focus:border-maincourse-gold focus:ring-2 focus:ring-maincourse-gold/25"
              />
              <select
                value={filtroUnidade}
                onChange={(evento) => setFiltroUnidade(evento.target.value as FiltroUnidade)}
                aria-label="Filtrar ingredientes pela unidade"
                className="w-full rounded-xl border border-maincourse-navy/15 bg-maincourse-cream/50 p-3 text-base text-maincourse-navy outline-none transition focus:border-maincourse-gold focus:ring-2 focus:ring-maincourse-gold/25 sm:w-48"
              >
                <option value="todas">Todas as unidades</option>
                {UNIDADES.map((valor) => (
                  <option key={valor} value={valor}>
                    {valor}
                  </option>
                ))}
              </select>
            </div>

            <ul className="flex flex-col gap-2">
              {filtrados.map((ingrediente) => {
                const usos = usosPorIngrediente.get(ingrediente.id) ?? 0;
                return (
                  <li
                    key={ingrediente.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-maincourse-navy/10 bg-maincourse-cream/50 p-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-maincourse-navy">
                        {ingrediente.nome}
                      </span>
                      {usos > 0 && (
                        <span
                          className="mt-0.5 block text-xs font-semibold text-maincourse-navy/45"
                        >
                          usado em {pluralizar(usos, 'receita', 'receitas')}
                        </span>
                      )}
                      {ingrediente.embalagem && (
                        <span
                          className="mt-0.5 block text-xs font-semibold text-maincourse-navy/45"
                        >
                          embalagem: {ingrediente.embalagem.rotulo}
                        </span>
                      )}
                    </span>
                    <span>
                      <Selo tom={ingrediente.unidade_medida === 'L' ? 'gold' : 'navy'}>
                        {ingrediente.unidade_medida}
                      </Selo>
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditando(ingrediente);
                          setNome(ingrediente.nome);
                          setUnidade(ingrediente.unidade_medida);
                          setEmbalagemRotulo(ingrediente.embalagem?.rotulo ?? '');
                          setEmbalagemQuantidade(
                            ingrediente.embalagem
                              ? String(ingrediente.embalagem.quantidade).replace('.', ',')
                              : '',
                          );
                          setErro(null);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-maincourse-navy transition hover:bg-white"
                        aria-label={`Editar a unidade de ${ingrediente.nome}`}
                      >
                        <IconeEditar />
                        <span className="hidden sm:inline">Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void aoRemover(ingrediente.nome)}
                        className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-bold text-maincourse-red transition hover:bg-white"
                        aria-label={`Excluir ${ingrediente.nome}`}
                      >
                        <IconeExcluir />
                      </button>
                    </div>
                  </li>
                );
              })}
              {filtrados.length === 0 && (
                <li className="py-4 text-center text-sm text-maincourse-navy/50">
                  Nenhum ingrediente encontrado com esses filtros.
                </li>
              )}
            </ul>
          </>
        )}
      </SecaoCard>
    </div>
  );
}
