import { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast, Toaster } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import semImagem from '../../../public/sem-foto.png'

type Course = {
  id: number;
  name: string;
  path: string;
  urlCover?: string;
  fileCover?: string;
  isCoverUrl?: string;
};

export default function lists() {
  const [courseName, setCourseName] = useState<string>('');
  const [imageURL, setImageURL] = useState<string>('');
  const [coursePath, setCoursePath] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRefEdit = useRef<HTMLInputElement>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleEdit = (course: Course) => {
    setCurrentCourse(course);
    setIsEditing(true);
    isEditing
  };

  const handleSubmitEdit = async () => {
    if (!currentCourse) {
      return;
    }
    setIsLoading(true);
    const formData = new FormData();

    formData.append('name', currentCourse.name);
    formData.append('path', currentCourse.path);

    if (fileInputRefEdit.current && fileInputRefEdit.current.files && fileInputRefEdit.current.files[0]) {
      formData.append('imageFile', fileInputRefEdit.current.files[0]);
    } else if (currentCourse.urlCover) {
      formData.append('imageURL', currentCourse.urlCover);
    }

    try {
      const response = await fetch(`/api/courses/${currentCourse.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        toast.error(errorMessage);
        return;
      }

      toast.success('Curso atualizado com sucesso!', {
        duration: 2000,
        action: {
          label: 'Ok',
          onClick: () => { },
        },
      });
      
      setIsEditing(false);
    } catch (error) {
      toast.error('Erro ao atualizar o curso.', {
        duration: 2000,
        action: {
          label: 'Ok',
          onClick: () => { },
        },
      });
    }
  };

  const handleDelete = (id: number) => {
    setIdToDelete(id);
  };

  const confirmDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        toast.error(errorMessage);
        return;
      }

      const updatedCourses = courses.filter((course) => course.id !== id);
      setCourses(updatedCourses);
      toast.success('Registro excluído com sucesso!', {
        duration: 2000,
        action: {
          label: 'Ok',
          onClick: () => { },
        },
      });
      
    } catch (error) {
      toast.error('Erro ao excluir o registro.', {
        duration: 2000,
        action: {
          label: 'Ok',
          onClick: () => { },
        },
      });
    } finally {
      setIdToDelete(null);
    }
  };

  const handleSubmit = async () => {
    setIsOpen(false)
    setIsLoading(true);
    const formData = new FormData();

    formData.append('name', courseName);
    formData.append('path', coursePath);

    if (fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files[0]) {
      formData.append('imageFile', fileInputRef.current.files[0]);
    } else if (imageURL) {
      formData.append('imageURL', imageURL);
    }

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorMessage = await response.json();
        toast.error(errorMessage.error);
        setIsLoading(false);
        return;
      }

      const result = await response.json();
      toast.success(`Curso adicionado: ${result.name}`, {
        duration: 2000,
        action: {
          label: 'Ok',
          onClick: () => { },
        },
      });
      
    } catch (error) {
      toast.error('Erro ao adicionar registro.', {
        duration: 2000, action: {
          label: 'Ok',
          onClick: () => ``,
        },
      });
    } finally {
      setIsLoading(false);
      fetchCourses();
      setCourseName('');
      setImageURL('');
      setCoursePath('');
    }
  };

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

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setCurrentCourse(prev => ({
      ...prev,
      [name]: value,
    }) as Course);
  };

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

  return (
    <>
      <div className='w-full mb-4'>
        {isLoading && <div className='flex justify-center'>
          <Card className='w-1/2 absolute top-1/2'>
            <CardContent className='flex justify-center items-center p-10'>
              <Loader2 className='animate-spin mr-4' />
              <p>Processando...</p>
            </CardContent>
          </Card>
        </div>
        }
        <h1 className='text-[3.5em] text-[hsl(222.2,84%,4.9%)] dark:text-white'>Qual iremos cadastrar?</h1>
        <div className='mt-10 flex flex-wrap gap-4 w-full justify-center'>
          <Card className="w-[250px]">
            <CardHeader>
              <CardTitle className='text-[hsl(222.2,84%,4.9%)] dark:text-white'>Cadastrar</CardTitle>
            </CardHeader>
            <CardContent className='flex justify-center'>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className='w-32 h-32'>
                    <Plus className="h-[1rem] w-[1rem] rotate-0 scale-100 transition-all" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="md:max-w-[700px] max-w-80">
                  <DialogHeader>
                    <DialogTitle className='mb-6'>Cadastro</DialogTitle>
                  </DialogHeader>
                  <div className='my-2 flex items-center gap-4'>
                    <Label htmlFor="nome" className="text-right">
                      Nome do curso
                    </Label>
                  </div>
                  <Input type="text" id="nome" value={courseName} onChange={(e) => setCourseName(e.target.value)} />
                  <div>
                    <h3>
                      Quer colocar alguma capa? se sim, só escolher...
                    </h3>
                    <Card className="w-full my-4">
                      <CardContent>
                        <div>
                          <div className='my-2'>
                            <Label htmlFor="capaUrl" className="text-right">
                              URL da imagem
                            </Label>
                          </div>
                          <Input type="url" id="capaUrl" value={imageURL} onChange={(e) => setImageURL(e.target.value)} />
                        </div>
                        <p className='my-2'>Ou</p>
                        <div>
                          <div className='my-2'>
                            <Label htmlFor="capaFile" className="text-right">
                              Anexo
                            </Label>
                          </div>
                          <Input type="file" id="capaFile" ref={fileInputRef} />
                        </div>
                      </CardContent>
                    </Card>
                    <h3>
                      Agora, defina o PATH.
                    </h3>
                    <div className='my-2 flex items-center gap-4'>
                      <Label htmlFor="path" className="text-right">
                        PATH do curso
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className='text-red-500 cursor-pointer underline'>Aviso</p>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Por motivos de segurança, os navegadores não permitem a coleta do path por input, deve ser adicionado manualmente.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input type="text" id="path" value={coursePath} onChange={(e) => setCoursePath(e.target.value)} />
                  </div>
                  <DialogFooter>
                    <Button type="button" onClick={handleSubmit}>Confirmar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
        <h1 className='text-[3.5em]'>O que já cadastramos...</h1>
        <div className='mt-10 flex flex-wrap gap-4 w-full justify-center'>
          {Array.isArray(courses) && courses.length > 0 ? (
          courses.map((course) => (
            <Card key={course.id} className="w-[350px] mb-12">
              <CardHeader>
                <CardTitle className='text-start leading-8 text-[hsl(222.2,84%,4.9%)] dark:text-white'>{course.name}</CardTitle>
              </CardHeader>
              <CardContent className='flex justify-center'>
                <img
                  className='rounded'
                  src={
                    course.isCoverUrl == '1' && course.urlCover && course.urlCover !== "null"
                      ? course.urlCover
                      : (course.fileCover ? `uploads/${course.fileCover}` : semImagem)
                  }
                  alt={course.name}
                />
              </CardContent>
              <CardFooter className="flex justify-around">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className='bg-white text-black outline-none border-none' variant="outline" onClick={() => handleEdit(course)}>Editar</Button>
                  </DialogTrigger>
                  <DialogContent className="md:max-w-[700px] max-w-80">
                    <DialogHeader>
                      <DialogTitle className='mb-6'>Editando - {currentCourse?.name || ''}</DialogTitle>
                    </DialogHeader>
                    <div className='my-2 flex items-center gap-4'>
                      <Label htmlFor="nome" className="text-right">
                        Nome do curso
                      </Label>
                    </div>
                    <Input type="text" id="nome" name='name' value={currentCourse?.name || ''} onChange={handleInputChange} />
                    <div>
                      <h3>
                        Quer colocar alguma capa? se sim, só escolher...
                      </h3>
                      <Card className="w-full my-4">
                        <CardContent>
                          <div>
                            <div className='my-2'>
                              <Label htmlFor="capaUrl" className="text-right">
                                URL da imagem
                              </Label>
                            </div>
                            <Input type="url" id="capaUrl" name='urlCover' value={currentCourse?.urlCover || ''} onChange={handleInputChange} />
                          </div>
                          <p className='my-2'>Ou</p>
                          <div>
                            <div className='my-2'>
                              <Label htmlFor="capaFile" className="text-right">
                                Anexo
                              </Label>
                            </div>
                            <Input type="file" id="capaFile" ref={fileInputRefEdit} />
                          </div>
                        </CardContent>
                      </Card>
                      <h3>
                        Agora, atualize o diretório do curso.
                      </h3>
                      <div className='my-2 flex items-center gap-4'>
                        <Label htmlFor="path" className="text-right">
                          PATH do curso
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className='text-red-500 cursor-pointer underline'>Aviso</p>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Por motivos de segurança, os navegadores não permitem a coleta do path por input, deve ser adicionado manualmente.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input type="text" id="path" name='path' value={currentCourse?.path || ''} onChange={handleInputChange} />
                    </div>
                    <DialogFooter>
                      <Button type="button" onClick={handleSubmitEdit}>Confirmar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {idToDelete && (
                  <AlertDialog open={true} onOpenChange={() => setIdToDelete(null)}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmação</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza de que deseja excluir este registro? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIdToDelete(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => confirmDelete(idToDelete)}>Continuar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button className='bg-red-700 text-cyan-50 hover:bg-red-950 hover:text-white outline-none border-none' variant="outline" onClick={() => handleDelete(course.id)}>Apagar</Button>
              </CardFooter>
            </Card>
          ))): <p>Não há registros...</p>
          }
        </div>
      </div>
      <Toaster position="bottom-center" richColors expand={false} visibleToasts={3} />
    </>
  )
}