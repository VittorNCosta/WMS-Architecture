. Requisitos arquiteturais da solução
Requisito
arquitetural
É importante
para o
sistema? Por
quê?
Onde aparece no
sistema?
Como a
arquitetura
ajuda ou limita?
Como isso
aparece na
solução?
Manutenibilidade
Sim, pois regras
de estoque
podem sofrer
alterações
frequentes.
Entradas, saídas
e movimentações
de estoque.
A Onion separa
domínio e
infraestrutura.
Organização em
camadas e
módulos
separados.
Modularidade /
Baixo
acoplamento
Sim, para
separar
responsabilidad
es da aplicação.
Serviços, domínio
e persistência.
Cada camada
possui
responsabilidade
específica.
Uso de interfaces,
serviços e
repositórios.
Testabilidade
Sim, para
validar regras
de estoque
isoladamente.
Regras FIFO e
movimentações.
O domínio fica
desacoplado da
infraestrutura.
Testes separados
das regras de
negócio.
Segurança
Sim, para
controle de
acesso ao
sistema.
Operações de
estoque e acesso
de usuários.
A separação de
responsabilidade
s facilita o
controle de
acesso.
Controle de
usuários e
permissões
básicas.
Desempenho
Sim, pois
operações de
estoque
precisam ser
rápidas.
Consultas e
movimentações.
A separação
facilita
otimizações na
persistência.
Consultas
organizadas e
separação das
camadas.
Escalabilidade
Sim, para
permitir inclusão
futura de
funcionalidades.
Novos módulos e
operações.
A estrutura
modular facilita
evolução do
sistema.
Inclusão de novos
serviços sem
alterar o domínio.
Disponibilidade /
Confiabilidade
Sim, pois o
controle de
estoque precisa
ser confiável.
Atualização e
rastreamento de
saldo.
A organização
reduz impacto de
falhas entre
módulos.
Validações e
rastreabilidade
das operações.
Integração /
Interoperabilidad
e
Sim, para
manter
comunicação
organizada
entre as
camadas.
Persistência e
comunicação com
banco de dados.
A Onion
desacopla
domínio e
infraestrutura.
Interfaces e
repositórios
separados da
lógica de negócio



Requisitos e escopo do sistema
● Cadastro/ Atualização de produtos.
● Consulta de produtos.
● Recebimento/Entrada do estoque.
● Armazenagem dos itens recebidos.
● Movimentações e Transferências do estoque.
● Expedição/Saída do estoque.
● Rastreabilidade de todas as movimentações, entradas e saídas de saldo.
● Regras de negócio.(FIFO).