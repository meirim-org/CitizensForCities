const axios = require('axios');
const config = process.env.CONFIG.paymentServices;

const instance = axios.create({
    baseURL: config.baseURL,
    headers: {
      get: {        // can be common or any other method
        "Access-Control-Allow-Origin": 'http://stg.meirim.org/',
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
      }
    }
  });

module.exports = {
    // need to have the following funcitons- get instance token, 
    getPaymentURL: (options) => {
      return instance.get('/', { 
        params: {
        "action":"APISign",
        "What":"SIGN",
        "KEY":config.apiKey,
        "PassP":config.PassP,
        "Masof":config.masofId,
        "Amount":options.amount,
        "UTF8":"True",
        "UTF8out":"True",
        "Coin":1,
        "sendemail":"True",
        "SendHesh":"True",
        "PageLang":"HEB",
        "tmp":11,
        "Info":"תרומה חודשית לעמותת מעירים",
        "Pritim":"True",
        "OnlyOnApprove":"True",
        "HK":"True",
       "heshDesc":["", "תרומה%20חודשית%20לעמותת%20מעירים", "1", `${options.amount}`].join('~'),
    } }, options).then(res=>`${config.baseURL}/?action=pay&${res.data}`)}
};