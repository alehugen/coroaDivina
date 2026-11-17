import type { Grau } from '@/modules/identity/domain/Grau'
import { tentar } from '@/shared/lib/errors'
import { hojeISO } from '@/shared/lib/datas'
import { fail, type Result } from '@/shared/lib/result'
import {
  duplicado,
  planoEncerramento,
  validarMandato,
  type Mandato,
  type NovoMandato,
} from '../domain/Mandato'
import type { MembersRepository } from './ports/MembersRepository'

export function criarUseCasesMembros(repo: MembersRepository) {
  return {
    listarSocios: () => tentar(() => repo.listarSocios()),
    desativar: (id: string) => tentar(() => repo.alterarStatus(id, 'inativo')),
    reativar: (id: string) => tentar(() => repo.alterarStatus(id, 'aprovado')),
    tornarAdmin: (id: string) => tentar(() => repo.alterarRole(id, 'admin')),
    removerAdmin: (id: string) => tentar(() => repo.alterarRole(id, 'socio')),
    definirGrau: (id: string, grau: Grau) => tentar(() => repo.definirGrau(id, grau)),
    excluir: (id: string) => tentar(() => repo.excluirConta(id)),
    recusarExclusao: (id: string) => tentar(() => repo.recusarExclusao(id)),

    listarMandatos: () => tentar(() => repo.listarMandatos()),

    async criarMandato(novo: NovoMandato, existentes: Mandato[]): Promise<Result<void>> {
      const v = validarMandato(novo)
      if (!v.ok) return v
      if (duplicado(novo, existentes))
        return fail('Essa pessoa já tem um mandato que cobre parte desse período.')
      return tentar(() => repo.criarMandato(novo))
    },

    encerrarMandato(m: Mandato): Promise<Result<void>> {
      const plano = planoEncerramento(m, hojeISO())
      return tentar(() =>
        plano.acao === 'remover' ? repo.removerMandato(m.id) : repo.alterarFimMandato(m.id, plano.fim),
      )
    },

    removerMandato: (id: string) => tentar(() => repo.removerMandato(id)),
  }
}
