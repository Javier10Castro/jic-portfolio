(function(){'use strict';
function buildSendBriefPayload(opts){
  var name=opts.name||'';
  var email=opts.email||'';
  var company=opts.company||'';
  var phone=opts.phone||'';
  var prompt=opts.prompt||opts.message||'';
  var rawFormData=opts.formData||{};
  var source=opts.source||'unknown';
  var lang=opts.lang;
  if(!lang&&typeof currentLang!=='undefined')lang=currentLang;
  if(!lang)lang='es';
  var payload={name:name,email:email,company:company,phone:phone,prompt:prompt,lang:lang,formData:JSON.parse(JSON.stringify(rawFormData)),submittedAt:Date.now()};
  console.log('[PAYLOAD:'+source.toUpperCase()+']',JSON.parse(JSON.stringify(payload)));
  return payload;
}
window.buildSendBriefPayload=buildSendBriefPayload;
})();
