import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useSessionStore } from '@/modules/identity'
import AppLayout from '../layouts/AppLayout.vue'

declare module 'vue-router' {
  interface RouteMeta {
    /** Só para visitantes (login, cadastro). Logado é redirecionado. */
    visitante?: boolean
    /** Acessível com ou sem sessão. */
    publica?: boolean
    /** Exige admin ou Orgã vigente. */
    gestor?: boolean
    /** Exige admin. */
    admin?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/escalas' },

  // --- visitantes
  {
    path: '/entrar',
    component: () => import('@/modules/identity/presentation/views/LoginView.vue'),
    meta: { visitante: true },
  },
  {
    path: '/cadastro',
    component: () => import('@/modules/identity/presentation/views/CadastroView.vue'),
    meta: { visitante: true },
  },
  {
    path: '/esqueci-senha',
    component: () => import('@/modules/identity/presentation/views/EsqueciSenhaView.vue'),
    meta: { visitante: true },
  },
  {
    path: '/redefinir-senha',
    component: () => import('@/modules/identity/presentation/views/RedefinirSenhaView.vue'),
    meta: { publica: true },
  },
  {
    path: '/aguardando-aprovacao',
    component: () =>
      import('@/modules/identity/presentation/views/AguardandoAprovacaoView.vue'),
  },

  {
    path: '/escalas/:id/imprimir',
    component: () => import('@/modules/schedules/presentation/views/EscalaImpressaoView.vue'),
    props: true,
  },

  // --- app (sócio aprovado)
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: 'escalas',
        component: () => import('@/modules/schedules/presentation/views/EscalasView.vue'),
      },
      {
        path: 'escalas/:id',
        component: () => import('@/modules/schedules/presentation/views/EscalaView.vue'),
        props: true,
      },
      {
        path: 'perfil',
        component: () => import('@/modules/identity/presentation/views/PerfilView.vue'),
      },
      {
        path: 'minhas-escalas',
        component: () => import('@/modules/schedules/presentation/views/MinhasEscalasView.vue'),
      },
      {
        path: 'admin',
        component: () => import('@/modules/members/presentation/views/AdminLayout.vue'),
        meta: { gestor: true },
        children: [
          { path: '', redirect: '/admin/escalas' },
          {
            path: 'escalas',
            component: () =>
              import('@/modules/schedules/presentation/views/admin/EscalasAdminView.vue'),
          },
          {
            path: 'escalas/nova',
            component: () =>
              import('@/modules/schedules/presentation/views/admin/NovaEscalaView.vue'),
          },
          {
            path: 'escalas/:id',
            component: () =>
              import('@/modules/schedules/presentation/views/admin/EscalaEditorView.vue'),
            props: true,
          },
          {
            path: 'funcoes',
            component: () => import('@/modules/catalog/presentation/views/FuncoesView.vue'),
          },
          {
            path: 'socios',
            component: () => import('@/modules/members/presentation/views/SociosView.vue'),
            meta: { admin: true },
          },
          {
            path: 'orgas',
            component: () => import('@/modules/members/presentation/views/OrgasView.vue'),
            meta: { admin: true },
          },
        ],
      },
    ],
  },

  { path: '/:pathMatch(.*)*', redirect: '/escalas' },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const session = useSessionStore()
  await session.init()

  if (to.meta.publica) return true

  if (!session.logado) {
    return to.meta.visitante ? true : { path: '/entrar', query: { r: to.fullPath } }
  }

  if (!session.aprovado) {
    return to.path === '/aguardando-aprovacao' ? true : '/aguardando-aprovacao'
  }

  if (to.meta.visitante || to.path === '/aguardando-aprovacao') return '/escalas'
  if (to.meta.admin && !session.admin) return '/escalas'
  if (to.meta.gestor && !session.gestor) return '/escalas'
  return true
})
