// custom javascript
// A few jQuery helpers for exporting only
jQuery.fn.pop = [].pop;
jQuery.fn.shift = [].shift;

let codeResponse = "";
let utilization = 0;
let hyperperiod = 0;
let editable = document.querySelectorAll('[contenteditable=true]');
let dataTable;
let chart;

function calc_lcm(periods) {
    let lcm_val = Math.round(periods[0]);
    periods.slice(1, periods.length).forEach(function (itm) {
        lcm_val = Math.round(lcm_val * itm / math.gcd(lcm_val, itm))
    });
    return lcm_val;
}

const newTaskTemplate = "<tr class='hide'><td contenteditable='true' inputmode=decimal>0</td>" +
    "<td contenteditable='true' inputmode=decimal>0</td>" +
    "<td contenteditable='true' inputmode=decimal>0</td>" +
    "<td contenteditable='true' inputmode=decimal>0</td>" +
    "<td contenteditable='true' inputmode=decimal>0</td>" +
    "<td contenteditable='true'>0</td>" +
    "<td contenteditable='true'>None</td>" +
    "<td contenteditable='true'>Tn</td>" +
    "<td contenteditable='true'>&task_n</td>" +
    "<td class='text-center'><span class='table-remove'><button type='button' class='btn btn-danger btn-rounded btn-sm my-0 btn-responsive'><i aria-hidden='true' class='fa fa-trash-o'/></button></span></td>"

const options = {
    timeline: {
        groupByRowLabel: true,
        colorByRowLabel: false,
        showRowLabels: true,
        showBarLabels: true,
    },
    avoidOverlappingGridLines: false,
    tooltip: {
        isHtml: true
    }
};

$(document).ready(() => {
    console.log('Sanity Check!');
    if ($(window).width() < 770) {
        // mobile
        $("#top-buttons").addClass("btn-group-vertical");
        $("#fileval").addClass("mobile");
        $("#form1").addClass("mobile");
        $("#exportCsv").addClass("mt-1")
        $("#schedule").addClass("mt-1")
    } else {
        // desktop
        $("#top-buttons").addClass("btn-group float-right");
    }
    google.charts.load("current", {packages: ["timeline", "gantt"]});
});

//create trigger to resizeEnd event
$(window).resize(function () {
    if (this.resizeTO) clearTimeout(this.resizeTO);
    this.resizeTO = setTimeout(function () {
        $(this).trigger('resizeEnd');
    }, 500);
});

//redraw graph when window resize is completed
$(window).on('resizeEnd', function () {
    const container = document.getElementById("schedule_chart");
    chart = new google.visualization.Timeline(container);
    if (dataTable)
        chart.draw(dataTable, options);
});


function init_util() {
    updateEditablesList();
    calc_util();
    calc_hyperperiod();
}

function updateEditablesList() {
    editable = document.querySelectorAll('[contenteditable=true]');
    editable.forEach(function (itm) {
        itm.addEventListener('blur', (event) => {
            calc_util();
            calc_hyperperiod();
        }, true);
    });
}

function SaveAsFile(t, f, m) {
    try {
        let b = new Blob([t], {type: m});
        saveAs(b, f);
        window.close();
    } catch (e) {
        window.open("data:" + m + "," + encodeURIComponent(t), '_blank', '');
    }
}

function GetTableAsString() {
    const $rows = $('#task_table').find('tr:not(:hidden)');
    let csvContent = ""
    // Turn all existing rows into a loopable array$("#tasks_data").val(GetTableAsString());
    $rows.each(function () {
        const $th = $(this).find('th:not(:empty)');
        for (let i = 0; i < $th.length - 1; i++) {
            csvContent += $th[i].innerText;
            if (i < $th.length - 2) {
                csvContent += ",";
            }
        }
        ;
        const $td = $(this).find('td');
        for (let i = 0; i < $td.length - 1; i++) {
            csvContent += $td[i].innerText.trim();
            if (i < $td.length - 2) {
                csvContent += ",";
            }
        }
        ;
        csvContent += "\r\n";
    });
    console.log(csvContent);
    return csvContent;
}

