import Admin from '../cmswing/admin'

module.exports = class extends Admin {
  constructor(ctx) {
    super(ctx); // 调用父级的 constructor 方法，并把 ctx 传递进去
    // 其他额外的操作
    this.tactive = "order"
  }

  /**
   * index action
   * @return {Promise} []
   */
  indexAction() {
    //auto render template file index_index.html

    return this.display();
  }

  //订单列表
  async listAction() {
    let status = this.get("status");
    let map = {};
    if (!think.isEmpty(status)) {
      map.status = status;
      this.assign('status', status);
    }

    map.is_del = 0
    map.type = 0;
    // this.config("db.nums_per_page",20)
    let data = await this.model("order").where(map).page(this.get('page') || 1, 20).order("create_time DESC").countSelect();
    let html = this.pagination(data);
    this.assign('pagerData', html); //分页展示使用
    //console.log(data.data);
    this.active = "admin/order/list";
    for (let val of data.data) {
      val.channel = await this.getPaymentInfo(val.payment, val.pay_code)
    }
    this.assign('list', data.data);
    this.meta_title = "订单管理";
    return this.display();
  }

  /**
   * 审核订单
   */
  async auditAction() {
    if (this.isPost) {
      let id = this.post("id");
      let admin_remark = this.post("admin_remark");
      let audit = await this.model("order").where({id: id}).update({status: 3, admin_remark: admin_remark});
      if (audit) {
        return this.success({name: "审核成功！", url: this.referer()})
      } else {
        return this.fail("审核失败！")
      }

    } else {
      let id = this.get("id");
      this.assign("id", id);
      this.meta_title = "审核订单";
      return this.display();
    }
  }

  /**
   * 删除订单
   */
  async delAction() {
    let id = this.get("id");
    //作废的订单才能删除
    let res = await this.model("order").where({id: id, status: 6}).delete();
    if (res) {
      return this.success({name: "删除成功！"});
    } else {
      return this.fail("删除失败！");
    }
  }

  /**
   * 作废订单
   */
  async voidAction() {
    if (this.isPost) {
      let id = this.post("id");
      let admin_remark = this.post("admin_remark");
      // let voids =await this.model("order").where({id:id}).update({status:6,admin_remark:admin_remark});
      let voids = true;
      if (voids) {
        //释放库存
        await this.model("order").stock(id, false);
        return this.success({name: "操作成功！", url: this.referer()})
      } else {
        return this.fail("操作失败！")
      }

    } else {
      let id = this.get("id");
      this.assign("id", id);
      this.meta_title = "审核订单";
      return this.display();
    }
  }

  /**
   * 完成订单
   */
  async finishAction() {
    if (this.isPost) {
      let id = this.post("id");
      let admin_remark = this.post("admin_remark");
      let finish = await this.model("order").where({id: id}).update({status: 4, admin_remark: admin_remark});
      if (finish) {
        return this.success({name: "操作成功！", url: this.referer()})
      } else {
        return this.fail("操作失败！")
      }

    } else {
      let id = this.get("id");
      this.assign("id", id);
      this.meta_title = "完成订单";
      return this.display();
    }
  }

  /**
   * 备注订单
   */
  async remarkAction() {
    if (this.isPost) {
      let id = this.post("id");
      let admin_remark = this.post("admin_remark");
      let remark = await this.model("order").where({id: id}).update({admin_remark: admin_remark});
      if (remark) {
        return this.success({name: "操作成功！", url: this.referer()})
      } else {
        return this.fail("操作失败！")
      }

    } else {
      let id = this.get("id");
      this.assign("id", id);
      this.meta_title = "备注订单";
      return this.display();
    }
  }

  /**
   * 查看订单
   * @returns {*}
   */
  async seeAction() {
    let id = this.get("id");
    console.log(id);
    this.meta_title = "查看订单";
    //获取订单信息
    let order = await this.model("order").find(id);

    //购物清单
    /*let goods = await this.model("order_goods").where({order_id: id}).select();
    let sum = [];
    for (let val of goods) {
      val.title = JSON.parse(val.prom_goods).title;
      val.pic = JSON.parse(val.prom_goods).pic;
      val.type = JSON.parse(val.prom_goods).type;
      val.sum = JSON.parse(val.prom_goods).price;
      sum.push(val.goods_nums);
    }
    sum = eval(sum.join('+'));
    this.assign("sum", sum);
    this.assign("goods", goods);*/

    //格式化订单详情
    if (order.type === 0) { // pcb
      await this.model('order').formatPcbDetail(order, this)
    }

    //获取购买人信息
    //购买人信息
    let user = await this.model("member").find(order.user_id);
    this.assign("user", user);
    //订单信息
    order.payment = await this.getPaymentInfo(order.payment, order.pay_code)
    this.assign("order", order);
    //获取 快递公司
    let express_company = this.model("express_company").order("sort ASC").select();
    this.assign("express_company", express_company);
    //获取省份
    /**
     * 订单原价 = 商品真实价格 + 真实运费
     */
    let olde_order_amount = order.order_amount - order.adjust_amount
    this.assign("olde_order_amount", olde_order_amount);
    const address = await this.model('address').getAddress(order.address_id);
    _.merge(order, address);
    let province = await this.model('area').where({parent_id:0}).select();
    let city = await this.model('area').where({parent_id:address.address.province}).select();
    let county = await this.model('area').where({parent_id:address.address.city}).select();
    this.assign("province", province);
    this.assign("city", city);
    this.assign("county", county);
    return this.display();
  }

  /**
   * 编辑订单
   */
  async editAction() {
    if (this.isPost) {
      let data = this.post()

      let order = await this.model("order").find(data.id);
      /**
       * 订单原价 = 商品真实价格 + 真实运费
       */
      let olde_order_amount = order.order_amount;
      data.order_amount = Number(olde_order_amount) + Number(data.adjust_amount);
      //更新订单信息
      let res = await this.model("order").update(data);
      if (res) {
        //记录日志
        let log;
        if (data.adjust_amount == 0) {
          log = `修改了订单，订单编号：${order.order_no}`
        } else {
          log = `修改了订单，订单编号：${order.order_no}，并调整订单金额 ${data.adjust_amount} 元，原订单金额：${olde_order_amount} 元，调整后订单金额：${data.order_amount} 元`
        }

        await this.model("action").log("order", "order", order.id, this.user.uid, this.ip, this.ctx.url, log);
        return this.success({name: "编辑成功！"});
      } else {
        return this.fail("编辑失败！");
      }
    } else {
      let id = this.get("id");
      //console.log(id);
      this.meta_title = "编辑订单";
      //获取订单信息
      let order = await this.model("order").find(id);
      //在订单同时没有付款，没有审核，没有完成的情况下才能编辑
      if (order.pay_status == 1 && item.status == 3 && item.delivery_status == 1) {
        return this.fail("订单已经付款，无法编辑！");
      }

      //格式化订单详情
      if (order.type === 0) { // pcb
        await this.model('order').formatPcbDetail(order, this)
      }

      //购物清单
      /*let goods = await this.model("order_goods").where({order_id: id}).select();
      let sum = [];
      for (let val of goods) {
        val.title = JSON.parse(val.prom_goods).title;
        val.pic = JSON.parse(val.prom_goods).pic;
        val.type = JSON.parse(val.prom_goods).type;
        val.sum = JSON.parse(val.prom_goods).price;
        sum.push(val.goods_nums);
      }
      sum = eval(sum.join('+'));
      this.assign("sum", sum);
      this.assign("goods", goods);*/
      //获取购买人信息
      //购买人信息
      let user = await this.model("member").find(order.user_id);
      this.assign("user", user);

      //订单信息
      order.payment = await this.getPaymentInfo(order.payment, order.pay_code)
      this.assign("order", order);
      //获取 快递公司
      let express_company = this.model("express_company").order("sort ASC").select();
      this.assign("express_company", express_company);
      //获取省份
      this.assign("olde_order_amount", order.order_amount);
      const address = await this.model('address').getAddress(order.address_id);
      _.merge(order, address);
      let province = await this.model('area').where({parent_id:0}).select();
      let city = await this.model('area').where({parent_id:address.address.province}).select();
      let county = await this.model('area').where({parent_id:address.address.city}).select();
      this.assign("province", province);
      this.assign("city", city);
      this.assign("county", county);
      return this.display();
    }
  }

  /**
   * 发货设置
   */
  async shipAction() {
    if (this.isPost) {
      let data = this.post();
      data.admin = await get_nickname(this.user.uid);
      //生成快递单编号
      let kid = ['k', new Date().getTime()]
      data.invoice_no = kid.join("");

      data.create_time = new Date().getTime();
      let res = await this.model("doc_invoice").add(data);
      if (res) {
        await this.model("order").where({id: data.order_id}).update({delivery_status: 1});
      }
      return this.success({"name": "发货成功！", "url": this.referer()});
    } else {
      let id = this.get("id");
      let order = await this.model("order").find(id);
      if (order.status != 3) {
        return this.fail("订单还没审核！，请先审核订单。")
      }
      order.payment = await this.getPaymentInfo(order.payment, order.pay_code)
      //格式化订单详情
      if (order.type === 0) { // pcb
        await this.model('order').formatPcbDetail(order, this)
      }
      //购物清单
      /*let goods = await this.model("order_goods").where({order_id: id}).select();
      let sum = []
      for (let val of goods) {
        val.title = JSON.parse(val.prom_goods).title;
        val.pic = JSON.parse(val.prom_goods).pic;
        val.type = JSON.parse(val.prom_goods).type;
        val.sum = JSON.parse(val.prom_goods).price;
        sum.push(val.goods_nums);
      }*/
      //购买人信息
      let user = await this.model("member").find(order.user_id);
      //获取 快递公司
      let express_company = await this.model("express_company").order("sort ASC").select();
      this.assign("express_company", express_company);
      //获取省份
      const address = await this.model('address').getAddress(order.address_id);
      _.merge(order, address);
      let province = await this.model('area').where({parent_id:0}).select();
      let city = await this.model('area').where({parent_id:address.address.province}).select();
      let county = await this.model('area').where({parent_id:address.address.city}).select();
      this.assign("province", province);
      this.assign("city", city);
      this.assign("county", county);
      this.assign("user", user);
      // sum = eval(sum.join('+'));
      // this.assign("sum", sum);
      // console.log(goods);
      // this.assign("goods", goods);
      this.assign("order", order);
      let olde_order_amount = order.order_amount - order.adjust_amount
      this.assign("olde_order_amount", olde_order_amount);
      this.meta_title = "发货";
      return this.display();
    }
  }

  /**
   * 查看订单
   */
  vieworderAction() {
    let list = [1, 2, 3];
    this.assign("list", list);
    return this.display();
  }

  /**
   * 收款单
   */

  async receivingAction() {
    let data = await this.model("doc_receiving").page(this.get('page')).order("create_time DESC").countSelect();
    let html = this.pagination(data);
    this.assign('pagerData', html); //分页展示使用
    //console.log(data.data);
    for (let val of data.data) {
      const orderInfo = await this.model("order").where({id: val.order_id}).getField("order_no, pay_code", true);
      val.channel = await this.getPaymentInfo(val.payment_id, orderInfo.pay_code)
      val.order_id = orderInfo.order_no;
    }
    this.assign('list', data.data);
    // this.active="admin/order/receiving"
    this.meta_title = "收款单";
    return this.display();
  }

  /**
   * 发货单
   */
  async invoiceAction() {

    let data = await this.model("doc_invoice").page(this.get('page')).order("create_time DESC").countSelect();
    let html = this.pagination(data);
    this.assign('pagerData', html); //分页展示使用
    for (let v of data.data) {
      v.express_company_id = await this.model("express_company").where({id: v.express_company_id}).getField("name", true);
    }
    this.assign("list", data.data);
    this.active = "admin/order/invoice"
    this.meta_title = "发货单";
    return this.display();
  }

  /**
   * 退款单
   */
  refundAction() {


    this.active = "admin/order/receiving"
    this.meta_title = "退款单";
    return this.display();
  }

  async getPaymentInfo (paymentId, pay_code) {
    switch (paymentId) {
      case 100:
        return "预付款支付";
      case 1001:
        return "货到付款";
      case 1002:
        return `线下付款${pay_code ? (pay_code) : ''}`;
      default:
        return await this.model("pingxx").where({id: paymentId}).getField("title", true);
    }
  }
}