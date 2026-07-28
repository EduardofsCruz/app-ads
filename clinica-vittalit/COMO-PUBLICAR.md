# Como publicar o site da Clínica Vittalit na HostGator

## O que vai para o ar

Todo o conteúdo da pasta `site/` — é um site estático (HTML/CSS/JS), sem
necessidade de PHP, Node ou banco na HostGator. O banco de dados, o login e o
armazenamento de PDFs rodam no Supabase (projeto "Bella Vista", região São Paulo).

## Passo a passo (cPanel da HostGator)

1. Acesse o cPanel → **Gerenciador de Arquivos** → pasta `public_html`
   (ou a pasta do domínio/subdomínio escolhido).
2. Envie **todo o conteúdo** da pasta `site/` (index.html, css/, js/, img/,
   fonts/, portal/, admin/) para dentro dela.
3. Pronto. Não há build nem configuração extra.

Estrutura final no servidor:

```
public_html/
├── index.html          ← site institucional
├── css/  js/  img/  fonts/
├── portal/             ← Portal do Paciente (login por CPF)
└── admin/              ← Painel administrativo da equipe
```

## Endereços

- Site: `https://SEU-DOMINIO.com.br/`
- Portal do paciente: `https://SEU-DOMINIO.com.br/portal/`
- Painel da equipe: `https://SEU-DOMINIO.com.br/admin/`

## Backend (Supabase)

- Projeto: `gzwkyzkyyscvlivvpyoe` (compartilhado com o app Bella Vista;
  todas as tabelas da clínica têm prefixo `vittalit_` e regras de acesso próprias)
- Tabelas: `vittalit_users`, `vittalit_exams`, `vittalit_meal_plans`,
  `vittalit_pregnancies`, `vittalit_settings`
- Arquivos (PDFs de exames): bucket privado `vittalit`, download só por link
  assinado temporário
- Função de servidor: `vittalit-admin` (criação de pacientes, redefinição de
  senha e exclusão — só executa para administradores)
- Segurança: RLS ativo em todas as tabelas — paciente só enxerga os próprios
  dados; configurações do site são públicas apenas para leitura

## Painel administrativo — o que dá para fazer

- **Pacientes**: cadastrar (login = CPF + senha inicial), buscar, redefinir
  senha, excluir
- **Exames**: enviar PDF do resultado, categoria, data e semana de gestação
  (aparece na linha do tempo da gestante)
- **Plano alimentar**: editor de texto simples (## títulos, - itens,
  **negrito**) que a paciente vê formatado no portal
- **Gestação**: DUM/DPP → o portal calcula automaticamente semanas e progresso
- **Site & contato**: WhatsApp, telefone, e-mail, endereço — o site
  institucional passa a usar os novos valores automaticamente
- **Minha conta**: trocar a própria senha

## Observações importantes

- A senha inicial do administrador foi entregue em conversa privada — troque no
  primeiro acesso (aba "Minha conta").
- Para dar acesso admin a alguém da clínica, cadastre a pessoa como paciente
  com e-mail real e peça para alterar o papel no banco (ou me peça que eu faço).
- LGPD: resultados de exame são dados sensíveis de saúde. Mantenha as senhas
  seguras e cadastre apenas funcionários autorizados como admin.
