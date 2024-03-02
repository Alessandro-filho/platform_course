import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function Help() {

  return (
    <div className='flex justify-center'>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className='text-center text-[hsl(222.2,84%,4.9%)] dark:text-white'>Aqui está a sua ajuda</CardTitle>
        </CardHeader>
        <CardDescription className='text-2xl my-4 text-red-600'>
          <h2>O vídeo está sem audio porque esqueci de gravar.</h2>
        </CardDescription>
        <CardContent className='flex justify-center'>
          <video controls src="../../../public/funcionamento_basico.mp4"></video>
        </CardContent>
      </Card>
    </div>
  );
}

export default Help;
