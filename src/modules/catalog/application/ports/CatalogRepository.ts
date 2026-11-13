import type { Area, DadosArea, DadosFuncao, FuncaoModelo } from '../../domain/Catalogo'

export interface CatalogRepository {
  listarAreas(): Promise<Area[]>
  listarFuncoes(): Promise<FuncaoModelo[]>

  criarArea(dados: DadosArea & { ordem: number }): Promise<void>
  atualizarArea(id: string, dados: DadosArea): Promise<void>
  removerArea(id: string): Promise<void>

  criarFuncao(dados: DadosFuncao & { ordem: number }): Promise<void>
  atualizarFuncao(id: string, dados: Partial<DadosFuncao>): Promise<void>
  removerFuncao(id: string): Promise<void>

  reordenar(tabela: 'areas' | 'funcoes', ordens: { id: string; ordem: number }[]): Promise<void>
}
