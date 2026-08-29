// Shim: webpack css-loader camelCase → actual BEM class names
// In the original webpack build, css-loader with camelCaseOnly converted
// .react-tabs__tab → reactTabsTab, etc.
const tabStyles = {
  reactTabsTab: 'react-tabs__tab',
  reactTabsTabList: 'react-tabs__tab-list',
  reactTabsTabPanel: 'react-tabs__tab-panel',
  reactTabsTabSelected: 'react-tabs__tab--selected',
  reactTabsTabPanelSelected: 'react-tabs__tab-panel--selected',
};
export default tabStyles;
