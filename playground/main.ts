import { createApp, defineComponent, h } from 'vue'
import { RsTable as RsTableCore, LocalAdapter, coluna } from '@rsdata/core'
import { RsData, RsDataTable } from '@rsdata/nuxt'
import '@rsdata/nuxt/theme/default.css'

const dados = [
  { id: 1, nome: 'Coca-Cola 2L', preco: 9.99, ativo: true, status: 1, criadoEm: '2026-01-15' },
  { id: 2, nome: 'Guaraná Antarctica', preco: 7.5, ativo: true, status: 1, criadoEm: '2026-02-03' },
  { id: 3, nome: 'Água Mineral 500ml', preco: 2.0, ativo: false, status: 2, criadoEm: '2026-03-21' },
  { id: 4, nome: 'Suco de Laranja 1L', preco: 12.25, ativo: true, status: 1, criadoEm: '2026-04-10' },
  { id: 5, nome: 'Cerveja Artesanal IPA', preco: 18.9, ativo: false, status: 2, criadoEm: '2026-05-05' },
  { id: 6, nome: 'Chá Gelado Limão', preco: 6.4, ativo: true, status: 1, criadoEm: '2026-06-18' },
  { id: 7, nome: 'Energético 269ml', preco: 8.75, ativo: true, status: 1, criadoEm: '2026-07-01' },
  { id: 8, nome: 'Refrigerante Cola Zero', preco: 8.99, ativo: false, status: 2, criadoEm: '2026-07-09' },
  { id: 9, nome: 'Isotônico Uva', preco: 5.6, ativo: true, status: 1, criadoEm: '2026-07-12' },
]

const tabela = new RsTableCore({
  columns: [
    coluna('id', { type: 'numero', label: 'ID' }),
    coluna('nome', { type: 'texto', label: 'Produto' }),
    coluna('preco', { type: 'numero', label: 'Preço', mask: 'R$ #.##0,00' }),
    coluna('ativo', { type: 'booleano', label: 'Ativo' }),
    coluna('status', { type: 'selecao', label: 'Status', options: { 1: 'Ativo', 2: 'Inativo' } }),
    coluna('criadoEm', { type: 'data', label: 'Criado em' }),
  ],
  pageSize: 4,
})
tabela.usarAdapter(new LocalAdapter(dados))

const App = defineComponent({
  setup() {
    return () =>
      h('main', { style: 'max-width: 60rem; margin: 2rem auto; padding: 0 1rem;' }, [
        h('h1', 'RSdata — Fase 3: Render Engine Nuxt + Theme Default'),
        h(RsDataTable, { tabela }),
      ])
  },
})

createApp(App).use(RsData).mount('#app')
