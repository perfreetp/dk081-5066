export default defineAppConfig({
  pages: [
    'pages/find/index',
    'pages/publish/index',
    'pages/message/index',
    'pages/mine/index',
    'pages/detail/index',
    'pages/sellpoint/index',
    'pages/booking/index',
    'pages/chat/index',
    'pages/agreement/index',
    'pages/handover/index'
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '机配通',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#ff6b00',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/find/index',
        text: '找车'
      },
      {
        pagePath: 'pages/publish/index',
        text: '发车'
      },
      {
        pagePath: 'pages/message/index',
        text: '消息'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
