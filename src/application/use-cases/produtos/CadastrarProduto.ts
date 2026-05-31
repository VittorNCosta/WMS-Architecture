import { Produto } from '../../../domain/entities/Produto';
import { AuditOperation } from '../../../domain/enums/AuditOperation';
import { DomainError } from '../../../domain/errors/DomainError';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { IProdutoRepository } from '../../../domain/repositories/IProdutoRepository';
import { ProdutoDTO, toProdutoDTO } from '../../dtos/ProdutoDTO';
import { Actor } from '../auditoria/Actor';
import { registerAuditSafely } from '../auditoria/registerAuditSafely';

export interface CadastrarProdutoInput {
  sku: unknown;
  nome: unknown;
  descricao?: unknown;
  unidadeMedida: unknown;
}

/** Caso de uso: cadastrar um novo produto (SKU único). */
export class CadastrarProduto {
  constructor(
    private readonly produtos: IProdutoRepository,
    private readonly auditoria: IAuditTrailRepository,
  ) {}

  async execute(input: CadastrarProdutoInput, actor: Actor): Promise<ProdutoDTO> {
    const produto = Produto.criar(input);

    const jaExiste = await this.produtos.buscarPorSku(produto.sku);
    if (jaExiste) {
      throw new DomainError(`Já existe um produto com o SKU "${produto.sku}".`);
    }

    await this.produtos.salvar(produto);

    await registerAuditSafely(this.auditoria, {
      actorUserId: actor.userId,
      actorLogin: actor.login,
      operation: AuditOperation.CREATE,
      entityType: 'Produto',
      entityId: produto.id,
      summary: `Produto "${produto.sku}" cadastrado.`,
    });

    return toProdutoDTO(produto);
  }
}
