import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { marked } from 'marked';
// import './mark.scss';

const markdownContent = `
# Título do Markdown

Aqui vai o conteúdo do seu arquivo Markdown.

- Lista
- Com
- Itens
`;

function Help() {
  const markdownHtml = marked(markdownContent);

  return (
    <div className='mt-40 flex justify-center'>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className='text-center text-[hsl(222.2,84%,4.9%)] dark:text-white'>Aqui está a sua ajuda</CardTitle>
        </CardHeader>
        <CardContent className='flex justify-center'>
          <div dangerouslySetInnerHTML={{ __html: markdownHtml }} />
        </CardContent>
      </Card>
    </div>
  );
}

export default Help;
