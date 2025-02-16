import { defineSiteConfig } from 'valaxy'

export default defineSiteConfig({
  url: 'https://sknp.top/',
  lang: 'zh-CN',
  title: 'SKNP的小站',
  author: {
    name: '焼烤牛排',
    avatar: 'https://s2.loli.net/2024/09/14/f9pFt715noEJxIV.jpg',
  },
  description: 'Someday I will be just like you.',
  social: [
    {
      name: 'RSS',
      link: '/atom.xml',
      icon: 'i-ri-rss-line',
      color: 'orange',
    },
    {
      name: 'GitHub',
      link: 'https://github.com/Sknp1006',
      icon: 'i-ri-github-line',
      color: '#6e5494',
    },
    {
      name: 'Twitter',
      link: 'https://twitter.com/SKNP1006',
      icon: 'i-ri-twitter-line',
      color: '#1da1f2',
    },
    {
      name: 'E-Mail',
      link: 'mailto:leizhe1006@gmail.com',
      icon: 'i-ri-mail-line',
      color: '#8E71C1',
    },
  ],

  search: {
    enable: true,
    type: 'fuse'
  },

  comment: {
    enable: true,
  },

  sponsor: {
    enable: true,
    title: '禁止打赏！',
    methods: [
      // {
      //   name: '支付宝',
      //   url: 'https://cdn.jsdelivr.net/gh/Sknp1006/cdn/img/donate/alipay-qrcode.jpg',
      //   color: '#00A3EE',
      //   icon: 'i-ri-alipay-line',
      // },
      //   {
      //     name: 'QQ 支付',
      //     url: 'https://cdn.yunyoujun.cn/img/donate/qqpay-qrcode.png',
      //     color: '#12B7F5',
      //     icon: 'i-ri-qq-line',
      //   },
      // {
      //   name: '微信支付',
      //   url: 'https://cdn.jsdelivr.net/gh/Sknp1006/cdn/img/donate/wechatpay-qrcode.jpg',
      //   color: '#2DC100',
      //   icon: 'i-ri-wechat-pay-line',
      // },
    ],
  },

  statistics: {
    enable: true,
    readTime: {
      speed: {
        /**
         * Chinese word count speed
         * @description 中文每分钟阅读字数
         * @default 300 (300 字/分钟)
         */
        cn: 300,
        /**
         * English word count speed
         * @description 英文每分钟阅读字数
         * @default 100 (200 字/分钟)
         */
        en: 100,
      },
    },
  },
},
)
