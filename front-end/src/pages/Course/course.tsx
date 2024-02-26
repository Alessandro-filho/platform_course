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

export default function course() {
  const { courseId } = useParams();
  const [lessons, setLessons] = useState([]);
  const [videoInfo, setVideoInfo] = useState({ title: '', url: '', videoId: '', timeElapsed: '', progressStatus: '' });
  const [watchedLessons, setWatchedLessons] = useState({});
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [lastTimeUpdated, setLastTimeUpdated] = useState(0);
  const [txtContent, setTxtContent] = useState([]);
  const [filesPath, setFilesPath] = useState([]);
  const [modules, setModules] = useState({});
  const [courseName, setCourseName] = useState('');

  function formatarDuracao(segundos) {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = Math.floor(segundos % 60);
    const paddedSegundos = String(segundosRestantes).padStart(2, '0');
    return `${minutos}:${paddedSegundos}`;
  }

  const fetchTxtContent = async (url) => {
    try {
      const response = await fetch(`/serve-txt/?video_path=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar arquivos .txt');
      }
      const data = await response.json();
      const arquivosTxt = Object.values(data) || [];
      setTxtContent(arquivosTxt);
    } catch (error) {
      console.error('Falha ao buscar arquivos .txt:', error);
    }
  };

  const fetchFiles = async (url) => {
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

  const handleTimeEnding = (lessonId, value) => {
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

  const updateLessonProgressLocally = (lessonId, progressStatus) => {
    setLessons((currentLessons) => {
      const updatedModules = { ...currentLessons };

      Object.keys(updatedModules).forEach((module) => {
        updatedModules[module] = updatedModules[module].map((lesson) => {
          if (lesson.id === lessonId) {
            return { ...lesson, progressStatus };
          }
          return lesson;
        });
      });

      return updatedModules;
    });
  };

  const handlePlay = () => {
    const requestData = {
      lessonId: videoInfo.videoId,
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
        updateLessonProgressLocally(videoInfo.videoId, 'started');
      })
      .catch(error => {
        console.error('Erro ao atualizar o progresso da lição:', error);
      });
  };

  const calculateModuleProgressStatus = (moduleLessons) => {
    const allLessons = Object.values(moduleLessons).flat();
    const progressStatusCounts = { completed: 0, started: 0, not_started: 0 };

    allLessons.forEach((lesson) => {
      progressStatusCounts[lesson.progressStatus]++;
    });

    if (progressStatusCounts.completed === allLessons.length) {
      return 'completed';
    }

    let mostCommonStatus = 'not_started';
    if (progressStatusCounts.started > progressStatusCounts[mostCommonStatus]) {
      mostCommonStatus = 'started';
    }
    if (progressStatusCounts.completed > progressStatusCounts[mostCommonStatus]) {
      mostCommonStatus = 'completed';
    }

    return mostCommonStatus;
  };

  const handleLessonWatchToggle = (lessonId) => {
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

  const calculateModuleProgress = (moduleLessons) => {
    const allLessons = Object.values(moduleLessons).flat();
    const total = allLessons.length;
    const watched = allLessons.filter((lesson) => watchedLessons[lesson.id]).length;
    return Number(((watched / total) * 100).toFixed(2));
  };

  const handleTimeUpdate = (lessonId, currentTime) => {
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

  const handleLinkClick = (path) => {
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

  function organizeLessonsInHierarchy(lessons) {
    const hierarchy = {};

    lessons.forEach((lesson) => {

      const pathParts = lesson.hierarchy_path.split('/');
      let currentLevel = hierarchy;

      pathParts.forEach((part, index) => {
        if (!currentLevel[part]) {
          currentLevel[part] = index === pathParts.length - 1 ? [] : {};
        }
        currentLevel = currentLevel[part];
      });

      currentLevel.push(lesson);
    });

    return hierarchy;
  }

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}/lessons`);
        if (!response.ok) throw new Error('Erro ao buscar aulas');
        const lessons = await response.json();
        setCourseName(lessons[0].course_title);

        if (lessons && lessons.length > 0) {
          const organizedHierarchy = organizeLessonsInHierarchy(lessons);
          setModules(organizedHierarchy);

          const firstLesson = findFirstLesson(organizedHierarchy);
          if (firstLesson) {
            setVideoInfo({
              title: firstLesson.title,
              url: `/serve-video/?video_path=${encodeURIComponent(firstLesson.video_url)}`,
              videoId: firstLesson.id,
              timeElapsed: firstLesson.time_elapsed || 0,
              progressStatus: firstLesson.progressStatus
            });
            setSelectedLessonId(firstLesson.id);
            fetchTxtContent(firstLesson.video_url);
            fetchFiles(firstLesson.video_url);
          }

          const watchedLessonsUpdate = lessons.reduce((acc, lesson) => {
            acc[lesson.id] = !!lesson.isCompleted;
            return acc;
          }, {});
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

  function findFirstLesson(hierarchy) {
    for (const key in hierarchy) {
      if (Array.isArray(hierarchy[key]) && hierarchy[key].length > 0) {
        return hierarchy[key][0];
      } else {
        return findFirstLesson(hierarchy[key]);
      }
    }
    return null;
  }

  const renderHierarchy = (hierarchy, level = 0) => {
    const sortedHierarchy = Object.entries(hierarchy).sort((a, b) => {
      const regex = /\d+/g;
      const aModuleNumber = parseInt(a[0].match(regex)[0]);
      const bModuleNumber = parseInt(b[0].match(regex)[0]);
      return aModuleNumber - bModuleNumber;
    });

    return sortedHierarchy.map(([key, value], index) => {
      if (Array.isArray(value)) {
        const sortedLessons = value.sort((a, b) => {
          const aLessonNumber = parseInt(a.hierarchy_path.match(/\d+/g).pop());
          const bLessonNumber = parseInt(b.hierarchy_path.match(/\d+/g).pop());
          return aLessonNumber - bLessonNumber;
        });

        return sortedLessons.map((lesson) => (
          <div key={lesson.id} className={`flex justify-around items-center w-full h-16 my-6 pr-3 ${selectedLessonId === lesson.id ? 'bg-slate-700 text-white dark:bg-black dark:text-white' : ''}`}>
            <p className="w-1/6">{index + 1}</p>
            <p className="w-5/6 cursor-pointer flex flex-col" onClick={() => {
              setVideoInfo({
                title: lesson.title, url: `/serve-video/?video_path=${encodeURIComponent(lesson.video_url)}`, videoId: lesson.id,
                timeElapsed: lesson.time_elapsed || 0,
                progressStatus: lesson.progressStatus
              });
              setSelectedLessonId(lesson.id);
            }}>{lesson.title} <span>{formatarDuracao(lesson.duration)}</span></p>
            <div className="w-1/6">
              <Checkbox
                checked={!!watchedLessons[lesson.id]}
                onCheckedChange={() => handleLessonWatchToggle(lesson.id)}
              />
            </div>
          </div>
        ));
      } else {
        const moduleProgress = calculateModuleProgress(value);
        const progressStatusModule = calculateModuleProgressStatus(value);
        const hasStartedLessons = Object.values(value).some(moduleLessons =>
          moduleLessons.some(lesson => lesson.progressStatus === 'started')
        );

        return (
          <Accordion key={`module-${level}-${index}`} collapsible>
            <AccordionItem value={`module-${key}`}>
              <AccordionTrigger className="hover:no-underline">{key}</AccordionTrigger>
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
              <AccordionContent>
                {renderHierarchy(value, level + 1)}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      }
    });
  };

  return (
    <>
      <div className='flex flex-wrap lg:flex-nowrap mt-[3.2rem] gap-4'>
        <section className="lg:w-2/3 w-full">
          <div>
            <Player
              title={videoInfo.title}
              src={videoInfo.url}
              isEnding={handleTimeEnding}
              lessonId={videoInfo.videoId}
              onTimeUpdate={(currentTime) => handleTimeUpdate(videoInfo.videoId, currentTime)}
              onPlay={handlePlay}
              timeElapsed={parseFloat(videoInfo.timeElapsed)}
            />
          </div>
          <div className="w-full">
            <Tabs defaultValue="description">
              <TabsList className="w-full">
                <TabsTrigger value="description" className="w-1/2">Descrição</TabsTrigger>
                <TabsTrigger value="others" className="w-1/2">Outros</TabsTrigger>
              </TabsList>
              <TabsContent value="description">
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-left mb-2">Descrição</CardTitle>
                    <Separator className="my-4" />
                  </CardHeader>
                  <CardContent>
                    {txtContent == '' ? <h3>Não há descrição em .txt</h3> : txtContent}
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
  )
}