'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProdutosList } from '@/components/produtos/produtos-list'
import { CategoriasList } from '@/components/produtos/categorias-list'
import { CadastrarProdutoButton } from '@/components/produtos/cadastrar-produto-button'
import { CadastrarCategoriaButton } from '@/components/produtos/cadastrar-categoria-button'
import { FiltroButton } from '@/components/produtos/filtro-button'
import type { Produto, Categoria } from '@/lib/types'

interface ProdutosClientProps {
  produtosIniciais: Produto[]
  categoriasIniciais: Categoria[]
  userId: string
}

export function ProdutosClient({ produtosIniciais, categoriasIniciais, userId }: ProdutosClientProps) {
  const [produtos, setProdutos] = useState<Produto[]>(produtosIniciais)
  const [categorias, setCategorias] = useState<Categoria[]>(categoriasIniciais)
  const [search, setSearch] = useState('')
  const [filterCategoria, setFilterCategoria] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [produtosRes, categoriasRes] = await Promise.all([
      supabase.from('produtos').select('*').eq('user_id', userId).order('nome'),
      supabase.from('categorias').select('*').eq('user_id', userId).order('nome'),
    ])
    if (produtosRes.data) setProdutos(produtosRes.data)
    if (categoriasRes.data) setCategorias(categoriasRes.data)
    setLoading(false)
  }, [supabase, userId])

  const filteredProdutos = produtos.filter(p => {
    const matchesSearch =
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.descricao?.toLowerCase().includes(search.toLowerCase())
    const matchesCategoria = filterCategoria === 'all' || p.categoria_id === filterCategoria
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'ativo' && p.ativo) ||
      (filterStatus === 'inativo' && !p.ativo)
    return matchesSearch && matchesCategoria && matchesStatus
  })

  const produtosAtivos = produtos.filter(p => p.ativo)
  const categoriasComProdutos = categorias.filter(c =>
    produtosAtivos.some(p => p.categoria_id === c.id)
  )

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>
        <div className="flex items-center gap-3">
          <FiltroButton
            categorias={categorias}
            onFilterChange={(filters) => {
              setFilterCategoria(filters.categoria)
              setFilterStatus(filters.status)
            }}
          />
          <CadastrarCategoriaButton onSuccess={fetchData} />
          <CadastrarProdutoButton categorias={categorias} onSuccess={fetchData} />
        </div>
      </div>

      <Tabs defaultValue="produtos" className="w-full">
        <TabsList className="bg-card">
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="cardapio">Cardápio Digital</TabsTrigger>
        </TabsList>

        <TabsContent value="produtos" className="mt-6">
          <ProdutosList
            produtos={filteredProdutos}
            categorias={categorias}
            loading={loading}
            onUpdate={fetchData}
          />
        </TabsContent>

        <TabsContent value="categorias" className="mt-6">
          <CategoriasList
            categorias={categorias}
            loading={loading}
            onUpdate={fetchData}
          />
        </TabsContent>

        <TabsContent value="cardapio" className="mt-6">
          <div className="bg-card rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6">Visualização do Cardápio</h2>
            {categoriasComProdutos.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum produto ativo encontrado. Cadastre produtos e ative-os para aparecer no cardápio.
              </p>
            ) : (
              <div className="space-y-8">
                {categoriasComProdutos.map(categoria => (
                  <div key={categoria.id}>
                    <h3 className="text-xl font-semibold mb-4 text-primary">{categoria.nome}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {produtosAtivos
                        .filter(p => p.categoria_id === categoria.id)
                        .map(produto => (
                          <div key={produto.id} className="flex items-center gap-4 p-4 bg-background rounded-lg">
                            {produto.imagem_url && (
                              <img
                                src={produto.imagem_url}
                                alt={produto.nome}
                                className="w-20 h-20 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium">{produto.nome}</h4>
                              {produto.descricao && (
                                <p className="text-sm text-muted-foreground line-clamp-2">{produto.descricao}</p>
                              )}
                            </div>
                            <span className="font-bold text-primary">
                              R${produto.preco.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}
