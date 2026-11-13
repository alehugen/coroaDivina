import { describe, expect, it } from 'vitest'
import {
  duplicado,
  fimSugerido,
  planoEncerramento,
  situacao,
  sobreposicoes,
  validarMandato,
  type Mandato,
} from './Mandato'
import { acoesPermitidas, contarPorGrupo, filtrarSocios, linkWhatsApp, type Socio } from './Socio'

const socio = (p: Partial<Socio>): Socio => ({
  id: 'x',
  nome: 'Fulano',
  email: 'f@x.com',
  telefone: '61999990000',
  role: 'socio',
  status: 'aprovado',
  criadoEm: '2026-11-01T10:00:00Z',
  aprovadoEm: null,
  ...p,
})

describe('Socio', () => {
  const lista = [
    socio({ id: '1', nome: 'João Pedro', status: 'pendente', criadoEm: '2026-11-05T00:00:00Z' }),
    socio({ id: '2', nome: 'Ana', status: 'pendente', criadoEm: '2026-11-02T00:00:00Z' }),
    socio({ id: '3', nome: 'Lucielma', email: 'luci@x.com' }),
    socio({ id: '4', nome: 'Isis', status: 'rejeitado' }),
  ]

  it('conta por grupo (rejeitado conta como inativo)', () => {
    expect(contarPorGrupo(lista)).toEqual({ pendente: 2, aprovado: 1, inativo: 1 })
  })

  it('ordena pendentes do mais antigo para o mais novo', () => {
    expect(filtrarSocios(lista, 'pendente').map((s) => s.id)).toEqual(['2', '1'])
  })

  it('busca ignorando acentos, por e-mail e por telefone', () => {
    expect(filtrarSocios(lista, 'pendente', 'joao').map((s) => s.id)).toEqual(['1'])
    expect(filtrarSocios(lista, 'aprovado', 'luci@').map((s) => s.id)).toEqual(['3'])
    expect(filtrarSocios(lista, 'aprovado', '99999').length).toBe(1)
  })

  it('admin não pode se desativar nem remover o próprio admin', () => {
    const eu = socio({ id: 'eu', role: 'admin' })
    const a = acoesPermitidas(eu, 'eu')
    expect(a.desativar).toBe(false)
    expect(a.removerAdmin).toBe(false)
    expect(acoesPermitidas(eu, 'outro').removerAdmin).toBe(true)
  })

  it('pendente só pode ser aprovado ou rejeitado', () => {
    const a = acoesPermitidas(socio({ status: 'pendente' }), 'eu')
    expect(a).toMatchObject({ aprovar: true, rejeitar: true, desativar: false, tornarAdmin: false })
  })

  it('gera link do WhatsApp', () => {
    expect(linkWhatsApp('61999990000')).toBe('https://wa.me/5561999990000')
    expect(linkWhatsApp('')).toBeNull()
  })
})

describe('Mandato', () => {
  const m = (p: Partial<Mandato>): Mandato => ({
    id: 'm',
    profileId: 'p1',
    nome: 'Lucielma',
    inicio: '2026-11-01',
    fim: '2026-12-31',
    ...p,
  })

  it('calcula situação', () => {
    expect(situacao(m({}), '2026-10-31')).toBe('futuro')
    expect(situacao(m({}), '2026-11-01')).toBe('vigente')
    expect(situacao(m({}), '2026-12-31')).toBe('vigente')
    expect(situacao(m({}), '2027-01-01')).toBe('encerrado')
  })

  it('sugere 2 meses de mandato', () => {
    expect(fimSugerido('2026-11-01')).toBe('2026-12-31')
    expect(fimSugerido('2026-11-22')).toBe('2027-01-21')
  })

  it('valida período', () => {
    expect(validarMandato({ profileId: 'p', inicio: '2026-11-10', fim: '2026-11-01' }).ok).toBe(false)
    expect(validarMandato({ profileId: '', inicio: '2026-11-01', fim: '2026-11-02' }).ok).toBe(false)
  })

  it('detecta sobreposição com outras pessoas e duplicidade da mesma', () => {
    const existentes = [m({ id: 'a', profileId: 'luci', fim: '2026-11-21' })]
    const isis = { profileId: 'isis', inicio: '2026-11-22', fim: '2027-01-21' }
    expect(sobreposicoes(isis, existentes)).toHaveLength(0)
    expect(sobreposicoes({ ...isis, inicio: '2026-11-20' }, existentes)).toHaveLength(1)
    expect(duplicado({ profileId: 'luci', inicio: '2026-11-15', fim: '2026-11-30' }, existentes)).toBe(true)
  })

  it('encerrar: encurta para ontem, ou remove se ainda não começou', () => {
    expect(planoEncerramento(m({}), '2026-11-13')).toEqual({ acao: 'encurtar', fim: '2026-11-12' })
    expect(planoEncerramento(m({ inicio: '2026-11-13' }), '2026-11-13')).toEqual({ acao: 'remover' })
  })
})
