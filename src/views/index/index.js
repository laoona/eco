const {to} = require('../../utils/index');

const weapp = require('../../libs/index');

Page({
  data: {
    p: null,
  },
  async onLoad () {
  },
  async $onClick() {
    let [a, b ] = await to(weapp.getUserInfo());
    console.log(a, b);

    weapp.showLoading({
      title: '加载中',
    });

    const p =  weapp.request({
      url: 'https://www.baidu.com',
      method: 'POST',
    });

    let [err, res] = await to(p);
    weapp.hideLoading();

    if (err) weapp.showToast({title: '请求失败'});

    this.setData({p});
  },

  async $onCancel() {
    this.data.p.abort();
  }
});