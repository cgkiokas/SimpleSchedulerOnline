// custom javascript
// A few jQuery helpers for exporting only
jQuery.fn.pop = [].pop;
jQuery.fn.shift = [].shift;

let codeResponse = "";
let utilization = 0;
let editable = document.querySelectorAll('[contenteditable=true]')

const newTaskTemplate = "<tr class='hide'><td contenteditable='true'>0</td><td contenteditable='true'>0</td><td contenteditable='true'>0</td><td contenteditable='true'>0</td><td contenteditable='true'>0</td><td contenteditable='true'>None</td><td contenteditable='true'>0</td><td contenteditable='true'>Tn</td><td contenteditable='true'>&task_n</td><td><span class='table-remove'><button type='button' class='btn btn-danger btn-rounded btn-sm my-0'>Remove</button></span></td>"

$( document ).ready(() => {
  console.log('Sanity Check!');

});


function init_util()
{
    updateEditablesList();
    calc_util();;
}

function updateEditablesList()
{
    editable = document.querySelectorAll('[contenteditable=true]');
    editable.forEach(function (itm) {
            itm.addEventListener('blur', (event) => {
                          calc_util();
                        }, true);
        });
}

function SaveAsFile(t,f,m) {
    try {
        var b = new Blob([t],{type:m});
        saveAs(b, f);
        window.close();
    } catch (e) {
        window.open("data:"+m+"," + encodeURIComponent(t), '_blank','');
    }
}

function GetTableAsString(){
    const $rows = $('#task_table').find('tr:not(:hidden)');
    let csvContent = ""
    // Turn all existing rows into a loopable array$("#tasks_data").val(GetTableAsString());
    $rows.each(function () {
        const $th = $(this).find('th:not(:empty)');
        for(i=0; i<$th.length-1; i++){
            csvContent += $th[i].innerText;
            if(i < $th.length-2){
                csvContent += ",";
            }
        };
        const $td = $(this).find('td');
        for(i=0; i<$td.length-1; i++){
            csvContent += $td[i].innerText.replace(/[^a-z0-9]/gi,'');
            if(i < $td.length-2){
                csvContent += ",";
            }
        };
        csvContent += "\r\n";
    });
    console.log(csvContent);
    return csvContent;
}

function getStatus(taskID) {
  $.ajax({
    url: `/tasks/${taskID}`,
    method: 'GET'
  })
  .done((res) => {
    const html = `
      <tr>
        <td>${res.data.task_id}</td>
        <td>${res.data.task_status}</td>
        <td>${res.data.task_elapsed}</td>
      </tr>`
    $('#sessions').empty();
    $('#sessions').append(html);
    const taskStatus = res.data.task_status;
    if (taskStatus === 'finished')
    {
      utilization = res.util
      $('#sched_util').text("(" + utilization.toFixed(2) + " % utilization)");
      if (res.code) {
          codeResponse = res.code;
          var button = document.createElement('button');
          button.className = 'btn btn-primary';
          button.innerHTML = 'Download C Header';
          button.onclick = function(){
              SaveAsFile(codeResponse,"sched.h","text/plain;charset=utf-8");
          };
           $('#downloadBtn').append(button);
      }

      var rawResponse = res.img; // truncated for example
      // append it to your page

      $('#plt_src').append(rawResponse);
      return false;
    }
    if (taskStatus === 'failed') return false;
    setTimeout(function() {
      getStatus(res.data.task_id);
    }, 1000);
  })
  .fail((err) => {
    console.log(err);
  });
}


$('#schedule').on('click', function() {
    $("#tasks_data").val(GetTableAsString());
    var formData = new FormData();
    formData.append('tasks_data', $("#tasks_data").val());
    //Remove old plots and code
    $('#downloadBtn').empty();
    $('#plt_src').empty();

    $.ajax({
        url: '/tasks',
        data: formData,
        method: 'POST',
        processData: false,  // tell jQuery not to process the data
        contentType: false,  // tell jQuery not to set contentType
    })
        .done((res) => {
        getStatus(res.data.task_id)
    })
        .fail((err) => {
        console.log(err)
    });
});

$("#fileval").change(function(e) {
    var ext = $("input#fileval").val().split(".").pop().toLowerCase();
    if($.inArray(ext, ["csv"]) == -1) {
        alert('Upload CSV');
        return false;
    }
    if (e.target.files != undefined) {
        var reader = new FileReader();
        reader.onload = function(e) {
            $('#tasks').empty();
            var data = e.target.result
            $("#tasks_data").val(data);
           // start the body
            var html = "";
            // split into lines
            var rows = data.split("\n");
            // parse lines
            for (i = 1; i < rows.length; ++i) {
                // start a table row
                html += "<tr>";
                // split line into columns
                var columns = rows[i].split(",");
                columns.forEach(function getvalues(outcol) {
                    html += "<td contenteditable='true'>" + outcol + "</td>";
                })
                html += "<td><span class='table-remove'><button type='button' class='btn btn-danger btn-rounded btn-sm my-0'>Remove</button></span></td>"
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

$('.table-add').on('click', 'i', () => {
    $('#tasks').append(newTaskTemplate);
    init_util();
});

$('#task_table').on('click', '.table-remove', function () {
    $(this).parents('tr').detach();
    init_util();

});


function calc_util()
{
    var sum = 0;
    const $rows = $('#task_table').find('tr:not(:hidden)');
      $rows.each(function () {
          const $td = $(this).find('td');
          if((typeof ($td[0] && $td[1]) !== "undefined") && $td.length > 0)
            {

                  if ($td[0] === 0)
                      {
                          sum = 0;
                      }
                  else
                      {
                          sum += (parseInt($td[1].textContent)/parseInt($td[0].textContent));
                      }
            }
          else
              {
                  sum = 0;
              }

        });
  console.log(sum);
  $('#utilVal').text((sum*100)+"%");
}
// TODO: add export button for tasks table to CSV