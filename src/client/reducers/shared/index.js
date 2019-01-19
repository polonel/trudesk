const initialState = {
    sessionUser: null
};

const reducer = function  (state = initialState, action) {
    switch(action.type) {
        case 'SET_SESSION_USER':
            return {
                sessionUser: action.payload.sessionUser
            };
        default:
            return state;
    }
};

export default reducer;