import { describe, expect, it } from 'vitest'
import { eventosPorData, rotuloMes, semanasDoMes, somarMes } from './Calendario'

describe('calendário', () => {
  it('monta novembro/2026 começando no domingo', () => {
    const s = semanasDoMes(2026, 10, '2026-11-13')
    expect(s).toHaveLength(5) // 01/11/2026 é domingo
    expect(s[0]![0]).toMatchObject({ data: '2026-11-01', noMes: true })
    expect(s[4]![6]).toMatchObject({ data: '2026-12-05', noMes: false })
    expect(s.flat().filter((d) => d.hoje).map((d) => d.data)).toEqual(['2026-11-13'])
    expect(s.every((sem) => sem.length === 7)).toBe(true)
  })

  it('inclui dias do mês anterior quando o mês não começa no domingo', () => {
    const s = semanasDoMes(2026, 11, '2026-11-13') // 01/12/2026 é terça
    expect(s[0]!.slice(0, 2).map((d) => [d.data, d.noMes])).toEqual([
      ['2026-11-29', false],
      ['2026-11-30', false],
    ])
  })

  it('rótulo e navegação entre meses', () => {
    expect(rotuloMes(2026, 10)).toBe('Novembro de 2026')
    expect(somarMes({ ano: 2026, mes: 11 }, 1)).toEqual({ ano: 2027, mes: 0 })
    expect(somarMes({ ano: 2026, mes: 0 }, -1)).toEqual({ ano: 2025, mes: 11 })
  })

  it('agrupa eventos por data e marca onde estou escalado', () => {
    const m = eventosPorData(
      [
        { escalaId: 'e1', data: '2026-11-20' },
        { escalaId: 'e1', data: '2026-11-21' },
        { escalaId: 'e2', data: '2026-11-20' },
        { escalaId: 'sumiu', data: '2026-11-22' },
      ],
      [
        { id: 'e1', titulo: 'Preparo', status: 'aberta' },
        { id: 'e2', titulo: 'Limpeza', status: 'rascunho' },
      ],
      [{ escalaId: 'e1', data: '2026-11-21' }],
    )
    expect(m.get('2026-11-20')?.map((e) => e.titulo)).toEqual(['Preparo', 'Limpeza'])
    expect(m.get('2026-11-21')?.[0]?.souEscalado).toBe(true)
    expect(m.get('2026-11-20')?.[0]?.souEscalado).toBe(false)
    expect(m.has('2026-11-22')).toBe(false)
  })
})
