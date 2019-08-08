require('./libs/regeneratorRuntime');
const weapp = require('./libs/index');

weapp.addInterceptor(function(){
  return {
    data: {
      a: 1
    },
  }
}, function (res) {
});
App({
  onLaunch: function () {
  },
});
