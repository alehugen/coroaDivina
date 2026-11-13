import type { DataISO } from '@/shared/lib/datas'
import { ocupacao, type FuncaoDoDia, type Inscricao, type Papel, type StatusEscala } from './Escala'

/** Contexto de quem está vendo a grade. Gestor = admin ou Orgã vigente. */
export interface ContextoInscricao {
  status: StatusEscala
  data: DataISO
  hoje: DataISO
  meuId: string
  gestor: boolean
}

export type MotivoBloqueio =
  | 'nao_aberta'
  | 'escala_fechada'
  | 'dia_passado'
  | 'funcao_inativa'
  | 'lotado'
  | 'ja_inscrito'

export const MOTIVOS: Record<MotivoBloqueio, string> = {
  nao_aberta: 'Inscrições ainda não abertas',
  escala_fechada: 'Inscrições encerradas',
  dia_passado: 'Dia já passou',
  funcao_inativa: 'Indisponível',
  lotado: 'Lotado',
  ja_inscrito: 'Você já está nesta função',
}

export const ROTULO_PAPEL: Record<Papel, string> = {
  responsavel: 'Responsável',
  auxiliar: 'Auxiliar',
}

export const minhaInscricao = (f: FuncaoDoDia, meuId: string): Inscricao | undefined =>
  f.inscricoes.find((i) => i.profileId === meuId)

export const vagasLivres = (f: FuncaoDoDia, papel: Papel) => {
  const o = ocupacao(f)
  return papel === 'responsavel' ? o.livresResp : o.livresAux
}

/**
 * Pode se inscrever nesse papel? Espelha as regras da RPC `inscrever`
 * (o banco é quem garante; aqui é só para a interface).
 * Gestores podem inscrever mesmo com a escala em rascunho/fechada ou dia passado.
 */
export function disponibilidade(
  f: FuncaoDoDia,
  papel: Papel,
  ctx: ContextoInscricao,
): { pode: true } | { pode: false; motivo: MotivoBloqueio } {
  if (!ctx.gestor) {
    if (ctx.status === 'rascunho') return { pode: false, motivo: 'nao_aberta' }
    if (ctx.status !== 'aberta') return { pode: false, motivo: 'escala_fechada' }
    if (ctx.data < ctx.hoje) return { pode: false, motivo: 'dia_passado' }
    if (!f.ativa) return { pode: false, motivo: 'funcao_inativa' }
  }
  if (minhaInscricao(f, ctx.meuId)) return { pode: false, motivo: 'ja_inscrito' }
  if (vagasLivres(f, papel) <= 0) return { pode: false, motivo: 'lotado' }
  return { pode: true }
}

/** O sócio pode cancelar a própria inscrição? (gestor sempre pode) */
export const podeCancelar = (ctx: Pick<ContextoInscricao, 'status' | 'data' | 'hoje' | 'gestor'>) =>
  ctx.gestor || (ctx.status === 'aberta' && ctx.data >= ctx.hoje)

/** Inscrição do usuário, já com os dados da escala (tela "Minhas escalas"). */
export interface MinhaInscricao {
  id: string
  papel: Papel
  funcao: string
  area: string
  areaCor: string
  data: DataISO
  escalaId: string
  escala: string
  escalaStatus: StatusEscala
}

/** Agrupa por data (ordem crescente), separando próximas e anteriores. */
export function agruparPorData(lista: MinhaInscricao[], hoje: DataISO) {
  const mapa = new Map<DataISO, MinhaInscricao[]>()
  for (const i of [...lista].sort((a, b) => a.data.localeCompare(b.data))) {
    mapa.set(i.data, [...(mapa.get(i.data) ?? []), i])
  }
  const grupos = [...mapa.entries()].map(([data, itens]) => ({ data, itens }))
  return {
    proximas: grupos.filter((g) => g.data >= hoje),
    anteriores: grupos.filter((g) => g.data < hoje).reverse(),
  }
}
