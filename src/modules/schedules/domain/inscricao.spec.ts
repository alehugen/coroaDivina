import { describe, expect, it } from 'vitest'
import type { FuncaoDoDia, Inscricao } from './Escala'
import {
  agruparPorData,
  disponibilidade,
  minhaInscricao,
  podeCancelar,
  type ContextoInscricao,
  type MinhaInscricao,
} from './Inscricao'

const insc = (profileId: string, papel: Inscricao['papel']): Inscricao => ({
  id: `i-${profileId}`,
  profileId,
  nome: profileId,
  papel,
  criadoEm: '',
})

const funcao = (p: Partial<FuncaoDoDia> = {}): FuncaoDoDia => ({
  id: 'f',
  diaId: 'd',
  area: { id: 'a', nome: 'Cozinha', cor: '#80b918', ordem: 1 },
  funcaoModeloId: null,
  nome: 'Jantar',
  ordem: 1,
  vagasResp: 1,
  vagasAux: 2,
  ativa: true,
  inscricoes: [],
  ...p,
})

const ctx = (p: Partial<ContextoInscricao> = {}): ContextoInscricao => ({
  status: 'aberta',
  data: '2026-11-20',
  hoje: '2026-11-13',
  meuId: 'eu',
  gestor: false,
  ...p,
})

describe('disponibilidade', () => {
  it('permite quando há vaga', () => {
    expect(disponibilidade(funcao(), 'responsavel', ctx())).toEqual({ pode: true })
  })

  it('bloqueia papel lotado, mas libera o outro', () => {
    const f = funcao({ inscricoes: [insc('maria', 'responsavel')] })
    expect(disponibilidade(f, 'responsavel', ctx())).toEqual({ pode: false, motivo: 'lotado' })
    expect(disponibilidade(f, 'auxiliar', ctx())).toEqual({ pode: true })
  })

  it('bloqueia quem já está na função', () => {
    const f = funcao({ inscricoes: [insc('eu', 'auxiliar')] })
    expect(minhaInscricao(f, 'eu')?.papel).toBe('auxiliar')
    expect(disponibilidade(f, 'responsavel', ctx())).toEqual({ pode: false, motivo: 'ja_inscrito' })
  })

  it('sócio não se inscreve com escala fechada, dia passado ou função inativa', () => {
    expect(disponibilidade(funcao(), 'auxiliar', ctx({ status: 'rascunho' }))).toMatchObject({ motivo: 'nao_aberta' })
    expect(disponibilidade(funcao(), 'auxiliar', ctx({ status: 'fechada' }))).toMatchObject({ motivo: 'escala_fechada' })
    expect(disponibilidade(funcao(), 'auxiliar', ctx({ status: 'arquivada' }))).toMatchObject({ motivo: 'escala_fechada' })
    expect(disponibilidade(funcao(), 'auxiliar', ctx({ data: '2026-11-01' }))).toMatchObject({ motivo: 'dia_passado' })
    expect(disponibilidade(funcao({ ativa: false }), 'auxiliar', ctx())).toMatchObject({ motivo: 'funcao_inativa' })
  })

  it('gestor (admin/Orgã) participa mesmo em rascunho, mas respeita vagas', () => {
    expect(disponibilidade(funcao(), 'auxiliar', ctx({ status: 'rascunho', gestor: true }))).toEqual({ pode: true })
    const lotada = funcao({ vagasAux: 0 })
    expect(disponibilidade(lotada, 'auxiliar', ctx({ gestor: true }))).toMatchObject({ motivo: 'lotado' })
  })
})

describe('cancelamento', () => {
  it('sócio cancela só com escala aberta e antes do dia', () => {
    expect(podeCancelar(ctx())).toBe(true)
    expect(podeCancelar(ctx({ status: 'fechada' }))).toBe(false)
    expect(podeCancelar(ctx({ data: '2026-11-01' }))).toBe(false)
    expect(podeCancelar(ctx({ status: 'fechada', gestor: true }))).toBe(true)
  })
})

describe('minhas inscrições', () => {
  const i = (id: string, data: string): MinhaInscricao => ({
    id,
    papel: 'auxiliar',
    funcao: 'Jantar',
    area: 'Cozinha',
    areaCor: '#80b918',
    data,
    escalaId: 'e',
    escala: 'Nov',
    escalaStatus: 'aberta',
  })

  it('agrupa por data, próximas em ordem e anteriores da mais recente', () => {
    const g = agruparPorData(
      [i('a', '2026-11-21'), i('b', '2026-11-20'), i('c', '2026-11-21'), i('d', '2026-11-01'), i('e', '2026-10-01')],
      '2026-11-13',
    )
    expect(g.proximas.map((x) => [x.data, x.itens.length])).toEqual([
      ['2026-11-20', 1],
      ['2026-11-21', 2],
    ])
    expect(g.anteriores.map((x) => x.data)).toEqual(['2026-11-01', '2026-10-01'])
  })
})
