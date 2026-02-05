<picture>
  <img alt="Rsbuild Banner" src="https://assets.rspack.rs/rsbuild/rsbuild-banner.png">
</picture>

# Rsbuild

<p>
  <a href="https://discord.gg/XsaKEEk4mW"><img src="https://img.shields.io/badge/chat-discord-blue?style=flat-square&logo=discord&colorA=564341&colorB=EDED91" alt="discord channel" /></a>
  <a href="https://npmjs.com/package/@rsbuild/core?activeTab=readme"><img src="https://img.shields.io/npm/v/@rsbuild/core?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" /></a>
  <a href="https://npmcharts.com/compare/@rsbuild/core"><img src="https://img.shields.io/npm/dm/@rsbuild/core.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="downloads" /></a>
  <a href="https://nodejs.org/en/about/previous-releases"><img src="https://img.shields.io/node/v/@rsbuild/core.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="node version"></a>
  <a href="https://github.com/web-infra-dev/rsbuild/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" /></a>
  <a href="https://deepwiki.com/web-infra-dev/rsbuild"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki" /></a>
</p>

[English](./README.md) | Portuguese | [简体中文](./README.zh-CN.md)

O Rsbuild é uma ferramenta moderna de build para aplicações web, baseada no [Rspack](https://rspack.rs/).

Ele oferece builds rápidos e uma saída de produção otimizada, mantendo a configuração simples, consistente e extensível por meio de plugins.

## 🔥 Recursos

O Rsbuild tem os seguintes recursos:

- **Fácil de Configurar**: Um dos objetivos do Rsbuild é fornecer recursos de compilação prontos para uso para os usuários do Rspack, permitindo que os desenvolvedores iniciem um projeto da Web com configuração zero. Além disso, o Rsbuild fornece configuração de compilação semântica para reduzir a curva de aprendizado da configuração do Rspack.

- **Orientado para o desempenho**: Rsbuild integra ferramentas de alto desempenho baseadas em Rust da comunidade, incluindo [Rspack](https://rspack.rs), [SWC](https://swc.rs/) e [Lightning CSS](https://lightningcss.dev/), para oferecer velocidade de compilação e experiência de desenvolvimento de primeira classe.

- **Ecossistema de plug-ins**: Rsbuild tem um sistema de plug-ins leve e inclui uma variedade de plug-ins oficiais de alta qualidade. Além disso, o Rsbuild é compatível com a maioria dos plug-ins do webpack e todos os plug-ins do Rspack, permitindo que os usuários aproveitem os plug-ins existentes da comunidade ou internos no Rsbuild sem a necessidade de reescrever o código.

- **Artefatos estáveis**: O Rsbuild foi projetado com um grande foco na estabilidade dos artefatos de compilação. Ele garante alta consistência entre os artefatos nas compilações de desenvolvimento e produção e conclui automaticamente o downgrade de sintaxe e a injeção de polyfill. O Rsbuild também fornece plug-ins para verificação de tipos e validação de sintaxe de artefatos para evitar problemas de qualidade e compatibilidade no código de produção.

- **Framework Agnóstico**: Rsbuild não está acoplado a nenhuma estrutura de interface do usuário de frontend. Ele oferece suporte a estruturas como React, Vue, Svelte, Solid e Preact por meio de plug-ins, e planeja oferecer suporte a mais estruturas de IU da comunidade no futuro.

## 📚 Documentação

- [Rsbuild v2 docs](https://v2.rsbuild.rs)
- [Rsbuild v1 docs](https://rsbuild.rs/)

## 🦀 Rstack

Rstack é uma cadeia de ferramentas JavaScript unificada construída em torno do Rspack, com alto desempenho e arquitetura consistente.

| Nome                                                  | Descrição                | Versão                                                                                                                                                                           |
| ----------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Rspack](https://github.com/web-infra-dev/rspack)     | Bundler                  | <a href="https://npmjs.com/package/@rspack/core"><img src="https://img.shields.io/npm/v/@rspack/core?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" /></a>     |
| [Rsbuild](https://github.com/web-infra-dev/rsbuild)   | Build tool               | <a href="https://npmjs.com/package/@rsbuild/core"><img src="https://img.shields.io/npm/v/@rsbuild/core?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" /></a>   |
| [Rslib](https://github.com/web-infra-dev/rslib)       | Library development tool | <a href="https://npmjs.com/package/@rslib/core"><img src="https://img.shields.io/npm/v/@rslib/core?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" /></a>       |
| [Rspress](https://github.com/web-infra-dev/rspress)   | Static site generator    | <a href="https://npmjs.com/package/@rspress/core"><img src="https://img.shields.io/npm/v/@rspress/core?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" /></a>   |
| [Rsdoctor](https://github.com/web-infra-dev/rsdoctor) | Build analyzer           | <a href="https://npmjs.com/package/@rsdoctor/core"><img src="https://img.shields.io/npm/v/@rsdoctor/core?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" /></a> |
| [Rstest](https://github.com/web-infra-dev/rstest)     | Testing framework        | <a href="https://npmjs.com/package/@rstest/core"><img src="https://img.shields.io/npm/v/@rstest/core?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" /></a>     |
| [Rslint](https://github.com/web-infra-dev/rslint)     | Linter                   | <a href="https://npmjs.com/package/@rslint/core"><img src="https://img.shields.io/npm/v/@rslint/core?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" /></a>     |

## 🔗 Links

- [awesome-rstack](https://github.com/rstackjs/awesome-rstack): Uma lista com curadoria de coisas incríveis relacionadas ao Rspack e ao Rsbuild.
- [agent-skills](https://github.com/rstackjs/agent-skills): Uma coleção de Agent Skills para Rstack.
- [rstack-examples](https://github.com/rstackjs/rstack-examples): Exemplos demonstrando ferramentas do Rstack.
- [storybook-rsbuild](https://github.com/rstackjs/storybook-rsbuild): Construtor de livros de histórias desenvolvido pelo Rsbuild.
- [rsbuild-plugin-template](https://github.com/rstackjs/rsbuild-plugin-template)：Use esse modelo para criar seu próprio plug-in do Rsbuild.
- [rstack-design-resources](https://github.com/rstackjs/rstack-design-resources)：Recursos de design para Rstack.

## 🤝 Contribuição

> [!NOTE]
> Nós valorizamos qualquer contribuição para o Rsbuild!

Por favor leia o [Guia de Contribuição](https://github.com/web-infra-dev/rsbuild/blob/main/CONTRIBUTING.md).

### Contribuidores

<a href="https://github.com/web-infra-dev/rsbuild/graphs/contributors" target="_blank">
  <img src="https://contrib.rocks/image?repo=web-infra-dev/rsbuild&columns=24">
</a>

### Código de conduta

Este repositório adotou o código de conduta de código aberto da ByteDance. Por favor, verifique [Código de Conduta](./CODE_OF_CONDUCT.md) para mais detalhes.

## 🧑‍💻 Comunidade

Venha e converse conosco no [Discord](https://discord.gg/XsaKEEk4mW)! O time do Rstack e usuários são ativos lá, e estamos sempre buscando por contribuidores.

## 🙏 Créditos

O Rsbuild foi inspirado por vários projetos excepcionais da comunidade. Gostaríamos de reconhecer e expressar nossa sincera gratidão aos seguintes projetos:

- Várias implementações de plugins foram inspiradas pelo [create-react-app](https://github.com/facebook/create-react-app)
- Múltiplas funções utilitárias foram adaptadas do [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)
- Vários padrões de design de API foram influenciados pelo [Vite](https://github.com/vitejs/vite)

## 📖 Licença

Rsbuild é licensiado sob [MIT License](https://github.com/web-infra-dev/rsbuild/blob/main/LICENSE).
