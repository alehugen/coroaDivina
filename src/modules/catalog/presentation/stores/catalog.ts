import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { criarUseCasesCatalogo } from '../../application/use-cases'
import type { Area, AreaComFuncoes, FuncaoModelo } from '../../domain/Catalogo'
import { supabaseCatalogRepository } from '../../infrastructure/SupabaseCatalogRepository'

const catalogo = criarUseCasesCatalogo(supabaseCatalogRepository)

export const useCatalogStore = defineStore('catalog', () => {
  const areas = ref<Area[]>([])
  const funcoes = ref<FuncaoModelo[]>([])
  const grupos = ref<AreaComFuncoes[]>([])
  const carregando = ref(false)
  const carregado = ref(false)
  const erro = ref('')

  const areaPorId = computed(() => new Map(areas.value.map((a) => [a.id, a])))

  async function carregar() {
    carregando.value = true
    const r = await catalogo.carregar()
    carregando.value = false
    if (!r.ok) {
      erro.value = r.error
      return
    }
    erro.value = ''
    areas.value = r.value.areas
    funcoes.value = r.value.funcoes
    grupos.value = r.value.grupos
    carregado.value = true
  }

  /** Carrega só se ainda não carregou nesta sessão. */
  const garantir = () => (carregado.value ? Promise.resolve() : carregar())

  return { areas, funcoes, grupos, carregando, carregado, erro, areaPorId, carregar, garantir }
})
