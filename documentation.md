Lucas Vinicius França do Livramento
Vittor Niquele da Costa











Projeto Arquitetura Software: …






















São José dos Pinhais
2026
Introdução / Descrição da aplicação
O sistema proposto será a criação de um WMS(Warehouse Management System) compacto para com foco no controle básico de estoque e movimentações logísticas internas de uma  empresa. Com o objetivo de gerenciar entradas, saídas e transferências do saldo do estoque.
	O Problema encontrado é a dificuldade de controlar manualmente os processos logísticos, principalmente envolvendo contagem de estoque e baixa rastreabilidade das operações. Os usuários do sistema serão os operadores de estoque, responsáveis pela expedição , responsáveis pelo recebimento e administradores do sistema.

Arquitetura escolhida
Foi escolhida a arquitetura Onion, no qual a solução será organizada em módulos e camadas, no qual o núcleo será composto pelas regras de negócio, enquanto as camadas externas serão responsáveis pela interface, infraestrutura(repositório) e persistência dos dados. Garantindo que o domínio permaneça independente do banco de dados e frameworks.

Justificativa da arquitetura
A Onion foi escolhida por apresentar forte divisão de responsabilidades, permitindo que as regras de negócio fiquem desacopladas do restante da aplicação. O sistema WMS contém regras de negócios complexas e únicas para cada cliente, dessa forma a Onion favorece a organização dessas regras em um núcleo central independente.
	Tal arquitetura facilita a modularização interna do software, manutenção/manutenabilidade, arquivos pequenos com funções bem específicas contendo clareza estrutural e clareza de entendimento das operações e facilitação de testes de cada respectivo processo.
A arquitetura citada separa claramente as regras de domínio, casos de uso, acesso aos dados e a interface.

Requisitos e escopo do sistema
Cadastro/ Atualização de produtos.
Consulta de produtos.
Recebimento/Entrada do estoque.
Armazenagem dos itens recebidos.
Movimentações e Transferências do estoque.
Expedição/Saída do estoque.
Rastreabilidade de todas as movimentações, entradas e saídas de saldo.
Regras de negócio.(FIFO).

Decomposição do sistema
Presentation - Responsável pela interação com o usuário e exibição dos dados e da aplicação.
Application - Casos de uso, interfaces dos serviços, regras de processo/fluxo operacional, serviços da aplicação.
Domain - Núcleo central da aplicação, contendo as regras de negócio e as entidades e repositório.
Infra - Implementação dos repositórios, acesso ao banco de dados, integração com serviços externos.

Relação com POO e SOLID
A Onion favorece a abstração por meio de interfaces , repositórios e serviços, havendo desacoplamento entre domínio e infraestrutura, encapsulamento é utilizado nas entidades do domínio, que contém regras e comportamentos relacionados aos dados do sistema.
As camadas internas dependem de abstrações, através das injeções de dependências, mantendo o domínio desaplocado, formando uma aplicação modular e organizada.

Padrões de projeto
O sistema utilizará padrões compatíveis com a Onion Architecture para auxiliar na organização e separação de responsabilidades da aplicação.

Repository
Responsável por abstrair o acesso aos dados, mantendo as regras de negócio independentes do banco de dados.


Dependency Injection
Utilizada para desacoplar serviços e implementações concretas, facilitando organização e manutenção do sistema.

Service Layer
Responsável por organizar os casos de uso e fluxos operacionais da aplicação.

Diagrama arquitetural

Requisitos arquiteturais da solução

Requisito arquitetural
É importante para o sistema? Por quê?
Onde aparece no sistema?
Como a arquitetura ajuda ou limita?
Como isso aparece na solução?
Manutenibilidade
Sim, pois regras de estoque podem sofrer alterações frequentes.
Entradas, saídas e movimentações de estoque.
A Onion separa domínio e infraestrutura.
Organização em camadas e módulos separados.
Modularidade / Baixo acoplamento
Sim, para separar responsabilidades da aplicação.
Serviços, domínio e persistência.
Cada camada possui responsabilidade específica.
Uso de interfaces, serviços e repositórios.
Testabilidade
Sim, para validar regras de estoque isoladamente.
Regras FIFO e movimentações.
O domínio fica desacoplado da infraestrutura.
Testes separados das regras de negócio.
Segurança
Sim, para controle de acesso ao sistema.
Operações de estoque e acesso de usuários.
A separação de responsabilidades facilita o controle de acesso.
Controle de usuários e permissões básicas.
Desempenho
Sim, pois operações de estoque precisam ser rápidas.
Consultas e movimentações.
A separação facilita otimizações na persistência.
Consultas organizadas e separação das camadas.
Escalabilidade
Sim, para permitir inclusão futura de funcionalidades.
Novos módulos e operações.
A estrutura modular facilita evolução do sistema.
Inclusão de novos serviços sem alterar o domínio.
Disponibilidade / Confiabilidade
Sim, pois o controle de estoque precisa ser confiável.
Atualização e rastreamento de saldo.
A organização reduz impacto de falhas entre módulos.
Validações e rastreabilidade das operações.
Integração / Interoperabilidade
Sim, para manter comunicação organizada entre as camadas.
Persistência e comunicação com banco de dados.
A Onion desacopla domínio e infraestrutura.
Interfaces e repositórios separados da lógica de negócio.

Riscos arquiteturais

Risco arquitetural
Por que isso pode ser um problema?
Como o grupo pretende reduzir esse risco?
Complexidade excessiva da arquitetura
O excesso de camadas pode dificultar o desenvolvimento inicial.
Manter o escopo reduzido e evitar abstrações desnecessárias.
Fronteiras mal definidas entre camadas
Pode gerar acoplamento entre domínio e infraestrutura.
Definir responsabilidades claras para cada camada.
Excesso de abstrações
Pode aumentar a complexidade da aplicação.
Utilizar interfaces e abstrações apenas quando necessário.


Trade-offs da arquitetura

Trade-off
O que a arquitetura favorece?
O que ela pode dificultar?
Como o grupo pretende lidar com essa limitação?
Desacoplamento x Complexidade
Organização e manutenção do sistema.
Maior quantidade de camadas e arquivos.
Manter estrutura simples e objetiva.
Testabilidade x Tempo de desenvolvimento
Facilidade para testar regras de negócio.
Desenvolvimento inicial mais demorado.
Manter escopo reduzido e focado.
Modularidade x Curva de aprendizado
Separação clara de responsabilidades.
Maior dificuldade inicial na organização do projeto.
Seguir padrão arquitetural definido.
Independência do domínio x Quantidade de interfaces
Regras de negócio desacopladas.
Aumento de interfaces e serviços.
Utilizar abstrações apenas quando necessário.
Manutenção futura x Complexidade inicial
Facilidade de evolução do sistema.
Necessidade maior de planejamento estrutural.
Limitar funcionalidades ao escopo principal.


Conclusão
A utilização da Onion Architecture no sistema WMS possibilita uma aplicação organizada, modular e desacoplada, favorecendo manutenção, clareza estrutural e separação de responsabilidades.	
A arquitetura escolhida atende ao objetivo do projeto ao permitir que as regras de negócio relacionadas ao controle de estoque permaneçam independentes das tecnologias externas utilizadas na aplicação.

Além disso, a proposta mantém um escopo reduzido e coerente com o projeto, permitindo que a implementação futura permaneça alinhada com a especificação arquitetural definida.
