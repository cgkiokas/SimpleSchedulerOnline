// custom javascript

$( document ).ready(() => {
  console.log('Sanity Check!');
});

$('#schedule').on('click', function() {
    var formData = new FormData();
    formData.append('file', $('#fileval')[0].files[0]);

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
                    html += "<td>" + outcol + "</td>";
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
      var rawResponse = res.img; // truncated for example
      // append it to your page
      $('#plt_src').append(rawResponse);

      // const html = `<img src=${res.img} alt="Plot result" width="500" height="600">`
      // $('#plt_src').empty();
      // $('#plt_src').append(html)
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
