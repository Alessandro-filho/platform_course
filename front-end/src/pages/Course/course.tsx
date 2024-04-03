import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { CheckCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Player } from "@/components/player/player"
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast, Toaster } from "sonner";

interface TxtFile {
  name: string;
  content: string;
}

interface Lesson {
  id: number;
  module: string;
  progressStatus: string;
  hierarchy_path: string;
  course_title: string;
  isCompleted: number;
  title: string;
  video_url: string;
  time_elapsed?: number;
  duration: string;
}

interface Hierarchy {
  [key: string]: Hierarchy | Lesson[];
}

interface FileObject {
  url: string;
  name: string;
}

export default function course() {
  const { courseId } = useParams<{ courseId: string }>();
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [videoInfo, setVideoInfo] = useState({ title: '', url: '', videoId: '', timeElapsed: '', progressStatus: '' });
  const [watchedLessons, setWatchedLessons] = useState<Record<number, boolean>>({});
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [lastTimeUpdated, setLastTimeUpdated] = useState(0);
  const [txtContent, setTxtContent] = useState<TxtFile[]>([]);
  const [filesPath, setFilesPath] = useState<FileObject[]>([]);
  const [modules, setModules] = useState<Record<string, any>>({});
  const [courseName, setCourseName] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  

  function formatarDuracao(segundos: number) {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = Math.floor(segundos % 60);
    const paddedSegundos = String(segundosRestantes).padStart(2, '0');
    return `${minutos}:${paddedSegundos}`;
  }

  const fetchTxtContent = async (url: string) => {
    try {
      const response = await fetch(`/serve-txt/?video_path=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar arquivos .txt');
      }
      const data: { [key: string]: TxtFile } = await response.json();
      const arquivosTxt = Object.values(data) || [];
      setTxtContent(arquivosTxt);
    } catch (error) {
      console.error('Falha ao buscar arquivos .txt:', error);
    }
  };

  
  


  const fetchFiles = async (url: string) => {
    try {
      const response = await fetch(`/serve-files/?video_path=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar arquivos');
      }
      const data = await response.json();
      setFilesPath(data);
    } catch (error) {
      console.error('Falha ao buscar arquivos:', error);
    }
  };

  const handleTimeEnding = (lessonId: number, value: boolean) => {
    if (value && lessonId) {
      const requestData = {
        lessonId: lessonId,
        progressStatus: 'started',
        isCompleted: true
      };

      fetch('/api/update-lesson-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      }).then(response => {
        if (!response.ok) {
          throw new Error('Erro ao atualizar o progresso da lição');
        }
      }).catch(error => {
        console.error('Erro:', error);
      });

      handleLessonWatchToggle(lessonId);
    }
  };

  const updateLessonProgressLocally = (lessonId: number, progressStatus: string) => {
    lessons
    setLessons((currentLessons) => {
      const updatedModules = { ...currentLessons };

      Object.keys(updatedModules).forEach((module: string) => {
        const lessonArray = updatedModules[module];
        if (Array.isArray(lessonArray)) {
          updatedModules[module] = lessonArray.map((lesson: Lesson) => {
            if (lesson.id === lessonId) {
              return { ...lesson, progressStatus };
            }
            return lesson;
          });
        }
      });

      return updatedModules;
    });
  };
  const createNotes = () => {
    if (!noteTitle || !noteContent) {
      return;
    }

    const requestData = {
      title: noteTitle,
      content: noteContent,
      course_id: courseId 
    };

    fetch('/api/annotations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to save notes');
        }
        return response.json();
      })
      .then(data => {
        
        console.log('Notes saved successfully:', data);
        
        setNoteTitle('');
        setNoteContent('');
      })
      .catch(error => {
        console.error('Error saving notes:', error);
        
      });
  };
  
  const handlePlay = () => {
    const requestData = {
      lessonId: Number(videoInfo.videoId),
      progressStatus: 'started',
    };

    fetch('/api/update-lesson-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Falha ao atualizar progresso da lição');
        }
        return response.json();
      })
      .then(() => {
        setVideoInfo(prev => ({
          ...prev,
          progressStatus: 'started',
        }));
        updateLessonProgressLocally(Number(videoInfo.videoId), 'started');
      })
      .catch(error => {
        console.error('Erro ao atualizar o progresso da lição:', error);
      });
  };

  type ProgressStatus = 'completed' | 'started' | 'not_started';

  const calculateModuleProgress = (moduleLessons: Lesson[]) => {
    const total = moduleLessons.length;
    const watched = moduleLessons.filter((lesson) => watchedLessons[lesson.id]).length;
    return Number(((watched / total) * 100).toFixed(2));
  };

  const calculateModuleProgressStatus = (moduleLessons: Lesson[]) => {
    const progressStatusCounts: Record<ProgressStatus, number> = { completed: 0, started: 0, not_started: 0 };

    moduleLessons.forEach((lesson) => {
      const status: ProgressStatus = watchedLessons[lesson.id] ? 'completed' : lesson.progressStatus as ProgressStatus;
      progressStatusCounts[status]++;
    });

    if (progressStatusCounts.completed === moduleLessons.length) {
      return 'completed';
    } else if (progressStatusCounts.started > 0) {
      return 'started';
    } else {
      return 'not_started';
    }
  };

  const handleLessonWatchToggle = (lessonId: number) => {
    setWatchedLessons((prev) => {
      const isCompleted = !prev[lessonId];
      const progressStatus = isCompleted ? "completed" : "started";

      const requestData = {
        lessonId: lessonId,
        isCompleted,
        progressStatus,
      };

      fetch('/api/update-lesson-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      }).catch((error) => {
        console.error('Erro:', error);
      });

      return { ...prev, [lessonId]: isCompleted };
    });
  };

  const handleTimeUpdate = (lessonId: number, currentTime: number) => {
    if (Math.abs(lastTimeUpdated - currentTime) > 60) {
      setLastTimeUpdated(currentTime);

      if (videoInfo.progressStatus === "started") {
        const requestData = {
          lessonId: lessonId,
          time_elapsed: currentTime,
          progressStatus: "started",
        };

        fetch('/api/update-lesson-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        })
          .then(() => {
            setVideoInfo(prev => ({
              ...prev,
              timeElapsed: currentTime.toString(),
            }));
          })
          .catch((error) => {
            console.error('Erro:', error);
          });
      }
    }
  };


  const handleLinkClick = (path: string) => {
    navigator.clipboard.writeText(path)
      .then(() => {
        toast.error('Sem permissão para abrir diretórios direto do navegador. O caminho foi copiado para a área de transferência.', {
          duration: 4000,
          action: {
            label: 'Ok',
            onClick: () => { },
          },
        });
      })
      .catch(() => {
        toast.error('Erro ao copiar o caminho para a área de transferência.', {
          duration: 2000,
        });
      });
  };

  const flattenHierarchy = (hierarchy: Hierarchy): Lesson[] => {
    const lessons: Lesson[] = [];

    Object.values(hierarchy).forEach((item) => {
      if (Array.isArray(item)) {
        lessons.push(...item);
      } else {
        lessons.push(...flattenHierarchy(item));
      }
    });

    return lessons;
  };

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}/lessons`);
        if (!response.ok) throw new Error('Erro ao buscar aulas');
        const lessons: Lesson[] = await response.json();
        setCourseName(lessons[0].course_title);

        if (lessons && lessons.length > 0) {
          const organizedHierarchy = organizeLessonsInHierarchy(lessons);
          setModules(organizedHierarchy);

          const firstLesson = findFirstLesson(organizedHierarchy);
          if (firstLesson) {
            setVideoInfo({
              title: firstLesson.title,
              url: `/serve-video/?video_path=${encodeURIComponent(firstLesson.video_url)}`,
              videoId: firstLesson.id.toString(),
              timeElapsed: (firstLesson.time_elapsed ?? 0).toString(),
              progressStatus: firstLesson.progressStatus
            });
            setSelectedLessonId(firstLesson.id);
            fetchTxtContent(firstLesson.video_url);
            fetchFiles(firstLesson.video_url);
          }

          const watchedLessonsUpdate: Record<number, boolean> = lessons.reduce((acc, lesson) => {
            acc[lesson.id] = !!lesson.isCompleted;
            return acc;
          }, {} as Record<number, boolean>);
          setWatchedLessons(watchedLessonsUpdate);
        } else {
          console.error('Resposta do servidor vazia ou sem dados');
        }
      } catch (error) {
        console.error('Falha ao buscar aulas:', error);
      }
    };

    fetchLessons();
  }, [courseId]);

  function findFirstLesson(hierarchy: Hierarchy): Lesson | null {
    for (const key in hierarchy) {
      const item = hierarchy[key];
      if (Array.isArray(item)) {
        if (item.length > 0) {
          return item[0] as Lesson;
        }
      } else {
        const lesson = findFirstLesson(item as Hierarchy);
        if (lesson) {
          return lesson;
        }
      }
    }
    return null;
  }

  function organizeLessonsInHierarchy(lessons: Lesson[]): Hierarchy {
    const hierarchy: Hierarchy = {};

    lessons.forEach((lesson) => {
      const pathParts = lesson.hierarchy_path.split('/');
      let currentLevel = hierarchy;

      pathParts.forEach((part, index) => {
        if (index === pathParts.length - 1) {
          if (!currentLevel[part]) {
            currentLevel[part] = [];
          }
          (currentLevel[part] as Lesson[]).push(lesson);
        } else {
          if (!currentLevel[part]) {
            currentLevel[part] = {};
          }
          currentLevel = currentLevel[part] as Hierarchy;
        }
      });
    });
    return hierarchy;
  }

  const renderHierarchy = (hierarchy: Hierarchy, level = 0): JSX.Element[] => {
    const elements: JSX.Element[] = [];

    Object.entries(hierarchy).sort((a, b) => {
      const regex = /\d+/g;
      const matchResultA = a[0].match(regex);
      const aModuleNumber = matchResultA ? parseInt(matchResultA[0], 10) : 0;
      const matchResultB = b[0].match(regex);
      const bModuleNumber = matchResultB ? parseInt(matchResultB[0], 10) : 0;
      return aModuleNumber - bModuleNumber;
    }).forEach(([key, value], index) => {
      const accordionKey = `module-${level}-${key}-${index}`;
      const isSubmodule = typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0;

      const moduleLessons = Array.isArray(value) ? value : flattenHierarchy(value);
      const moduleProgress = level === 0 ? calculateModuleProgress(moduleLessons) : null;
      const progressStatusModule = level === 0 ? calculateModuleProgressStatus(moduleLessons) : null;
      const hasStartedLessons = level === 0 ? moduleLessons.some(lesson => watchedLessons[lesson.id] || lesson.progressStatus === 'started') : false;


      const progressComponents = level === 0 ? (
        <div className="flex gap-2 justify-start items-center my-4">
          <div>
            <p className="w-12 h-12 rounded-full bg-slate-500 text-white dark:bg-black dark:text-white flex justify-center items-center">
              {index + 1}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p>{key}</p>
            {hasStartedLessons && moduleProgress !== 100.00 ? (
              <div className="flex gap-2 items-center">
                <Progress fill="#22c55e" className="w-full h-1" value={moduleProgress} />
                <span>{moduleProgress}%</span>
              </div>
            ) : progressStatusModule === 'completed' ? (
              <div className="flex gap-2 items-center">
                <CheckCircle color="#339d25" className="w-4 h-4" />
                Completo
              </div>
            ) : progressStatusModule === 'not_started' || !hasStartedLessons ? (
              <div className="flex gap-2 items-center">
                <CheckCircle color="#cccccc" className="w-4 h-4" />
                Não Iniciado
              </div>
            ) : null}
          </div>
        </div>
      ) : key;

      if (isSubmodule) {
        elements.push(
          <Accordion key={accordionKey} type="single" collapsible>
            <AccordionItem value={accordionKey}>
              <AccordionTrigger className="hover:no-underline">
                {progressComponents}
              </AccordionTrigger>
              <AccordionContent>
                {renderHierarchy(value, level + 1)}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      } else if (Array.isArray(value)) {
        const sortedLessons = value.sort((a, b) => {
          const matchResultA = a.hierarchy_path.match(/\d+/g);
          const matchResultB = b.hierarchy_path.match(/\d+/g);
          const aLessonNumber = matchResultA ? parseInt(matchResultA[matchResultA.length - 1], 10) : 0;
          const bLessonNumber = matchResultB ? parseInt(matchResultB[matchResultB.length - 1], 10) : 0;
          return aLessonNumber - bLessonNumber;
        });
        const lessonElements = sortedLessons.map((lesson, lessonIndex) => (
          <div key={lesson.id} className={`flex justify-around items-center w-full h-16 my-6 pr-3 ${selectedLessonId === lesson.id ? 'bg-slate-700 text-white dark:bg-black dark:text-white' : ''}`}>
            <p className="w-1/6">{lessonIndex + 1}</p>
            <p className="w-5/6 cursor-pointer flex flex-col" onClick={() => {
              setVideoInfo({
                title: lesson.title,
                url: `/serve-video/?video_path=${encodeURIComponent(lesson.video_url)}`,
                videoId: lesson.id.toString(),
                timeElapsed: lesson.time_elapsed?.toString() || '0',
                progressStatus: lesson.progressStatus
              });
              setSelectedLessonId(lesson.id);
            }}>
              {lesson.title} <span>{formatarDuracao(Number(lesson.duration))}</span>
            </p>
            <div className="w-1/6">
              <Checkbox
                checked={!!watchedLessons[lesson.id]}
                onCheckedChange={() => handleLessonWatchToggle(lesson.id)}
              />
            </div>
          </div>
        ));

        elements.push(
          <Accordion className="pl-4" key={`submodule-${accordionKey}`} type="single" collapsible>
            <AccordionItem value={accordionKey}>
              <AccordionTrigger className="hover:no-underline">
                {progressComponents}
              </AccordionTrigger>
              <AccordionContent>
                {lessonElements}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      }
    });

    return elements;
  };

  return (
    <>
      <div className='flex flex-wrap lg:flex-nowrap mt-[3.2rem] gap-4'>
        <section className="lg:w-2/3 w-full">
          <div>
            <Player
              title={videoInfo.title}
              src={videoInfo.url}
              isEnding={(lessonId) => handleTimeEnding(Number(lessonId), true)}
              lessonId={Number(videoInfo.videoId)}
              onTimeUpdate={(currentTime) => handleTimeUpdate(Number(videoInfo.videoId), currentTime)}
              onPlay={handlePlay}
              timeElapsed={parseFloat(videoInfo.timeElapsed)}
            />
          </div>
          <div className="w-full">
            <Tabs defaultValue="description">
              <TabsList className="w-full">
                <TabsTrigger value="description" className="w-1/2">Descrição</TabsTrigger>
                <TabsTrigger value="others" className="w-1/2">Outros</TabsTrigger>
                <TabsTrigger value="notes" className="w-1/2">Notas</TabsTrigger>
              </TabsList>
              <TabsContent value="description">
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-left mb-2">Descrição</CardTitle>
                    <Separator className="my-4" />
                  </CardHeader>
                  <CardContent>
                    {
                      Object.keys(txtContent).length === 0 ? (
                        <h3>Não há descrição em .txt ou conteúdo em .html</h3>
                      ) : (
                        <div>
                          {Object.entries(txtContent).map(([_, fileContent], index) => {
                            return (
                              <div key={index} className="mb-5">
                                <div dangerouslySetInnerHTML={{__html: `${fileContent}`}}></div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    }
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="others">
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-left mb-2">Outros</CardTitle>
                    <Separator className="my-4" />
                  </CardHeader>
                  <CardContent>
                    {filesPath.length > 0 ? (
                      <ul>
                        {filesPath.map((file, index) => (
                          <li className="mb-4" key={index}>
                            <a href={file.url} target="_blank" rel="noopener noreferrer" onClick={() => handleLinkClick(file.url)}>
                              {file.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : <h3>Sem outros arquivos</h3>}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="notes">
                <Card className="mt-4">
                  <CardHeader>
                  <CardTitle className="text-left mb-2 mr-4">Notas</CardTitle>
                    <Separator className="my-4" />
                  </CardHeader>
                  <CardContent>
                    <div>
                      <input 
                        type="text"
                        placeholder="Título"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        className="w-full mb-4 p-2 border border-gray-300 rounded-md"
                      />
                      <textarea
                        placeholder="Conteúdo"
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        className="w-full h-32 p-2 border border-gray-300 rounded-md"
                      />
                      <button onClick={createNotes} className="mt-4 bg-green-500 text-white rounded-md p-2">Salvar</button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
        <section className="lg:w-1/3 w-full">
          <Card className="min-h-full">
            <CardHeader>
              <CardTitle className="text-left mb-2">{courseName}</CardTitle>
              <Separator className="my-4" />
            </CardHeader>
            <CardContent className='flex justify-center max-h-[700px]'>
              <ScrollArea className="max-h-[700px] overflow-auto w-full pr-4">
                {renderHierarchy(modules)}
              </ScrollArea>
            </CardContent>
          </Card>
        </section>
        <Toaster position="bottom-center" richColors expand={false} visibleToasts={3} />
      </div>
    </>
  );  
}