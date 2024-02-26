# Plarform course

O Plarform course é uma aplicação web desenvolvida com Flask que permite gerenciar cursos em vídeo, incluindo suas lições e progresso do usuário.

## Funcionalidades

- **Listagem de Cursos**: Visualize todos os cursos cadastrados, incluindo detalhes como nome, caminho, capa (URL ou arquivo) e lista de lições.

- **Detalhes do Curso**: Obtenha detalhes específicos de um curso, incluindo seu nome, capa e lista de lições.

- **Adição de Curso**: Adicione novos cursos, incluindo nome, caminho do curso, capa (opcional) e lições automaticamente detectadas a partir do diretório do curso.

- **Edição de Curso**: Edite os detalhes de um curso existente, incluindo nome, caminho do curso e capa (opcional), mantendo a lista de lições existente.

- **Exclusão de Curso**: Remova cursos existentes, incluindo todas as lições associadas.

- **Listagem de Lições**: Visualize todas as lições associadas a um curso específico, incluindo título, módulo, status de progresso e duração.

- **Atualização de Progresso da Lição**: Atualize o progresso de uma lição específica, incluindo o status de progresso (iniciado, concluído) e o tempo decorrido.

## Pré-requisitos

- Python 3.x
- Flask
- Flask SQLAlchemy
- Flask CORS
- FFmpeg (para obter a duração dos vídeos)

## Banco de Dados

A aplicação utiliza um banco de dados SQLite para armazenar informações sobre os cursos e lições. O banco de dados é criado automaticamente quando a aplicação é iniciada e está localizado no arquivo `instance/platform_course.sqlite` na raiz do projeto.

As tabelas do banco de dados são as seguintes:

### Tabela `Course`

- `id`: Identificador único do curso (chave primária)
- `name`: Nome do curso
- `path`: Caminho do curso no sistema de arquivos
- `isCoverUrl`: Indica se a capa do curso é uma URL (0 para não, 1 para sim)
- `fileCover`: Nome do arquivo da capa do curso (se não for uma URL)
- `urlCover`: URL da capa do curso (se for uma URL)

### Tabela `Lesson`

- `id`: Identificador único da lição (chave primária)
- `course_id`: ID do curso ao qual a lição pertence (chave estrangeira)
- `title`: Título da lição
- `module`: Módulo ao qual a lição pertence
- `hierarchy_path`: Caminho hierárquico da lição
- `video_url`: URL do vídeo da lição
- `progressStatus`: Status de progresso da lição
- `isCompleted`: Indica se a lição está concluída (0 para não, 1 para sim)
- `time_elapsed`: Tempo decorrido na lição
- `duration`: Duração do vídeo da lição

## Instalação

1. Clone o repositório:

```shell
git clone https://github.com/Alessandro-filho/platform_course.git
```

2. Instale as dependências:

```shell
cd platform_course
pip install -r requirements.txt
```

3. Execute a aplicação:

```shell
python app.py
```

A aplicação estará acessível em `http://localhost:5000` por padrão.

## Uso

- Acesse a aplicação em seu navegador.
- Utilize as funcionalidades fornecidas pela interface web para gerenciar cursos e lições.

PS: Tive uma tentativa frustante de usar o [Electron](https://www.electronjs.org/pt/), mas caso você tenha mais capacidade e paciência do que eu, você vai conseguir.

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir uma issue para relatar bugs ou sugerir novos recursos. Pull requests também são encorajados.

## Licença

Este projeto é licenciado sob a [MIT License](https://opensource.org/licenses/MIT).