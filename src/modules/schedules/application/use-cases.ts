import { tentar } from '@/shared/lib/errors'
import type { DataISO } from '@/shared/lib/datas'
import { fail, type Result } from '@/shared/lib/result'
import {
  validarNovaEscala,
  validarNovaFuncaoDia,
  type DiaEscala,
  type NovaEscala,
  type NovaFuncaoDia,
  type Papel,
  type StatusEscala,
} from '../domain/Escala'
import type { EscalasRepository, PatchFuncaoDia } from './ports/EscalasRepository'

export function criarUseCasesEscalas(repo: EscalasRepository) {
  return {
    listar: () => tentar(() => repo.listar()),
    obter: (id: string) => tentar(() => repo.obter(id)),
    listarOrgas: () => tentar(() => repo.listarOrgas()),
    listarDias: () => tentar(() => repo.listarDias()),

    async criar(dados: NovaEscala): Promise<Result<string>> {
      const v = validarNovaEscala(dados)
      if (!v.ok) return v
      return tentar(() => repo.criar(v.value))
    },

    async duplicar(origemId: string, titulo: string, novoInicio: DataISO): Promise<Result<string>> {
      if (titulo.trim().length < 3) return fail('Informe o título da nova escala.')
      if (!novoInicio) return fail('Informe a data de início.')
      return tentar(() => repo.duplicar(origemId, titulo.trim(), novoInicio))
    },

    async atualizarDados(id: string, titulo: string, descricao: string): Promise<Result<void>> {
      if (titulo.trim().length < 3) return fail('Informe o título da escala.')
      return tentar(() => repo.atualizar(id, { titulo: titulo.trim(), descricao: descricao.trim() || null }))
    },

    alterarStatus: (id: string, status: StatusEscala) => tentar(() => repo.alterarStatus(id, status)),
    excluir: (id: string) => tentar(() => repo.excluir(id)),

    async adicionarDia(
      escalaId: string,
      data: DataISO,
      diasExistentes: DiaEscala[],
      funcaoModeloIds: string[],
    ): Promise<Result<void>> {
      if (!data) return fail('Escolha a data.')
      if (diasExistentes.some((d) => d.data === data)) return fail('Esse dia já faz parte da escala.')
      return tentar(() => repo.adicionarDia(escalaId, data, funcaoModeloIds))
    },

    removerDia: (diaId: string) => tentar(() => repo.removerDia(diaId)),
    salvarObservacoes: (diaId: string, texto: string) => tentar(() => repo.salvarObservacoes(diaId, texto.trim())),

    async adicionarFuncao(dia: DiaEscala, dados: NovaFuncaoDia): Promise<Result<void>> {
      const v = validarNovaFuncaoDia(dados, dia.funcoes)
      if (!v.ok) return v
      const ordem = dia.funcoes.reduce((m, f) => Math.max(m, f.ordem), 0) + 1
      return tentar(() => repo.adicionarFuncao(dia.id, { ...v.value, ordem }))
    },

    atualizarFuncao: (id: string, patch: PatchFuncaoDia) => tentar(() => repo.atualizarFuncao(id, patch)),
    removerFuncao: (id: string) => tentar(() => repo.removerFuncao(id)),

    inscrever: (diaFuncaoId: string, papel: Papel, profileId?: string) =>
      tentar(() => repo.inscrever(diaFuncaoId, papel, profileId)),
    cancelarInscricao: (inscricaoId: string) => tentar(() => repo.cancelarInscricao(inscricaoId)),
    minhasInscricoes: () => tentar(() => repo.minhasInscricoes()),
    observarInscricoes: (aoMudar: () => void) => repo.observarInscricoes(aoMudar),
  }
}
