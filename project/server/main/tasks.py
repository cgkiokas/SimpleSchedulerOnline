# from project.server.scheduling. import get_SMT_sched
import base64
import sys

sys.path.insert(0, '../SimpleSMTScheduler')
from simplesmtscheduler.schedulers import *

from io import BytesIO


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
    c_code = gen_schedule_code("", tasksFileName, taskSet, hyperPeriod, utilization, False)
    # Save it to a temporary buffer.
    imgBuf = BytesIO()
    schedulePlot.savefig(imgBuf, format="png")
    # Embed the result in the html output.
    imgData = base64.b64encode(imgBuf.getbuffer()).decode("ascii")

    c_code.seek(0)
    codeString = c_code.read()
    #codeData = base64.b64encode(codeBuf.getbuffer()).decode("ascii")

    retVal = dict();
    retVal['img'] = f"<img class='center-block' src='data:image/png;base64,{imgData}'/>"
    retVal['code'] = codeString
    return retVal
