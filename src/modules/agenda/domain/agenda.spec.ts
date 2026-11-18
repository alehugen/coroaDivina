import { describe, expect, it } from 'vitest'
import {
  agruparPorData,
  agruparPorMes,
  eventosDoMes,
  eventosDoPeriodo,
  rotuloSemana,
  textoWhatsAppAgenda,
  validarEvento,
  type Evento,
} from './Evento'
import { intervaloDoPeriodo, rotuloPeriodo, somarPeriodo, tituloPeriodo } from './Periodo'

const ev = (p: Partial<Evento>): Evento => ({
  id: Math.random().toString(36),
  data: '2026-11-07',
  hora: null,
  titulo: 'Evento',
  detalhe: '',
  cor: 'nenhuma',
  ...p,
})

describe('rotuloSemana', () => {
  it('sábados levam o número da ocorrência no mês', () => {
    expect(rotuloSemana('2026-11-07')).toBe('1º sábado')
    expect(rotuloSemana('2026-11-14')).toBe('2º sábado')
    expect(rotuloSemana('2026-11-21')).toBe('3º sábado')
    expect(rotuloSemana('2026-11-28')).toBe('4º sábado')
  })
  it('demais dias por extenso', () => {
    expect(rotuloSemana('2026-11-01')).toBe('domingo')
    expect(rotuloSemana('2026-11-11')).toBe('quarta-feira')
  })
})

describe('validarEvento', () => {
  const base = { data: '2026-11-21', hora: null, titulo: '  Preparo  ', detalhe: ' x ', cor: 'amarela' as const }
  it('normaliza título, complemento e hora', () => {
    expect(validarEvento({ ...base, hora: '21:00:00' })).toEqual({
      ok: true,
      value: { ...base, titulo: 'Preparo', detalhe: 'x', hora: '21:00' },
    })
    expect(validarEvento({ ...base, hora: '' }).ok && validarEvento({ ...base, hora: '' })).toMatchObject({
      value: { hora: null },
    })
  })
  it('rejeita sem título, sem data ou hora inválida', () => {
    expect(validarEvento({ ...base, titulo: ' ' }).ok).toBe(false)
    expect(validarEvento({ ...base, data: '' }).ok).toBe(false)
    expect(validarEvento({ ...base, hora: '25:00' }).ok).toBe(false)
  })
})

