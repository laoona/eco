/*
 * @Author: laoono.com
 * @Date: 2019-03-25 19:27:11
 * @Last Modified by: laoono.com
 * @Last Modified time: 2019-07-10 11:33:38
 */

exports.to = function(promise) {
    if (!promise || !Promise.prototype.isPrototypeOf(promise)) {
        return new Promise((resolve, reject) => {
            reject(new Error('request promises as ths param'));
        }).catch((error) => {
            return [error, null];
        });
    }

    return promise.then(function () {
        return [null, ...arguments];
    }).catch((error) => {
        return [error, null];
    });
};

