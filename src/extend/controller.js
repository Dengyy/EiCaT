// const moment = require('moment');
// moment.locale('zh-cn');
/**
 * Created by arter on 2017/7/9.
 */
const pagination = require('think-pagination');
module.exports = {
  para(param){
    return this.get(param)||this.post(param)
  },
  pagination(data, config = {}){
    let ops = think.extend({
      desc: true, //show description
      pageNum: 2,
      url: '', //page url, when not set, it will auto generated
      class: 'nomargin', //pagenation extra class
      text: {
        next: '下一页',
        prev: '上一页',
        total: '总数: __COUNT__ , 页数: __PAGE__'
      }
    }, config);
    return pagination(data, this.ctx, ops);
  }
}