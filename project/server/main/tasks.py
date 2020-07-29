# from project.server.scheduling. import get_SMT_sched
import simplejson as json
import sys

sys.path.insert(0, '../SimpleSMTScheduler')
from simplesmtscheduler.schedulers import *

from io import StringIO

def create_task(file, wcet_offset, optimize=False, simAnnealing=False):
    tasksFileName = file
    taskSet = []
    verbose = False
    schedulePlotPeriods = 1

    parse_csv_taskset(tasksFileName, taskSet)

    if simAnnealing is False:
        schedule, utilization, hyperPeriod, elapsedTime = gen_cyclic_schedule_model(taskSet, wcet_offset, optimize, verbose)

    if schedule is not None:
        gen_schedule_activations(schedule, taskSet)

    schedulePlot = plot_cyclic_schedule(taskSet, hyperPeriod, schedulePlotPeriods)
    c_code = gen_schedule_code("", tasksFileName, taskSet, hyperPeriod, utilization, False)
    imgBuf = StringIO()
    schedulePlot.savefig(imgBuf, format="svg")
    imgData = imgBuf.getvalue()

    c_code.seek(0)
    codeString = c_code.read()

    retVal = dict()
    retVal['img'] = f"{imgData}"
    retVal['code'] = codeString
    tasksDict = dict()
    for t in taskSet:
        d = dict()
        for k, v in t.__dict__.items():
            if not k.startswith('release'):
                d[k] = v
        tasksDict[t.name] = d
    retVal['activations'] = json.dumps(tasksDict, iterable_as_array=True)
    retVal['elapsed'] = (elapsedTime * SEC_TO_MS)

    return retVal
