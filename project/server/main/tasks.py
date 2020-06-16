import os

#from project.server.scheduling. import get_SMT_sched
from project.server.scheduling.simplesmtscheduler.schedulers import gen_cyclic_schedule_model, gen_schedule_activations, plot_cyclic_schedule
from project.server.scheduling.simplesmtscheduler.utilities import parse_csv_taskset
from flask import current_app

def create_task(file):
    tasksFileName = file
    taskSet = []
    wcet_offset = 0
    verbose = False
    schedulePlotPeriods = 1

    parse_csv_taskset(tasksFileName, taskSet)
    schedule, utilization, hyperPeriod, elapsedTime = gen_cyclic_schedule_model(taskSet, wcet_offset, verbose)
    if schedule is not None:
        gen_schedule_activations(schedule, taskSet)
    schedulePlot = plot_cyclic_schedule(taskSet, hyperPeriod, schedulePlotPeriods)
    path = os.path.join(os.path.normpath(current_app.root_path), current_app.config['PLOT_FOLDER'], 'plot')
    schedulePlot.savefig(path, dpi=480)
    return True
