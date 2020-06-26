# from project.server.scheduling. import get_SMT_sched
import base64
from io import BytesIO

from project.server.scheduling.simplesmtscheduler.schedulers import *
from project.server.scheduling.simplesmtscheduler.utilities import *


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
    # Save it to a temporary buffer.
    buf = BytesIO()
    schedulePlot.savefig(buf, format="png")
    # Embed the result in the html output.
    data = base64.b64encode(buf.getbuffer()).decode("ascii")
    return f"<img class='center-block' src='data:image/png;base64,{data}'/>"
