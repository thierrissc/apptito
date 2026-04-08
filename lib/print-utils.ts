
export interface PrintItem {
  quantidade: number
  nome: string
  observacoes?: string | null
  preco?: number
  subtotal?: number
}

export interface PrintConfig {
  tipo: 'venda' | 'comanda' | 'delivery' | 'cozinha'
  numero: number
  cliente?: {
    nome?: string
    telefone?: string
    endereco?: string
  }
  mesa?: string | null
  funcionario?: string | null
  itens: PrintItem[]
  subtotal?: number
  desconto?: number
  taxaEntrega?: number
  taxaServico?: number
  total?: number
  formaPagamento?: string | null
  observacoes?: string | null
  createdAt: string
  setor?: string
  reimpressao?: boolean
}

function formatCurrencyPrint(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDateTimePrint(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR')
}

function padCenter(text: string, width: number): string {
  const padding = Math.max(0, width - text.length)
  const padLeft = Math.floor(padding / 2)
  const padRight = padding - padLeft
  return ' '.repeat(padLeft) + text + ' '.repeat(padRight)
}

function padLeft(text: string, width: number): string {
  return text.padStart(width)
}

function padRight(text: string, width: number): string {
  return text.padEnd(width)
}

function repeatChar(char: string, count: number): string {
  return char.repeat(count)
}

export function generateThermalPrint(config: PrintConfig): string {
  const WIDTH = 48 
  const lines: string[] = []
  const now = new Date()

  const decorLine = repeatChar('X', WIDTH)
  const halfDecorLine = repeatChar('#', WIDTH)

  lines.push(decorLine)
  if (config.reimpressao) {
    lines.push(padCenter(`REIMPRESSAO:${formatDateTimePrint(now)}`, WIDTH))
  } else {
    lines.push(padCenter(formatDateTimePrint(now), WIDTH))
  }
  lines.push(decorLine)
  lines.push('')

  if (config.tipo === 'cozinha' && config.setor) {
    lines.push(halfDecorLine)
    lines.push(padCenter(`Setor: ${config.setor}`, WIDTH))
    lines.push(halfDecorLine)
    lines.push('')
  }

  const tipoLabel = {
    venda: 'VENDA',
    comanda: 'COMANDA',
    delivery: 'DELIVERY',
    cozinha: 'PEDIDO'
  }
  lines.push(padCenter(`${tipoLabel[config.tipo]} #${config.numero.toString().padStart(3, '0')}`, WIDTH))
  lines.push('')

  if (config.cliente) {
    if (config.cliente.nome) {
      lines.push(`CLIENTE: ${config.cliente.nome}`)
    }
    if (config.cliente.telefone) {
      lines.push(`Fones: ${config.cliente.telefone}`)
    }
    if (config.cliente.endereco) {
      lines.push('')
      lines.push(config.cliente.endereco)
    }
    lines.push('')
  }

  if (config.mesa) {
    lines.push(halfDecorLine)
    lines.push(padCenter(`Mesa ${config.mesa}`, WIDTH))
    lines.push(halfDecorLine)
    lines.push('')
  }

  if (config.tipo === 'delivery') {
    lines.push(halfDecorLine)
    lines.push(padCenter('Tele - Entrega', WIDTH))
    lines.push(halfDecorLine)
    lines.push('')
  }

  lines.push('QTD   | DESCRICAO')
  lines.push(repeatChar('-', WIDTH))

  config.itens.forEach(item => {
    const qtdStr = item.quantidade.toString().padStart(2, ' ')
    lines.push(`${qtdStr}  - ${item.nome.toUpperCase()}`)
    
    if (item.observacoes) {
      const obs = item.observacoes.split(',')
      obs.forEach(o => {
        const trimmed = o.trim()
        if (trimmed) {
          lines.push(`      + ${trimmed}`)
        }
      })
    }

    if (config.tipo !== 'cozinha' && item.preco !== undefined) {
      const precoStr = formatCurrencyPrint(item.subtotal || item.preco * item.quantidade)
      lines.push(padLeft(precoStr, WIDTH))
    }
  })

  lines.push(repeatChar('-', WIDTH))

  if (config.tipo !== 'cozinha') {
    if (config.subtotal !== undefined) {
      lines.push(`Subtotal:${padLeft(formatCurrencyPrint(config.subtotal), WIDTH - 9)}`)
    }
    if (config.desconto && config.desconto > 0) {
      lines.push(`Desconto:${padLeft('-' + formatCurrencyPrint(config.desconto), WIDTH - 9)}`)
    }
    if (config.taxaEntrega && config.taxaEntrega > 0) {
      lines.push(`Taxa Entrega:${padLeft(formatCurrencyPrint(config.taxaEntrega), WIDTH - 13)}`)
    }
    if (config.taxaServico && config.taxaServico > 0) {
      lines.push(`Taxa Servico:${padLeft(formatCurrencyPrint(config.taxaServico), WIDTH - 13)}`)
    }
    if (config.total !== undefined) {
      lines.push(repeatChar('=', WIDTH))
      lines.push(`TOTAL:${padLeft(formatCurrencyPrint(config.total), WIDTH - 6)}`)
    }
    if (config.formaPagamento) {
      lines.push(`Pagamento: ${config.formaPagamento.replace('_', ' ').toUpperCase()}`)
    }
    lines.push('')
  }

  lines.push(repeatChar('-', WIDTH))
  if (config.funcionario) {
    lines.push(`Atendente: ${config.funcionario}`)
  }
  lines.push(`Criado em:    ${formatDateTimePrint(config.createdAt)}`)
  lines.push(`Impresso em:  ${formatDateTimePrint(now)}`)

  if (config.observacoes) {
    lines.push('')
    lines.push(decorLine)
    lines.push(padCenter('OBSERVACOES', WIDTH))
    lines.push(config.observacoes)
    lines.push(decorLine)
  }

  lines.push('')
  lines.push(padCenter('*** CUPOM SEM VALOR FISCAL ***', WIDTH))
  lines.push('')

  return lines.join('\n')
}

export function printThermal(config: PrintConfig): void {
  const content = generateThermalPrint(config)
  
  const printWindow = window.open('', '_blank', 'width=400,height=600')
  if (!printWindow) {
    alert('Não foi possível abrir a janela de impressão. Verifique se pop-ups estão permitidos.')
    return
  }

  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Impressão - ${config.tipo.toUpperCase()} #${config.numero}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      line-height: 1.3;
      width: 80mm;
      padding: 5mm;
      background: #fff;
      color: #000;
    }
    pre {
      font-family: inherit;
      font-size: inherit;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    @media print {
      body {
        width: 80mm;
        padding: 2mm;
      }
    }
  </style>
</head>
<body>
  <pre>${content}</pre>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
        window.onafterprint = function() {
          window.close();
        };
      }, 250);
    };
  </script>