describe('agrupamento e texto', () => {
  const lista = [
    ev({ data: '2026-11-20', titulo: 'Preparo de Vegetal' }),
    ev({ data: '2026-11-20', hora: '19:00', titulo: 'Reunião da Diretoria Geral' }),
    ev({ data: '2026-11-01', titulo: 'Escala Anual', detalhe: 'Eleição Diretoria', cor: 'amarela' }),
    ev({ data: '2026-11-14', titulo: 'Final de semana Livre', cor: 'verde' }),
    ev({ data: '2026-12-05', titulo: 'Outro mês' }),
  ]
  it('filtra o mês e ordena (sem horário antes)', () => {
    expect(eventosDoMes(lista, 2026, 10).map((e) => e.titulo)).toEqual([
      'Escala Anual',
      'Final de semana Livre',
      'Preparo de Vegetal',
      'Reunião da Diretoria Geral',
    ])
  })
  it('agrupa por data', () => {
    expect(agruparPorData(eventosDoMes(lista, 2026, 10)).map((g) => [g.data, g.eventos.length])).toEqual([
      ['2026-11-01', 1],
      ['2026-11-14', 1],
      ['2026-11-20', 2],
    ])
  })
  it('monta o texto do WhatsApp', () => {
    const t = textoWhatsAppAgenda(lista, { tipo: 'mes', data: '2026-11-18' }, 'https://app/agenda')
    expect(t).toContain('*AGENDA – NOVEMBRO 2026*')
    expect(t).toContain('*01/11 · domingo*\n🟡 *Escala Anual* – Eleição Diretoria')
    expect(t).toContain('*14/11 · 2º sábado*\n🟢 *Final de semana Livre*')
    expect(t).toContain('• *Preparo de Vegetal*\n• 19:00 – *Reunião da Diretoria Geral*')
    expect(t).not.toContain('Outro mês')
    expect(t.endsWith('Agenda completa: https://app/agenda')).toBe(true)
  })
  it('período vazio avisa', () => {
    expect(textoWhatsAppAgenda([], { tipo: 'mes', data: '2026-01-01' })).toContain('Nenhum evento')
  })
  it('dia: só os eventos dele, sem repetir a data', () => {
    const t = textoWhatsAppAgenda(lista, { tipo: 'dia', data: '2026-11-20' })
    expect(t).toContain('*AGENDA – SEXTA-FEIRA, 20/11/2026*')
    expect(t).toContain('• *Preparo de Vegetal*\n• 19:00 – *Reunião da Diretoria Geral*')
    expect(t).not.toContain('20/11 ·')
    expect(t).not.toContain('Escala Anual')
  })
  it('semana: de domingo a sábado', () => {
    const p = { tipo: 'semana', data: '2026-11-18' } as const
    expect(eventosDoPeriodo(lista, p).map((e) => e.data)).toEqual(['2026-11-20', '2026-11-20'])
    expect(textoWhatsAppAgenda(lista, p)).toContain('*AGENDA – SEMANA DE 15/11 A 21/11/2026*')
  })
  it('ano: separa por mês e pula meses vazios', () => {
    const p = { tipo: 'ano', data: '2026-03-10' } as const
    expect(agruparPorMes(eventosDoPeriodo(lista, p)).map((m) => m.nome)).toEqual(['NOVEMBRO', 'DEZEMBRO'])
    const t = textoWhatsAppAgenda(lista, p)
    expect(t).toContain('*AGENDA – 2026*')
    expect(t.indexOf('━━ *NOVEMBRO* ━━')).toBeLessThan(t.indexOf('━━ *DEZEMBRO* ━━'))
    expect(t).toContain('*05/12 · 1º sábado*')
  })
})

describe('Periodo', () => {
  it('calcula o intervalo de cada tipo', () => {
    const data = '2026-11-18'
    expect(intervaloDoPeriodo({ tipo: 'dia', data })).toEqual({ de: data, ate: data })
    expect(intervaloDoPeriodo({ tipo: 'semana', data })).toEqual({ de: '2026-11-15', ate: '2026-11-21' })
    expect(intervaloDoPeriodo({ tipo: 'mes', data })).toEqual({ de: '2026-11-01', ate: '2026-11-30' })
    expect(intervaloDoPeriodo({ tipo: 'ano', data })).toEqual({ de: '2026-01-01', ate: '2026-12-31' })
  })
  it('anda para frente e para trás', () => {
    expect(somarPeriodo({ tipo: 'dia', data: '2026-12-31' }, 1).data).toBe('2027-01-01')
    expect(somarPeriodo({ tipo: 'semana', data: '2026-11-18' }, -1).data).toBe('2026-11-11')
    expect(somarPeriodo({ tipo: 'mes', data: '2026-01-31' }, 1).data).toBe('2026-02-28')
    expect(somarPeriodo({ tipo: 'ano', data: '2026-11-18' }, 1).data).toBe('2027-11-18')
  })
  it('rótulos', () => {
    expect(rotuloPeriodo({ tipo: 'dia', data: '2026-11-18' })).toBe('Quarta-feira, 18 de novembro de 2026')
    expect(rotuloPeriodo({ tipo: 'mes', data: '2026-11-18' })).toBe('Novembro de 2026')
    expect(rotuloPeriodo({ tipo: 'ano', data: '2026-11-18' })).toBe('2026')
    // semana que vira o ano mostra os dois anos
    expect(rotuloPeriodo({ tipo: 'semana', data: '2026-12-30' })).toBe('27/12/2026 a 02/01/2027')
    expect(tituloPeriodo({ tipo: 'mes', data: '2026-11-18' })).toBe('NOVEMBRO 2026')
  })
})
