import type { DataISO } from '@/shared/lib/datas'
import type {
  EscalaComResumo,
  EscalaDetalhada,
  FuncaoDoDia,
  NovaEscala,
  NovaFuncaoDia,
  Papel,
  StatusEscala,
} from '../../domain/Escala'
import type { MinhaInscricao } from '../../domain/Inscricao'

export type PatchFuncaoDia = Partial<Pick<FuncaoDoDia, 'vagasResp' | 'vagasAux' | 'ativa' | 'nome'>>

export interface MandatoRef {
  nome: string
  inicio: DataISO
  fim: DataISO
}

export interface EscalasRepository {
  listar(): Promise<EscalaComResumo[]>
  obter(id: string): Promise<EscalaDetalhada | null>
  listarOrgas(): Promise<MandatoRef[]>

  criar(dados: NovaEscala): Promise<string>
  duplicar(origemId: string, titulo: string, novoInicio: DataISO): Promise<string>
  atualizar(id: string, dados: { titulo: string; descricao: string | null }): Promise<void>
  alterarStatus(id: string, status: StatusEscala): Promise<void>
  excluir(id: string): Promise<void>

  adicionarDia(escalaId: string, data: DataISO, funcaoModeloIds: string[]): Promise<void>
  removerDia(diaId: string): Promise<void>
  salvarObservacoes(diaId: string, texto: string): Promise<void>

  adicionarFuncao(diaId: string, dados: NovaFuncaoDia & { ordem: number }): Promise<void>
  atualizarFuncao(id: string, patch: PatchFuncaoDia): Promise<void>
  removerFuncao(id: string): Promise<void>

  /** profileId omitido = o próprio usuário. Outro id exige admin/Orgã. */
  inscrever(diaFuncaoId: string, papel: Papel, profileId?: string): Promise<void>
  cancelarInscricao(inscricaoId: string): Promise<void>
  minhasInscricoes(): Promise<MinhaInscricao[]>
  /** Avisa sempre que alguma inscrição mudar (Realtime). Retorna função para parar. */
  observarInscricoes(aoMudar: () => void): () => void
}