</body>
</html>
  `)
  printWindow.document.close()
}

export function printVenda(venda: {
  numero: number
  cliente?: { nome?: string; telefone?: string } | null
  funcionario?: { nome: string } | null
  itens: { nome_produto: string; quantidade: number; preco_unitario: number; subtotal: number; observacoes?: string | null }[]
  subtotal: number
  desconto: number
  total: number
  forma_pagamento?: string | null
  created_at: string
  observacoes?: string | null
}, reimpressao = false): void {
  printThermal({
    tipo: 'venda',
    numero: venda.numero,
    cliente: venda.cliente ? {
      nome: venda.cliente.nome,
      telefone: venda.cliente.telefone || undefined
    } : undefined,
    funcionario: venda.funcionario?.nome,
    itens: venda.itens.map(item => ({
      quantidade: item.quantidade,
      nome: item.nome_produto,
      observacoes: item.observacoes,
      preco: item.preco_unitario,
      subtotal: item.subtotal
    })),
    subtotal: venda.subtotal,
    desconto: venda.desconto,
    total: venda.total,
    formaPagamento: venda.forma_pagamento,
    createdAt: venda.created_at,
    observacoes: venda.observacoes,
    reimpressao
  })
}

export function printComanda(comanda: {
  numero: number
  mesa?: string | null
  cliente?: { nome?: string; telefone?: string } | null
  funcionario?: { nome: string } | null
  itens: { nome_produto: string; quantidade: number; preco_unitario: number; subtotal: number; observacoes?: string | null }[]
  subtotal: number
  desconto: number
  taxa_servico: number
  total: number
  forma_pagamento?: string | null
  created_at: string
  observacoes?: string | null
}, reimpressao = false): void {
  printThermal({
    tipo: 'comanda',
    numero: comanda.numero,
    mesa: comanda.mesa,
    cliente: comanda.cliente ? {
      nome: comanda.cliente.nome,
      telefone: comanda.cliente.telefone || undefined
    } : undefined,
    funcionario: comanda.funcionario?.nome,
    itens: comanda.itens.map(item => ({
      quantidade: item.quantidade,
      nome: item.nome_produto,
      observacoes: item.observacoes,
      preco: item.preco_unitario,
      subtotal: item.subtotal
    })),
    subtotal: comanda.subtotal,
    desconto: comanda.desconto,
    taxaServico: comanda.taxa_servico,
    total: comanda.total,
    formaPagamento: comanda.forma_pagamento,
    createdAt: comanda.created_at,
    observacoes: comanda.observacoes,
    reimpressao
  })
}

export function printDelivery(pedido: {
  numero: number
  cliente_nome?: string
  cliente_telefone?: string | null
  endereco: string
  bairro?: string | null
  complemento?: string | null
  funcionario?: { nome: string } | null
  itens?: { nome_produto: string; quantidade: number; preco_unitario: number; subtotal: number; observacoes?: string | null }[]
  subtotal: number
  taxa_entrega: number
  desconto: number
  total: number
  forma_pagamento?: string | null
  created_at: string
  observacoes?: string | null
}, reimpressao = false): void {
  const enderecoCompleto = [pedido.endereco, pedido.bairro, pedido.complemento]
    .filter(Boolean)
    .join(', ')

  printThermal({
    tipo: 'delivery',
    numero: pedido.numero,
    cliente: {
      nome: pedido.cliente_nome,
      telefone: pedido.cliente_telefone || undefined,
      endereco: enderecoCompleto
    },
    funcionario: pedido.funcionario?.nome,
    itens: (pedido.itens || []).map(item => ({
      quantidade: item.quantidade,
      nome: item.nome_produto,
      observacoes: item.observacoes,
      preco: item.preco_unitario,
      subtotal: item.subtotal
    })),
    subtotal: pedido.subtotal,
    taxaEntrega: pedido.taxa_entrega,
    desconto: pedido.desconto,
    total: pedido.total,
    formaPagamento: pedido.forma_pagamento,
    createdAt: pedido.created_at,
    observacoes: pedido.observacoes,
    reimpressao
  })
}

export function printCozinha(pedido: {
  numero: number
  mesa?: string | null
  tipo: 'comanda' | 'delivery'
  cliente_nome?: string
  endereco?: string
  itens: { nome_produto: string; quantidade: number; observacoes?: string | null }[]
  created_at: string
  observacoes?: string | null
  setor?: string
}, reimpressao = false): void {
  printThermal({
    tipo: 'cozinha',
    numero: pedido.numero,
    mesa: pedido.mesa,
    setor: pedido.setor,
    cliente: pedido.tipo === 'delivery' ? {
      nome: pedido.cliente_nome,
      endereco: pedido.endereco
    } : undefined,
    itens: pedido.itens.map(item => ({
      quantidade: item.quantidade,
      nome: item.nome_produto,
      observacoes: item.observacoes
    })),
    createdAt: pedido.created_at,
    observacoes: pedido.observacoes,
    reimpressao
  })
}
