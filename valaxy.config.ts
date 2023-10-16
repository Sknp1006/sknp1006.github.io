import { defineValaxyConfig } from 'valaxy'
import type { UserThemeConfig } from 'valaxy-theme-yun'
import { addonWaline } from "valaxy-addon-waline";

// add icons what you will need
const safelist = [
  'i-ri-home-line',
]

/**
 * User Config
 */
export default defineValaxyConfig<UserThemeConfig>({
  // site config see site.config.ts

  theme: 'yun',

  themeConfig: {
    banner: {
      enable: true,
      title: '焼烤牛排的小站',
      cloud: {
        enable: true,
      },
    },

    pages: [
      {
        name: '我的小伙伴们',
        url: '/links/',
        icon: 'i-ri-links-line',
        color: 'dodgerblue',
      },
      {
        name: '我的图床',
        url: 'https://images.sknp.top/',
        icon: 'i-ri-cloud-line',
        color: '#FA8072',
      },
    ],

    footer: {
      since: 2020,
      beian: {
        enable: true,
        icp: '粤ICP备2023009426号',
      },
    },
  },

  unocss: { safelist },

  addons: [
    addonWaline({
      serverURL: "https://waline.sknp.top",		// Waline服务链接
      locale: {
        placeholder: "填写qq邮箱或点击登录，可以展示个人头像",
      },
      comment: true,
      pageview: true
    }),
  ],
  
})
