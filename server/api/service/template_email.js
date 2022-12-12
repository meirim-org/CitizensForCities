/**
 * Dynamic Template Email service.
 * Compiles emails and pushes to an email web service.
 */
const Promise = require('bluebird');
const Nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
 
const Juice = require('juice');
const Log = require('../lib/log');
const Config = require('../lib/config');
const Alert = require('../model/alert');
const { map, keys, get } = require('lodash');
const { parseCronExpression } = require('cron-schedule')
const cron = parseCronExpression('20 7,16 * * SUN-THU')

class DynamicTemplateEmail {
	 /**
	  * Generate test SMTP service account from ethereal.email
	  * Only needed if you don't have a real mail account for testing
	  */
	 constructor() {
		 // create reusable transporter object using the default SMTP transport
		 const env = process.env.NODE_ENV === 'test' ? 'test.email' : 'email'; // hack, should be fixed
		 this.config = Config.get(`${env}`);
		 this.baseUrl = Config.get('general.domain');
		 this.transporter = Nodemailer.createTransport(this.config.options);

		this.dynamicTemplates = {
			digestPlanAlert: get(Config, 'email.templates.digestPlans', 'd-db0b55ab042e4ba9878715acd35c1d6c')
		};

		sgMail.setApiKey(get(Config, 'email.options.auth.templatePass', ''));
	 }

	getEmailAttachements (plans) {
		 return map(plans, (plan)=>{
			 if(plan.map) return {
				cid: `${plan.id}map`,
				content_id: `${plan.id}map`,
				filename: 'plan_map.png',
				content: plan.map,
				encoding: 'base64',
				disposition: 'inline',
			 };
		 });
	 }
	 
	 /**
	  * send mail with defined transport object
	  * @param {*} mailOptions
	  */
	  send (mailOptions) {
		return this.transporter
			.sendMail(mailOptions)
			.then(info => Log.info('Message sent: %s', info.messageId, mailOptions.to));
	}

	 digestPlanAlert (recipient, emailPlanParams, emailAlertParams) {
		 const email = {
			 from: `"${this.config.from_name}" < ${this.config.from_email}>`, // sender address
			 to: recipient,
			unsubscribeLink: emailAlertParams.alert.unsubscribeLink,
			 personalizations:[
				 {
					 'to':[{
						 'email': recipient
					 }
					 ],
					'dynamic_template_data': {
						 ...emailAlertParams,
						 plans: emailPlanParams
					 }
				 }
			  ],
			attachments:  this.getEmailAttachements(emailPlanParams),
			template_id : this.dynamicTemplates.digestPlanAlert,
			send_at: cron.getNextDate(new Date()).getTime()/1000,		
		};
		return sgMail
			.send(email)
			.then(() => {
				console.log('Digest Email sent');
			})
			.catch((err) => console.log(err));
		
	 }
}
 
module.exports = new DynamicTemplateEmail();
 