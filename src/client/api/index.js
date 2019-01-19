import axios from 'axios';

let api = {};

api.settings = {};

api.settings.update = function(settings) {
    return axios.put('/api/v1/settings', settings)
        .then((res) => {
            return res.data;
        });
};

export default api;