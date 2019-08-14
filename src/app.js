const weapp = require('./libs/index');
const config = require('./config');

weapp.addInterceptor(function(){
  return {
    data: {
      a: 21
    },
  }
}, function (res) {
});
App({
  onLaunch: function () {
    console.log(config);
  },
});
