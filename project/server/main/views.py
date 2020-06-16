# project/server/main/views.py
import base64
import os

import redis
from rq import Queue, Connection

from flask import render_template, Blueprint, jsonify, request, current_app, flash, redirect
from werkzeug.utils import secure_filename

from project.server.main.tasks import create_task

main_blueprint = Blueprint("main", __name__, )


@main_blueprint.route("/", methods=["GET"])
def home():
    return render_template("main/home.html")


@main_blueprint.route("/tasks", methods=["POST"])
def run_task():
    file = request.files['file']
    # scontents = gotdata.read()
    # file = scontents
    if 'file' is None:
        flash('No file part')
        return redirect(request.url)

    if file.filename == '':
        flash('No selected file')
        return redirect(request.url)
    # file = request.form["file"]
    with Connection(redis.from_url(current_app.config["REDIS_URL"])):

        # if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filePath = os.path.join(os.path.normpath(current_app.root_path), current_app.config['UPLOAD_FOLDER'], filename)
        file.save(filePath)
        q = Queue()
        task = q.enqueue(create_task, filePath)

    response_object = {
        "status": "success",
        "data": {
            "task_id": task.get_id()
        }
    }
    return jsonify(response_object), 202


@main_blueprint.route("/tasks/<task_id>", methods=["GET"])
def get_status(task_id):
    with Connection(redis.from_url(current_app.config["REDIS_URL"])):
        q = Queue()
        task = q.fetch_job(task_id)

    path = os.path.join(os.path.normpath(current_app.root_path), current_app.config['PLOT_FOLDER'], 'plot.png')
    with open(path, "rb") as image_file:
        b64_string = base64.b64encode(image_file.read())
        encoded_string = b64_string.decode('utf-8')


    if task:
        response_object = {
            "status": "success",
            "data": {
                "task_id": task.get_id(),
                "task_status": task.get_status(),
                "task_result": task.result,
            },
            "img":encoded_string,
        }
    else:
        response_object = {"status": "error"}

    return jsonify(response_object)

# @bp.route('/getSMT', methods=['GET', 'POST'])
# def getSMTsched():
#     file = request.form['file']
#     if 'file' is None:
#         flash('No file part')
#         return redirect(request.url)
#     print(file)
#     if file.filename == '':
#         flash('No selected file')
#         return redirect(request.url)
#     if file and allowed_file(file.filename):
#         filename = secure_filename(file.filename)
#         filePath = os.path.join(project.config['UPLOAD_FOLDER'], filename)
#         file.save(filePath)
#         resp = get_SMT_sched(filePath)
#         if isinstance(resp, str):
#             flash(resp)
#         else:
#             return render_template('home.html', name='new_plot', src='/project/plots/plot.png')
#     return render_template('home.html', name='new_plot', src='/project/plots/plot.png')
