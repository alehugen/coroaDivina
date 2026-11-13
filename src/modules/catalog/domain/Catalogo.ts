import { fail, ok, type Result } from '@/shared/lib/result'

export interface Area {
  id: string
  nome: string
  /** Hex #rrggbb */
  cor: string
  ordem: number
}

/** Função "modelo": usada como base ao montar os dias de uma escala. */
export interface FuncaoModelo {
  id: string
  areaId: string
  nome: string
  ordem: number
  vagasResp: number
  vagasAux: number
  ativo: boolean
}

export interface AreaComFuncoes extends Area {
  funcoes: FuncaoModelo[]
}

/** Cores sugeridas (paleta da marca). */
export const CORES_AREA = [
  '#007f5f',
  '#2b9348',
  '#55a630',
  '#80b918',
  '#aacc00',
  '#bfd200',
  '#d4d700',
  '#dddf00',
  '#eeef20',
  '#ffff3f',
] as const

export const MAX_VAGAS = 50

export function agruparPorArea(areas: Area[], funcoes: FuncaoModelo[]): AreaComFuncoes[] {
  return [...areas]
    .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((a) => ({
      ...a,
      funcoes: funcoes
        .filter((f) => f.areaId === a.id)
        .sort((x, y) => x.ordem - y.ordem || x.nome.localeCompare(y.nome, 'pt-BR')),
    }))
}

export type DadosArea = Pick<Area, 'nome' | 'cor'>

export function validarArea(d: DadosArea): Result<DadosArea> {
  const nome = d.nome.trim()
  if (nome.length < 2) return fail('Informe o nome da área.')
  if (!/^#[0-9a-f]{6}$/i.test(d.cor)) return fail('Cor inválida.')
  return ok({ nome, cor: d.cor.toLowerCase() })
}

export type DadosFuncao = Pick<FuncaoModelo, 'areaId' | 'nome' | 'vagasResp' | 'vagasAux' | 'ativo'>

export function validarFuncao(d: DadosFuncao): Result<DadosFuncao> {
  const nome = d.nome.trim()
  if (!d.areaId) return fail('Escolha a área.')
  if (nome.length < 2) return fail('Informe o nome da função.')
  for (const v of [d.vagasResp, d.vagasAux]) {
    if (!Number.isInteger(v) || v < 0 || v > MAX_VAGAS) return fail(`Vagas devem estar entre 0 e ${MAX_VAGAS}.`)
  }
  if (d.vagasResp + d.vagasAux === 0) return fail('A função precisa ter pelo menos uma vaga.')
  return ok({ ...d, nome })
}

/**
 * Troca a posição de um item com o vizinho (para os botões ↑/↓).
 * Retorna as novas ordens a gravar, ou [] se não houver vizinho.
 */
export function mover<T extends { id: string; ordem: number }>(
  lista: T[],
  id: string,
  direcao: -1 | 1,
): { id: string; ordem: number }[] {
  const i = lista.findIndex((x) => x.id === id)
  const j = i + direcao
  if (i < 0 || j < 0 || j >= lista.length) return []
  // Renumera tudo (1..n) para corrigir ordens repetidas, depois troca o par
  const ids = lista.map((x) => x.id)
  ;[ids[i], ids[j]] = [ids[j]!, ids[i]!]
  return ids
    .map((id, k) => ({ id, ordem: k + 1 }))
    .filter((novo) => lista.find((x) => x.id === novo.id)!.ordem !== novo.ordem)
}

/** Próxima ordem livre ao criar um item no fim da lista. */
export const proximaOrdem = (lista: { ordem: number }[]) =>
  lista.reduce((m, x) => Math.max(m, x.ordem), 0) + 1
