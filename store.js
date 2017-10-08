import { createStore } from "redux";

// Redux store
// const store = createStore(reducer);

// Action Creator

const defaultData = {
    text: "New York",
    keyword: "FullStack",
    buttonData:[
        {
            id: "1",
            text: "Remote",
            keyword: "Remote"
        },
        {
            id: "2",
            text: "Campus",
            keyword: "Campus"
        },

    ]
};

const UPDATE = 'UPDATE';
const UPDATEBUTTON = 'UPDATEBUTTON'

export const update = data => ({
    type: "UPDATE",
    payload: data
});

export const updateButton = buttonData => ({
    type: "UPDATEBUTTON",
    payload: buttonData
});

// Reducer
const reducer = (state = defaultData, action) => {
    switch (action.type) {
        case "UPDATE":
            return {
                text: action.payload.text,
                keyword: action.payload.keyword
            };
        case "UPDATEBUTTON":
            return {
                buttonData: action.payload
            };
        default:
            return state;
    }
};


export default createStore(reducer);