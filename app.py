from flask import Flask, request, jsonify, send_file, abort, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.utils import secure_filename, safe_join
import os
from urllib.parse import unquote
import subprocess
import json
from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import joinedload

app = Flask(__name__, static_folder='front-end/dist', static_url_path='')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///platform_course.sqlite?cache=shared'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
db = SQLAlchemy(app)
CORS(app)

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA busy_timeout=30000")
    cursor.close()

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    path = db.Column(db.String(255), nullable=False)
    isCoverUrl = db.Column(db.Integer, default=0)
    fileCover = db.Column(db.String(255), nullable=True)
    urlCover = db.Column(db.String(255), nullable=True)

class Lesson(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    course = db.relationship('Course', backref=db.backref('lessons', lazy=True))
    title = db.Column(db.String(150), nullable=False)
    module = db.Column(db.Text)
    hierarchy_path = db.Column(db.Text, nullable=False)
    video_url = db.Column(db.String(255))
    progressStatus = db.Column(db.Text)
    isCompleted = db.Column(db.Integer)
    time_elapsed = db.Column(db.Text)
    duration = db.Column(db.Text, nullable=True)

class Annotation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    content = db.Column(db.Text)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    course = db.relationship('Course', backref=db.backref('annotations', lazy=True))

with app.app_context():
    db.create_all()

@app.route('/api/courses', methods=['GET'])
def list_courses():
    courses = Course.query.all()
    return jsonify([{'id': course.id, 'name': course.name, 'path': course.path, 'isCoverUrl': course.isCoverUrl, 'fileCover': course.fileCover, 'urlCover': course.urlCover } for course in courses])

@app.route('/api/courses/<int:course_id>/lessons', methods=['GET'])
def list_lessons_for_course(course_id):
    lessons = Lesson.query \
        .filter_by(course_id=course_id) \
        .options(joinedload(Lesson.course)) \
        .all()

    response = [{
        'course_title': lesson.course.name if lesson.course else None,
        'id': lesson.id,
        'title': lesson.title,
        'module': lesson.module,
        'progressStatus': lesson.progressStatus,
        'isCompleted': lesson.isCompleted,
        'hierarchy_path': lesson.hierarchy_path,
        'time_elapsed': lesson.time_elapsed,
        'video_url': lesson.video_url,
        'duration': lesson.duration
    } for lesson in lessons]
    
    return jsonify(response)

def get_duration(caminho_do_video):
    try:
        resultado = subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=duration", "-of", "json", caminho_do_video],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            check=True
        )
        informacoes = json.loads(resultado.stdout)
        duracao = float(informacoes['streams'][0]['duration'])
        return duracao
    except Exception as e:
        print(f"Erro ao obter a duração do vídeo: {e}")
        return None

@app.route('/serve-video/', methods=['GET'])
def serve_video():
    video_path = request.args.get('video_path')

    if '..' in video_path or video_path.startswith('/'):
        abort(404)

    if not os.path.exists(video_path):
        abort(404)

    return send_file(video_path)

@app.route('/serve-txt/', methods=['GET'])
def serve_txt():
    video_path = unquote(request.args.get('video_path', ''))

    if '..' in video_path or video_path.startswith('/'):
        abort(404)

    if not os.path.exists(video_path):
        abort(404)

    video_dir = os.path.dirname(video_path)

    arquivos_txt = {}
    for arquivo in os.listdir(video_dir):
        if arquivo.endswith(".txt") or arquivo.endswith(".html"):
            with open(os.path.join(video_dir, arquivo), 'r', encoding='utf-8') as f:
                arquivos_txt[arquivo] = f.read()

    return jsonify(arquivos_txt)

@app.route('/serve-files/', methods=['GET'])
def serve_files():
    video_path = unquote(request.args.get('video_path', ''))

    if '..' in video_path or video_path.startswith('/'):
        abort(404)

    if not os.path.exists(video_path):
        abort(404)

    video_dir = os.path.dirname(video_path)

    files = os.listdir(video_dir)

    filtered_files = [f for f in files if not (f.endswith('.txt') or f.endswith(('.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm')))]

    files_info = [{'name': f, 'url': os.path.join(video_dir)} for f in filtered_files]

    return jsonify(files_info)

@app.route('/api/annotations', methods=['POST'])
def save_annotation():
    title = request.json.get('title')
    content = request.json.get('content')
    course_id = request.json.get('course_id')
    annotation = Annotation(title=title, content=content, course_id=course_id)
    db.session.add(annotation)
    db.session.commit()
    return jsonify({'title': annotation.title, 'content': annotation.content, 'course_id': annotation.course_id}), 201

@app.route('/api/annotations/<int:course_id>', methods=['GET'])
def list_annotations(course_id):
    annotations = Annotation.query.filter_by(course_id=course_id).all()
    if annotations:
        annotations_list = [{'id': annotation.id, 'title': annotation.title, 'content': annotation.content} for annotation in annotations]
        return jsonify(annotations_list)
    else:
        return jsonify({'message': 'Nenhuma anotação encontrada para este curso e aula'}), 404

@app.route('/api/annotations', methods=['GET'])
def list_all_annotations():
    annotations = Annotation.query.all()
    if annotations:
        annotations_list = [{'id': annotation.id, 'title': annotation.title, 'content': annotation.content, 'course_id': annotation.course_id} for annotation in annotations]
        return jsonify(annotations_list)
    else:
        return jsonify({'message': 'Nenhuma anotação encontrada'}), 404
    
