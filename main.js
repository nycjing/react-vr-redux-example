import React from "react";
import NativeModules from 'react-vr';

// import {
//     Navigator, Text, TouchableHighlight,
//     ScrollView,
//     StyleSheet,
//     View,
//     Pano
// } from 'react-native';
// import {
//     Header, Link, nativeHistory,
//     Route,  NativeRouter as Router, withRouter,
//     } from 'react-router-native';
// import StackRoute from './StackRoute'
import SampleVR from './screen1';
import SampleVR1 from './screen2';


//
// import React from "react";
// import { createStore } from "redux";
import { connect } from "react-redux";
import store, {update, updateButton } from './store';
import { Pano, Text, View, VrButton } from "react-vr";

const uriTemplate = "https://source.unsplash.com/1600x900/?";

const mapStateToProps = state => ({
    text: state.text,
    keyword: state.keyword,
    buttonData: state.buttonData
});

const mapDispatchToProps = dispatch => ({
    onClick: buttonData => dispatch(updateButton(buttonData))
});

// Component styles
const styles = {
    textArea: {
        marginBottom: 0.15
    },
    text: {
        backgroundColor: "transparent",
        fontSize: 0.5,
        fontWeight: "400",
        layoutOrigin: [0.5, 0.5],
        textAlign: "center",
        textAlignVertical: "center",
        transform: [{ translate: [0, 0, -3] }]
    },
    buttonArea: {
        flexDirection: "row",
        layoutOrigin: [0.5, 0.5],
        marginLeft: 0.3,
        marginRight: 0.3
    },
    button: {
        width: 0.8
    },
    buttonText: {
        backgroundColor: "black",
        height: 0.3,
        color: "yellowgreen",
        fontSize: 0.12,
        fontWeight: "400",
        layoutOrigin: [0.5, 0.5],
        paddingLeft: 0.1,
        paddingRight: 0.1,
        marginLeft: 0.1,
        marginRight: 0.1,
        textAlign: "center",
        textAlignVertical: "center",
        transform: [{ translate: [0, 0, -3] }],
        borderRadius: 0.1
    }
};


const buttonData1 = [
    {
        id: "tokyo",
        text: "Tokyo",
        keyword: "tokyo"
    },
    {
        id: "kyoto",
        text: "Kyoto",
        keyword: "kyoto"
    },
    {
        id: "newyork",
        text: "New York",
        keyword: "new york"
    },
    {
        id: "paris",
        text: "Paris",
        keyword: "paris"
    }
];

const buttonData2 = [
    {
        id: "beijing",
        text: "beijing",
        keyword: "beijing"
    },
    {
        id: "singapore",
        text: "singapore",
        keyword: "singapore"
    },
    {
        id: "newyork",
        text: "New York",
        keyword: "new york"
    }
];
const buttonDataOld = [
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

];

const CubeModule = NativeModules.CubeModule;


// VR components
const ButtonList = ({ buttonData, onClick }) =>
    buttonData.map(data =>
        <VrButton
            key={`button_${data.id}`}
            style={styles.button}
             onClick={() => {
                 console.log(data.id,buttonData1 )
                 switch(data.id ) {
                     case '1':
                        return store.dispatch(updateButton(buttonData1));
                     case '2':
                         return store.dispatch(updateButton(buttonData2));
                     default:
                         return store.dispatch(updateButton(buttonDataOld));
                 }
             }}
        >
            <Text style={styles.buttonText}>
                {data.text}
            </Text>


        </VrButton>
    );




 class Main extends React.Component {

    constructor() {
        super();
        this.state = store.getState();
        Main.onClick = Main.onClick.bind(this)
    }

    componentDidMount () {
        store.getState();
        this.unsubscribe = store.subscribe(() => this.setState(store.getState()));
    }

    componentWillUnmount () {
        this.unsubscribe();
    }

    static onClick (buttonData)  {
        store.dispatch(updateButton(buttonData));
    }

    render() {
        const buttonData = this.state.buttonData;
        const keyword = this.state.keyword;
        const text = this.state.text;
        const onClick = this.onClick;

        return (
    <View>
        <Pano source={{ uri: `${uriTemplate}${keyword}` }} />
        <View style={styles.textArea}>
            <Text style={styles.text}>
                {text}
            </Text>
        </View>
        <View style={styles.buttonArea}>
            {ButtonList({buttonData, onClick})}
        </View>
    </View>
    )
    }
}
// Redux container
 export default connect(mapStateToProps, mapDispatchToProps)(Main);








//
// export default class Main extends React.Component {
//    render(){
//        return (
//
//          <View>
//
//              <SampleVR />
//          </View>
//            /* Address Bar can be toggled on or off by setting the addressBar prop */
//            // <Router >
//            //     <StackRoute path="master" component={Master}>
//            //         <Route path="/" component={SampleVR} overlayComponent={HomeHeader } />
//            //         <Route path="/1" component={SampleVR1}  />
//            //     {/*<Route path="/detail/:themeColor" component={Detail} overlayComponent={DetailHeader} />*/}
//            //     </StackRoute>
//            // </Router>
//        )
//    } };
//
//
