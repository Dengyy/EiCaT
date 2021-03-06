// +----------------------------------------------------------------------
// | CmsWing [ 网站内容管理框架 ]
// +----------------------------------------------------------------------
// | Copyright (c) 2015-2115 http://www.cmswing.com All rights reserved.
// +----------------------------------------------------------------------
// | Author: arterli <arterli@qq.com>
// +----------------------------------------------------------------------
import Admin from '../cmswing/admin'
import Os from 'os'
// const fs = require('fs');
module.exports = class extends Admin {
  async indexAction() {
    // auto render template file index_index.html
    // console.log(think.parseConfig(true,think.config("db")).prefix);
    // await this.model("action").log("testaction","member","sdffds",this.user.uid,this.ip,this.ctx.url);//测试日志行为
    // console.log(think.config('model.mysql.prefix'));
    // let pa = JSON.parse(fs.readFileSync(think.ROOT_PATH+"/package.json",'utf-8'));
    // console.log(cmswing);
    // console.log(this.config('setup.WEB_SITE_TITLE'));
    // console.log(process);

    // 服务器信息
    this.meta_title = '首页';
    const mysqlv = await this.model('mysql').query('select version()');

    const node = process.versions;
    this.assign({
      'version': think.cmswing.info.version,
      'OS': Os.type(),
      'nodejs_v': node.node,
      'thinkjs': think.version,
      'mysqlv': mysqlv[0]['version()']
    });
    // console.log(mysqlv);
    // return this.body=mysqlv[0]['version()'];
    // 用户统计
    const user_count = await this.model('member').count('id');
    // 行为
    const action_count = await this.model('action').count('id');
    // 栏目
    const cate_count = await this.model('category').count('id');
    // // 模型
    // const model_count = await this.model('model').count('id');
    // // 插件
    // const ext_count = await this.model('ext').count('ext');
    // // 分类信息
    // const type_count = await this.model('type').count('typeid');
    this.assign({
      user_count: user_count,
      action_count: action_count,
      cate_count: cate_count,
      // model_count: model_count,
      // ext_count: ext_count,
      // type_count: type_count
    });
    // console.log(111)
    return this.display();
  }

  //获取头像
  async avatarAction() {
    let uid = this.get("uid")||this.user.uid
    var uploadPath = think.resource + '/upload/avatar/' + uid;
    let path = think.isFile(uploadPath + "/" + "/avatar.png");
    let pic;
    if (path) {
      pic = fs.readFileSync(uploadPath + "/" + "/avatar.png")
    } else {
      pic = fs.readFileSync(think.resource + '/upload/avatar/avatar.jpg')
    }
    this.header('Content-Type', 'image/png');
    return this.body=pic;
  }
};