@app.route('/api/annotations/<int:annotation_id>', methods=['DELETE'])
def delete_annotation(annotation_id):
    annotation = Annotation.query.get_or_404(annotation_id)
    db.session.delete(annotation)
    db.session.commit()
    return jsonify({'message': 'Anotação deletada com sucesso'})

@app.route('/api/annotations/<int:annotation_id>', methods=['PUT'])
def update_annotation(annotation_id):
    annotation = Annotation.query.get_or_404(annotation_id)
    content = request.json.get('content')
    annotation.content = content
    db.session.commit()
    return jsonify({'id': annotation.id, 'content': annotation.content})


def list_and_register_lessons(course_path, course_id):
    Lesson.query.filter_by(course_id=course_id).delete()
    list_and_register_lessons_in_directory(course_path, course_id, "")
    db.session.commit()

def list_and_register_lessons_in_directory(directory, course_id, hierarchy_prefix=""):
    """
    Função auxiliar para listar e registrar lições recursivamente.
    :param directory: O diretório atual a ser explorado.
    :param course_id: O ID do curso no banco de dados.
    :param hierarchy_prefix: Prefixo hierárquico atual para construir o caminho de hierarquia.
    """
    entries = list(os.scandir(directory))
    entries.sort(key=lambda e: (e.is_file(), e.name))

    for entry in entries:
        if entry.is_dir():
            new_hierarchy_prefix = f"{hierarchy_prefix}/{entry.name}" if hierarchy_prefix else entry.name
            list_and_register_lessons_in_directory(entry.path, course_id, new_hierarchy_prefix)
        elif entry.is_file() and entry.name.lower().endswith((".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv", ".webm")):
            video_title = os.path.splitext(entry.name)[0]

            duration = get_duration(entry.path)

            lesson = Lesson(
                course_id=course_id,
                title=video_title,
                module=hierarchy_prefix,
                hierarchy_path=hierarchy_prefix,
                video_url=entry.path,
                duration=str(duration),
                progressStatus='not_started',
                isCompleted=0,
                time_elapsed='0'
            )
            db.session.add(lesson)

    db.session.commit()

@app.route('/api/update-lesson-progress', methods=['POST'])
def update_lesson_for_end_progress():
    data = request.json
    lesson_id = data.get('lessonId')
    progress_status = data.get('progressStatus')
    is_completed = data.get('isCompleted')
    time_elapsed = data.get('time_elapsed', None)

    lesson = Lesson.query.get(lesson_id)
    if lesson:
        if progress_status:
            lesson.progressStatus = progress_status
        if is_completed is not None:
            lesson.isCompleted = is_completed
        if time_elapsed is not None:
            lesson.time_elapsed = time_elapsed

        db.session.commit()
        return jsonify({'message': 'Progresso da lição atualizado com sucesso'})
    else:
        return jsonify({'error': 'Lição não encontrada'}), 404


@app.route('/api/courses', methods=['POST'])
def add_course():
    name = request.form['name']
    path = request.form['path']
    
    isCoverUrl = 1 if 'imageURL' in request.form and request.form['imageURL'] else 0
    urlCover = request.form.get('imageURL', None)

    if not isCoverUrl:
        image_file = request.files.get('imageFile')
        if image_file:
            filename = secure_filename(image_file.filename)
            fileCover = filename
            image_file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        else:
            fileCover = None
    else:
        fileCover = None

    course = Course(
        name=name,
        path=path,
        isCoverUrl=isCoverUrl,
        fileCover=fileCover,
        urlCover=urlCover if isCoverUrl else None
    )
    print(f"Saving course with file cover: {course.fileCover}")
    db.session.add(course)
    db.session.commit()

    list_and_register_lessons(request.form['path'], course.id)

    return jsonify({'id': course.id, 'name': course.name}), 201

@app.route('/api/courses/<int:course_id>', methods=['GET'])
def get_course(course_id):
    course = Course.query.get_or_404(course_id)
    return jsonify({'id': course.id, 'name': course.name})

@app.route('/api/courses/<int:course_id>', methods=['PUT'])
def update_course(course_id):
    course = Course.query.get_or_404(course_id)

    course.name = request.form['name']
    course.path = request.form['path']
    isCoverUrl = 1 if 'imageURL' in request.form and request.form['imageURL'] else 0

    if isCoverUrl:
        course.urlCover = request.form.get('imageURL')
        course.isCoverUrl = 1
        course.fileCover = None
    else:
        image_file = request.files.get('imageFile')
        if image_file:
            filename = secure_filename(image_file.filename)
            course.fileCover = filename
            course.isCoverUrl = 0
            course.urlCover = None
            image_file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        else:
            course.fileCover = course.fileCover
    print(f"Saving course with file cover: {course.fileCover}")
    db.session.commit()
    list_and_register_lessons(course.path, course_id)

    return jsonify({'id': course.id, 'name': course.name, 'path': course.path, 'isCoverUrl': course.isCoverUrl, 'fileCover': course.fileCover, 'urlCover': course.urlCover})

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/courses/<int:course_id>', methods=['DELETE'])
def delete_course(course_id):
    course = Course.query.get_or_404(course_id)
    
    Lesson.query.filter_by(course_id=course_id).delete()
    
    if course.fileCover:
        try:
            os.remove(os.path.join(app.config['UPLOAD_FOLDER'], course.fileCover))
        except FileNotFoundError:
            print(f"Arquivo {course.fileCover} não encontrado.")

    db.session.delete(course)
    db.session.commit()
    return jsonify({'message': 'Course and associated lessons deleted'})

if __name__ == '__main__':
    app.run(debug=True)
