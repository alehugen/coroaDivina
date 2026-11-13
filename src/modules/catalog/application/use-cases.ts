import { tentar } from '@/shared/lib/errors'
import type { Result } from '@/shared/lib/result'
import {
  agruparPorArea,
  mover,
  proximaOrdem,
  validarArea,
  validarFuncao,
  type Area,
  type DadosArea,
  type DadosFuncao,
  type FuncaoModelo,
} from '../domain/Catalogo'
import type { CatalogRepository } from './ports/CatalogRepository'

export function criarUseCasesCatalogo(repo: CatalogRepository) {
  return {
    carregar: () =>
      tentar(async () => {
        const [areas, funcoes] = await Promise.all([repo.listarAreas(), repo.listarFuncoes()])
        return { areas, funcoes, grupos: agruparPorArea(areas, funcoes) }
      }),

    async salvarArea(dados: DadosArea, existentes: Area[], id?: string): Promise<Result<void>> {
      const v = validarArea(dados)
      if (!v.ok) return v
      return tentar(() =>
        id
          ? repo.atualizarArea(id, v.value)
          : repo.criarArea({ ...v.value, ordem: proximaOrdem(existentes) }),
      )
    },

    removerArea: (id: string) => tentar(() => repo.removerArea(id)),

    async salvarFuncao(
      dados: DadosFuncao,
      funcoesDaArea: FuncaoModelo[],
      id?: string,
    ): Promise<Result<void>> {
      const v = validarFuncao(dados)
      if (!v.ok) return v
      return tentar(() =>
        id
          ? repo.atualizarFuncao(id, v.value)
          : repo.criarFuncao({ ...v.value, ordem: proximaOrdem(funcoesDaArea) }),
      )
    },

    alternarFuncao: (f: FuncaoModelo) => tentar(() => repo.atualizarFuncao(f.id, { ativo: !f.ativo })),
    removerFuncao: (id: string) => tentar(() => repo.removerFuncao(id)),

    moverArea: (areas: Area[], id: string, dir: -1 | 1) =>
      tentar(() => repo.reordenar('areas', mover(areas, id, dir))),
    moverFuncao: (funcoesDaArea: FuncaoModelo[], id: string, dir: -1 | 1) =>
      tentar(() => repo.reordenar('funcoes', mover(funcoesDaArea, id, dir))),
  }
}
