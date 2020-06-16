// custom javascript

$( document ).ready(() => {
  console.log('Sanity Check!');
});

$('#upload').on('click', function() {
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
        <td>${res.data.task_result}</td>
      </tr>`
    $('#tasks').empty();
    $('#tasks').append(html);
    const taskStatus = res.data.task_status;
    if (taskStatus === 'finished')
    {
      var rawResponse = res.img; // truncated for example
      // convert to Base64
      var b64Response = btoa(rawResponse);
      // create an image
      var outputImg = document.createElement('img');
      outputImg.src = 'data:image/png;base64,'+rawResponse;
      outputImg.width = 800;
      outputImg.height = 600;
      // append it to your page
      $('#plt_src').append(outputImg);

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
