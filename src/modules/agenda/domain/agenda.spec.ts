import { describe, expect, it } from 'vitest'
import {
  agruparPorData,
  eventosDoMes,
  rotuloSemana,
  textoWhatsAppAgenda,
  validarEvento,
  type Evento,
} from './Evento'

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
    const t = textoWhatsAppAgenda(lista, 2026, 10, 'https://app/agenda')
    expect(t).toContain('*AGENDA – NOVEMBRO 2026*')
    expect(t).toContain('*01/11 · domingo*\n🟡 *Escala Anual* – Eleição Diretoria')
    expect(t).toContain('*14/11 · 2º sábado*\n🟢 *Final de semana Livre*')
    expect(t).toContain('• *Preparo de Vegetal*\n• 19:00 – *Reunião da Diretoria Geral*')
    expect(t).not.toContain('Outro mês')
    expect(t.endsWith('Agenda completa: https://app/agenda')).toBe(true)
  })
  it('mês vazio avisa', () => {
    expect(textoWhatsAppAgenda([], 2026, 0)).toContain('Nenhum evento')
  })
})
