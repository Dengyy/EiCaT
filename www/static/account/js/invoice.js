
// require([], function () {
//   $(function ($) {
//     bindFormEvents();
//   })
// })
$(document).ready(function() {
  bindFormEvents();
  // setupData();
});
function bindFormEvents() {
  var self = this;
  $('.btn-set').click(function (event) {
    var dataId = $(event.target).data('val');
    setupDefault(event, dataId);
  })
  $('.btn-del').click(function (event) {
    var dataId = $(event.target).data('val');
    self.dataId = dataId;
  })
  $('#sureBtn').click(function () {
    delInfo(self.dataId)
  })
  $('#cancelBtn').click(function () {
    $('.del-invo-dialog').modal('hide')
  })
}

function delInfo(dataId) {
  $.ajax({
    url: '/account/invoice/delete',
    type: 'POST',
    dataType: 'json',
    data: {id: dataId},
    success: function (data) {
      $('.del-invo-dialog').modal('hide')
      if (data.rtnCode === 0) {
        setTimeout(function(){
          location.reload();
        },1000);
      } else {
        console.log(data.rtnMsg)
      }
    },
    error: function (err) {
      $('.del-invo-dialog').modal('hide')
      console.log(err)
    }
  })
}

function setupDefault(event, dataId) {
  $.ajax({
    url: '/account/invoice/default',
    type: 'POST',
    dataType: 'json',
    data: {id: dataId},
    success: function (data) {
      if (data.rtnCode === 0) {
        $('.btn-set').each(function (index, ele) {
          $(ele).removeClass('btn-success');
          $(ele).text('设为默认发票');
        })
        $(event.target).addClass('btn-success');
        $(event.target).text('默认发票');
      } else {
        console.log(data.rtnMsg)
      }
    },
    error: function (err) {
      console.log(err)
    }
  })
}

