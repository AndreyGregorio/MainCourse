import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Ingrediente, Unidade } from '../../types';
import { LIMITE_NOME, UNIDADES } from '../../lib/constants';
import { normalizar } from '../../lib/utils';
import { Botao, Campo, Entrada, EstadoVazio, SecaoCard, Selecao, Selo } from '../ui/Basicos';
import { IconeEditar, IconeExcluir, IconeIngrediente } from '../ui/Icones';

type FiltroUnidade = Unidade | 'todas';

type Props = {
  ingredientes: Ingrediente[];
  aoCriar: (nome: string, unidade: Unidade) => Promise<boolean>;
  aoAtualizarUnidade: (nome: string, unidade: Unidade) => Promise<boolean>;
  aoRemover: (nome: string) => Promise<boolean>;
};

export function GestaoIngredientes({
  ingredientes,
  aoCriar,
  aoAtualizarUnidade,
  aoRemover,
}: Props) {
  const [nome, setNome] = useState('');
  const [unidade, setUnidade] = useState<Unidade>('kg');
  const [editando, setEditando] = useState<Ingrediente | null>(null);
  const [salvando, setSalvando] = useState(false);
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
    setEditando(null);
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) return;

    setSalvando(true);
    const salvou = editando
      ? await aoAtualizarUnidade(editando.nome, unidade)
      : await aoCriar(nomeLimpo, unidade);
    setSalvando(false);
    if (salvou) limpar();
  }

  return (
    <SecaoCard>
      <div className="mb-1 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-maincourse-gold/20 text-lg"
            aria-hidden="true"
          >
            <IconeIngrediente />
          </span>
          <h2 className="font-display text-xl font-bold text-maincourse-navy">Ingredientes</h2>
        </div>
        <span className="rounded-full bg-maincourse-navy/5 px-2.5 py-1 text-xs font-bold text-maincourse-navy/60">
          {ingredientes.length}
        </span>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-maincourse-navy/55">
        A unidade escolhida vale para todas as receitas e itens de despensa que usarem este
        ingrediente.
      </p>

      <form onSubmit={enviar} data-testid="ingrediente-form" className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <Campo
          rotulo={editando ? `Editando “${editando.nome}”` : 'Nome do ingrediente'}
          className="flex-1"
          dica={editando ? 'O nome não pode ser alterado; ajuste só a unidade.' : undefined}
        >
          <Entrada
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
            data-testid="ingrediente-nome"
          />
        </Campo>
        <Campo rotulo="Unidade" className="sm:w-32">
          <Selecao
            value={unidade}
            onChange={(evento) => setUnidade(evento.target.value as Unidade)}
            data-testid="ingrediente-unidade"
          >
            {UNIDADES.map((valor) => (
              <option key={valor} value={valor}>
                {valor}
              </option>
            ))}
          </Selecao>
        </Campo>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Botao type="submit" carregando={salvando} className="w-full sm:w-auto" data-testid="ingrediente-adicionar">
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

      {ingredientes.length === 0 ? (
        <EstadoVazio
          icone="🥕"
          titulo="Nenhum ingrediente cadastrado"
          detalhe="Sem ingredientes não dá para montar as receitas nas próximas releases."
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
              data-testid="ingrediente-busca"
              className="w-full rounded-xl border border-maincourse-navy/15 bg-maincourse-cream/50 p-3 text-base text-maincourse-navy outline-none transition placeholder:text-maincourse-navy/35 focus:border-maincourse-gold focus:ring-2 focus:ring-maincourse-gold/25"
            />
            <select
              value={filtroUnidade}
              onChange={(evento) => setFiltroUnidade(evento.target.value as FiltroUnidade)}
              aria-label="Filtrar ingredientes pela unidade"
              data-testid="ingrediente-filtro"
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
            {filtrados.map((ingrediente) => (
              <li
                key={ingrediente.id}
                data-testid="ingrediente-item"
                data-nome={ingrediente.nome}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-maincourse-navy/10 bg-maincourse-cream/50 p-3"
              >
                <span className="min-w-0 flex-1 font-semibold text-maincourse-navy">
                  {ingrediente.nome}
                </span>
                <span data-testid="ingrediente-unidade-badge">
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
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-maincourse-navy transition hover:bg-white"
                    aria-label={`Editar a unidade de ${ingrediente.nome}`}
                    data-testid="ingrediente-editar"
                  >
                    <IconeEditar />
                    <span className="hidden sm:inline">Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void aoRemover(ingrediente.nome)}
                    className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-bold text-maincourse-red transition hover:bg-white"
                    aria-label={`Excluir ${ingrediente.nome}`}
                    data-testid="ingrediente-excluir"
                  >
                    <IconeExcluir />
                  </button>
                </div>
              </li>
            ))}
            {filtrados.length === 0 && (
              <li className="py-4 text-center text-sm text-maincourse-navy/50">
                Nenhum ingrediente encontrado com esses filtros.
              </li>
            )}
          </ul>
        </>
      )}
    </SecaoCard>
  );
}
