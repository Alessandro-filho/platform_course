import './App.css'
import { ThemeProvider } from "./utils/theme-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import { toast, Toaster } from "sonner"
import semImagem from '../public/sem-foto.png'
import { Plus } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  isCoverUrl: '0' | '1';
  urlCover?: string;
  fileCover?: string;
}

function App() {
  const [courses, setCourses] = useState<Course[]>([]);

  function handleNavigate(path: string) {
    navigate(path);
  }

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses');
        if (!response.ok) throw new Error('Falha ao buscar cursos');

        const data = await response.json();
        setCourses(data);
      } catch (error) {
        toast.error('Erro ao carregar cursos.');
      }
    };

    fetchCourses();
  }, []);
  let navigate = useNavigate();

  function handlePlayButtonClick(courseId: number) {
    navigate(`/course/${courseId}`);
  }

  return (
    <>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <div className='mt-20 w-full'>
          <h1 className='text-[3.5em]'>Que curso iremos assistir?</h1>
          <div className='mt-10 flex flex-wrap gap-4 w-full justify-center'>
            {Array.isArray(courses) && courses.length > 0 ? (
              courses.map((course) => (
                <Card key={course.id} className="w-[250px]">
                  <CardHeader>
                    <CardTitle className='text-[hsl(222.2,84%,4.9%)] dark:text-white'>{course.name}</CardTitle>
                  </CardHeader>
                  <CardContent className='flex justify-center'>
                    <img
                      className='rounded w-44 h-44'
                      src={
                        course.isCoverUrl == '1' && course.urlCover && course.urlCover !== "null"
                          ? course.urlCover
                          : (course.fileCover ? `../../../../uploads/${course.fileCover}` : semImagem)
                      }
                      alt={course.name}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={() => handlePlayButtonClick(Number(course.id))}>Play</Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card className="w-[250px]">
                <CardHeader>
                  <CardTitle className='text-[hsl(222.2,84%,4.9%)] dark:text-white'>Cadastrar</CardTitle>
                </CardHeader>
                <CardDescription className='text-start px-4 pb-4'>
                  Não temos nenhum curso cadastrado ainda, vamos nessa?
                </CardDescription>
                <CardContent className='flex justify-center'>
                  <Button onClick={() => handleNavigate('/lists')} variant="outline" className='w-32 h-32'>
                    <Plus className="h-[1rem] w-[1rem] rotate-0 scale-100 transition-all" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        <Toaster position="bottom-center" richColors expand={false} visibleToasts={3} />
      </ThemeProvider>
    </>
  )
}

export default App
