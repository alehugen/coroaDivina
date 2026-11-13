import { describe, expect, it } from 'vitest'
import {
  descreverOrgas,
  diasNoPeriodo,
  funcoesPorArea,
  ocupacao,
  percentual,
  rotuloDia,
  rotuloDiaCurto,
  rotuloPeriodo,
  tituloSugerido,
  validarNovaEscala,
  validarNovaFuncaoDia,
  type FuncaoDoDia,
  type Inscricao,
} from './Escala'

const insc = (papel: Inscricao['papel']): Inscricao => ({
  id: Math.random().toString(),
  profileId: 'p',
  nome: 'X',
  papel,
  criadoEm: '',
})

const funcao = (p: Partial<FuncaoDoDia>): FuncaoDoDia => ({
  id: 'f',
  diaId: 'd',
  area: { id: 'a', nome: 'Cozinha', cor: '#80b918', ordem: 1 },
  funcaoModeloId: null,
  nome: 'Jantar',
  ordem: 1,
  vagasResp: 1,
  vagasAux: 4,
  ativa: true,
  inscricoes: [],
  ...p,
})

describe('ocupação', () => {
  it('conta por papel e calcula vagas livres', () => {
    const o = ocupacao(funcao({ inscricoes: [insc('responsavel'), insc('auxiliar'), insc('auxiliar')] }))
    expect(o).toEqual({ resp: 1, aux: 2, livresResp: 0, livresAux: 2, total: 3, vagas: 5 })
  })
  it('percentual', () => {
    expect(percentual(3, 4)).toBe(75)
    expect(percentual(0, 0)).toBe(0)
  })
})

describe('agrupamento por área', () => {
  it('ordena áreas e funções', () => {
    const zel = { id: 'z', nome: 'Zeladoria', cor: '#dddf00', ordem: 2 }
    const g = funcoesPorArea([
      funcao({ id: '1', area: zel, nome: 'Templo' }),
      funcao({ id: '2', nome: 'Jantar', ordem: 5 }),
      funcao({ id: '3', nome: 'Almoço', ordem: 2 }),
    ])
    expect(g.map((x) => x.area.nome)).toEqual(['Cozinha', 'Zeladoria'])
    expect(g[0]!.funcoes.map((f) => f.id)).toEqual(['3', '2'])
  })
})

describe('datas', () => {
  it('lista os dias do período', () => {
    expect(diasNoPeriodo('2026-11-20', '2026-11-23')).toEqual([
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
      '2026-11-23',
    ])
    expect(diasNoPeriodo('2026-11-23', '2026-11-20')).toEqual([])
  })
  it('rótulos no estilo da planilha', () => {
    expect(rotuloDia('2026-11-20')).toBe('Sexta-feira | 20 Nov')
    expect(rotuloDiaCurto('2026-11-21')).toBe('Sáb 21/11')
    expect(rotuloPeriodo('2026-11-20', '2026-11-23')).toBe('20/11 a 23/11/2026')
    expect(rotuloPeriodo('2026-12-30', '2027-01-02')).toBe('30/12/2026 a 02/01/2027')
    expect(tituloSugerido('2026-11-20')).toBe('Escala do Preparo – Nov 2026')
  })
})

describe('Orgãs da escala', () => {
  const mandatos = [
    { nome: 'Cons. Lucielma', inicio: '2026-09-22', fim: '2026-11-21' },
    { nome: 'Cons. Isis', inicio: '2026-11-22', fim: '2027-01-21' },
    { nome: 'Antiga', inicio: '2026-01-01', fim: '2026-02-28' },
  ]
  it('descreve a troca de Orgã no meio da escala', () => {
    expect(descreverOrgas(mandatos, '2026-11-20', '2026-11-23')).toBe(
      'Cons. Lucielma (até 21/11) e Cons. Isis (desde 22/11)',
    )
  })
  it('uma Orgã cobrindo todo o período', () => {
    expect(descreverOrgas(mandatos, '2026-12-01', '2026-12-05')).toBe('Cons. Isis')
  })
})

describe('validações', () => {
  it('nova escala: remove datas repetidas e ordena', () => {
    const r = validarNovaEscala({
      titulo: ' N ',
      descricao: '',
      datas: ['2026-11-21', '2026-11-20', '2026-11-21'],
      funcaoModeloIds: ['x'],
    })
    expect(r.ok).toBe(false) // título curto
    const r2 = validarNovaEscala({
      titulo: 'Preparo',
      descricao: '',
      datas: ['2026-11-21', '2026-11-20', '2026-11-21'],
      funcaoModeloIds: ['x'],
    })
    expect(r2.ok && r2.value.datas).toEqual(['2026-11-20', '2026-11-21'])
  })
  it('nova função no dia: bloqueia nome repetido', () => {
    const base = { areaId: 'a', nome: 'jantar', vagasResp: 1, vagasAux: 1, funcaoModeloId: null }
    expect(validarNovaFuncaoDia(base, [funcao({})]).ok).toBe(false)
    expect(validarNovaFuncaoDia({ ...base, nome: 'Ceia' }, [funcao({})]).ok).toBe(true)
  })
})
