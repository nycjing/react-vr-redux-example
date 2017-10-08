import React from "react";
// import { createStore } from "redux";
import { Provider } from "react-redux";
import store from './store';
import { AppRegistry } from "react-vr";
// import SampleVR from './screen1.js';
import Main from './main';



class App extends React.Component {
    render() {
        //const cube = { key, width, height, depth, x, y, z, upDown}
        return (
            <Provider store={store}>
                { /* TO DO: Add routes */ }
                <Main />
            </Provider>
        )
    }
};

AppRegistry.registerComponent("app", () => App);
