# Multi Agenda App

Aplicativo de agenda multi-usuário desenvolvido com Angular e Firebase Firestore.

## Características

- 📅 Calendário interativo com visualizações mensal, semanal e diária
- 👥 Suporte a múltiplos usuários
- 🔄 Eventos recorrentes
- 🤝 Eventos compartilhados
- 🔐 Autenticação segura com Firebase Auth

## Tecnologias Utilizadas

- Angular 17+
- Firebase (Firestore + Authentication)
- Angular Material
- TypeScript
- SCSS
- RxJS

## Instalação

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Configure o Firebase (veja seção de configuração)
4. Execute o projeto: `ng serve`

## Configuração do Firebase

Para configurar o Firebase, siga os passos abaixo:

1. No diretório `src/environments/`, crie um arquivo chamado `environment.ts` com as credenciais do seu projeto Firebase.
2. Utilize o arquivo `environment.example.ts` na raiz do projeto como modelo. Copie seu conteúdo para `src/environments/environment.ts` e preencha com suas informações reais do Firebase.

> **Dica:** Para ambientes de produção, utilize o arquivo `environment.prod.ts` seguindo o mesmo padrão.

## Estrutura do Projeto

```
src/
├── app/
│   ├── core/          # Modelos, serviços e guards
│   ├── shared/        # Componentes compartilhados
│   ├── features/      # Funcionalidades principais
│   └── layouts/       # Layouts da aplicação
├── assets/            # Recursos estáticos
├── environments/      # Configurações de ambiente
└── styles/           # Estilos globais
```