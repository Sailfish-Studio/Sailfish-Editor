// Sailfish Studio - Browser app entry
// Mounts the React GUI application

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, compose, applyMiddleware } from 'redux';
import rootReducer from '@sailfish/ui/src/reducers';
import App from '@sailfish/ui/src/components/gui/gui';

// TODO: Initialize the Scratch VM, Render, and Audio engines
// and connect them to the React GUI.

const store = createStore(
  rootReducer,
  compose(applyMiddleware())
);

const rootEl = document.getElementById('app');
if (rootEl) {
  ReactDOM.render(
    React.createElement(Provider, { store },
      React.createElement(App)
    ),
    rootEl
  );
}
