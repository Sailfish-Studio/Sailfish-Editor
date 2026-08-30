import React from 'react';

let _cachedModule;
let _loadPromise;

const loadScratchPaint = () => {
    if (!_loadPromise) {
        _loadPromise = import('@sailfish/ui/src/paint').then(mod => {
            _cachedModule = mod;
            return mod;
        });
    }
    return _loadPromise;
};

class PaintEditor extends React.Component {
    constructor (props) {
        super(props);
        this.state = {Mod: null};
        loadScratchPaint().then(mod => {
            this.setState({Mod: mod.default});
        });
    }
    render () {
        const {Mod} = this.state;
        if (!Mod) return null;
        return React.createElement(Mod, this.props);
    }
}

let hasSetupReducer = false;
const ScratchPaintReducer = (state, action) => {
    if (!hasSetupReducer && action.type === 'scratch-gui/navigation/ACTIVATE_TAB' && action.activeTabIndex === 1) {
        hasSetupReducer = true;
        loadScratchPaint();
    }
    if (hasSetupReducer && _cachedModule) {
        return _cachedModule.ScratchPaintReducer(state, action);
    }
    return {};
};

export {
    PaintEditor as default,
    ScratchPaintReducer
};
