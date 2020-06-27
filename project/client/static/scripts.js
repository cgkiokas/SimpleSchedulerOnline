// custom javascript

let codeResponse;

$( document ).ready(() => {
  console.log('Sanity Check!');
});

$('#schedule').on('click', function() {
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

function SaveAsFile(t,f,m) {
    try {
        var b = new Blob([t],{type:m});
        saveAs(b, f);

    } catch (e) {
        window.open("data:"+m+"," + encodeURIComponent(t), '_blank','');
    }
}



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
                // close row
                html += "</tr>";
            }
            // insert into div
            $('#tasks').append(html);
        }
        reader.readAsText(e.target.files.item(0));
        return true;
    }
    return false;
});

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
      </tr>`
    $('#sessions').empty();
    $('#sessions').append(html);
    const taskStatus = res.data.task_status;
    if (taskStatus === 'finished')
    {

    if (res.code) {
        codeResponse = res.code
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

