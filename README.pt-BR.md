<picture>
  <img alt="Rsbuild Banner" src="https://github.com/web-infra-dev/rsbuild/assets/7237365/84abc13e-b620-468f-a90b-dbf28e7e9427">
</picture>

# Rsbuild

<p>
  <a href="https://discord.gg/XsaKEEk4mW"><img src="https://img.shields.io/badge/chat-discord-blue?style=flat-square&logo=discord&colorA=564341&colorB=EDED91" alt="discord channel" /></a>
  <a href="https://npmjs.com/package/@rsbuild/core?activeTab=readme"><img src="https://img.shields.io/npm/v/@rsbuild/core?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" /></a>
  <a href="https://npmcharts.com/compare/@rsbuild/core?minimal=true"><img src="https://img.shields.io/npm/dm/@rsbuild/core.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="downloads" /></a>
  <a href="https://nodejs.org/en/about/previous-releases"><img src="https://img.shields.io/node/v/@rsbuild/core.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="node version"></a>
  <a href="https://github.com/web-infra-dev/rsbuild/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" /></a>
</p>

[English](./README.md) | Portuguese | [简体中文](./README.zh-CN.md)

Rsbuild é uma ferramenta de build de alta performance com base no Rspack. Ele fornece um conjunto de configurações de compilação padrão cuidadosamente projetadas, oferecendo uma experiência de desenvolvimento pronta para uso e pode liberar totalmente as vantagens de desempenho do Rspack.