function getStatus(taskID) {
    $.ajax({
        url: `/tasks/${taskID}`,
        method: 'GET'
    }).done((res) => {
        const html = `
      <tr>
        <td>${res.data.task_id}</td>
        <td>${res.data.task_status}</td>
        <td>${res.data.task_elapsed}</td>
      </tr>`
        $('#sessions').empty().append(html);
        const taskStatus = res.data.task_status;
        if (taskStatus === 'finished') {
            if (res.code) {
                codeResponse = res.code;
                var button = document.createElement('button');
                button.className = 'btn btn-primary';
                button.innerHTML = 'Download C Header';
                button.onclick = function () {
                    SaveAsFile(codeResponse, "sched.h", "text/plain;charset=utf-8");
                };
                $('#downloadBtn').append(button);
            }
            // const rawResponse = res.img;
            // const plt_src = $('#plt_src');
            // plt_src.append(rawResponse);
            // plt_src.children('svg').addClass('responsive-img').attr('width', "100%")
            // plt_src.scrollIntoView();

            if (res.activations) {
                const container = document.getElementById("schedule_chart");
                let activations = JSON.parse(res.activations);
                // drawGoogleTimeline(container, activations);
                drawVisTimeline(container, activations);
                container.scrollIntoView();
            }

            return false;
        }
        if (taskStatus === 'failed') return false;
        setTimeout(function () {
            getStatus(res.data.task_id);
        }, 5000);
    }).fail((err) => {
        console.log(err);
    });
}

function drawGoogleTimeline(container, activations) {
    dataTable = new google.visualization.DataTable();
    dataTable.addColumn({type: 'string', id: 'CPU ID'});
    dataTable.addColumn({type: 'string', id: 'Name'});
    dataTable.addColumn({type: 'string', role: 'tooltip'});
    dataTable.addColumn({type: 'number', id: 'Start'});
    dataTable.addColumn({type: 'number', id: 'End'});
    console.log(activations);
    let task_acts = [];
    $.each(activations, function (key, value) {
        let t = value;
        for (let i = 0; i < t.activation_instances.length; i++) {
            let start = parseFloat(t.activation_instances[i]);
            let end = start + parseFloat(t.execution);
            let reldeadline = parseFloat(t.deadline) + i * parseFloat(t.period);
            let ttooltip = "<div><strong>Task:</strong>" + t.name + "</div>" +
                "<div>" +
                "<div><strong>Period:</strong>" + t.period.toString() + "</div>" +
                "<div><strong>Starts @ </strong>" + start.toString() + "</div>" +
                "<div><strong>Ends @ </strong>" + end.toString() + "</div>" +
                "<div><strong>Deadline @ </strong>" + reldeadline.toString() + "</div>" +
                "</div>";
            task_acts.push([
                "CPU #" + t.coreid.toString(),
                t.name,
                ttooltip,
                start,
                end
            ]);
        }
    });
    chart = new google.visualization.Timeline(container);
    dataTable.addRows(task_acts);
    chart.draw(dataTable, options);
}

function drawVisTimeline(container, activations) {
    // Configuration for the Timeline
    const timeline_options = {
        start: new Date(0),
        end: new Date(hyperperiod),
        min: new Date(0),
        max: new Date(hyperperiod),
        stack: false,
        stackSubgroups: true,
        horizontalScroll: false,
        verticalScroll: false,
        zoomKey: "ctrlKey",
        editable: true,
        format: {
            minorLabels: function (date, scale, step) {
                switch (scale) {
                    case 'millisecond':
                        return new Date(date).getTime();
                    case 'second':
                        return new Date(date).getTime();
                    case 'minute':
                        return new Date(date).getTime();
                }
            },
            majorLabels: function (date, scale, step) {
                switch (scale) {
                    case 'millisecond':
                        return new Date(date).getTime();
                    case 'second':
                        return new Date(date).getTime();
                    case 'minute':
                        return new Date(date).getTime();
                }
            }
        }
    };
    let timeline = new vis.Timeline(container, null, timeline_options);

    // Create a DataSet (allows two way data-binding)
    let groups = new vis.DataSet();
    let items = new vis.DataSet();
    let arrows_array = [];

    let count = 0;
    let taskindex = 0;
    $.each(activations, function (key, value) {
        let t = value;
        for (let i = 0; i < t.activation_instances.length; i++) {
            let t_start = parseFloat(t.activation_instances[i]);
            let t_end = t_start + parseFloat(t.execution);
            let t_dead = t.deadline + i * t.period;
            items.add({
                id: count,
                group: t.coreid,
                subgroup: taskindex,
                title: "<div class='alert-success'>" +
                    "<div><strong>" + t.name + "</strong></div>" +
                    "<div><strong>WCET = </strong>" + t.execution + "</div>" +
                    "</div>",
                start: t_start,
                end: t_end,
                type: 'range',
                className: 'green'
            });
            let to = count;
            count++;
            let from = count;
            items.add({
                id: count,
                group: t.coreid,
                subgroup: taskindex,
                start: t_end,
                end: t_end + parseFloat($("#wcet_gap").val()),
                type: 'background'
            });
            count++;
            items.add({
                id: count,
                group: t.coreid,
                subgroup: taskindex,
                start: t_dead - Math.max(1, t.jitter / 2),
                end: t_dead + Math.max(1, t.jitter / 2),
                type: 'background',
                className: 'warning'
            });
            count++;
            arrows_array.push({id: arrows_array.length + 1, id_item_1: from, id_item_2: to});
        }
        let found_group = false;
        $.each(groups['_data'], function (key, value) {
            if (value.id === t.coreid) found_group = true;
        });
        if (!found_group) {
            groups.add({
                id: t.coreid,
                content: "CPU #" + t.coreid
            });
        }
        taskindex++;
    });

    // Create a Timeline
    timeline.setGroups(groups);
    timeline.setItems(items);
    // const my_Arrow = new Arrow(timeline, arrows_array);
}


