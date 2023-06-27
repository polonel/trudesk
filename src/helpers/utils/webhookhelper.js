const fs = require('fs').promises; 
const axios = require('axios')
const winston = require('../../logger')


function attachWebhooks(schema, COLLECTION) {
    schema.pre('save', async function(next) {
        const self = this;
        let doc = await self.model(COLLECTION).find({_id: self._id }).lean();
        
        next();

        const jsonData = await fs.readFile('/usr/src/trudesk/src/settings/json/webhook-config.json', 'utf8');
        const json = JSON.parse(jsonData);
        
        for(let i = 0; i < Object.keys(json).length; i++){
          if(json[i].action === undefined){
            winston.warn("WARNING: ", "No action defined in webhook: " + i)
            continue;
          }
          if(json[i].model === undefined){
            winston.warn("WARNING: ", "No model defined in webhook: " + i)
            continue;
          }
          if(COLLECTION !== json[i].model){
            continue;
          }
          if(json[i].endpoint === undefined){
            winston.warn("WARNING: ", "No endpoint defined in webhook: " + i)
            continue;
          }
          if(json[i].payload === undefined){winston.warn("WARNING: ", "No payload defined in webhook: " + i)}

          try{
            replace(json[i].payload, self);
            if((doc.length === 0 && json[i].action == 'created') || (doc.length > 0 && json[i].action == 'updated') ){  
               await axios.post(json[i].endpoint.trim(), json[i].payload);
          }
          }catch (error){
            winston.warn("WARNING: ", "Webhook failed during replace substitution/post request")
          }

        }
 
    });
    
    function replace(object, data){
        for (let [key, value] of Object.entries(object)) {
          if(typeof value === 'string'){
            let regex = /{{(.*?)}}/g;
            let match;
            let result = value;
                  
            while ((match = regex.exec(value)) !== null) {
                let extracted = match[1];  
                result =  result.replace(match[0], subJSON(extracted, data));
            }
                object[key] = result;
          }
          if(typeof value === 'object'){
            object[key] = replace(object[key], data)
          }
      
        }
        return object;
      }    
      
      function subJSON(func, data) {
        return eval(func); 
      }
}

module.exports = {
    attachWebhooks
};
