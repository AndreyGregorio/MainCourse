import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Prato } from '../../types';
import { LIMITE_NOME } from '../../lib/constants';
import { normalizar } from '../../lib/utils';
import { Botao, Campo, Entrada, EstadoVazio, SecaoCard } from '../ui/Basicos';
import { IconeEditar, IconeExcluir, IconePrato } from '../ui/Icones';

type Props = {
  pratos: Prato[];
  aoSalvar: (nome: string, nomeOriginal?: string) => Promise<boolean>;
  aoRemover: (nome: string) => Promise<boolean>;
};

export function GestaoPratos({ pratos, aoSalvar, aoRemover }: Props) {
  const [nome, setNome] = useState('');
  const [editando, setEditando] = useState<Prato | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState('');

  const filtrados = useMemo(() => {
    const termo = normalizar(busca);
    if (!termo) return pratos;
    return pratos.filter((prato) => normalizar(prato.nome).includes(termo));
  }, [busca, pratos]);

  function limpar() {
    setNome('');
    setEditando(null);
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) return;

    setSalvando(true);
    const salvou = await aoSalvar(nomeLimpo, editando?.nome);
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
            <IconePrato />
          </span>
          <h2 className="font-display text-xl font-bold text-maincourse-navy">Pratos</h2>
        </div>
        <span className="rounded-full bg-maincourse-navy/5 px-2.5 py-1 text-xs font-bold text-maincourse-navy/60">
          {pratos.length}
        </span>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-maincourse-navy/55">
        O nome identifica o prato
      </p>

      <form onSubmit={enviar} data-testid="prato-form" className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <Campo
          rotulo={editando ? `Editando “${editando.nome}”` : 'Nome do prato'}
          className="flex-1"
          dica={editando ? 'Salve para renomear ou cancele para voltar.' : undefined}
        >
          <Entrada
            required
            type="text"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            placeholder="Ex.: Lasanha à bolonhesa"
            maxLength={LIMITE_NOME}
            autoComplete="off"
            data-testid="prato-nome"
          />
        </Campo>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Botao type="submit" carregando={salvando} className="w-full sm:w-auto" data-testid="prato-adicionar">
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

      {pratos.length === 0 ? (
        <EstadoVazio
          icone="🍳"
          titulo="Nenhum prato cadastrado"
          detalhe="Cadastre o primeiro prato acima."
        />
      ) : (
        <>
          {pratos.length > 5 && (
            <input
              type="search"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Filtrar prato…"
              aria-label="Filtrar pratos pelo nome"
              data-testid="prato-busca"
              className="mb-3 w-full rounded-xl border border-maincourse-navy/15 bg-maincourse-cream/50 p-3 text-base text-maincourse-navy outline-none transition placeholder:text-maincourse-navy/35 focus:border-maincourse-gold focus:ring-2 focus:ring-maincourse-gold/25"
            />
          )}

          <ul className="flex flex-col gap-2">
            {filtrados.map((prato) => (
              <li
                key={prato.id}
                data-testid="prato-item"
                data-nome={prato.nome}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-maincourse-navy/10 bg-maincourse-cream/50 p-3"
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-maincourse-gold"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 font-semibold text-maincourse-navy">
                  {prato.nome}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditando(prato);
                      setNome(prato.nome);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-maincourse-navy transition hover:bg-white"
                    aria-label={`Editar ${prato.nome}`}
                    data-testid="prato-editar"
                  >
                    <IconeEditar />
                    <span className="hidden sm:inline">Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void aoRemover(prato.nome)}
                    className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-bold text-maincourse-red transition hover:bg-white"
                    aria-label={`Excluir ${prato.nome}`}
                    data-testid="prato-excluir"
                  >
                    <IconeExcluir />
                  </button>
                </div>
              </li>
            ))}
            {filtrados.length === 0 && (
              <li className="py-4 text-center text-sm text-maincourse-navy/50">
                Nenhum prato encontrado para “{busca}”.
              </li>
            )}
          </ul>
        </>
      )}
    </SecaoCard>
  );
}
