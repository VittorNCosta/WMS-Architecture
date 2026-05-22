import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * "Banco de dados" do projeto: um único arquivo JSON.
 *
 * Não é um SGBD — é só persistência simples em arquivo, suficiente para um
 * projeto de arquitetura. Guarda o estado em memória e regrava o arquivo
 * inteiro a cada alteração (`salvar()`).
 *
 * Cada array abaixo é uma "tabela". As linhas são objetos planos (sem métodos);
 * a conversão linha <-> entidade de domínio é feita pelos repositórios.
 */

export interface ProdutoRow {
  id: string;
  sku: string;
  nome: string;
  descricao: string | null;
  unidadeMedida: string;
  ativo: boolean;
  criadoEm: string; // ISO 8601
  atualizadoEm: string; // ISO 8601
}

export interface LocalizacaoRow {
  id: string;
  codigo: string;
  descricao: string | null;
}

export interface EstoqueItemRow {
  id: string;
  produtoId: string;
  localizacaoId: string | null;
  quantidade: number;
  dataEntrada: string; // ISO 8601 — base do FIFO
}

export interface MovimentacaoRow {
  id: string;
  tipo: string; // TipoMovimentacao
  produtoId: string;
  quantidade: number;
  localizacaoOrigemId: string | null;
  localizacaoDestinoId: string | null;
  usuarioId: string;
  documentoReferencia: string | null;
  dataHora: string; // ISO 8601
}

export interface UsuarioRow {
  id: string;
  nome: string;
  login: string;
  perfil: string; // PerfilUsuario
  ativo: boolean;
}

export interface DadosBanco {
  produtos: ProdutoRow[];
  localizacoes: LocalizacaoRow[];
  estoque: EstoqueItemRow[];
  movimentacoes: MovimentacaoRow[];
  usuarios: UsuarioRow[];
}

function bancoVazio(): DadosBanco {
  return { produtos: [], localizacoes: [], estoque: [], movimentacoes: [], usuarios: [] };
}

export class JsonDatabase {
  private readonly dados: DadosBanco;

  constructor(private readonly caminhoArquivo: string) {
    this.dados = this.carregar();
  }

  private carregar(): DadosBanco {
    if (!existsSync(this.caminhoArquivo)) return bancoVazio();
    try {
      const bruto = JSON.parse(readFileSync(this.caminhoArquivo, 'utf-8')) as Partial<DadosBanco>;
      return { ...bancoVazio(), ...bruto };
    } catch {
      // arquivo inexistente/corrompido -> começa do zero
      return bancoVazio();
    }
  }

  /** Retorna a "tabela" pedida. Depois de alterá-la, chame `salvar()`. */
  tabela<K extends keyof DadosBanco>(nome: K): DadosBanco[K] {
    return this.dados[nome];
  }

  /** Grava todo o estado atual no arquivo JSON. */
  salvar(): void {
    mkdirSync(dirname(this.caminhoArquivo), { recursive: true });
    writeFileSync(this.caminhoArquivo, JSON.stringify(this.dados, null, 2) + '\n', 'utf-8');
  }
}
