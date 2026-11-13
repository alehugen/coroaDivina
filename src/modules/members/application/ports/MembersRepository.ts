import type { Role, StatusCadastro } from '@/modules/identity/domain/Conta'
import type { DataISO } from '@/shared/lib/datas'
import type { Mandato, NovoMandato } from '../../domain/Mandato'
import type { Socio } from '../../domain/Socio'

export interface MembersRepository {
  listarSocios(): Promise<Socio[]>
  alterarStatus(id: string, status: StatusCadastro): Promise<void>
  alterarRole(id: string, role: Role): Promise<void>
  /** Exclusão permanente (Edge Function excluir-conta, só admin). */
  excluirConta(id: string): Promise<void>
  recusarExclusao(id: string): Promise<void>

  listarMandatos(): Promise<Mandato[]>
  criarMandato(m: NovoMandato): Promise<void>
  alterarFimMandato(id: string, fim: DataISO): Promise<void>
  removerMandato(id: string): Promise<void>
}