$('#schedule').on('click', function () {
    if (utilization > 100) {
        alert('Utilization over 100%');
        return false;
    }
    const tasks_data = $("#tasks_data");
    tasks_data.val(GetTableAsString());
    const formData = new FormData();
    formData.append('tasks_data', tasks_data.val());
    formData.append('optimize', $("#optimizeCheck").val());
    formData.append('wcet_gap', $("#wcet_gap").val());
    //Remove old plots and code
    $('#downloadBtn').empty();
    $('#plt_src').empty();
    $('#schedule_chart').empty();
    $.ajax({
        url: '/tasks',
        data: formData,
        method: 'POST',
        processData: false,  // tell jQuery not to process the data
        contentType: false,  // tell jQuery not to set contentType
    }).done((res) => {
        getStatus(res.data.task_id)
    }).fail((err) => {
        console.log(err)
    });
});

$("#fileval").change(function (e) {
    let ext = $("input#fileval").val().split(".").pop().toLowerCase();
    if ($.inArray(ext, ["csv"]) == -1) {
        alert('Upload CSV');
        return false;
    }

    if (e.target.files != undefined) {
        var reader = new FileReader();
        reader.onload = function (e) {
            $('#tasks').empty();
            const data = e.target.result
            $("#tasks_data").val(data);
            // start the body
            let html = "";
            // split into lines
            let rows = data.split("\n");
            // parse lines
            for (i = 1; i < rows.length; ++i) {
                // start a table row
                html += "<tr>";
                // split line into columns
                var columns = rows[i].split(",");
                var columnsize = columns.length;
                columns.forEach(function getvalues(outcol) {
                    if (columnsize >= 5) {
                        html += "<td contenteditable='true' inputmode=decimal>" + outcol + "</td>";
                    } else {
                        html += "<td contenteditable='true' >" + outcol + "</td>";
                    }
                    columnsize--;
                })
                html += "<td class='text-center'><span class='table-remove'><button type='button' class='btn btn-danger btn-rounded btn-sm my-0 btn-responsive'><i aria-hidden='true' class='fa fa-trash-o'/></button></span></td>"
                // close row
                html += "</tr>";

            }
            // insert into div
            $('#tasks').append(html);
            init_util();
        }
        reader.readAsText(e.target.files.item(0));


        return true;
    }
    return false;
});

$('#addNewTask').on('click', () => {
    $('#tasks').append(newTaskTemplate);
    init_util();
});

$('#task_table').on('click', '.table-remove', function () {
    $(this).parents('tr').detach();
    init_util();
});

$("#exportCsv").on('click', function () {
    SaveAsFile(GetTableAsString(), "task_set.csv", "text/plain;charset=utf-8");
});

function calc_util() {
    let sum = 0;
    const $rows = $('#tasks').find('tr:not(:hidden)');
    $rows.each(function () {
        const $td = $(this).find('td');
        if ((typeof ($td[0] && $td[1]) !== "undefined") && $td.length > 0) {

            if ($td[0] === 0) {
                sum = 0;
            } else {
                sum += (parseInt($td[1].textContent) / parseInt($td[0].textContent));
            }
        } else {
            sum = 0;
        }

    });
    console.log("utilization=" + sum);
    utilization = (sum * 100).toFixed(3);
    $('#utilVal').text(utilization + "%");
}

function calc_hyperperiod() {
    const $rows = $('#tasks').find('tr:not(:hidden)');
    let periods = [];
    $rows.each(function () {
        const $td = $(this).find('td');
        if ((typeof ($td[0]) !== "undefined") && $td.length > 0) {
            periods.push(parseInt($td[0].textContent));
        }
    });
    if (periods.length > 0) {
        hyperperiod = calc_lcm(periods);
        console.log("hyperperiod=" + hyperperiod);
        $('#hyperVal').text(hyperperiod);
    }
}