import { defineSiteConfig } from 'valaxy'

export default defineSiteConfig({
  url: 'https://sknp.top/',
  lang: 'zh-CN',
  title: 'SKNP的小站',
  author: {
    name: '焼烤牛排',
    avatar: 'https://images.sknp.top/images/2021/05/04/025.jpg',
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
      name: '哔哩哔哩',
      link: 'https://space.bilibili.com/66124873',
      icon: 'i-ri-bilibili-line',
      //icon: 'i-ri-qq-line',
      color: '#FF8EB3',
    },
    {
      name: 'GitHub',
      link: 'https://github.com/Sknp1006',
      icon: 'i-ri-github-line',
      color: '#6e5494',
    },
    {
      name: '微博',
      link: 'https://weibo.com/sknpzhe',
      icon: 'i-ri-weibo-line',
      color: '#E6162D',
    },
    // {
    //   name: '豆瓣',
    //   link: 'https://www.douban.com/people/yunyoujun/',
    //   icon: 'i-ri-douban-line',
    //   color: '#007722',
    // },
    {
      name: '网易云音乐',
      link: 'https://music.163.com/#/user/home?id=1691069566',
      icon: 'i-ri-netease-cloud-music-line',
      color: '#C20C0C',
    },
    {
      name: '知乎',
      link: 'https://www.zhihu.com/people/sheng-kong-nie-pan/',
      icon: 'i-ri-zhihu-line',
      color: '#0084FF',
    },
    // {
    //   name: '哔哩哔哩',
    //   link: 'https://space.bilibili.com/1579790',
    //   icon: 'i-ri-bilibili-line',
    //   color: '#FF8EB3',
    // },
    // {
    //   name: '微信公众号',
    //   link: 'https://cdn.yunyoujun.cn/img/about/white-qrcode-and-search.jpg',
    //   icon: 'i-ri-wechat-2-line',
    //   color: '#1AAD19',
    // },
    {
      name: 'Twitter',
      link: 'https://twitter.com/SKNP1006',
      icon: 'i-ri-twitter-line',
      color: '#1da1f2',
    },
    // {
    //   name: 'Telegram Channel',
    //   link: 'https://t.me/elpsycn',
    //   icon: 'i-ri-telegram-line',
    //   color: '#0088CC',
    // },
    {
      name: 'E-Mail',
      link: 'mailto:leizhe1006@gmail.com',
      icon: 'i-ri-mail-line',
      color: '#8E71C1',
    },
    // {
    //   name: 'Travelling',
    //   link: 'https://www.travellings.cn/go.html',
    //   icon: 'i-ri-train-line',
    //   color: 'var(--va-c-text)',
    // },
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
      {
        name: '支付宝',
        url: 'https://cdn.jsdelivr.net/gh/Sknp1006/cdn/img/donate/alipay-qrcode.jpg',
        color: '#00A3EE',
        icon: 'i-ri-alipay-line',
      },
      //   {
      //     name: 'QQ 支付',
      //     url: 'https://cdn.yunyoujun.cn/img/donate/qqpay-qrcode.png',
      //     color: '#12B7F5',
      //     icon: 'i-ri-qq-line',
      //   },
      {
        name: '微信支付',
        url: 'https://cdn.jsdelivr.net/gh/Sknp1006/cdn/img/donate/wechatpay-qrcode.jpg',
        color: '#2DC100',
        icon: 'i-ri-wechat-pay-line',
      },
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