Rsbuild provê [ricas funcionalidades de build](https://rsbuild.dev/guide/start/features), incluindo a compilação de TypeScript, JSX, Sass, Less, CSS Modules, Wasm, e outros. Ele também suporta Module Federation, compressão de imagem, checagem de tipos, PostCSS, Lightning CSS, e mais.

## 💡 Comparações

Rsbuild é uma ferramenta de build que está no mesmo patamar do [Vite](https://vitejs.dev/), [Create React App](https://github.com/facebook/create-react-app), ou [Vue CLI](https://github.com/vuejs/vue-cli). Todos eles possuem um servidor de desenvolvimento imbutido, ferramentas de linha de comando, e configurações de build que provê uma experiência pronta para uso.

### CRA / Vue CLI

Você pode imaginar o Rsbuild como uma versão moderna do Create React App ou Vue CLI, com estas principais diferenças:

- O bundler por baixo é trocado de Webpack para Rspack, provendo 5 à 10 vezes mais rápido o desempenho de build.
- É desacoplado de frameworks de frontend e suporta todos os frameworks de interface, por meio de [plugins](https://rsbuild.dev/plugins/list/), incluíndo React, Vue, Svelte, Solid, etc.
- Oferece melhor extensibilidade. Você pode extender o Rsbuild flexivelmente via [Configurações](https://rsbuild.dev/config/), [Plugin API](https://rsbuild.dev/plugins/dev/), e [JavaScript API](https://rsbuild.dev/api/start/).

### Vite

Rsbuild compartilha muitas similaridades com Vite, assim como ambos miram em melhorar a experiência do desenvolvimento frontend. As principais diferenças são:

- **Compatibilidade do ecossistema**: Rsbuild é compatível com a maioria dos plug-ins para webpack e todos os plug-ins do Rspack, enquanto Vite é compatível com plug-ins do Rollup. Se você estiver usando mais plug-ins e carregadores do ecossistema do Webpack, a migração para o Rsbuild será relativamente fácil.
- **Consistência em produção**: Rsbuild usa o Rspack para empacotamento durante as compilações de desenvolvimento e produção, garantindo assim um alto nível de consistência entre os resultados de desenvolvimento e produção. Esse também é um dos objetivos que a Vite pretende alcançar com o Rolldown.
- **Module Federation**: O time do Rsbuild trabalha próximo com o time de [Module Federation](https://rsbuild.dev/guide/advanced/module-federation), fornecendo suporte de primeira classe para o Module Federation para ajudá-lo a desenvolver grandes aplicativos da Web com arquitetura de micro frontend.

## 🚀 Desempenho

O desempenho de construção do Rsbuild está no mesmo nível do Rspack nativo. Esse é o tempo necessário para criar 1.000 componentes React:

![benchmark](https://assets.rspack.dev/rsbuild/assets/benchmark-latest.jpeg)

> Os dados acima são provenientes do [performance-compare](https://github.com/rspack-contrib/performance-compare) benchmark.

## 🔥 Recursos

O Rsbuild tem os seguintes recursos:

- **Fácil de Configurar**: Um dos objetivos do Rsbuild é fornecer recursos de compilação prontos para uso para os usuários do Rspack, permitindo que os desenvolvedores iniciem um projeto da Web com configuração zero. Além disso, o Rsbuild fornece configuração de compilação semântica para reduzir a curva de aprendizado da configuração do Rspack.

- **Orientado para o desempenho**: Rsbuild integra ferramentas de alto desempenho baseadas em Rust da comunidade, incluindo [Rspack](https://rspack.dev), [SWC](https://swc.rs/) e [Lightning CSS](https://lightningcss.dev/), para oferecer velocidade de compilação e experiência de desenvolvimento de primeira classe.

- **Ecossistema de plug-ins**: Rsbuild tem um sistema de plug-ins leve e inclui uma variedade de plug-ins oficiais de alta qualidade. Além disso, o Rsbuild é compatível com a maioria dos plug-ins do Webpack e todos os plug-ins do Rspack, permitindo que os usuários aproveitem os plug-ins existentes da comunidade ou internos no Rsbuild sem a necessidade de reescrever o código.

- **Artefatos estáveis**: O Rsbuild foi projetado com um grande foco na estabilidade dos artefatos de compilação. Ele garante alta consistência entre os artefatos nas compilações de desenvolvimento e produção e conclui automaticamente o downgrade de sintaxe e a injeção de polyfill. O Rsbuild também fornece plug-ins para verificação de tipos e validação de sintaxe de artefatos para evitar problemas de qualidade e compatibilidade no código de produção.

- **Framework Agnóstico**: Rsbuild não está acoplado a nenhuma estrutura de interface do usuário de frontend. Ele oferece suporte a estruturas como React, Vue, Svelte, Solid e Preact por meio de plug-ins, e planeja oferecer suporte a mais estruturas de IU da comunidade no futuro.

## 🎯 Ecossistema

Além de ser usado como uma ferramenta de compilação, o Rsbuild também oferece recursos de compilação universal para soluções de nível superior, como [Rspress](https://github.com/web-infra-dev/rspress) e [Rslib](https://github.com/web-infra-dev/rslib), permitindo que eles se concentrem no desenvolvimento de seus próprios recursos específicos de domínio.

O diagrama a seguir ilustra a relação entre o Rsbuild e outras ferramentas do ecossistema:

![Rspack stack layers](https://assets.rspack.dev/rsbuild/assets/rspack-stack-layers.png)

## 📚 Primeiros passos

Para começar a usar o Rsbuild, consulte a seção [Início Rápido](https://rsbuild.dev/guide/start/quick-start).

## 🦀 Links

- [Rspack](https://github.com/web-infra-dev/rspack): Um empacotador web rápido baseado em Rust.
- [Rspress](https://github.com/web-infra-dev/rspress): Um gerador rápido de sites estáticos baseado no Rsbuild.
- [Rsdoctor](https://github.com/web-infra-dev/rsdoctor): Um analisador de compilação único para Rspack e webpack.
- [Rslib](https://github.com/web-infra-dev/rslib): A ferramenta de compilação de bibliotecas desenvolvida pelo Rsbuild.
- [Modern.js](https://github.com/web-infra-dev/modern.js): Uma estrutura React progressiva baseada no Rsbuild.
- [awesome-rspack](https://github.com/web-infra-dev/awesome-rspack): Uma lista com curadoria de coisas incríveis relacionadas ao Rspack e ao Rsbuild.
- [rspack-examples](https://github.com/rspack-contrib/rspack-examples): Exemplos para Rspack, Rsbuild, Rspress e Rsdoctor.
- [storybook-rsbuild](https://github.com/rspack-contrib/storybook-rsbuild): Construtor de livros de histórias desenvolvido pelo Rsbuild.
- [rsbuild-plugin-template](https://github.com/rspack-contrib/rsbuild-plugin-template)：Use esse modelo para criar seu próprio plug-in do Rsbuild.
- [rstack-design-resources](https://github.com/rspack-contrib/rstack-design-resources)：Recursos de design para Rspack, Rsbuild, Rspress e Rsdoctor.

## 🤝 Contribuição

> Novos colaboradores são bem-vindos!

Por favor leia o [Guia de Contribuição](https://github.com/web-infra-dev/rsbuild/blob/main/CONTRIBUTING.md).

### Contribuidores

<a href="https://github.com/web-infra-dev/rsbuild/graphs/contributors" target="_blank">
  <table>
    <tr>
      <th colspan="2">
        <br/>
        <img src="https://contrib.rocks/image?repo=web-infra-dev/rsbuild&columns=16&max=96"><br/><br/>
      </th>
    </tr>
    <tr>
      <td>
        <picture>
          <source 
            media="(prefers-color-scheme: dark)" 
            srcset="https://next.ossinsight.io/widgets/official/compose-org-active-contributors/thumbnail.png?activity=active&period=past_90_days&owner_id=87694465&repo_ids=701750420&image_size=2x3&color_scheme=dark"
          />
          <img 
            alt="Contributors of web-infra-dev/rsbuild" 
            src="https://next.ossinsight.io/widgets/official/compose-org-active-contributors/thumbnail.png?activity=active&period=past_90_days&owner_id=87694465&repo_ids=701750420&image_size=2x3&color_scheme=light"
          />
        </picture>
      </td>
      <td rowspan="2">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="https://next.ossinsight.io/widgets/official/compose-org-participants-growth/thumbnail.png?activity=new&period=past_90_days&owner_id=87694465&repo_ids=701750420&image_size=4x7&color_scheme=dark">
          <img alt="New trends of web-infra-dev" src="https://next.ossinsight.io/widgets/official/compose-org-participants-growth/thumbnail.png?activity=new&period=past_90_days&owner_id=87694465&repo_ids=701750420&image_size=4x7&color_scheme=light">
        </picture>
      </td>
    </tr>
    <tr>
      <td>
        <picture>
          <source 
            media="(prefers-color-scheme: dark)" 
            srcset="https://next.ossinsight.io/widgets/official/compose-org-active-contributors/thumbnail.png?activity=new&period=past_90_days&owner_id=87694465&repo_ids=701750420&image_size=2x3&color_scheme=dark"
          />
          <img 
            alt="Contributors of web-infra-dev/rsbuild" 
            src="https://next.ossinsight.io/widgets/official/compose-org-active-contributors/thumbnail.png?activity=new&period=past_90_days&owner_id=87694465&repo_ids=701750420&image_size=2x3&color_scheme=light"
          />
        </picture>
      </td>
    </tr>
  </table>
</a>

### Código de Conduta

Este repositório adotou o código de conduta de código aberto da ByteDance. Por favor, verifique [Código de Conduta](./CODE_OF_CONDUCT.md) para mais detalhes.

## 🧑‍💻 Comunidade

Venha e converse conosco no [Discord](https://discord.gg/XsaKEEk4mW)! O time do Rspack / Rsbuild e usuários são ativos lá, e estamos sempre buscando por contribuidores.

## 🌟 Qualidade

Rsbuild usa [Web Infra QoS](https://web-infra-qos.netlify.app?product=rsbuild&metrics=bundle-size) para observar a tendência das principais métricas, como tamanho do pacote, velocidade de compilação e tamanho da instalação.

## 🙏 Créditos

Algumas das implementações do Rsbuild foram inspiradas em projetos excepcionais da comunidade. Gostaríamos de expressar nossa gratidão a eles:

- A implementação de alguns plug-ins é referenciada em [create-react-app](https://github.com/facebook/create-react-app).
- Algumas funções de utilidade são referenciadas em [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin).
- O design de algumas APIs é referenciado em [vite](https://github.com/vitejs/vite).

O site Rsbuild é em parceira com [Netlify](https://www.netlify.com/).

## 📖 Licença

Rsbuild é licensiado sob [MIT License](https://github.com/web-infra-dev/rsbuild/blob/main/LICENSE).
