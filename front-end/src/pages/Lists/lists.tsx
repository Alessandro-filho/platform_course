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
import { Plus } from 'lucide-react';
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
import { Progress } from "@/components/ui/progress"

export default function lists() {
  const [courseName, setCourseName] = useState('');
  const [imageURL, setImageURL] = useState('');
  const [coursePath, setCoursePath] = useState('');
  const fileInputRef = useRef(null);
  const fileInputRefEdit = useRef(null);
  const [courses, setCourses] = useState([]);
  const [idToDelete, setIdToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = (course) => {
    console.log(course)
    setCurrentCourse(course);
    setIsEditing(true);
  };

  const handleSubmitEdit = async () => {
    const formData = new FormData();

    formData.append('name', currentCourse.name);
    formData.append('path', currentCourse.path);

    if (fileInputRefEdit.current?.files[0]) {
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

  const handleDelete = (id) => {
    setIdToDelete(id);
  };

  const confirmDelete = async (id) => {
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
    setIsLoading(true);
    const formData = new FormData();

    formData.append('name', courseName);
    formData.append('path', coursePath);

    if (fileInputRef.current?.files[0]) {
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
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao adicionar registro.', {
        duration: 2000, action: {
          label: 'Ok',
          onClick: () => ``,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setCurrentCourse(prev => ({
      ...prev,
      [name]: value,
    }));
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
      <div className='mt-20 w-full'>
        <h1 className='text-[3.5em] text-[hsl(222.2,84%,4.9%)] dark:text-white'>Qual iremos cadastrar?</h1>
        <div className='mt-10 flex flex-wrap gap-4 w-full justify-center'>
          <Card className="w-[250px]">
            <CardHeader>
              <CardTitle className='text-[hsl(222.2,84%,4.9%)] dark:text-white'>Cadastrar</CardTitle>
            </CardHeader>
            <CardContent className='flex justify-center'>
              <Dialog>
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
          {Array.isArray(courses) && courses.map((course) => (
            <Card key={course.id} className="w-[350px]">
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
          ))}
        </div>
      </div>
      <Toaster position="bottom-center" richColors expand={false} visibleToasts={3} />
      {isLoading && <Progress />}
    </>
  )
}