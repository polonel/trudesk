import axios from 'axios';

let api = {};

api.settings = {};

api.settings.update = function({name, value}) {
    return axios.put('/api/v1/settings', {name, value})
        .then((res) => {
            return res.data;
        });
};

export default api;