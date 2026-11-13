import { describe, expect, it } from 'vitest'
import { agruparPorArea, mover, proximaOrdem, validarArea, validarFuncao, type FuncaoModelo } from './Catalogo'

const f = (id: string, ordem: number, areaId = 'a'): FuncaoModelo => ({
  id,
  areaId,
  nome: id,
  ordem,
  vagasResp: 1,
  vagasAux: 2,
  ativo: true,
})

describe('Catálogo', () => {
  it('agrupa funções por área, ordenadas', () => {
    const g = agruparPorArea(
      [
        { id: 'b', nome: 'Zeladoria', cor: '#dddf00', ordem: 2 },
        { id: 'a', nome: 'Cozinha', cor: '#80b918', ordem: 1 },
      ],
      [f('jantar', 2), f('almoco', 1), f('templo', 1, 'b')],
    )
    expect(g.map((a) => a.id)).toEqual(['a', 'b'])
    expect(g[0]!.funcoes.map((x) => x.id)).toEqual(['almoco', 'jantar'])
  })

  it('move item e devolve só as ordens alteradas', () => {
    const lista = [f('a', 1), f('b', 2), f('c', 3)]
    expect(mover(lista, 'b', -1)).toEqual([
      { id: 'b', ordem: 1 },
      { id: 'a', ordem: 2 },
    ])
    expect(mover(lista, 'a', -1)).toEqual([])
    expect(mover(lista, 'c', 1)).toEqual([])
  })

  it('renumera ordens repetidas ao mover', () => {
    const lista = [f('a', 1), f('b', 1), f('c', 1)]
    expect(mover(lista, 'c', -1)).toEqual([
      { id: 'c', ordem: 2 },
      { id: 'b', ordem: 3 },
    ])
  })

  it('próxima ordem', () => {
    expect(proximaOrdem([])).toBe(1)
    expect(proximaOrdem([f('a', 4), f('b', 2)])).toBe(5)
  })

  it('valida área e função', () => {
    expect(validarArea({ nome: ' ', cor: '#000000' }).ok).toBe(false)
    expect(validarArea({ nome: 'Portaria', cor: '#ABCDEF' })).toEqual({
      ok: true,
      value: { nome: 'Portaria', cor: '#abcdef' },
    })
    const base = { areaId: 'a', nome: 'Jantar', vagasResp: 1, vagasAux: 3, ativo: true }
    expect(validarFuncao(base).ok).toBe(true)
    expect(validarFuncao({ ...base, vagasResp: 0, vagasAux: 0 }).ok).toBe(false)
    expect(validarFuncao({ ...base, vagasAux: -1 }).ok).toBe(false)
  })
})
