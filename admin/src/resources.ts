// Configuração declarativa dos recursos gerenciados pelo painel.
// Cada recurso vira uma rota com listagem + formulário genéricos (ResourceCrud).

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'checkbox'
  | 'datetime'
  | 'time'
  | 'select'
  | 'array'
  | 'relation'

export interface FieldOption {
  value: string
  label: string
}

export interface Field {
  name: string
  label: string
  type: FieldType
  required?: boolean
  options?: FieldOption[]
  relation?: { table: string; labelColumn: string; optional?: boolean }
  placeholder?: string
}

export interface Resource {
  key: string
  table: string
  title: string
  singular: string
  /** Tabela tem church_id gerenciado pelo seletor de igreja do topo. */
  churchScoped?: boolean
  /** Recurso aninhado: filtrado pela coluna que aponta para o pai na rota. */
  parent?: { column: string; resourceKey: string }
  fields: Field[]
  listColumns: string[]
  orderBy?: { column: string; ascending?: boolean }
  childLink?: { label: string; key: string }
  canCreate?: boolean
  canDelete?: boolean
  adminGlobalOnly?: boolean
}

const AGE_GROUPS: FieldOption[] = [
  { value: 'children', label: 'Crianças' },
  { value: 'adolescent', label: 'Adolescentes' },
  { value: 'adult', label: 'Adultos' },
]

const DIFFICULTIES: FieldOption[] = [
  { value: 'easy', label: 'Fácil' },
  { value: 'medium', label: 'Médio' },
  { value: 'hard', label: 'Difícil' },
]

const WEEK_DAYS: FieldOption[] = [
  { value: 'sunday', label: 'Domingo' },
  { value: 'monday', label: 'Segunda' },
  { value: 'tuesday', label: 'Terça' },
  { value: 'wednesday', label: 'Quarta' },
  { value: 'thursday', label: 'Quinta' },
  { value: 'friday', label: 'Sexta' },
  { value: 'saturday', label: 'Sábado' },
]

