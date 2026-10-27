import { useCallback, useMemo } from 'react';
import type { Unidade } from '../types';
import { useColecao, useOnline } from '../hooks/useColecao';
import { mapearIngrediente, mapearPrato } from '../lib/mapeadores';
import * as acoes from '../lib/acoes';
import { compararNomes, mensagemDeErro } from '../lib/utils';
import { useToast } from './ui/toast-context';
import { useConfirm } from './ui/confirm-context';
import { Cabecalho } from './Cabecalho';
import { TelaPainel } from './TelaPainel';
import { Rodape } from './Rodape';
import { TelaCarregando } from './TelaCarregando';

export function Aplicacao() {
  const { avisar } = useToast();
  const confirmar = useConfirm();
  const online = useOnline();

  const colecaoPratos = useColecao('pratos', mapearPrato);
  const colecaoIngredientes = useColecao('ingredientes', mapearIngrediente);

  const carregando = colecaoPratos.carregando || colecaoIngredientes.carregando;
  const daCache = colecaoPratos.daCache || colecaoIngredientes.daCache;

  const datasDeAtualizacao = [colecaoPratos.atualizadoEm, colecaoIngredientes.atualizadoEm].filter(
    (data): data is Date => data instanceof Date,
  );
  const atualizadoEm =
    datasDeAtualizacao.length === 0
      ? null
      : new Date(Math.max(...datasDeAtualizacao.map((data) => data.getTime())));

  const pratos = useMemo(
    () => [...colecaoPratos.dados].sort((a, b) => compararNomes(a.nome, b.nome)),
    [colecaoPratos.dados],
  );

  const ingredientes = useMemo(
    () => [...colecaoIngredientes.dados].sort((a, b) => compararNomes(a.nome, b.nome)),
    [colecaoIngredientes.dados],
  );

  const executar = useCallback(
    async (acao: () => Promise<void>, sucesso?: string): Promise<boolean> => {
      try {
        await acao();
        if (sucesso) avisar(sucesso);
        return true;
      } catch (falha) {
        avisar(mensagemDeErro(falha), 'erro');
        return false;
      }
    },
    [avisar],
  );

  const salvarPrato = useCallback(
    (nome: string, nomeOriginal?: string) =>
      executar(
        () => acoes.salvarPrato(nome, nomeOriginal),
        nomeOriginal ? 'Prato atualizado.' : 'Prato adicionado.',
      ),
    [executar],
  );

  const removerPrato = useCallback(
    async (nome: string) => {
      const confirmou = await confirmar({
        titulo: `Excluir “${nome}”?`,
        descricao: 'O prato sai do cadastro. Esta ação não pode ser desfeita.',
        textoConfirmar: 'Excluir prato',
        perigoso: true,
      });
      if (!confirmou) return false;
      return executar(() => acoes.removerPrato(nome), 'Prato excluído.');
    },
    [confirmar, executar],
  );

  const criarIngrediente = useCallback(
    (nome: string, unidade: Unidade) =>
      executar(() => acoes.criarIngrediente(nome, unidade), 'Ingrediente adicionado.'),
    [executar],
  );

  const atualizarUnidade = useCallback(
    (nome: string, unidade: Unidade) =>
      executar(() => acoes.atualizarUnidadeIngrediente(nome, unidade), 'Unidade atualizada.'),
    [executar],
  );

  const removerIngrediente = useCallback(
    async (nome: string) => {
      const confirmou = await confirmar({
        titulo: `Excluir “${nome}”?`,
        descricao: 'O ingrediente sai do cadastro. Esta ação não pode ser desfeita.',
        textoConfirmar: 'Excluir ingrediente',
        perigoso: true,
      });
      if (!confirmou) return false;
      return executar(() => acoes.removerIngrediente(nome), 'Ingrediente excluído.');
    },
    [confirmar, executar],
  );

  if (carregando) {
    return <TelaCarregando mensagem="Conectando..." />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-maincourse-cream">
      <Cabecalho online={online} daCache={daCache} atualizadoEm={atualizadoEm} />

      <main className="flex-1 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-10">
        <TelaPainel
          pratos={pratos}
          ingredientes={ingredientes}
          aoSalvarPrato={salvarPrato}
          aoRemoverPrato={removerPrato}
          aoCriarIngrediente={criarIngrediente}
          aoAtualizarUnidade={atualizarUnidade}
          aoRemoverIngrediente={removerIngrediente}
        />
      </main>

      <Rodape />
    </div>
  );
}