export const resources: Resource[] = [
  {
    key: 'churches',
    table: 'churches',
    title: 'Igrejas',
    singular: 'Igreja',
    adminGlobalOnly: true,
    orderBy: { column: 'name', ascending: true },
    listColumns: ['name', 'city', 'state', 'contact_number', 'is_active'],
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'city', label: 'Cidade', type: 'text', required: true },
      { name: 'state', label: 'UF', type: 'text', required: true, placeholder: 'DF' },
      { name: 'contact_number', label: 'Telefone', type: 'text' },
      { name: 'tax_id', label: 'CNPJ', type: 'text' },
      { name: 'pix_key', label: 'Chave PIX', type: 'text' },
      { name: 'bank_name', label: 'Banco', type: 'text' },
      { name: 'bank_code', label: 'Código do banco', type: 'text' },
      { name: 'bank_account', label: 'Conta', type: 'text' },
      { name: 'street', label: 'Endereço', type: 'text' },
      { name: 'complement', label: 'Complemento', type: 'text' },
      { name: 'maps_url', label: 'Link do Google Maps', type: 'text' },
      { name: 'is_active', label: 'Ativa', type: 'checkbox' },
    ],
  },
  {
    key: 'service-times',
    table: 'church_service_times',
    title: 'Horários de culto',
    singular: 'Horário',
    churchScoped: true,
    orderBy: { column: 'week_day', ascending: true },
    listColumns: ['week_day', 'time', 'description', 'is_active'],
    fields: [
      { name: 'week_day', label: 'Dia da semana', type: 'select', options: WEEK_DAYS, required: true },
      { name: 'time', label: 'Horário', type: 'time', required: true },
      { name: 'description', label: 'Descrição', type: 'text', required: true },
      { name: 'is_active', label: 'Ativo', type: 'checkbox' },
    ],
  },
  {
    key: 'devotionals',
    table: 'devotionals',
    title: 'Devocionais',
    singular: 'Devocional',
    churchScoped: true,
    orderBy: { column: 'publish_date', ascending: false },
    listColumns: ['title', 'publish_date', 'is_active'],
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'description', label: 'Conteúdo', type: 'textarea', required: true },
      { name: 'publish_date', label: 'Data de publicação', type: 'datetime', required: true },
      { name: 'is_active', label: 'Ativo', type: 'checkbox' },
    ],
  },
  {
    key: 'events',
    table: 'events',
    title: 'Eventos',
    singular: 'Evento',
    churchScoped: true,
    orderBy: { column: 'datetime', ascending: false },
    listColumns: ['title', 'datetime', 'location', 'is_active'],
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'description', label: 'Descrição', type: 'textarea', required: true },
      { name: 'datetime', label: 'Data e hora', type: 'datetime', required: true },
      { name: 'location', label: 'Local', type: 'text', required: true },
      { name: 'is_active', label: 'Ativo', type: 'checkbox' },
    ],
  },
  {
    key: 'notifications',
    table: 'notifications',
    title: 'Avisos',
    singular: 'Aviso',
    churchScoped: true,
    orderBy: { column: 'publish_date', ascending: false },
    listColumns: ['title', 'publish_date', 'is_active'],
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'description', label: 'Mensagem', type: 'textarea', required: true },
      { name: 'publish_date', label: 'Data de publicação', type: 'datetime', required: true },
      { name: 'is_active', label: 'Ativo', type: 'checkbox' },
    ],
  },
  {
    key: 'live-streams',
    table: 'live_streams',
    title: 'Transmissões',
    singular: 'Transmissão',
    churchScoped: true,
    orderBy: { column: 'scheduled_at', ascending: false },
    listColumns: ['title', 'scheduled_at', 'stream_url', 'is_active'],
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'description', label: 'Descrição', type: 'textarea', required: true },
      { name: 'stream_url', label: 'URL da transmissão', type: 'text', required: true },
      { name: 'scheduled_at', label: 'Agendada para', type: 'datetime', required: true },
      { name: 'is_active', label: 'Ativa', type: 'checkbox' },
    ],
  },
  {
    key: 'christian-tips',
    table: 'christian_tips',
    title: 'Dicas cristãs',
    singular: 'Dica',
    churchScoped: true,
    orderBy: { column: 'created_at', ascending: false },
    listColumns: ['title', 'category', 'platforms', 'is_active'],
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'description', label: 'Descrição', type: 'textarea', required: true },
      {
        name: 'category',
        label: 'Categoria',
        type: 'select',
        options: [
          { value: 'book', label: 'Livro' },
          { value: 'movie', label: 'Filme' },
          { value: 'serie', label: 'Série' },
          { value: 'cartoon', label: 'Desenho' },
        ],
      },
      { name: 'platforms', label: 'Plataformas (separadas por vírgula)', type: 'array' },
      { name: 'is_active', label: 'Ativa', type: 'checkbox' },
    ],
  },
  {
    key: 'courses',
    table: 'courses',
    title: 'Cursos',
    singular: 'Curso',
    churchScoped: true,
    orderBy: { column: 'created_at', ascending: false },
    listColumns: ['title', 'is_active'],
    childLink: { label: 'Aulas', key: 'lessons' },
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'description', label: 'Descrição', type: 'textarea', required: true },
      { name: 'is_active', label: 'Ativo', type: 'checkbox' },
    ],
  },
  {
    key: 'lessons',
    table: 'course_lessons',
    title: 'Aulas do curso',
    singular: 'Aula',
    parent: { column: 'course_id', resourceKey: 'courses' },
    orderBy: { column: 'lesson_order', ascending: true },
    listColumns: ['lesson_order', 'title', 'duration_minutes', 'is_active'],
    fields: [
      { name: 'lesson_order', label: 'Ordem', type: 'number', required: true },
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'description', label: 'Descrição', type: 'textarea', required: true },
      { name: 'duration_minutes', label: 'Duração (min)', type: 'number', required: true },
      { name: 'is_active', label: 'Ativa', type: 'checkbox' },
    ],
  },
  {
    key: 'quiz',
    table: 'quiz_questions',
    title: 'Quiz bíblico',
    singular: 'Pergunta',
    orderBy: { column: 'created_at', ascending: false },
    listColumns: ['title', 'age_group', 'difficulty', 'is_active'],
    fields: [
      { name: 'title', label: 'Pergunta', type: 'text', required: true },
      { name: 'options', label: 'Alternativas (separadas por vírgula)', type: 'array', required: true },
      { name: 'correct_answer', label: 'Índice da resposta correta (0 = primeira)', type: 'number', required: true },
      { name: 'explanation', label: 'Explicação', type: 'textarea', required: true },
      { name: 'age_group', label: 'Faixa etária', type: 'select', options: AGE_GROUPS },
      { name: 'difficulty', label: 'Dificuldade', type: 'select', options: DIFFICULTIES },
      { name: 'question_order', label: 'Ordem', type: 'number' },
      { name: 'course_id', label: 'Curso (opcional, para quiz de curso)', type: 'relation', relation: { table: 'courses', labelColumn: 'title', optional: true } },
      { name: 'is_active', label: 'Ativa', type: 'checkbox' },
    ],
  },
  {
    key: 'word-games',
    table: 'word_games',
    title: 'Jogos de palavras',
    singular: 'Jogo',
    orderBy: { column: 'created_at', ascending: false },
    listColumns: ['game_type', 'title', 'age_group', 'difficulty', 'grid_size', 'is_active'],
    childLink: { label: 'Palavras', key: 'word-game-words' },
    fields: [
      {
        name: 'game_type',
        label: 'Tipo',
        type: 'select',
        required: true,
        options: [
          { value: 'crossword', label: 'Palavras cruzadas' },
          { value: 'word_search', label: 'Caça-palavras' },
        ],
      },
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'description', label: 'Descrição', type: 'textarea' },
      { name: 'age_group', label: 'Faixa etária', type: 'select', options: AGE_GROUPS, required: true },
      { name: 'difficulty', label: 'Dificuldade', type: 'select', options: DIFFICULTIES, required: true },
      { name: 'grid_size', label: 'Tamanho da grade (6 a 20)', type: 'number', required: true },
      { name: 'is_active', label: 'Ativo', type: 'checkbox' },
    ],
  },
  {
    key: 'word-game-words',
    table: 'word_game_words',
    title: 'Palavras do jogo',
    singular: 'Palavra',
    parent: { column: 'game_id', resourceKey: 'word-games' },
    orderBy: { column: 'word_order', ascending: true },
    listColumns: ['word_order', 'word', 'clue'],
    fields: [
      { name: 'word_order', label: 'Ordem', type: 'number' },
      { name: 'word', label: 'Palavra (MAIÚSCULAS, sem acento)', type: 'text', required: true },
      { name: 'clue', label: 'Dica (obrigatória nas cruzadas)', type: 'text' },
    ],
  },
  {
    key: 'benefit-partners',
    table: 'benefit_partners',
    title: 'Clube de benefícios',
    singular: 'Parceiro',
    orderBy: { column: 'created_at', ascending: false },
    listColumns: ['name', 'category', 'discount_description', 'is_active'],
    fields: [
      { name: 'name', label: 'Parceiro', type: 'text', required: true },
      {
        name: 'category',
        label: 'Categoria',
        type: 'select',
        options: [
          { value: 'health', label: 'Saúde' },
          { value: 'education', label: 'Educação' },
          { value: 'food', label: 'Alimentação' },
          { value: 'retail', label: 'Comércio' },
          { value: 'services', label: 'Serviços' },
          { value: 'entertainment', label: 'Entretenimento' },
          { value: 'other', label: 'Outros' },
        ],
      },
      { name: 'description', label: 'Descrição', type: 'textarea' },
      { name: 'discount_description', label: 'Desconto/benefício', type: 'text', placeholder: 'ex.: 15% em consultas' },
      { name: 'church_id', label: 'Igreja (vazio = benefício global)', type: 'relation', relation: { table: 'churches', labelColumn: 'name', optional: true } },
      { name: 'logo_url', label: 'URL do logo', type: 'text' },
      { name: 'website_url', label: 'Site', type: 'text' },
      { name: 'phone', label: 'Telefone', type: 'text' },
      { name: 'address', label: 'Endereço', type: 'text' },
      { name: 'is_active', label: 'Ativo', type: 'checkbox' },
    ],
  },
  {
    key: 'telemedicine',
    table: 'telemedicine_providers',
    title: 'Telemedicina — provedores',
    singular: 'Provedor',
    adminGlobalOnly: true,
    orderBy: { column: 'created_at', ascending: false },
    listColumns: ['name', 'slug', 'api_base_url', 'is_active'],
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'slug', label: 'Slug (identificador da integração)', type: 'text', required: true, placeholder: 'ex.: conexa' },
      { name: 'api_base_url', label: 'URL base da API', type: 'text' },
      { name: 'description', label: 'Descrição', type: 'textarea' },
      { name: 'is_active', label: 'Ativo', type: 'checkbox' },
    ],
  },
  {
    key: 'testimonials',
    table: 'testimonials',
    title: 'Testemunhos (moderação)',
    singular: 'Testemunho',
    churchScoped: true,
    canCreate: false,
    orderBy: { column: 'created_at', ascending: false },
    listColumns: ['content', 'created_at', 'is_active'],
    fields: [
      { name: 'content', label: 'Conteúdo', type: 'textarea', required: true },
      { name: 'is_active', label: 'Visível no app', type: 'checkbox' },
    ],
  },
  {
    key: 'prayer-requests',
    table: 'prayer_requests',
    title: 'Pedidos de oração (moderação)',
    singular: 'Pedido',
    churchScoped: true,
    canCreate: false,
    orderBy: { column: 'created_at', ascending: false },
    listColumns: ['content', 'is_private', 'created_at', 'is_active'],
    fields: [
      { name: 'content', label: 'Conteúdo', type: 'textarea', required: true },
      { name: 'is_private', label: 'Privado', type: 'checkbox' },
      { name: 'is_active', label: 'Visível no app', type: 'checkbox' },
    ],
  },
  {
    key: 'users',
    table: 'profiles',
    title: 'Usuários',
    singular: 'Usuário',
    canCreate: false,
    canDelete: false,
    orderBy: { column: 'created_at', ascending: false },
    listColumns: ['full_name', 'role', 'church_id', 'is_active'],
    fields: [
      { name: 'full_name', label: 'Nome', type: 'text', required: true },
      {
        name: 'role',
        label: 'Papel',
        type: 'select',
        required: true,
        options: [
          { value: 'user', label: 'Usuário' },
          { value: 'admin_local', label: 'Admin da igreja' },
          { value: 'admin_global', label: 'Admin global' },
        ],
      },
      { name: 'church_id', label: 'Igreja', type: 'relation', relation: { table: 'churches', labelColumn: 'name', optional: true } },
      { name: 'is_active', label: 'Ativo', type: 'checkbox' },
    ],
  },
]

export const findResource = (key: string) => resources.find((r) => r.key === key)
